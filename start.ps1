param(
    [ValidateRange(1024, 65500)][int]$BackendPort = 5080,
    [ValidateRange(1024, 65500)][int]$FrontendPort = 5173,
    [switch]$NoBrowser,
    [switch]$Check
)

$ErrorActionPreference = 'Stop'
$backendProcess = $null
$frontendProcess = $null
$previousProxy = $env:CINEMA_API_PROXY
$previousEnvironment = $env:ASPNETCORE_ENVIRONMENT

function Invoke-Checked {
    param([string]$Command, [string[]]$Arguments)
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Command failed (exit $LASTEXITCODE)." }
}

function Find-FreePort {
    param([int]$Preferred)
    foreach ($candidate in $Preferred..($Preferred + 20)) {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::IPv6Any, $candidate)
        try {
            $listener.Server.DualMode = $true
            $listener.Start()
            return $candidate
        }
        catch [System.Net.Sockets.SocketException] { }
        finally { $listener.Stop() }
    }
    throw "No free port near $Preferred. Pass -BackendPort or -FrontendPort to choose another."
}

function Wait-Endpoint {
    param([string]$Url, [System.Diagnostics.Process]$Process, [string[]]$Logs)
    $deadline = [DateTime]::UtcNow.AddMinutes(2)
    do {
        if ($Process.HasExited) { break }
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -eq 200) { return }
        }
        catch { }
        Start-Sleep -Milliseconds 500
    } while ([DateTime]::UtcNow -lt $deadline)
    foreach ($log in $Logs) {
        if (Test-Path -LiteralPath $log) { Get-Content -LiteralPath $log -Tail 15 }
    }
    throw "The app did not become ready at $Url. See the logs above."
}

function Stop-StartedProcess {
    param([System.Diagnostics.Process]$Process)
    if ($null -ne $Process -and -not $Process.HasExited) {
        # Kill only the process tree this script started, including npm's Vite child.
        & taskkill.exe /PID $Process.Id /T /F 2>$null | Out-Null
    }
}

Push-Location $PSScriptRoot
try {
    foreach ($command in @('dotnet', 'node', 'npm.cmd', 'docker')) {
        if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
            throw "Install $command first. See README.md for the required .NET, Node.js, and Docker versions."
        }
    }

    Write-Host 'Starting PostgreSQL…' -ForegroundColor Cyan
    Invoke-Checked 'docker' @('compose', 'up', '-d', '--wait', 'postgres')

    if (-not (Test-Path -LiteralPath 'src/frontend/node_modules/.package-lock.json')) {
        Write-Host 'Installing frontend dependencies…' -ForegroundColor Cyan
        Invoke-Checked 'npm.cmd' @('ci', '--prefix', 'src/frontend')
    }

    $chosenBackendPort = Find-FreePort $BackendPort
    $chosenFrontendPort = Find-FreePort $FrontendPort
    if ($chosenFrontendPort -eq $chosenBackendPort) { $chosenFrontendPort = Find-FreePort ($chosenFrontendPort + 1) }
    $backendUrl = "http://localhost:$chosenBackendPort"
    $frontendUrl = "http://localhost:$chosenFrontendPort"
    $env:CINEMA_API_PROXY = $backendUrl
    $env:ASPNETCORE_ENVIRONMENT = 'Development'
    $logDirectory = Join-Path $PSScriptRoot '.dev'
    New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
    $runId = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
    $backendLog = Join-Path $logDirectory "$runId-backend.log"
    $backendError = Join-Path $logDirectory "$runId-backend-error.log"
    $frontendLog = Join-Path $logDirectory "$runId-frontend.log"
    $frontendError = Join-Path $logDirectory "$runId-frontend-error.log"

    Write-Host 'Starting backend and frontend…' -ForegroundColor Cyan
    # Launch without an apphost so a previous locally running .exe cannot block compilation.
    $backendProcess = Start-Process -FilePath (Get-Command dotnet).Source -WorkingDirectory $PSScriptRoot `
        -ArgumentList @('run', '--project', 'src/backend', '--no-launch-profile', '-p:UseAppHost=false', '--', '--urls', $backendUrl, '--Logging:LogLevel:Microsoft.EntityFrameworkCore', 'Warning') `
        -WindowStyle Hidden -PassThru -RedirectStandardOutput $backendLog -RedirectStandardError $backendError
    $frontendProcess = Start-Process -FilePath $env:ComSpec -WorkingDirectory (Join-Path $PSScriptRoot 'src/frontend') `
        -ArgumentList @('/d', '/c', "npm run dev -- --host localhost --port $chosenFrontendPort") `
        -WindowStyle Hidden -PassThru -RedirectStandardOutput $frontendLog -RedirectStandardError $frontendError

    Wait-Endpoint "$backendUrl/health/ready" $backendProcess @($backendLog, $backendError)
    Wait-Endpoint "$backendUrl/api/admin/catalog" $backendProcess @($backendLog, $backendError)
    Wait-Endpoint "$frontendUrl/admin" $frontendProcess @($frontendLog, $frontendError)

    Write-Host "`nCinema is ready: $frontendUrl/admin" -ForegroundColor Green
    Write-Host "Backend: $backendUrl"
    Write-Host "Logs: $logDirectory"
    if ($Check) {
        Write-Host 'Startup check passed. Stopping the two test processes.' -ForegroundColor Green
    }
    else {
        Write-Host 'Keep this terminal open. Press Ctrl+C to stop both servers; PostgreSQL keeps its data.'
        if (-not $NoBrowser) { Start-Process "$frontendUrl/admin" -WindowStyle Hidden }
        while (-not $backendProcess.HasExited -and -not $frontendProcess.HasExited) {
            Start-Sleep -Milliseconds 500
        }
        foreach ($process in @($backendProcess, $frontendProcess)) {
            if ($process.HasExited -and $process.ExitCode -ne 0) { throw 'A server stopped unexpectedly. See the .dev logs.' }
        }
    }
}
finally {
    Stop-StartedProcess $frontendProcess
    Stop-StartedProcess $backendProcess
    $env:CINEMA_API_PROXY = $previousProxy
    $env:ASPNETCORE_ENVIRONMENT = $previousEnvironment
    Pop-Location
}
