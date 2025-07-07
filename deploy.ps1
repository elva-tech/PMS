# Deploy script for Real Estate Management System

Write-Host "🚀 Starting deployment process..." -ForegroundColor Cyan

# Function to check if command was successful
function Test-CommandSuccess {
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error occurred. Deployment failed." -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

# Save current location
$originalLocation = Get-Location

try {
    # 1. Frontend Build and Deploy
    Write-Host "📦 Building and deploying frontend..." -ForegroundColor Yellow
    Set-Location "$PSScriptRoot\frontend"

    # Install dependencies if node_modules doesn't exist
    if (-not (Test-Path "node_modules")) {
        Write-Host "📥 Installing frontend dependencies..." -ForegroundColor Yellow
        npm install
        Test-CommandSuccess
    }

    # Run deployment
    Write-Host "🚀 Deploying to GitHub Pages..." -ForegroundColor Yellow
    npm run deploy
    Test-CommandSuccess

    # 2. Commit all changes
    Write-Host "📝 Committing changes to repository..." -ForegroundColor Yellow
    Set-Location "$PSScriptRoot"
    
    # Add all changes
    git add .
    
    # Get commit message from user or use default
    $commitMessage = Read-Host "Enter commit message (press Enter for default message)"
    if (-not $commitMessage) {
        $commitMessage = "Updated site - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    }
    
    # Commit changes
    git commit -m $commitMessage
    Test-CommandSuccess
    
    # Push changes
    Write-Host "⬆️ Pushing changes to GitHub..." -ForegroundColor Yellow
    git push origin main
    Test-CommandSuccess

    Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
    Write-Host "🌐 Your site will be available at: https://Abhiabee.github.io/Real-Estate-Management-System" -ForegroundColor Cyan
    Write-Host "⏳ Note: It may take a few minutes for changes to appear on GitHub Pages" -ForegroundColor Yellow

} catch {
    Write-Host "❌ Error occurred: $_" -ForegroundColor Red
} finally {
    # Restore original location
    Set-Location $originalLocation
}

# Keep window open if running by double-click
if ($Host.Name -eq 'ConsoleHost') {
    Write-Host "`nPress any key to exit..." -ForegroundColor Cyan
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
}
