# Frontend guide

## Organize by feature

Product areas own their code. The app routes between an auditorium entrance, a schedule, and seat selection. Schedule owns dated browsing; Booking owns the showtime seat-map query and local selection. Admin can become a sibling feature when needed.

```text
src/
  main.tsx
  app/
    App.tsx
    App.theme.ts
    components/NotFoundPage/
      NotFoundPage.tsx
      NotFoundPage.theme.ts
    hooks/useAppNavigation.ts
    providers/AppProviders.tsx
    theme.css
  features/
    cinema-entrance/
      index.ts
      components/
        CinemaEntrance/
          CinemaEntrance.tsx
          CinemaEntrance.theme.ts
        Auditorium/
          Auditorium.tsx
          Auditorium.theme.ts
      hooks/useCinemaJourney.ts
      journeyGeometry.ts
    schedule/
      index.ts
      components/
        SchedulePage/
          SchedulePage.tsx
          SchedulePage.theme.ts
        DatePicker/
          DatePicker.tsx
          DatePicker.theme.ts
      hooks/
        useResultsSpace.ts
        useScheduleMotion.ts
        useScheduleReady.ts
        useShowtimeClock.ts
      model/
        scheduleDates.ts
        scheduleMotion.ts
        showtimeStatus.ts
      api/scheduleQueries.ts
      types.ts
    booking/
      index.ts
      api/bookingQueries.ts
      types.ts
      hooks/useSeatSelection.ts
      components/
        BookingPage/
          BookingPage.tsx
          BookingPage.theme.ts
        SeatMap/
          SeatMap.tsx
          SeatMap.theme.ts
  shared/
    components/
      MovieArtwork/
        MovieArtwork.tsx
        MovieArtwork.theme.ts
        artwork/
          presentation.ts
          assets/README.md
      Button/
        Button.tsx
        Button.theme.ts
      StatusMessage/
        StatusMessage.tsx
        StatusMessage.theme.ts
      Wordmark/Wordmark.tsx
    hooks/usePageScrollLock.ts
```

`app` composes features and installs providers. `App.tsx` declares routes; `useAppNavigation` owns arrival state, route scroll positioning, focus, document titles, and the shared motion session. Each feature and shared component has its own folder under `components/`, with its theme beside it. Hooks live directly in their owner’s `hooks/` folder without per-hook subfolders. Keep JSX expanded and separate logical blocks with blank lines. `CinemaEntrance` accepts the schedule as children and knows nothing about movie data. Schedule owns its screening response types and dated query. MovieArtwork and its local assets are shared by Schedule and Booking. There is no standalone Movies feature or unused catalog query; a future catalog browsing screen can establish its own boundary when needed. Shared UI must not import features or app code. Keep dependencies in one direction; compose features in the app and expose a small public interface when needed.

This is pragmatic feature-folder organization, not the formal Feature-Sliced Design layer system. Do not add empty booking/admin directories, generic repositories, or extra layers before there is code that needs them. The imports are conventions, not currently enforced by a lint rule. Substantial Tailwind class groups and visual variants live in adjacent `Component.theme.ts` files and are imported as named theme objects. Global tokens and atmospheric utilities remain in `app/theme.css`; runtime camera values remain inline CSS properties. Tailwind scans the complete utility strings in these TypeScript files.

## Visual direction

The app is named **cinemaR**. The homepage uses an original photorealistic auditorium image: upholstered burgundy seats, dark wood acoustic panels, warm aisle lights, and a dim charcoal screen. Illustrated room layers were replaced after visual review because they felt cartoonish. A thin inset frame with amber corner details surrounds the entrance. The centered brand pairs a screen-and-play emblem with the wordmark and links Home. During the zoom, “Your next story starts here.” reveals across two lines on the cinema screen in muted ivory, without a glow or bright accent color. Copy uses direct cinema language throughout, including loading, error, and empty states.

Inter is bundled locally through Fontsource in weights 400, 500, and 600 for body text and controls. Cormorant Garamond in weights 500 and 600 supplies the wordmark and headings. The shared wordmark uses tight spacing and an italic amber R. The entrance header has a centered clickable brand and a Schedule link at the right. The bottom arrow and “Scroll to discover” are decorative cues without click handlers, hover effects, or keyboard focus; Schedule opens the schedule directly. There is no Explore button in the header. The header, frame, and cue fade as the journey begins, and invisible entrance controls become inert. The theme retains near-black violet surfaces, amber accents, warm ivory text, and a dark color scheme regardless of system preference. No external font or image requests are required.

