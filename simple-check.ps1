Get-Content .env.vercel | ForEach-Object { if ($_ -match '^(.+?)=(.+)$') { Set-Item "env:$($matches[1])" $matches[2] } }
$r = Invoke-RestMethod -Uri "https://api.vercel.com/v6/deployments?projectId=$env:VERCEL_PROJECT_ID&limit=1" -Headers @{"Authorization"="Bearer $env:VERCEL_TOKEN"}
$r.deployments[0] | ConvertTo-Json | Out-File result.json
"DONE - Check result.json" | Out-File check-done.txt


