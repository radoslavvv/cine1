param(
    [string]$Filter = ""
)

$ErrorActionPreference = 'Stop'
$containerName = 'cinemar-tests-' + [Guid]::NewGuid().ToString('N')
$previousConnection = $env:CINEMAR_TEST_POSTGRES
$testExitCode = 1

try {
    docker run --detach --rm --name $containerName --env POSTGRES_PASSWORD=cinemar_tests --publish 127.0.0.1::5432 postgres:18 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not start the disposable PostgreSQL container.'
    }

    $ready = $false
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        docker exec $containerName pg_isready -h 127.0.0.1 -U postgres 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $ready = $true
            break
        }
        Start-Sleep -Seconds 1
    }
    if (!$ready) {
        throw 'PostgreSQL did not become ready.'
    }

    $binding = docker port $containerName 5432/tcp
    if ($binding -notmatch '^127\.0\.0\.1:(\d+)$') {
        throw 'Unexpected PostgreSQL port binding.'
    }
    $env:CINEMAR_TEST_POSTGRES = "Host=127.0.0.1;Port=$($Matches[1]);Database=postgres;Username=postgres;Password=cinemar_tests"
    $project = Join-Path $PSScriptRoot '../src/backend/CinemaR.IntegrationTests/CinemaR.IntegrationTests.csproj'
    & dotnet restore $project --locked-mode
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not restore the integration test dependencies from the lock file.'
    }
    $testArguments = @('test', $project, '--no-restore', '--configuration', 'Release')
    if ($Filter) {
        $testArguments += @('--filter', $Filter)
    }
    & dotnet @testArguments
    $testExitCode = $LASTEXITCODE
}
finally {
    $env:CINEMAR_TEST_POSTGRES = $previousConnection
    docker rm --force $containerName 2>$null | Out-Null
}

exit $testExitCode
