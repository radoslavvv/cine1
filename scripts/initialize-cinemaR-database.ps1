$ErrorActionPreference = 'Stop'

# Keep the existing Compose role and volume while adopting the exact product database name.
$databases = & docker compose exec -T postgres psql -U cinemar -d postgres -At -v ON_ERROR_STOP=1 -c 'SELECT datname FROM pg_database'
if ($LASTEXITCODE -ne 0) { throw 'Could not inspect the local PostgreSQL databases.' }
$hasLegacy = $databases -ccontains 'cinemar'
$hasCurrent = $databases -ccontains 'cinemaR'
if ($hasLegacy -and $hasCurrent) {
    throw 'Both cinemar and cinemaR databases exist. Choose the intended database before starting the app.'
}
if ($hasLegacy) {
    'ALTER DATABASE cinemar RENAME TO "cinemaR";' | & docker compose exec -T postgres psql -U cinemar -d postgres -v ON_ERROR_STOP=1
    if ($LASTEXITCODE -ne 0) { throw 'Database rename failed. Stop older API processes and retry; existing data was retained.' }
    Write-Host 'Renamed the existing development database to cinemaR.'
}
elseif (-not $hasCurrent) {
    throw 'The cinemaR development database is missing. Check the Compose volume and PostgreSQL initialization.'
}
