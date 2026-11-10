#requires -Version 7.0
param(
    [ValidateSet('Correctness', 'Capacity', 'All')]
    [string]$Mode = 'All',
    [ValidateRange(1, 100)]
    [int]$PeakRate = 50,
    [ValidateRange(5, 60)]
    [int]$StageSeconds = 30
)

$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$runId = [Guid]::NewGuid().ToString('N')
$output = Join-Path $root ".dev/load/$runId"
$container = "cinemar-load-$runId"
$database = "cinemar_load_$runId"
$processes = @()
$previousEnvironment = @{}
$exitCode = 1
New-Item -ItemType Directory -Path $output -Force | Out-Null

function Set-RunEnvironment([string]$Name, [string]$Value) {
    if (!$previousEnvironment.ContainsKey($Name)) {
        $previousEnvironment[$Name] = [Environment]::GetEnvironmentVariable($Name, 'Process')
    }
    [Environment]::SetEnvironmentVariable($Name, $Value, 'Process')
}

function Invoke-Checked([string]$Executable, [string[]]$Arguments) {
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Executable failed with exit code $LASTEXITCODE. See the output above."
    }
}

function Start-RunProcess([string]$Name, [string[]]$Arguments) {
    # ArgumentList is a command line, so quote paths explicitly; generated paths cannot contain quotes.
    $quoted = $Arguments | ForEach-Object { '"' + $_ + '"' }
    return Start-Process dotnet -ArgumentList $quoted -WorkingDirectory $root -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $output "$Name.log") -RedirectStandardError (Join-Path $output "$Name-error.log")
}

