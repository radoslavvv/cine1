param([switch]$Check)

$ErrorActionPreference = 'Stop'
Push-Location (Split-Path $PSScriptRoot -Parent)
try {
    $prettier = Join-Path $PWD 'src/frontend/node_modules/prettier/bin/prettier.cjs'
    if (-not (Test-Path -LiteralPath $prettier)) {
        throw 'Install frontend dependencies first: npm ci --prefix src/frontend'
    }

    $mode = if ($Check) { '--check' } else { '--write' }
    & node $prettier . $mode
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    $dotnetArguments = @('format', 'whitespace', 'CinemaR.slnx', '--no-restore')
    if ($Check) { $dotnetArguments += '--verify-no-changes' }
    & dotnet @dotnetArguments
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
    Pop-Location
}
