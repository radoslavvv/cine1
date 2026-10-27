# Frontend guide

## Organize by feature

Product areas own their code. The app composes an auditorium entrance and a schedule; the schedule consumes the movie feature's public API. Booking and admin can become sibling features when we build them.

```text
src/
  main.tsx
  app/
    App.tsx
    providers/AppProviders.tsx
    theme.css
  features/
    cinema-entrance/
      index.ts
      CinemaEntrance.tsx
      useCinemaJourney.ts
      components/
        Auditorium.tsx
        ScreenProjection.tsx
        SeatRows.tsx
    schedule/
      index.ts
      SchedulePage.tsx
      model/demoSchedule.ts
      components/DatePicker.tsx
    movies/
      index.ts
      types.ts
      presentation.ts
      assets/README.md
      api/
        getMovies.ts
        movieQueries.ts
      components/
        MovieArtwork.tsx
  shared/
    ui/
      Button.tsx
      StatusMessage.tsx
```

`app` composes features and installs providers. `CinemaEntrance` accepts the schedule as children and knows nothing about movie data. The schedule imports movie types, query options, artwork, and presentation helpers through `features/movies/index.ts`, never through internal paths. Movies owns those backend calls and presentation mappings. Shared UI has no knowledge of movies and must not import features or app code. Keep dependencies in one direction; compose features in the app and expose a small public interface when needed.

This is pragmatic feature-folder organization, not the formal Feature-Sliced Design layer system. Do not add empty booking/admin directories, generic repositories, or extra layers before there is code that needs them. The imports are conventions, not currently enforced by a lint rule. Tailwind utilities style components directly in JSX; the separate `app/theme.css` owns the theme.

## Visual direction

Frame opens inside a layered auditorium: dim ceiling panels, warm pleated walls, patterned carpet, seat banks around a central aisle, and a projected mountain scene. Scroll forward through the rows until the screen fills the viewport and becomes the schedule. Near-black violet surfaces, amber lighting, warm ivory typography, and small playful details carry into the schedule. The theme stays dark regardless of system preference.

Artwork is local only. Until the user supplies movie posters and backdrops, `MovieArtwork` draws decorative placeholders with Tailwind utilities. Add the documented files to `features/movies/assets/` and Vite discovers them; see [artwork instructions](../src/frontend/src/features/movies/assets/README.md). Load failures retain the illustration rather than a broken image. `presentation.ts` maps sample movie titles to artwork, genre labels, and short editorial notes; these are frontend presentation metadata, not backend fields. Unknown titles use a generic illustration and label. Small schedule thumbnails omit decorative titles to avoid cramped lettering. The auditorium projection is original local SVG/DOM artwork, independent of movie availability. There are no external font or image requests.

Interactive elements must perform a real action. Preserve visible keyboard focus, readable text, mobile layouts, and reduced-motion support. Decoration is hidden from assistive technology. Showtime chips are read-only times, not misleading booking buttons. Booking and seat availability are not implemented yet.

## Auditorium journey

The entrance occupies 300 small viewport heights (`svh`), with a one-viewport sticky stage. Its two-viewport scroll range drives normalized progress from 0 to 1. A smoothstep curve supplies `--travel`; seat rows use different translation speeds and scales while walls and ceiling exit in opposite directions. The screen rectangle expands to cover the stage. This is a stylized 2.5D scene inspired by the reference, not a photo zoom or a WebGL simulation.

`useCinemaJourney` reads native scroll position through a passive listener and schedules at most one update per animation frame. It updates CSS properties on the wrapper instead of rendering React on every scroll tick. ResizeObserver, resize, pageshow, and motion-preference changes recalculate the geometry. The hook removes listeners and cancels pending frames on unmount; native scrolling is never intercepted.

The real schedule overlaps the final viewport of the journey. During the final 4% it fades into the enlarged screen; its controls remain `inert` and hidden from assistive technology until the handoff. It then scrolls as ordinary page content, with no nested scrolling area. Scrolling back reverses the effect. The screen itself never contains a tiny interactive copy of the schedule.

**Skip to schedule** jumps directly to the schedule, updates the fragment, and moves focus there. With `prefers-reduced-motion: reduce`, the auditorium is a static single-viewport introduction followed by the fully accessible schedule; there is no zoom or hidden multi-viewport gap. Mobile uses wider screen proportions and fewer seats per bank. Use the main back link to revisit the auditorium.

## Demo schedule boundary

Movie titles and durations still come from `/api/movies` through TanStack Query. Dates, auditorium labels, and times are frontend fixtures in `schedule/model/demoSchedule.ts`, not available inventory. The interface explicitly labels the schedule as a demo; no reservation or payment request is made.

The date selector offers seven days starting on the current cinema date in `Europe/Kyiv`. Calendar arithmetic uses UTC noon to preserve consecutive dates over daylight-saving and month/year boundaries. Dates are initialized when the page mounts; reload after midnight to advance the demo window. Displayed times are Kyiv wall-clock times, including any earlier sample times on the current date; this is a browsing prototype, not a live availability filter. Adjacent demo days have different times so selection has an observable effect.

