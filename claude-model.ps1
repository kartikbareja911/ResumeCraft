$settings = "$HOME\.claude\settings.json"
$config = Get-Content $settings -Raw | ConvertFrom-Json

$key = $config.env.ANTHROPIC_AUTH_TOKEN

if (-not $key) {
    Write-Host "OpenRouter key not found in settings.json"
    exit
}

Write-Host "Fetching OpenRouter models..."

$headers = @{
    Authorization = "Bearer $key"
}

$models = Invoke-RestMethod `
    -Uri "https://openrouter.ai/api/v1/models" `
    -Headers $headers `
    -Method Get

$list = $models.data |
    Where-Object { $_.architecture.input_modalities -contains "text" } |
    Sort-Object id

while ($true) {

    $search = Read-Host "`nSearch model/provider (Enter = show all)"

    if ($search) {
        $results = $list | Where-Object {
            $_.id -like "*$search*" -or
            $_.name -like "*$search*"
        }
    } else {
        $results = $list
    }

    $results = @($results)

    if ($results.Count -eq 0) {
        Write-Host "No models found."
        continue
    }

    $max = [Math]::Min($results.Count, 30)

    for ($i = 0; $i -lt $max; $i++) {
        Write-Host "$($i + 1). $($results[$i].id)"
    }

    $choice = Read-Host "`nEnter number"

    if ($choice -match '^\d+$') {
        $index = [int]$choice - 1

        if ($index -ge 0 -and $index -lt $max) {

            $selected = $results[$index].id

            $config.env.ANTHROPIC_MODEL = $selected

            $config | ConvertTo-Json -Depth 10 |
                Set-Content $settings -Encoding UTF8

            Write-Host "`nSelected:"
            Write-Host $selected
            Write-Host "`nRestart Claude Code / Antigravity Claude panel for the change to apply."
            break
        }
    }

    Write-Host "Invalid selection."
}