param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$Email = "smoke@example.com",
    [string]$Password = "Passw0rd!",
    [string]$Nickname = "smoke_user"
)

$ErrorActionPreference = "Stop"

function Write-Result($name, $ok, $detail = "") {
    $status = if ($ok) { "OK" } else { "FAIL" }
    $suffix = if ($detail) { " - $detail" } else { "" }
    Write-Host "[$status] $name$suffix"
}

function Invoke-Json($method, $url, $body = $null, $headers = $null) {
    if ($null -ne $body) {
        return Invoke-RestMethod -Method $method -Uri $url -Body ($body | ConvertTo-Json -Depth 6) -ContentType "application/json" -Headers $headers
    }
    return Invoke-RestMethod -Method $method -Uri $url -Headers $headers
}

$results = @{}

# Health/public feed (no auth)
try {
    Invoke-Json "GET" "$BaseUrl/api/dreams" | Out-Null
    Write-Result "public feed GET /api/dreams" $true
    $results["public_feed"] = $true
} catch {
    Write-Result "public feed GET /api/dreams" $false $_.Exception.Message
    $results["public_feed"] = $false
}

# Auth: login, if fails try register then login
$token = $null
try {
    $loginBody = @{ email = $Email; password = $Password }
    $token = Invoke-Json "POST" "$BaseUrl/api/auth/login" $loginBody
    Write-Result "auth login POST /api/auth/login" $true
} catch {
    Write-Result "auth login POST /api/auth/login" $false $_.Exception.Message
    try {
        $registerBody = @{ email = $Email; password = $Password; nickname = $Nickname }
        Invoke-Json "POST" "$BaseUrl/api/auth/register" $registerBody | Out-Null
        Write-Result "auth register POST /api/auth/register" $true
        $token = Invoke-Json "POST" "$BaseUrl/api/auth/login" $loginBody
        Write-Result "auth login (after register)" $true
    } catch {
        Write-Result "auth register/login" $false $_.Exception.Message
    }
}

if (-not $token) {
    Write-Host "Auth token missing; stopping auth-required checks."
    exit 1
}

$authHeaders = @{ Authorization = "Bearer $token" }

# Auth smoke: /api/users/me
try {
    $me = Invoke-Json "GET" "$BaseUrl/api/users/me" $null $authHeaders
    Write-Result "auth GET /api/users/me" $true
} catch {
    Write-Result "auth GET /api/users/me" $false $_.Exception.Message
}

# Create a dream for feed/discover smoke
try {
    $dreamBody = @{ title = "Smoke dream"; description = "Smoke test"; theme = "HAPPY"; visibility = "PUBLIC"; tagNames = @() }
    $dream = Invoke-Json "POST" "$BaseUrl/api/dreams" $dreamBody $authHeaders
    Write-Result "auth POST /api/dreams" $true
} catch {
    Write-Result "auth POST /api/dreams" $false $_.Exception.Message
}

# Discover feed
try {
    Invoke-Json "GET" "$BaseUrl/api/matches/discover" $null $authHeaders | Out-Null
    Write-Result "auth GET /api/matches/discover" $true
} catch {
    Write-Result "auth GET /api/matches/discover" $false $_.Exception.Message
}

# Notifications
try {
    Invoke-Json "GET" "$BaseUrl/api/notifications" $null $authHeaders | Out-Null
    Write-Result "auth GET /api/notifications" $true
} catch {
    Write-Result "auth GET /api/notifications" $false $_.Exception.Message
}

try {
    Invoke-Json "POST" "$BaseUrl/api/notifications/read-all" @{} $authHeaders | Out-Null
    Write-Result "auth POST /api/notifications/read-all" $true
} catch {
    Write-Result "auth POST /api/notifications/read-all" $false $_.Exception.Message
}

# Chat
try {
    $conversations = Invoke-Json "GET" "$BaseUrl/api/chat/conversations" $null $authHeaders
    Write-Result "auth GET /api/chat/conversations" $true
    if ($conversations.Count -gt 0) {
        $conversationId = $conversations[0].id
        Invoke-Json "GET" "$BaseUrl/api/chat/$conversationId/messages" $null $authHeaders | Out-Null
        Write-Result "auth GET /api/chat/{id}/messages" $true
    } else {
        Write-Result "auth GET /api/chat/{id}/messages" $false "no conversations"
    }
} catch {
    Write-Result "auth GET /api/chat/conversations" $false $_.Exception.Message
}
