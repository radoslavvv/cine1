param([switch]$Check)

$ErrorActionPreference = 'Stop'
Push-Location (Split-Path $PSScriptRoot -Parent)
try {
    $prettier = Join-Path $PWD 'src/frontend/node_modules/prettier/bin/prettier.cjs'
    if (-not (Test-Path -LiteralPath $prettier)) {
        throw 'Install frontend dependencies first: npm ci --prefix src/frontend'
    }

    $readableArguments = @('scripts/format-readable.cjs')
    if ($Check) { $readableArguments += '--check' }
    & node @readableArguments
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    $mode = if ($Check) { '--check' } else { '--write' }
    & node $prettier . $mode
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    $styleArguments = @('format', 'style', 'CinemaR.slnx', '--no-restore', '--diagnostics', 'IDE0011', 'IDE0021', 'IDE0022', 'IDE0023', 'IDE0024', 'IDE0025', 'IDE0026', 'IDE0027', 'IDE0061', 'IDE2000')
    if ($Check) { $styleArguments += '--verify-no-changes' }
    & dotnet @styleArguments
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    $dotnetArguments = @('format', 'whitespace', 'CinemaR.slnx', '--no-restore')
    if ($Check) { $dotnetArguments += '--verify-no-changes' }
    & dotnet @dotnetArguments
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
    Pop-Location
}
