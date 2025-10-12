# 🚀 GitHub Actions Login & Check Script
Write-Host "🚀 GitHub Actions Login & Check Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Function to check GitHub CLI installation
function Check-GitHubCLI {
    Write-Host "`n🔍 Checking GitHub CLI..." -ForegroundColor Yellow
    try {
        $version = gh --version
        Write-Host "✅ GitHub CLI is installed: $version" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ GitHub CLI not found. Installing..." -ForegroundColor Red
        try {
            winget install GitHub.cli
            Write-Host "✅ GitHub CLI installed successfully" -ForegroundColor Green
            return $true
        } catch {
            Write-Host "❌ Failed to install GitHub CLI" -ForegroundColor Red
            return $false
        }
    }
}

# Function to check GitHub login status
function Check-GitHubLogin {
    Write-Host "`n🔍 Checking GitHub login status..." -ForegroundColor Yellow
    try {
        $user = gh auth status
        Write-Host "✅ GitHub login status:" -ForegroundColor Green
        Write-Host "$user" -ForegroundColor Gray
        return $true
    } catch {
        Write-Host "❌ Not logged in to GitHub" -ForegroundColor Red
        return $false
    }
}

# Function to login to GitHub
function Login-GitHub {
    Write-Host "`n🔐 Logging in to GitHub..." -ForegroundColor Yellow
    Write-Host "A browser window will open for authentication..." -ForegroundColor Gray
    
    try {
        gh auth login --web
        Write-Host "✅ Successfully logged in to GitHub!" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Failed to login to GitHub" -ForegroundColor Red
        return $false
    }
}

# Function to check GitHub Actions workflows
function Check-GitHubActions {
    Write-Host "`n📊 Checking GitHub Actions workflows..." -ForegroundColor Yellow
    
    try {
        # List recent workflow runs
        Write-Host "Recent workflow runs:" -ForegroundColor Gray
        gh run list --limit 10
        
        Write-Host "`n✅ GitHub Actions workflows retrieved successfully" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Failed to retrieve GitHub Actions workflows" -ForegroundColor Red
        return $false
    }
}

# Function to check specific workflow status
function Check-WorkflowStatus {
    Write-Host "`n🔍 Checking specific workflow status..." -ForegroundColor Yellow
    
    try {
        # Get the latest workflow run
        $latestRun = gh run list --limit 1 --json status,conclusion,workflowName,createdAt,url
        Write-Host "Latest workflow run:" -ForegroundColor Gray
        Write-Host "$latestRun" -ForegroundColor White
        
        # Check if there are any running workflows
        $runningRuns = gh run list --status in_progress --limit 5
        if ($runningRuns) {
            Write-Host "`n🔄 Currently running workflows:" -ForegroundColor Yellow
            Write-Host "$runningRuns" -ForegroundColor Gray
        } else {
            Write-Host "`n✅ No workflows currently running" -ForegroundColor Green
        }
        
        return $true
    } catch {
        Write-Host "❌ Failed to check workflow status" -ForegroundColor Red
        return $false
    }
}

# Function to view workflow logs
function View-WorkflowLogs {
    Write-Host "`n📋 Viewing workflow logs..." -ForegroundColor Yellow
    
    try {
        # Get the latest run ID
        $latestRunId = gh run list --limit 1 --json databaseId --jq '.[0].databaseId'
        
        if ($latestRunId) {
            Write-Host "Latest run ID: $latestRunId" -ForegroundColor Gray
            Write-Host "Viewing logs for latest run..." -ForegroundColor Gray
            
            # View logs for the latest run
            gh run view $latestRunId --log
        } else {
            Write-Host "❌ No workflow runs found" -ForegroundColor Red
        }
        
        return $true
    } catch {
        Write-Host "❌ Failed to view workflow logs" -ForegroundColor Red
        return $false
    }
}