The schedule starts with a compact brand header, a single row of seven dates on mobile and desktop, and the movie list. The page heading and selected-date announcement remain available to screen readers. Repeated schedule labels, introductory instructions, film counts, timezone notes, and the routine refresh button are removed. Movie rows show the title, genre, runtime, synopsis on larger screens, and auditorium-specific times. The schedule background is plain rather than patterned with ceiling lights.

Movie artwork remains local only. Until posters and backdrops are supplied, MovieArtwork draws decorative placeholders. See [artwork instructions](../src/frontend/src/shared/components/MovieArtwork/artwork/assets/README.md). Showtime chips display stored screening instants in Kyiv time and label each auditorium. Upcoming showtimes link to seat selection. Booking uses a left-side back link, a poster/details card, a wider centered seat map, and a full-width summary beneath the map. Selection stays local and does not reserve seats. Keyboard focus, mobile layouts, and reduced-motion support remain required.

## Routes and auditorium journey

React Router's BrowserRouter provides Home at `/` and Schedule at `/schedule`. The schedule can be opened directly or refreshed without playing the entrance. Unknown URLs show a page-not-found view with a schedule link. Direct navigation resets the scroll position, focuses the main region, and sets the document title. At the schedule reveal boundary (88% of scroll travel), arrival synchronously locks scrolling and pins the preview to the viewport top before it becomes visible. The remaining camera/fade progress finishes automatically, then opens `/schedule` at the same top position. The lock survives the route handoff and ends once that date's data resolves and its opening animations finish. Error and offline states also release the hold. Reduced motion performs the same pinned handoff when the schedule enters the viewport, without a zoom or fade. Clicking Schedule or opening the route directly does not engage the arrival hold. The lock restores the previous overflow and scrollbar-gutter styles on release, navigation away, or unmount. Native history restoration is disabled while this app owns route scroll positioning. The Query provider stays above the router, preserving cached movie data across navigation.

The home route composes the entrance with a schedule preview. The entrance remains 300svh with a one-viewport sticky stage and two viewports of scroll travel. Passive native scrolling drives a target progress; requestAnimationFrame applies a short, time-based damping step (65ms) and smoothstep easing. There is no intercepted scrolling, nested scroller, or additional scroll distance.

The realistic scene has three registered photographic layers: a room clean plate, transparent middle seats, and transparent foreground seats. Nearer seats translate and scale faster than the room, exposing reconstructed floor rather than duplicate seats. A shared camera aims at the screen center. Geometry is recalculated on resize from the image cover fit and measured source screen rectangle; its final scale covers every viewport edge with 3% overscan on portrait and wide screens. Camera arrival completes at 84% progress, before schedule reveal starts at 88%. As the camera approaches, a registered CSS-gradient screen surface replaces the photographic screen texture and dims it progressively. It is fully opaque before the closest zoom, so the full-viewport screen remains smooth rather than enlarging JPEG noise. The dim screen remains visible until the schedule appears. See [layer assets and generation prompts](auditorium-layers.md), and the [original reference](auditorium-asset.md).

The schedule retains a full-width carpet footer, cropped to 64px on mobile and 80px on desktop. A subtle overlay covers the pattern for legibility; there are no individual text plaques. A small wordmark and Back to top link align with the content container. The flex-column page keeps the footer below short and long results alike.

The schedule preview overlaps the final viewport and fades in over the final 12% of journey progress, after the camera has fully arrived. Once the reveal boundary is reached, that remaining progress runs automatically while scrolling is held. The preview remains inert and hidden from assistive technology until navigation, so partially revealed controls cannot be focused. When the camera reaches the end, the app pushes `/schedule` into history and displays the real schedule at the same visible content position. Scroll travel can reverse before the reveal boundary; after completion, browser Back returns to the start of the entrance and Forward returns to the schedule. The schedule brand links Home.

**Schedule ↗** is a normal router link and works with keyboard navigation and modified clicks. With reduced motion, the auditorium is a static one-viewport introduction followed by the accessible schedule; scrolling to the schedule navigates to its route without a zoom. The Schedule link also remains available. All animation frames, observers, and listeners are cleaned up on unmount.

Production hosting must serve index.html for non-file frontend routes such as `/schedule`. Vite's development and preview servers already provide SPA fallback. Keep API routes separate when production hosting is implemented.

## Homepage entrance motion

