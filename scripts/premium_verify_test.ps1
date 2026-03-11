$baseUrl = if ($env:PREMIUM_BASE_URL) { $env:PREMIUM_BASE_URL } else { "http://localhost:8080" }
$jwt = $env:PREMIUM_TEST_JWT
$appleReceipt = $env:APPSTORE_RECEIPT_BASE64
$appleProduct = if ($env:APPLE_PRODUCT_ID) { $env:APPLE_PRODUCT_ID } else { "dreamlink_plus_monthly" }
$googleToken = $env:GOOGLE_PURCHASE_TOKEN
$googleProduct = if ($env:GOOGLE_PRODUCT_ID) { $env:GOOGLE_PRODUCT_ID } else { "dreamlink_plus_monthly" }
$googlePackage = $env:GOOGLE_PACKAGE_NAME

$script:results = @()
function Add-Result($name, $status, $errorType, $skipped) {
  $script:results += [pscustomobject]@{ name = $name; status = $status; error = $errorType; skipped = $skipped }
}

function Get-MissingKeys($requiredKeys, $jwtRequired) {
  $missing = @()
  foreach ($k in $requiredKeys) {
    if (-not [Environment]::GetEnvironmentVariable($k)) { $missing += $k }
  }
  if ($jwtRequired -and (-not $jwt)) { $missing += "PREMIUM_TEST_JWT" }
  return $missing
}

function Invoke-JsonPost($name, $url, $body, $jwtRequired, $requiredKeys) {
  $missing = Get-MissingKeys $requiredKeys $jwtRequired
  if ($missing.Count -gt 0) {
    Add-Result $name 0 ("missing_env: " + ($missing -join ',')) $true
    return
  }

  try {
    $headers = @{}
    if ($jwtRequired) { $headers['Authorization'] = "Bearer $jwt" }
    $payload = $body | ConvertTo-Json -Depth 6
    $resp = Invoke-WebRequest -Method Post -Uri $url -Headers $headers -ContentType "application/json" -Body $payload -UseBasicParsing
    Add-Result $name $resp.StatusCode $null $false
  } catch {
    $status = 0
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $status = [int]$_.Exception.Response.StatusCode
    }
    Add-Result $name $status $_.Exception.GetType().Name $false
  }
}

Invoke-JsonPost "apple_verify" "$baseUrl/api/premium/purchase/verify" @{
  store = "APP_STORE"; productId = $appleProduct; receiptData = $appleReceipt; transactionId = "sandbox-tx"; storeSubscriptionId = "sandbox-sub"; packageName = $null
} $true @('APPSTORE_RECEIPT_BASE64')

Invoke-JsonPost "google_verify" "$baseUrl/api/premium/purchase/verify" @{
  store = "PLAY_STORE"; productId = $googleProduct; purchaseToken = $googleToken; packageName = $googlePackage; transactionId = "sandbox-order"; storeSubscriptionId = "sandbox-sub"
} $true @('GOOGLE_PURCHASE_TOKEN','GOOGLE_PACKAGE_NAME')

Invoke-JsonPost "apple_verify_duplicate" "$baseUrl/api/premium/purchase/verify" @{
  store = "APP_STORE"; productId = $appleProduct; receiptData = $appleReceipt; transactionId = "sandbox-tx"; storeSubscriptionId = "sandbox-sub"; packageName = $null
} $true @('APPSTORE_RECEIPT_BASE64')

Invoke-JsonPost "apple_wrong_product" "$baseUrl/api/premium/purchase/verify" @{
  store = "APP_STORE"; productId = "invalid_product"; receiptData = $appleReceipt; transactionId = "sandbox-tx"; storeSubscriptionId = "sandbox-sub"; packageName = $null
} $true @('APPSTORE_RECEIPT_BASE64')

Invoke-JsonPost "google_wrong_package" "$baseUrl/api/premium/purchase/verify" @{
  store = "PLAY_STORE"; productId = $googleProduct; purchaseToken = $googleToken; packageName = "wrong.package"; transactionId = "sandbox-order"; storeSubscriptionId = "sandbox-sub"
} $true @('GOOGLE_PURCHASE_TOKEN')

Invoke-JsonPost "apple_restore" "$baseUrl/api/premium/restore" @{
  store = "APP_STORE"; productId = $appleProduct; receiptData = $appleReceipt; storeSubscriptionId = "sandbox-sub"
} $true @('APPSTORE_RECEIPT_BASE64')

Invoke-JsonPost "webhook_security" "$baseUrl/api/premium/webhook/apple" @{
  store = "APP_STORE"; eventType = "TEST"; storeSubscriptionId = "sandbox-sub"
} $false @()

$script:results | ForEach-Object {
  Write-Host "RESULT name=$($_.name) status=$($_.status) error=$($_.error) skipped=$($_.skipped)"
}

$total = $script:results.Count
$skipped = ($script:results | Where-Object { $_.skipped }).Count
$nonSkipped = $total - $skipped
Write-Host "SUMMARY total=$total skipped=$skipped executed=$nonSkipped"
