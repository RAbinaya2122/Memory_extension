# setup-windows-service.ps1
# Run this script as Administrator to ensure registry keys can be added for startup.

Write-Host "Installing PM2 globally..."
npm install -g pm2

Write-Host "Installing pm2-windows-startup globally..."
npm install -g pm2-windows-startup

Write-Host "Configuring PM2 to start on Windows boot..."
pm2-startup install

Write-Host "Starting capture-server..."
# Navigate to capture-server directory to resolve paths correctly
Push-Location "$PSScriptRoot\capture-server"

# Stop existing process if it's already running to avoid duplicates
pm2 stop capture-server 2>$null
pm2 delete capture-server 2>$null

# Start using the ecosystem configuration
pm2 start ecosystem.config.cjs

Write-Host "Saving PM2 process list..."
pm2 save

Pop-Location

Write-Host "Setup Complete! The capture-server will now start automatically in the background when you log into Windows."
Write-Host "You can verify the status at any time by running: pm2 status"