On page load, a vignette dims the auditorium over 2.5 seconds, with the strongest dimming around the seats and walls. This replaces the previous 600ms brightness reveal. The logo, Schedule link, and bottom cue fade in with a 6px lift and staggered starts. Motion runs on separate wrappers so the scroll journey keeps control of its opacity and camera transforms. The projected headline stays hidden through the early zoom: its first line begins revealing at 42% of eased camera travel and its second at 57%. It fades away before the schedule handoff and reverses naturally when scrolling back. Reduced-motion preferences show the static introduction and complete headline immediately.

## Schedule motion

The schedule runs one staged entrance sequence when it opens. The header fades, dates stagger by 35ms, and movie rows stagger by 65ms. Posters scale from 0.96 while details shift 6px and showtimes fade. Footer content fades without changing the carpet layout. Durations are 300–520ms. Everything starts from this page-opening timeline, including components below the viewport; scrolling does not trigger additional reveals.

Motion definitions live in `SchedulePage.theme.ts`. `useScheduleMotion` uses the Web Animations API with opacity and transform only. Base styles stay visible; effects use backwards fill while waiting, then release their styles when finished. Reduced-motion preferences cancel these effects and leave immediate, usable content. Preference changes, unmounting, and removed nodes also clean up active effects. Loading, offline, error and retry messages remain immediately readable.

The app owns a motion session shared between the hidden preview and real schedule. The auditorium starts it when the schedule first becomes visible. Each component keeps its scheduled timestamp across the route handoff, so remounting seeks to the current point instead of restarting or hiding already revealed content. Returning Home clears the session for the next visit. Direct visits start on mount. Newly loaded movies receive a current entrance time if the initial sequence has already elapsed.

Date selection transitions color, border, and background over 200ms. A date change gives the new showtimes a 220ms fade and 4px lift. Movie rows keep their identity and do not replay during date changes or background refresh. Mutation observation registers newly inserted movie elements without restarting existing components. No animation dependency or scroll observer is required.

Uncached dates show three skeleton rows, with pulsing disabled under reduced motion. A ResizeObserver preserves the largest results height for the current page visit, with a 32rem minimum, so loading and empty dates do not collapse the page or clamp its scroll position. A width change resets the measured footprint for the new layout. Different dates never display one another's films while loading. An empty result says No screenings on this date only after the request resolves. Background refreshes keep existing rows visible without inserting a progress sentence.

## Persistent schedule boundary

The schedule loads `/api/showtimes?date=YYYY-MM-DD` through TanStack Query. Movie titles, durations, genres, synopses, auditorium labels, and UTC screening instants come from PostgreSQL. The response includes movie and auditorium details, avoiding a second catalog request. One row groups a movie's screenings across auditoriums; every chip identifies its room. No reservation or payment request is made.

The date selector offers seven days starting on the current cinema date in `Europe/Kyiv`. Calendar arithmetic uses UTC noon to preserve consecutive dates over daylight-saving and month/year boundaries. Dates are initialized when the page mounts; reload after midnight to advance the window. Displayed times are Kyiv wall-clock times, including earlier screenings on the selected date. Development seeding creates seven days once, not a rolling schedule. Dates with no stored screenings show an empty state.

Showtime chips use soft green for Upcoming, amber for Started, and muted gray for Finished, with matching tinted backgrounds and borders. A showtime becomes Started at its stored start instant and Finished when its movie runtime elapses, excluding turnaround. A shared clock wakes at the next start/end boundary, checks at least once per minute, and resynchronizes on focus and visibility changes. Status is based on absolute instants, including across midnight and daylight-saving changes. Showtime chips remain informational; booking is not implemented.

Run `node scripts/check-entrance-scroll.cjs` from the repository root for the entrance handoff regression checks. These exercise the real hooks with simulated scrolling and animation frames, including overshoot, reduced motion, synchronous locking, and release after data and effects finish. Run `npm run build` from `src/frontend` to check TypeScript and create the production bundle; use the walkthroughs below to verify browser behavior manually.

## Tailwind and the theme

Tailwind v4 runs through `@tailwindcss/vite` in `vite.config.ts`. `main.tsx` imports `app/theme.css`, which imports Tailwind and defines tokens with `@theme`. There is no Sass or CSS Module dependency.

For example, `--color-lobby` creates `bg-lobby`, while `--color-amber` creates `text-amber`, `border-amber`, and opacity variants such as `bg-amber/10`. Typography tokens create `font-display` and `font-label`. Shadow and background-image tokens expose `shadow-screen` and `bg-carpet`.

