param([string]$BaseUrl = 'http://localhost:5080')
$ErrorActionPreference = 'Stop'

function Assert-Check([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw $Message }
    Write-Host "PASS $Message"
}

function Assert-Status([string]$Path, [int]$Expected, [string]$Method = 'GET') {
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl$Path" -Method $Method
        $status = [int]$response.StatusCode
    } catch {
        if (-not $_.Exception.Response) { throw }
        $status = [int]$_.Exception.Response.StatusCode
    }
    Assert-Check ($status -eq $Expected) "$Method $Path returns $Expected"
}

# Use the Windows ID for compatibility with older Windows PowerShell timezone mappings.
$cinemaDate = [TimeZoneInfo]::ConvertTimeBySystemTimeZoneId([DateTime]::UtcNow, 'FLE Standard Time').ToString('yyyy-MM-dd')
$showtimes = Invoke-RestMethod "$BaseUrl/api/showtimes?date=$cinemaDate"
Assert-Check ($showtimes.Count -eq 12) 'Today has twelve seeded screenings (run during the initial seven-day seed window)'
Assert-Check (($showtimes.movie.id | Select-Object -Unique).Count -eq 6) 'Schedule contains six films from the rotating catalog'
Assert-Check ($showtimes[0].movie.genres.Count -gt 0 -and $showtimes[0].movie.synopsis.Length -gt 0) 'Movie metadata comes from the schedule API'
Assert-Check ($showtimes[0].startsAt.EndsWith('Z') -and $showtimes[0].auditorium.name.Length -gt 0) 'Showtimes carry UTC instants and auditorium names'
$nextDate = [DateTime]::ParseExact($cinemaDate, 'yyyy-MM-dd', [Globalization.CultureInfo]::InvariantCulture).AddDays(1).ToString('yyyy-MM-dd')
$tomorrow = Invoke-RestMethod "$BaseUrl/api/showtimes?date=$nextDate"
$todayTitles = ($showtimes.movie.title | Sort-Object -Unique) -join ','
$tomorrowTitles = ($tomorrow.movie.title | Sort-Object -Unique) -join ','
Assert-Check ($todayTitles -ne $tomorrowTitles) 'Different dates offer different movie lineups'
$todayTimes = $showtimes | ForEach-Object { ([DateTimeOffset]::Parse($_.startsAt)).TimeOfDay.ToString() }
$tomorrowTimes = $tomorrow | ForEach-Object { ([DateTimeOffset]::Parse($_.startsAt)).TimeOfDay.ToString() }
Assert-Check (($todayTimes -join ',') -ne ($tomorrowTimes -join ',')) 'Different dates have different screening times'
$emptySchedule = Invoke-RestMethod "$BaseUrl/api/showtimes?date=2099-01-01"
Assert-Check ($emptySchedule.Count -eq 0) 'A date without screenings returns an empty array'
Assert-Status '/api/showtimes' 400
Assert-Status '/api/showtimes?date=not-a-date' 400
Assert-Status '/api/showtimes?date=2026-02-30' 400
Assert-Status '/api/showtimes?date=9999-12-31' 400
Assert-Status '/api/movies' 404
Assert-Status '/api/showtimes' 405 'POST'
$health = Invoke-WebRequest -UseBasicParsing 'http://localhost:5080/health/ready'
Assert-Check ($health.StatusCode -eq 200) 'Database readiness is healthy'

Write-Host 'Running calendar, fresh migration, seed persistence, and PostgreSQL constraint checks in an isolated temporary database...'
dotnet run --project "$PSScriptRoot/../tests/Cinema.Api.Checks"
if ($LASTEXITCODE -ne 0) { throw 'Database checks failed' }
