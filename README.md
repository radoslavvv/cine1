# Cinema Booking Learning Project

A React + TypeScript client connected to an ASP.NET Core controller API. This first scaffold displays three sample movies from an injected, in-memory catalog.

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

Open [the movie catalog](http://localhost:5173). The backend listens on `http://localhost:5080`. Vite uses port 5173 with `strictPort`, so it fails clearly if that port is occupied. Stop each process with Ctrl+C.

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

The page should display all three titles and durations. To examine loading, use browser network throttling and refresh. To examine failure, stop the backend and refresh; restart it and select **Try again** to recover. To examine the empty state, use the browser's response override for `/api/movies` with `[]`, then reload and remove the override afterward.

## How the code fits together

- `src/frontend/src/App.tsx`: fetch lifecycle, catalog display, loading/empty/error states, and retry.
- `src/frontend/src/movies.ts`: the frontend movie type and HTTP request.
- `src/frontend/vite.config.ts`: fixed development port and API proxy.
- `src/backend/Controllers/MoviesController.cs`: HTTP endpoint using dependency injection.
- `src/backend/Movies/`: movie model, catalog interface, and sample implementation.
- `src/backend/Program.cs`: service registration and endpoint setup.

The request path is React → Vite proxy → controller → catalog. The sample data resets with the process and there are no write endpoints. The poster-like illustrations are decorative CSS artwork, not official movie posters.

## Learning documents

- [ROADMAP.md](ROADMAP.md): six milestones, experiments, and acceptance criteria. The initial scaffold's build and runtime checks have passed; the first full milestone still includes administration, identity, and basic booking.
- [CONTEXT.md](CONTEXT.md): domain vocabulary, separate from implementation decisions.

Future work introduces PostgreSQL, authentication, booking, Docker infrastructure, and messaging incrementally. Architectural decision records will be added when a consequential tradeoff warrants one.

## References

- [React: building from scratch](https://react.dev/learn/build-a-react-app-from-scratch)
- [Vite getting started](https://vite.dev/guide/)
