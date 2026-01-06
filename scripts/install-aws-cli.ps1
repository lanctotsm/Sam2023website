<# 
  Installs AWS CLI on Windows (if missing) so you can run 'aws configure'.
  After running, restart Cursor/terminal if aws is still not found.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Test-Command {
  param([Parameter(Mandatory=$true)][string]$Name)
  $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

Write-Host "Checking for 'aws' CLI..."
if (Test-Command -Name "aws") {
  $version = (aws --version 2>&1).ToString()
  Write-Host "'aws' CLI already installed: $version"
  Write-Host "You can run 'aws configure' to set up your credentials."
  exit 0
}

Write-Host "'aws' CLI not found. Installing AWS CLI..."

try {
  # Try winget first (Windows Package Manager) - it handles elevation automatically
  if (Test-Command -Name "winget") {
    Write-Host "Using winget to install AWS CLI..."
    $wingetProcess = Start-Process -FilePath "winget" -ArgumentList "install -e --id Amazon.AWSCLI --accept-package-agreements --accept-source-agreements --silent" -Wait -PassThru -NoNewWindow
    
    if ($wingetProcess.ExitCode -eq 0) {
      Write-Host "AWS CLI installation completed successfully via winget."
      # Refresh PATH
      $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
      Start-Sleep -Seconds 2
      
      if (Test-Command -Name "aws") {
        $version = (aws --version 2>&1).ToString()
        Write-Host "AWS CLI is now available: $version"
        Write-Host "You can now run 'aws configure' to set up your credentials."
        exit 0
      } else {
        Write-Warning "AWS CLI installed but not yet available in PATH."
        Write-Warning "Please restart Cursor/VS Code/terminal, then run 'aws configure'."
        exit 0
      }
    } else {
      Write-Warning "winget installation failed (exit code: $($wingetProcess.ExitCode)). Trying MSI installer..."
    }
  }
  
  # Fallback to MSI installer with elevation
  Write-Host "Downloading AWS CLI MSI installer..."
  try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}
  
  $msiUrl = "https://awscli.amazonaws.com/AWSCLIV2.msi"
  $tempDir = $env:TEMP
  $msiPath = Join-Path $tempDir "AWSCLIV2.msi"
  
  Invoke-WebRequest -Uri $msiUrl -OutFile $msiPath -UseBasicParsing
  
  Write-Host "Installing AWS CLI (this may prompt for admin privileges)..."
  # Request elevation with -Verb RunAs
  $process = Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$msiPath`" /quiet /norestart" -Wait -PassThru -Verb RunAs
  
  if ($process.ExitCode -eq 0 -or $process.ExitCode -eq 3010) {
    Write-Host "AWS CLI installation completed successfully."
    Remove-Item $msiPath -ErrorAction SilentlyContinue
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    Start-Sleep -Seconds 2
    
    if (Test-Command -Name "aws") {
      $version = (aws --version 2>&1).ToString()
      Write-Host "AWS CLI is now available: $version"
      Write-Host "You can now run 'aws configure' to set up your credentials."
    } else {
      Write-Warning "AWS CLI installed but not yet available in PATH."
      Write-Warning "Please restart Cursor/VS Code/terminal, then run 'aws configure'."
    }
  } else {
    Write-Error "Installation failed with exit code: $($process.ExitCode)"
    Write-Host "You may need to run this script as Administrator, or install manually from: https://aws.amazon.com/cli/"
    exit 1
  }
} catch {
  Write-Error "Failed to install AWS CLI. Error: $($_.Exception.Message)"
  Write-Host "You can also install AWS CLI manually from: https://aws.amazon.com/cli/"
  exit 1
}