try {
    Invoke-Checked docker @('info', '--format', '{{.ServerVersion}}')
    $toolProject = Join-Path $root 'tests/load/fixtures/CinemaR.LoadTests.csproj'
    $apiProject = Join-Path $root 'src/backend/CinemaR.Api/CinemaR.Api.csproj'
    Invoke-Checked dotnet @('restore', $toolProject, '--locked-mode')
    Invoke-Checked dotnet @('restore', $apiProject, '--locked-mode')
    Invoke-Checked dotnet @('build', $toolProject, '--no-restore', '--configuration', 'Release')
    Invoke-Checked dotnet @('build', $apiProject, '--no-restore', '--configuration', 'Release')

    # Cache a verified official Windows binary locally, without installing system-wide tools.
    $version = '1.6.1'
    $tools = Join-Path $root ".dev/tools/k6-$version"
    $k6 = Join-Path $tools "k6-v$version-windows-amd64/k6.exe"
    if (!(Test-Path -LiteralPath $k6)) {
        New-Item -ItemType Directory -Path $tools -Force | Out-Null
        $archiveName = "k6-v$version-windows-amd64.zip"
        $archive = Join-Path $tools $archiveName
        $release = "https://github.com/grafana/k6/releases/download/v$version"
        Invoke-WebRequest "$release/$archiveName" -OutFile $archive
        $checksumsPath = Join-Path $tools 'checksums.txt'
        Invoke-WebRequest "$release/k6-v$version-checksums.txt" -OutFile $checksumsPath
        $checksums = Get-Content -LiteralPath $checksumsPath -Raw
        $line = ($checksums -split "`n") | Where-Object { $_.Trim().EndsWith($archiveName) }
        $expected = (($line -join '').Trim() -split '\s+')[0]
        if (!$expected -or (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne $expected) {
            throw 'Official k6 archive checksum did not match.'
        }
        Expand-Archive -LiteralPath $archive -DestinationPath $tools -Force
    }

    Invoke-Checked docker @('run', '--detach', '--rm', '--name', $container,
        '--env', 'POSTGRES_PASSWORD=cinemar_load_only', '--env', "POSTGRES_DB=$database",
        '--publish', '127.0.0.1::5432', 'postgres:18')
    $ready = $false
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        & docker exec $container pg_isready -h 127.0.0.1 -U postgres 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $ready = $true
            break
        }
        Start-Sleep -Seconds 1
    }
    if (!$ready) {
        throw 'Disposable PostgreSQL did not become ready.'
    }

    $binding = & docker port $container 5432/tcp
    if ($binding -notmatch '^127\.0\.0\.1:(\d+)$') {
        throw 'Unexpected database binding.'
    }
    # Pooling remains enabled, as in the real API, with a bounded 50-connection pool.
    $connection = "Host=127.0.0.1;Port=$($Matches[1]);Database=$database;Username=postgres;Password=cinemar_load_only;Maximum Pool Size=50;Application Name=cinemar-load"
    Set-RunEnvironment 'CINEMAR_LOAD_POSTGRES' $connection
    $toolDll = Join-Path $root 'tests/load/fixtures/bin/Release/net10.0/CinemaR.LoadTests.dll'
    Invoke-Checked dotnet @($toolDll, 'prepare', $output)

    $listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
    $listener.Start()
    $port = $listener.LocalEndpoint.Port
    $listener.Stop()
    $baseUrl = "https://127.0.0.1:$port"
    Set-RunEnvironment 'ConnectionStrings__CinemaR' $connection
    Set-RunEnvironment 'ASPNETCORE_ENVIRONMENT' 'Production'
    Set-RunEnvironment 'DOTNET_ENVIRONMENT' 'Production'
    Set-RunEnvironment 'ASPNETCORE_URLS' $baseUrl
    Set-RunEnvironment 'Kestrel__Certificates__Default__Path' (Join-Path $output 'localhost.pfx')
    Set-RunEnvironment 'Kestrel__Certificates__Default__Password' 'load-only'
    Set-RunEnvironment 'Logging__LogLevel__Default' 'Warning'
    $api = Start-RunProcess 'api' @((Join-Path $root 'src/backend/CinemaR.Api/bin/Release/net10.0/CinemaR.Api.dll'),
        '--contentRoot', (Join-Path $root 'src/backend/CinemaR.Api'))
    $processes += $api
    $ready = $false
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        if ($api.HasExited) {
            throw "Load API exited. Read $output/api-error.log and api.log."
        }
        try {
            $response = Invoke-WebRequest "$baseUrl/health/ready" -SkipCertificateCheck -TimeoutSec 2
            if ($response.StatusCode -eq 200) {
                $ready = $true
                break
            }
        }
        catch {
            Start-Sleep -Seconds 1
        }
    }
    if (!$ready) {
        throw 'Load API did not become ready.'
    }

    $observer = Start-RunProcess 'observer' @($toolDll, 'observe', $output)
    $processes += $observer
    $os = Get-CimInstance Win32_OperatingSystem
    $cpu = Get-CimInstance Win32_Processor
    $metadata = @{
        startedAt = [DateTimeOffset]::UtcNow.ToString('o')
        revision = (& git -C $root rev-parse HEAD)
        workingTree = @(& git -C $root status --short)
        mode = $Mode
        peakIterationsPerSecond = $PeakRate
        stageSeconds = $StageSeconds
        workload = '80% showtimes reads, 20% single-seat guest bookings; session setup is additional traffic'
        cpu = @($cpu | Select-Object Name, NumberOfLogicalProcessors)
        memoryGB = [Math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
        os = $os.Caption
        dotnet = (& dotnet --version)
        k6 = (& $k6 version)
        postgresImage = (& docker inspect $container --format '{{.Image}}')
        docker = (& docker info --format '{{.ServerVersion}}')
        maxPoolSize = 50
        dataset = '43 screenings; 40 capacity screenings with 250 seats each'
    }
    $metadata | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $output 'run.json')
    Set-RunEnvironment 'FIXTURE' (Join-Path $output 'fixture.json')
    Set-RunEnvironment 'BASE_URL' $baseUrl
    Set-RunEnvironment 'PEAK_RATE' "$PeakRate"
    Set-RunEnvironment 'STAGE_SECONDS' "$StageSeconds"
    $testFailed = $false
    $workloads = if ($Mode -eq 'All') { @('correctness', 'capacity') } else { @($Mode.ToLowerInvariant()) }
    foreach ($workload in $workloads) {
        Set-RunEnvironment 'SUMMARY' (Join-Path $output "$workload-summary.json")
        & $k6 run --quiet --out "json=$(Join-Path $output "$workload-timeseries.jsonl")" (Join-Path $PSScriptRoot "scenarios/$workload.js")
        if ($LASTEXITCODE -ne 0) {
            $testFailed = $true
        }
    }

    & dotnet $toolDll verify $output $Mode.ToLowerInvariant()
    if ($LASTEXITCODE -ne 0) {
        $testFailed = $true
    }
    if ($observer.HasExited) {
        $testFailed = $true
        Write-Warning 'Database observer exited unexpectedly; inspect observer-error.log.'
    }
    $exitCode = if ($testFailed) { 1 } else { 0 }
    @{ completedAt = [DateTimeOffset]::UtcNow.ToString('o'); passed = !$testFailed } |
        ConvertTo-Json | Set-Content (Join-Path $output 'result.json')
    $report = [Collections.Generic.List[string]]::new()
    $report.Add('# Booking experiment results')
    $report.Add('')
    $report.Add("- Started (UTC): $($metadata.startedAt)")
    $report.Add("- Commit: $($metadata.revision); see run.json for working-tree changes and hardware.")
    $report.Add("- Overall passed: $(!$testFailed)")
    $report.Add('- Local API, load generator and database share the same machine. No production capacity claim.')
    foreach ($workload in $workloads) {
        $summaryPath = Join-Path $output "$workload-summary.json"
        if (!(Test-Path -LiteralPath $summaryPath)) {
            continue
        }
        $summaryData = Get-Content -LiteralPath $summaryPath -Raw | ConvertFrom-Json
        $report.Add('')
        $report.Add("## $workload")
        $report.Add('')
        foreach ($metric in @('booking_confirmed', 'seat_conflicts', 'unexpected_outcome', 'replay_mismatch', 'dropped_iterations')) {
            $value = $summaryData.metrics.PSObject.Properties[$metric]
            if ($value) {
                $report.Add("- ${metric}: $($value.Value.values | ConvertTo-Json -Compress)")
            }
        }
        foreach ($metric in @('http_req_duration', 'http_req_duration{operation:booking}', 'http_req_duration{operation:browse}')) {
            $value = $summaryData.metrics.PSObject.Properties[$metric]
            if ($value) {
                $report.Add("- $metric (milliseconds): $($value.Value.values | ConvertTo-Json -Compress)")
            }
        }
        $report.Add("- Timestamped measurements: $workload-timeseries.jsonl. Inspect individual stages before drawing capacity conclusions.")
    }
    $report.Add('')
    $report.Add('Database verification: database-check.json. Lock/connection samples: postgres-samples.jsonl. Full configuration: run.json.')
    $report | Set-Content (Join-Path $output 'report.md')
}
finally {
    foreach ($process in $processes) {
        if (!$process.HasExited) {
            Stop-Process -Id $process.Id -ErrorAction SilentlyContinue
        }
    }
    # Only remove the random container created by this invocation; never touch Compose volumes.
    & docker rm --force $container 2>$null | Out-Null
    foreach ($name in $previousEnvironment.Keys) {
        [Environment]::SetEnvironmentVariable($name, $previousEnvironment[$name], 'Process')
    }
    Write-Host "Results: $output"
}

exit $exitCode
