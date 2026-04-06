# Dream-Link Account Deletion Verification Script
# Verifies that deleted accounts have no remaining traces in the database

param(
    [string]$DbHost,
    [int]$DbPort,
    [string]$DbName,
    [string]$DbUser,
    [string]$DbPassword,
    [guid]$TestUserId
)

if (-not $DbHost) { $DbHost = "localhost" }
if (-not $DbPort) { $DbPort = 5432 }
if (-not $DbName) { $DbName = if ($env:DB_NAME) { $env:DB_NAME } elseif ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "dreamlink_test" } }
if (-not $DbUser) { $DbUser = if ($env:DB_USERNAME) { $env:DB_USERNAME } elseif ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "postgres" } }
if (-not $DbPassword) { $DbPassword = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } elseif ($env:POSTGRES_PASSWORD) { $env:POSTGRES_PASSWORD } else { "postgres" } }
if (-not $TestUserId -or $TestUserId -eq [guid]::Empty) { $TestUserId = [guid]::NewGuid() }

if ($PSVersionTable.PSEdition -ne "Core") {
    $pwshCommand = Get-Command pwsh -ErrorAction SilentlyContinue
    if (-not $pwshCommand) {
        Write-Host "FAILURE: PowerShell Core (pwsh) is required for Npgsql-based verification"
        exit 1
    }

    $pwshArgs = @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", $PSCommandPath,
        "-DbHost", $DbHost,
        "-DbPort", $DbPort,
        "-DbName", $DbName,
        "-DbUser", $DbUser,
        "-DbPassword", $DbPassword,
        "-TestUserId", $TestUserId.ToString()
    )

    & $pwshCommand.Source @pwshArgs
    exit $LASTEXITCODE
}

function Initialize-Npgsql {
    if ("Npgsql.NpgsqlConnection" -as [type]) {
        return
    }

    $nugetRoot = Join-Path $env:USERPROFILE ".nuget\\packages\\npgsql"
    $dll = Get-ChildItem -Path $nugetRoot -Filter "Npgsql.dll" -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -match "\\lib\\net8\.0\\Npgsql\.dll$" } |
        Sort-Object FullName -Descending |
        Select-Object -First 1

    $loggingDll = Get-ChildItem -Path "C:\\Program Files\\dotnet\\shared\\Microsoft.AspNetCore.App" -Filter "Microsoft.Extensions.Logging.Abstractions.dll" -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -match "\\8\.0\." } |
        Sort-Object FullName -Descending |
        Select-Object -First 1

    if ($loggingDll) {
        Add-Type -Path $loggingDll.FullName -ErrorAction SilentlyContinue
    }

    if ($dll) {
        Add-Type -Path $dll.FullName -ErrorAction Stop
        return
    }

    try {
        Add-Type -AssemblyName "Npgsql" -ErrorAction Stop
        return
    } catch {
        throw "Npgsql assembly not found. Install Npgsql or ensure it exists under $nugetRoot."
    }
}

function Open-PostgresConnection {
    param(
        [string]$DbHost,
        [int]$DbPort,
        [string]$DbName,
        [string]$DbUser,
        [string]$DbPassword
    )

    $connectionString = "User ID=$DbUser;Password=$DbPassword;Host=$DbHost;Port=$DbPort;Database=$DbName;"
    $connection = New-Object Npgsql.NpgsqlConnection($connectionString)
    $connection.Open()
    return $connection
}

function Get-ExistingColumns {
    param(
        [object]$Connection,
        [string]$TableName
    )

    $command = $Connection.CreateCommand()
    $command.CommandText = "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = @tableName"
    $tableParam = $command.CreateParameter()
    $tableParam.ParameterName = "@tableName"
    $tableParam.Value = $TableName
    [void]$command.Parameters.Add($tableParam)

    $reader = $command.ExecuteReader()
    $columns = @()
    while ($reader.Read()) {
        $columns += [string]$reader["column_name"]
    }
    $reader.Close()

    return $columns
}

function Test-TableExists {
    param(
        [object]$Connection,
        [string]$TableName
    )

    $command = $Connection.CreateCommand()
    $command.CommandText = "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = @tableName)"
    $tableParam = $command.CreateParameter()
    $tableParam.ParameterName = "@tableName"
    $tableParam.Value = $TableName
    [void]$command.Parameters.Add($tableParam)

    return [bool]$command.ExecuteScalar()
}

