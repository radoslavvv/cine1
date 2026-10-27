# cinemaR

A React + TypeScript client connected to an ASP.NET Core controller API. Scroll through a realistic auditorium entrance, then browse a demo movie schedule. The frontend uses React Router, Tailwind CSS, and TanStack Query; movies come from the API, while showtimes are frontend fixtures.

## Requirements

- .NET 10 SDK (the solution uses the `.slnx` format).
- Node.js 22.12+ and npm; Node.js 24 LTS is recommended.
- Two terminals. PostgreSQL and Docker are not needed for this milestone.

## Install and build

Run from the project root:

```powershell
dotnet restore Cinema.slnx --locked-mode
dotnet build Cinema.slnx --no-restore
```

Then install and build the client:

```powershell
cd src/frontend
npm ci
npm run build
npm test
```

`package-lock.json` and the backend's `packages.lock.json` record dependency resolution. Commit both when placing this project under source control. The backend currently has no external NuGet packages.

## Run locally

In terminal 1, from the project root:

```powershell
dotnet run --project src/backend --launch-profile http
```

In terminal 2, from the project root:

```powershell
cd src/frontend
npm run dev
```

Open [cinemaR](http://localhost:5173). Scroll toward the screen or use **Skip to schedule**, then select a date to browse sample showtimes. The schedule is also available directly at [Movie schedule](http://localhost:5173/schedule). The backend listens on `http://localhost:5080`. Vite uses port 5173 with `strictPort`, so it fails clearly if that port is occupied. Stop each process with Ctrl+C.

The browser calls the relative URL `/api/movies`. Vite forwards `/api` requests to the backend, so local development needs no cross-origin configuration. `/health` is called directly on the backend. HTTP is intentional for this local scaffold; production HTTPS and hosting are future work. `npm run preview` serves built frontend assets on port 4173 but does not configure a backend proxy; use `npm run dev` for the connected app until production hosting is added.

## Verify the connection

With both processes running:

```powershell
Invoke-WebRequest http://localhost:5080/health
Invoke-RestMethod http://localhost:5080/api/movies
Invoke-RestMethod http://localhost:5173/api/movies
```

The health check returns HTTP 200 and `Healthy`. Both movie URLs return the same JSON array:

```json
[
  { "id": 1, "title": "Interstellar", "durationMinutes": 169 },
  { "id": 2, "title": "Spirited Away", "durationMinutes": 125 },
  { "id": 3, "title": "The Grand Budapest Hotel", "durationMinutes": 99 }
]
```

The schedule should display all three titles and durations, with clearly labeled sample times. Use **Skip to schedule** to inspect request states. To examine loading, use browser network throttling and reload. To examine initial failure, stop the backend and reload; after one automatic retry the error appears. Restart the backend and select **Try again** to recover. To examine the empty state, use the browser's response override for `/api/movies` with `[]`, then reload and remove the override afterward.

**Refresh movies** explicitly fetches a fresh catalog while keeping existing movies on screen. If that request fails, a notice explains that the displayed catalog is the last successful result. The TanStack Query devtools toggle appears in the bottom-left corner during development only.

## How the code fits together

- `src/frontend/src/app/`: app shell, Query provider, and the separate Tailwind theme in `theme.css`.
- `src/frontend/src/features/cinema-entrance/`: auditorium layers, scroll journey and route handoff, skip link, and reduced-motion handoff.
- `src/frontend/src/features/schedule/`: date selector and demo showtimes, consuming the movie feature's public API.
- `src/frontend/src/features/movies/`: request and query configuration, movie types, artwork, and local presentation data.
- `src/frontend/src/shared/ui/`: reusable button and request-status panel.
- `src/frontend/vite.config.ts`: fixed development port and API proxy.
- `src/backend/Controllers/MoviesController.cs`: HTTP endpoint using dependency injection.
- `src/backend/Movies/`: movie model, catalog interface, and sample implementation.
- `src/backend/Program.cs`: service registration and endpoint setup.

The request path is schedule → movie query → native fetch → Vite proxy → controller → catalog. The API has no showtime or write endpoints yet. Dates, auditorium labels, and showtimes are frontend-only demo data, with times displayed in Kyiv local time. Posters use styled illustrations until you add local artwork; see [artwork instructions](src/frontend/src/features/movies/assets/README.md). There are no external image requests. See [the frontend guide](docs/frontend.md) for the scroll transition, feature boundaries, Tailwind theme conventions, and Query exercises.

## Learning documents

- [ROADMAP.md](ROADMAP.md): six milestones, experiments, and acceptance criteria. The initial scaffold's build and runtime checks have passed; the first full milestone still includes administration, identity, and basic booking.
- [CONTEXT.md](CONTEXT.md): domain vocabulary, separate from implementation decisions.
- [docs/frontend.md](docs/frontend.md): frontend organization, visual conventions, and TanStack Query exercises.

Future work introduces PostgreSQL, real showtimes, authentication, booking, Docker infrastructure, and messaging incrementally. See [the auditorium decision](docs/adr/0001-layered-auditorium-entrance.md) for the visual approach and accessibility tradeoffs.

## References

- [React: building from scratch](https://react.dev/learn/build-a-react-app-from-scratch)
- [Vite getting started](https://vite.dev/guide/)
