param(
    [string]$RootPath = (Split-Path -Parent $PSScriptRoot),
    [switch]$Verbose
)

class SecretScanFinding {
    [string]$Pattern
    [string]$FilePath
    [int]$LineNo
    [string]$Snippet

    SecretScanFinding([string]$pattern, [string]$filePath, [int]$lineNo, [string]$snippet) {
        $this.Pattern = $pattern
        $this.FilePath = $filePath
        $this.LineNo = $lineNo
        $this.Snippet = $snippet
    }
}

$SecretPatterns = @(
    @{
        Name = "AWS_ACCESS_KEY"
        Pattern = "AKIA[0-9A-Z]{16}"
    },
    @{
        Name = "AWS_SECRET_KEY"
        Pattern = "aws_secret_access_key.*[A-Za-z0-9/+]+"
    },
    @{
        Name = "PRIVATE_KEY"
        Pattern = "-----BEGIN.*(PRIVATE|RSA|DSA|EC|OPENSSH).*KEY"
    },
    @{
        Name = "GENERIC_API_KEY"
        Pattern = "api.?key.?[A-Za-z0-9_-]{20,}"
    },
    @{
        Name = "DATABASE_URL"
        Pattern = "(postgres|mysql|mongodb)://\w+:\w+@"
    },
    @{
        Name = "JWT_TOKEN"
        Pattern = "eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+"
    },
    @{
        Name = "SLACK_WEBHOOK"
        Pattern = "https://hooks\.slack\.com/services"
    },
    @{
        Name = "GITHUB_TOKEN"
        Pattern = "gh[pousr]_[A-Za-z0-9_]{36,255}"
    },
    @{
        Name = "STRIPE_KEY"
        Pattern = "sk_live_[A-Za-z0-9]{20,}"
    }
)

$ExcludePaths = @(
    "\.git",
    "\.gradle",
    "\.venv",
    "venv",
    "site-packages",
    "node_modules",
    "\.next",
    "target",
    "dist",
    "build",
    "out",
    "\.md",
    "package-lock\.json",
    "\.lock",
    "\.a",
    "\.o",
    "\.dylib",
    "\.so",
    "\.dll",
    "\.class",
    "\.pyc",
    "\.pyd",
    "\.jar"
)

function Test-ShouldScanFile {
    param([string]$FilePath)

    $relativePath = $FilePath -replace [regex]::Escape($RootPath), ""

    foreach ($excludePath in $ExcludePaths) {
        if ($relativePath -match $excludePath) {
            return $false
        }
    }

    return $true
}

function Scan-SecretsInFile {
    param(
        [string]$FilePath,
        [array]$Patterns
    )

    $findings = @()

    try {
        $content = Get-Content -Path $FilePath -Raw -ErrorAction SilentlyContinue
        if (-not $content) {
            return $findings
        }

        $lines = $content -split "`n"

        foreach ($patternObj in $Patterns) {
            $pattern = $patternObj.Pattern
            $patternName = $patternObj.Name

            for ($i = 0; $i -lt $lines.Count; $i++) {
                $line = $lines[$i]

                if ($line -match $pattern) {
                    if ($line -match "Pattern\s*=") {
                        continue
                    }
                    if ($patternName -eq "PRIVATE_KEY" -and $line -match "\.replace\(") {
                        continue
                    }
                    if ($line -match "=\s*(change_me|replace_me|your_openrouter_api_key|dummy|example|test)\s*$") {
                        continue
                    }

                    $maxLen = [Math]::Min(200, $line.Length)
                    $snippet = $line.Substring(0, $maxLen).Trim()
                    $finding = [SecretScanFinding]::new(
                        $patternName,
                        $FilePath,
                        ($i + 1),
                        $snippet
                    )
                    $findings += $finding
                }
            }
        }
    }
    catch {
        if ($Verbose) {
            Write-Host "Warning: Could not scan $FilePath : $_"
        }
    }

    return $findings
}

function Scan-Secrets {
    param(
        [string]$Path,
        [array]$Patterns
    )

    $allFindings = @()

    $files = Get-ChildItem -Path $Path -File -Recurse -ErrorAction SilentlyContinue

    foreach ($file in $files) {
        if (Test-ShouldScanFile -FilePath $file.FullName) {
            $findings = Scan-SecretsInFile -FilePath $file.FullName -Patterns $Patterns
            $allFindings += $findings
        }
    }

    return $allFindings
}

$findings = Scan-Secrets -Path $RootPath -Patterns $SecretPatterns

if ($findings.Count -gt 0) {
    Write-Host "SECRETS_FOUND"
    foreach ($finding in $findings) {
        $output = @{
            pattern = $finding.Pattern
            file = $finding.FilePath
            line = $finding.LineNo
            snippet = $finding.Snippet
        } | ConvertTo-Json -Compress
        Write-Host $output
    }
    exit 1
}
else {
    Write-Host "NO_SECRETS_FOUND"
    exit 0
}