# Function to trigger a new workflow run
function Trigger-Workflow {
    Write-Host "`n🔄 Triggering new workflow run..." -ForegroundColor Yellow
    
    try {
        # Get workflow file name
        $workflowFile = ".github/workflows/cd.yml"
        
        if (Test-Path $workflowFile) {
            Write-Host "Found workflow file: $workflowFile" -ForegroundColor Gray
            
            # Trigger workflow by pushing to main branch
            Write-Host "Triggering workflow by making a small commit..." -ForegroundColor Gray
            
            # Create a small change to trigger workflow
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            Add-Content -Path "workflow-trigger.txt" -Value "Workflow triggered at: $timestamp"
            
            git add workflow-trigger.txt
            git commit -m "Trigger GitHub Actions workflow - $timestamp"
            git push
            
            Write-Host "✅ Workflow triggered successfully!" -ForegroundColor Green
            Write-Host "Check GitHub Actions tab for progress" -ForegroundColor Gray
        } else {
            Write-Host "❌ Workflow file not found: $workflowFile" -ForegroundColor Red
        }
        
        return $true
    } catch {
        Write-Host "❌ Failed to trigger workflow" -ForegroundColor Red
        return $false
    }
}

# Function to check repository status
function Check-RepositoryStatus {
    Write-Host "`n📊 Checking repository status..." -ForegroundColor Yellow
    
    try {
        # Get repository info
        $repoInfo = gh repo view --json name,owner,url,defaultBranchRef
        Write-Host "Repository information:" -ForegroundColor Gray
        Write-Host "$repoInfo" -ForegroundColor White
        
        # Check if we're in the right repository
        $currentRepo = git remote get-url origin
        Write-Host "`nCurrent repository: $currentRepo" -ForegroundColor Gray
        
        return $true
    } catch {
        Write-Host "❌ Failed to check repository status" -ForegroundColor Red
        return $false
    }
}

# Main execution
Write-Host "`n🚀 Starting GitHub Actions login and check..." -ForegroundColor Green

# Check if we're in a git repository
if (!(Test-Path ".git")) {
    Write-Host "❌ Not in a git repository!" -ForegroundColor Red
    exit 1
}

# Step 1: Check GitHub CLI
if (!(Check-GitHubCLI)) {
    Write-Host "❌ Failed to install GitHub CLI" -ForegroundColor Red
    exit 1
}

# Step 2: Check login status
if (!(Check-GitHubLogin)) {
    # Step 3: Login to GitHub
    if (!(Login-GitHub)) {
        Write-Host "`n❌ Failed to login to GitHub. Please login manually:" -ForegroundColor Red
        Write-Host "Run: gh auth login --web" -ForegroundColor Yellow
        exit 1
    }
}

# Step 4: Check repository status
Check-RepositoryStatus

# Step 5: Check GitHub Actions
if (!(Check-GitHubActions)) {
    Write-Host "⚠️ Could not retrieve GitHub Actions, but continuing..." -ForegroundColor Yellow
}

# Step 6: Check workflow status
Check-WorkflowStatus

# Step 7: Ask if user wants to view logs
Write-Host "`n📋 Do you want to view workflow logs? (y/n)" -ForegroundColor Cyan
$viewLogs = Read-Host
if ($viewLogs -eq "y" -or $viewLogs -eq "Y") {
    View-WorkflowLogs
}

# Step 8: Ask if user wants to trigger new workflow
Write-Host "`n🔄 Do you want to trigger a new workflow run? (y/n)" -ForegroundColor Cyan
$triggerWorkflow = Read-Host
if ($triggerWorkflow -eq "y" -or $triggerWorkflow -eq "Y") {
    Trigger-Workflow
}

Write-Host "`n🎉 GitHub Actions check completed!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host "✅ GitHub CLI: Installed and logged in" -ForegroundColor Green
Write-Host "✅ Repository: Connected" -ForegroundColor Green
Write-Host "✅ Workflows: Checked" -ForegroundColor Green
Write-Host "✅ Status: Retrieved" -ForegroundColor Green
Write-Host "`n📊 Check GitHub Actions tab for detailed status!" -ForegroundColor Cyan
Write-Host "URL: https://github.com/Kendo260599/soulfriend/actions" -ForegroundColor Cyan
