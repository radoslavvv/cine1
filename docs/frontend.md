# Frontend guide

## Organize by feature

Product areas own their code. The app routes between an auditorium entrance and a schedule; the schedule consumes the movie feature's public API. Booking and admin can become sibling features when we build them.

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
        Auditorium.theme.ts
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

This is pragmatic feature-folder organization, not the formal Feature-Sliced Design layer system. Do not add empty booking/admin directories, generic repositories, or extra layers before there is code that needs them. The imports are conventions, not currently enforced by a lint rule. Substantial Tailwind class groups and visual variants live in adjacent `Component.theme.ts` files and are imported as named theme objects. Global tokens and atmospheric utilities remain in `app/theme.css`; runtime camera values remain inline CSS properties. Tailwind scans the complete utility strings in these TypeScript files.

## Visual direction

The app is named **cinemaR**. The homepage uses an original photorealistic auditorium image: upholstered burgundy seats, dark wood acoustic panels, warm aisle lights, and a dim charcoal screen. Illustrated room layers were replaced after visual review because they felt cartoonish. The centered wordmark, slogans, and mountain projection have been removed. Copy uses direct cinema language throughout, including loading, error, and empty states.

Inter is bundled locally through Fontsource in weights 400, 500, and 600 for body text and controls. Cormorant Garamond in weights 500 and 600 supplies the wordmark and headings. Body text is 18px; supporting text is generally at least 14px. A pair of thin, static chevrons replaces the scroll sentence and fades as the journey begins; it is also a keyboard-accessible link with a descriptive accessible name. The theme retains near-black violet surfaces, amber accents, warm ivory text, and a dark color scheme regardless of system preference. No external font or image requests are required.

Movie artwork remains local only. Until posters and backdrops are supplied, MovieArtwork draws decorative placeholders. See [artwork instructions](../src/frontend/src/features/movies/assets/README.md). Showtime chips display sample times; booking and seat availability are not implemented. Keyboard focus, mobile layouts, and reduced-motion support remain required.

## Routes and auditorium journey

React Router's BrowserRouter provides Home at `/` and Schedule at `/schedule`. The schedule can be opened directly or refreshed without playing the entrance. Unknown URLs show a page-not-found view with a schedule link. Direct navigation resets the scroll position, focuses the main region, and sets the document title. Automatic entrance completion carries the preview’s current scroll offset into the schedule before paint, so overscrolling during damping does not snap the content upward. The offset is consumed once in memory; refresh and direct visits start at the top. Native history restoration is disabled while this app owns route scroll positioning. The Query provider stays above the router, preserving cached movie data across navigation.

The home route composes the entrance with a schedule preview. The entrance remains 300svh with a one-viewport sticky stage and two viewports of scroll travel. Passive native scrolling drives a target progress; requestAnimationFrame applies a short, time-based damping step (65ms) and smoothstep easing. There is no intercepted scrolling, nested scroller, or additional scroll distance.

The realistic scene has three registered photographic layers: a room clean plate, transparent middle seats, and transparent foreground seats. Nearer seats translate and scale faster than the room, exposing reconstructed floor rather than duplicate seats. A shared camera aims at the screen center. Geometry is recalculated on resize from the image cover fit and measured source screen rectangle; its final scale covers every viewport edge with 3% overscan on portrait and wide screens. Camera arrival completes at 84% progress, before schedule reveal starts at 88%. The dim screen remains visible until the schedule appears. See [layer assets and generation prompts](auditorium-layers.md), and the [original reference](auditorium-asset.md).

The schedule uses a full-width carpet footer below its centered content container. A flex-column page with minimum viewport height pushes the footer to the bottom when content is short; longer pages place it after their content. Footer text retains the same content alignment and dark backing for legibility. The carpet covers the whole footer, with no separate decorative strip.

The schedule preview overlaps the final viewport and fades in over the final 12% of scroll progress, after the camera has fully arrived. It remains inert and hidden from assistive technology until navigation, so partially revealed controls cannot be focused. When the camera reaches the end, the app pushes `/schedule` into history and displays the real schedule at the same visible content position. Scroll travel can reverse before completion; after completion, browser Back returns to the start of the entrance and Forward returns to the schedule. The schedule brand links Home.

**Skip to schedule** is a normal router link and works with keyboard navigation and modified clicks. With reduced motion, the auditorium is a static one-viewport introduction followed by the accessible schedule; scrolling to the schedule navigates to its route without a zoom. The skip link also remains available. All animation frames, observers, and listeners are cleaned up on unmount.

Production hosting must serve index.html for non-file frontend routes such as `/schedule`. Vite's development and preview servers already provide SPA fallback. Keep API routes separate when production hosting is implemented.

## Demo schedule boundary

Movie titles and durations still come from `/api/movies` through TanStack Query. Dates, auditorium labels, and times are frontend fixtures in `schedule/model/demoSchedule.ts`, not available inventory. The interface explicitly labels the schedule as a demo; no reservation or payment request is made.

The date selector offers seven days starting on the current cinema date in `Europe/Kyiv`. Calendar arithmetic uses UTC noon to preserve consecutive dates over daylight-saving and month/year boundaries. Dates are initialized when the page mounts; reload after midnight to advance the demo window. Displayed times are Kyiv wall-clock times, including any earlier sample times on the current date; this is a browsing prototype, not a live availability filter. Adjacent demo days have different times so selection has an observable effect.

Run `npm test` in `src/frontend` for date-boundary, camera coverage, and handoff-position tests. They use Node's test runner and TypeScript stripping, with no extra test dependency.

## Tailwind and the theme

Tailwind v4 runs through `@tailwindcss/vite` in `vite.config.ts`. `main.tsx` imports `app/theme.css`, which imports Tailwind and defines tokens with `@theme`. There is no Sass or CSS Module dependency.

For example, `--color-lobby` creates `bg-lobby`, while `--color-amber` creates `text-amber`, `border-amber`, and opacity variants such as `bg-amber/10`. Typography tokens create `font-display` and `font-label`. Shadow and background-image tokens expose `shadow-screen` and `bg-carpet`.

Use adjacent component theme objects for layout, spacing, responsive rules, and visual states. Keep complete Tailwind utility strings in those objects; do not construct class names from fragments. Tiny one-off class uses may remain inline. Keep recurring visual choices in the theme instead of scattering color literals through components. The placeholder illustrations use a few art-specific colors and dimensions that are not interface tokens.

`@layer base` sets the dark color scheme, body defaults, keyboard focus, and reduced-motion behavior. Theme `@utility` definitions supply atmospheric effects, including `ceiling-lights`, `auditorium-curtain`, and `ceiling-panels`. The carpet is an original local SVG tile in `public/carpet.svg`. Per-frame camera values are inline CSS properties; layout and responsive styles stay in Tailwind utilities in component theme files. Nothing requires an external stylesheet or a runtime styling library.

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
