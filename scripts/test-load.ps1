#requires -Version 7.0
param(
    [ValidateSet('Correctness', 'Capacity', 'All')]
    [string]$Mode = 'All',
    [ValidateRange(1, 100)]
    [int]$PeakRate = 50,
    [ValidateRange(5, 60)]
    [int]$StageSeconds = 30
)

# Keep the public command stable; the load-test suite owns its implementation.
& (Join-Path $PSScriptRoot '../tests/load/run.ps1') @PSBoundParameters
exit $LASTEXITCODE
