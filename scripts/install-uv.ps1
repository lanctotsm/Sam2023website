<# 
  Installs Astral's uv tool on Windows (if missing) so uvx-based MCP servers can run.
  After running, restart Cursor/terminal if uvx is still not found.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Test-Command {
  param([Parameter(Mandatory=$true)][string]$Name)
  $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

Write-Host "Checking for 'uvx'..."
if (-not (Test-Command -Name "uvx")) {
  Write-Host "'uvx' not found. Installing 'uv' (which provides 'uvx')..."
  try {
    try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}
    iwr https://astral.sh/uv/install.ps1 -useb | iex
  } catch {
    Write-Error "Failed to install uv. Error: $($_.Exception.Message)"
    exit 1
  }
} else {
  Write-Host "'uvx' already present."
}

# Ensure current session can see uvx if installed into %USERPROFILE%\.local\bin
$userLocalBin = Join-Path $env:USERPROFILE ".local\bin"
if (-not (Test-Command -Name "uvx") -and (Test-Path $userLocalBin)) {
  $env:Path = "$userLocalBin;$env:Path"
}

if (Test-Command -Name "uvx") {
  Write-Host "'uvx' is available. You can enable uvx-based MCP servers in .cursor\mcp.json."
  exit 0
} else {
  Write-Warning "'uvx' still not available in PATH."
  Write-Warning "Please restart Cursor/VS Code/terminal, or add '$userLocalBin' to your PATH."
  exit 0
}