function Get-RowCountForUser {
    param(
        [object]$Connection,
        [string]$TableName,
        [string[]]$CandidateColumns,
        [guid]$UserId
    )

    $existingColumns = Get-ExistingColumns -Connection $Connection -TableName $TableName
    $matchingColumns = $CandidateColumns | Where-Object { $existingColumns -contains $_ }

    if (-not $matchingColumns -or $matchingColumns.Count -eq 0) {
        throw "No applicable user reference column found in table '$TableName'."
    }

    $conditions = $matchingColumns | ForEach-Object { "`"$_`" = @userId" }
    $sql = "SELECT COUNT(*) FROM public.`"$TableName`" WHERE " + ($conditions -join " OR ")

    $command = $Connection.CreateCommand()
    $command.CommandText = $sql
    $userParam = $command.CreateParameter()
    $userParam.ParameterName = "@userId"
    $userParam.Value = $UserId
    [void]$command.Parameters.Add($userParam)

    return [int]$command.ExecuteScalar()
}

function Verify-AccountDeletion {
    param(
        [object]$Connection,
        [guid]$UserId
    )

    $tableColumnMap = [ordered]@{
        users         = @('id')
        dreams        = @('user_id')
        comments      = @('user_id')
        dream_likes   = @('user_id', 'from_user_id', 'to_user_id')
        dream_matches = @('my_user_id', 'user1_id', 'user2_id')
        follows       = @('follower_id', 'following_id')
        conversations = @('user1_id', 'user2_id')
        messages      = @('sender_id')
        notifications = @('recipient_user_id')
        user_blocks   = @('blocker_user_id', 'blocked_user_id')
        subscriptions = @('user_id')
    }

    $results = @()
    $allClean = $true

    foreach ($table in $tableColumnMap.Keys) {
        $count = -1
        $errorText = $null
        $note = $null

        try {
            if (-not (Test-TableExists -Connection $Connection -TableName $table)) {
                $count = 0
                $note = "TABLE_NOT_PRESENT"
            } else {
                $count = Get-RowCountForUser -Connection $Connection -TableName $table -CandidateColumns $tableColumnMap[$table] -UserId $UserId
            }
        } catch {
            $errorText = $_.Exception.Message
            $allClean = $false
        }

        $isClean = ($count -eq 0) -and (-not $errorText)
        $verifyRowCountResult = [pscustomobject]@{
            TableName = $table
            RowCount  = $count
            IsClean   = $isClean
            Error     = $errorText
            Note      = $note
        }
        $results += $verifyRowCountResult

        if (-not $isClean) {
            $allClean = $false
        }
    }

    return @{
        Results = $results
        AllClean = $allClean
    }
}

Write-Host "Dream-Link Account Deletion Verification Script"
Write-Host "================================================"
Write-Host "Target User ID: $TestUserId"
Write-Host "Database: $DbHost`:$DbPort/$DbName"
Write-Host ""

try {
    Initialize-Npgsql
    $connection = Open-PostgresConnection -DbHost $DbHost -DbPort $DbPort -DbName $DbName -DbUser $DbUser -DbPassword $DbPassword
    $verification = Verify-AccountDeletion -Connection $connection -UserId $TestUserId
    $connection.Close()
} catch {
    Write-Host "FAILURE: Account deletion verification could not run"
    Write-Host "Reason: $($_.Exception.Message)"
    exit 1
}

Write-Host "Verification Results:"
Write-Host "====================="

foreach ($result in $verification.Results) {
    if ($result.Error) {
        Write-Host "$($result.TableName): ERROR [$($result.Error)]"
    } else {
        $status = if ($result.IsClean) { "CLEAN" } else { "FOUND REMNANTS" }
        if ($result.Note) {
            Write-Host "$($result.TableName): $($result.RowCount) rows [$status] ($($result.Note))"
        } else {
            Write-Host "$($result.TableName): $($result.RowCount) rows [$status]"
        }
    }
}

Write-Host ""

if ($verification.AllClean) {
    Write-Host "SUCCESS: Account deletion verified - no remnants found"
    exit 0
} else {
    Write-Host "FAILURE: Account deletion incomplete - remnants found in database"
    $failedTables = $verification.Results | Where-Object { -not $_.IsClean } | ForEach-Object { $_.TableName }
    Write-Host "Tables with remnants: $($failedTables -join ', ')"
    exit 1
}