Use adjacent component theme objects for layout, spacing, responsive rules, and visual states. Keep complete Tailwind utility strings in those objects; do not construct class names from fragments. Tiny one-off class uses may remain inline. Keep recurring visual choices in the theme instead of scattering color literals through components. The placeholder illustrations use a few art-specific colors and dimensions that are not interface tokens.

`@layer base` sets the dark color scheme, body defaults, keyboard focus, and reduced-motion behavior. Theme `@utility` definitions supply atmospheric effects, including `ceiling-lights`, `auditorium-curtain`, and `ceiling-panels`. The carpet is an original local SVG tile in `public/carpet.svg`. Per-frame camera values are inline CSS properties; layout and responsive styles stay in Tailwind utilities in component theme files. Nothing requires an external stylesheet or a runtime styling library.

## Learn TanStack Query through this catalog

The provider creates one stable `QueryClient` for the mounted app. It stores server data and query state in memory. It does not replace the .NET API, perform HTTP by itself, or persist the cache across full page reloads. The schedule query uses native `fetch` and throws for non-success HTTP responses.

The schedule consumes a dated screening query:

```tsx
const scheduleQuery = useQuery(scheduleQueries.forDate(selectedDate.key));
```

The definition uses `queryOptions` to keep the key, request function, and settings together with TypeScript inference. The request receives TanStack Query's `AbortSignal`, so an abandoned request can be cancelled.

- **Query key:** `['showtimes', selectedDate.key]` identifies this cache entry. Components requesting the same date share its result. Different dates never share results or placeholder data.
- **Freshness:** `staleTime: 60_000` means the loaded catalog is fresh for one minute. Becoming stale does not itself trigger a timed request.
- **Refetching:** stale data can refetch on mount, window visibility/focus changes, or network reconnection. There is no routine manual refresh control. A failed request exposes Try again. This page does not poll the API; the local showtime status clock is independent of fetching.
- **Retries:** the schedule query retries once after one second, then shows the initial error or a failed-refresh notice. This policy must not be assumed suitable for seat holds or payment mutations.
- **Cache lifetime:** the default inactive cache lifetime is five minutes. That differs from freshness: stale cached data can still be displayed. A full reload creates a new in-memory cache.
- **Invalidation:** future movie/showtime mutations must invalidate affected schedule entries, including embedded movie details. There are no write operations in this increment.

Use `isPending` to identify a query with no result yet, and `isFetching` to identify an active request, including background updates. An offline request may be pending but paused; the UI explains that it is waiting for connectivity. After a successful fetch, a failed refresh retains `data`, so checking `isError` alone must not replace that data with a full-page error.

Server data belongs in Query. Local interactions, such as a dialog or search input, belong in React state. The glossary in `CONTEXT.md` is reserved for cinema concepts, not library terminology.

## Try it yourself

1. Run both projects and open the devtools toggle at the bottom-left. Inspect `['showtimes', selectedDate]` and the cached screening array.
2. Use browser network throttling and reload. Observe the loading state, then the cached result. Development Strict Mode can cancel the first mount's request; a cancelled request is expected.
3. Select an uncached date with throttling enabled. Observe skeleton rows and stable results space, followed by only that date's movies or an empty state.
4. Wait more than one minute, switch to another browser tab, and return. Observe a background refresh of stale data. The one-minute timer alone does not cause polling.
5. Stop the API after a successful load, wait for the query to become stale, and switch away and back to trigger refetching. After the retry, the previous rows remain alongside a failure notice. Restart the API and select Try again.
6. Stop the API and fully reload, then skip to the schedule to exercise an initial failure with no cached result. Restart it and use **Try again**.
7. Override the showtime response with `[]` using browser response overrides, then reload. Observe the empty state and remove the override afterward.
8. Toggle offline mode in Query devtools to inspect a paused request. Restore connectivity and observe recovery.

Use **Schedule ↗** before these exercises when inspecting query UI. The API is loaded while entering the auditorium, so its loading indicator may finish before the scroll journey does.

Devtools are lazy-loaded only under `import.meta.env.DEV`; Vite's production build removes the import branch. This keeps learning tools out of the delivered app.

## References

- [Query options](https://tanstack.com/query/latest/docs/framework/react/guides/query-options)
- [Important defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
- [Devtools](https://tanstack.com/query/latest/docs/framework/react/devtools)
- [Tailwind with Vite](https://tailwindcss.com/docs/installation/using-vite)
- [Tailwind theme variables](https://tailwindcss.com/docs/theme)
