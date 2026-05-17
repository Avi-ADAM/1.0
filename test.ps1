function Test-MonthiApi {
    param(
        [string]$BaseUrl = "http://localhost:5173",
        [switch]$Verbose
    )
    
    $uri = "$BaseUrl/api/monthi"
    
    try {
        Write-Host "Calling API: $uri" -ForegroundColor Cyan
        $response = Invoke-WebRequest -Uri $uri -Method Get -UseBasicParsing
        $statusCode = $response.StatusCode
        $content = $response.Content
        
        Write-Host "Status: $statusCode" -ForegroundColor Green
        if ($Verbose) {
            Write-Host "Response content:"
            $content | ConvertFrom-Json | ConvertTo-Json -Depth 10
        } else {
            Write-Host "Content: $content"
        }
        
        return @{
            Success    = $statusCode -eq 200
            StatusCode = $statusCode
            Content    = $content
        }
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
        return @{
            Success    = $false
            StatusCode = $null
            Error      = $_.Exception.Message
        }
    }
}