Run `npm test` in `src/frontend` for the date-boundary tests. They use Node's test runner and TypeScript stripping, with no extra test dependency.

## Tailwind and the theme

Tailwind v4 runs through `@tailwindcss/vite` in `vite.config.ts`. `main.tsx` imports `app/theme.css`, which imports Tailwind and defines tokens with `@theme`. There is no Sass or CSS Module dependency.

For example, `--color-lobby` creates `bg-lobby`, while `--color-amber` creates `text-amber`, `border-amber`, and opacity variants such as `bg-amber/10`. Typography tokens create `font-display` and `font-label`. Shadow and background-image tokens expose `shadow-screen` and `bg-carpet`.

Use utilities in JSX for layout, spacing, responsive rules, and component states. Keep recurring visual choices in the theme instead of scattering color literals through components. The placeholder illustrations use a few art-specific colors and dimensions that are not interface tokens.

`@layer base` sets the dark color scheme, body defaults, keyboard focus, and reduced-motion behavior. Theme `@utility` definitions supply atmospheric effects, including `ceiling-lights`, `auditorium-curtain`, and `ceiling-panels`. The carpet is an original local SVG tile in `public/carpet.svg`. Per-frame camera values are inline CSS properties; layout and responsive styles stay in Tailwind utilities. Nothing requires an external stylesheet or a runtime styling library.

## Learn TanStack Query through this catalog

The provider creates one stable `QueryClient` for the mounted app. It stores server data and query state in memory. It does not replace the .NET API, perform HTTP by itself, or persist the cache across full page reloads. `getMovies` still uses native `fetch` and throws for non-success HTTP responses.

The schedule consumes the movie feature's query definition:

```tsx
const moviesQuery = useQuery(movieQueries.list());
```

The definition uses `queryOptions` to keep the key, request function, and settings together with TypeScript inference. The request receives TanStack Query's `AbortSignal`, so an abandoned request can be cancelled.

- **Query key:** `['movies', 'list']` identifies this cache entry. Components requesting the same key share its result; future filter parameters that change the backend response belong in the key.
- **Freshness:** `staleTime: 60_000` means the loaded catalog is fresh for one minute. Becoming stale does not itself trigger a timed request.
- **Refetching:** stale data can refetch on mount, window visibility/focus changes, or network reconnection. **Refresh movies** calls `refetch()` even while data is fresh. This page does not poll.
- **Retries:** the movie query retries once after one second, then shows the initial error or a failed-refresh notice. This policy is scoped to movies; it must not be assumed suitable for seat holds or payment mutations.
- **Cache lifetime:** the default inactive cache lifetime is five minutes. That differs from freshness: stale cached data can still be displayed. A full reload creates a new in-memory cache.
- **Invalidation:** later, after editing a movie successfully, `queryClient.invalidateQueries({ queryKey: movieQueries.all })` can mark movie queries stale and refetch active consumers. There are no write operations in this milestone.

Use `isPending` to identify a query with no result yet, and `isFetching` to identify an active request, including background updates. An offline request may be pending but paused; the UI explains that it is waiting for connectivity. After a successful fetch, a failed refresh retains `data`, so checking `isError` alone must not replace that data with a full-page error.

Server data belongs in Query. Local interactions, such as a dialog or search input, belong in React state. The glossary in `CONTEXT.md` is reserved for cinema concepts, not library terminology.

## Try it yourself

1. Run both projects and open the devtools toggle at the bottom-left. Inspect `['movies', 'list']` and the cached movie array.
2. Use browser network throttling and reload. Observe the loading state, then the cached result. Development Strict Mode can cancel the first mount's request; a cancelled request is expected.
3. Select **Refresh movies**. Watch `isFetching` and the network request while the cards stay visible. The button prevents duplicate manual refreshes while a request is active.
4. Wait more than one minute, switch to another browser tab, and return. Observe a background refresh of stale data. The one-minute timer alone does not cause polling.
5. Stop the API after a successful load and select **Refresh movies**. After the retry, the previous cards remain alongside a failure notice. Restart the API and refresh again.
6. Stop the API and fully reload, then skip to the schedule to exercise an initial failure with no cached result. Restart it and use **Try again**.
7. Override the movie response with `[]` using browser response overrides, then reload. Observe the empty state and remove the override afterward.
8. Toggle offline mode in Query devtools to inspect a paused request. Restore connectivity and observe recovery.

Use **Skip to schedule** before these exercises when inspecting query UI. The API is loaded while entering the auditorium, so its loading indicator may finish before the scroll journey does.

Devtools are lazy-loaded only under `import.meta.env.DEV`; Vite's production build removes the import branch. This keeps learning tools out of the delivered app.

## References

- [Query options](https://tanstack.com/query/latest/docs/framework/react/guides/query-options)
- [Important defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
- [Devtools](https://tanstack.com/query/latest/docs/framework/react/devtools)
- [Tailwind with Vite](https://tailwindcss.com/docs/installation/using-vite)
- [Tailwind theme variables](https://tailwindcss.com/docs/theme)
