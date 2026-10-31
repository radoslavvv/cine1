# Frontend guide

## Organize by feature

Product areas own their code. The app routes between an auditorium entrance, a schedule, and seat selection. Schedule owns dated browsing; Booking owns the showtime seat-map query and local selection. Admin owns cinema management; Auth owns account forms, session state, and personal booking history.

```text
src/
  app/
    App.tsx
    pages/
      HomePage.tsx
      NotFoundPage/
    components/Tumbleweed/
    hooks/useAppNavigation.ts
    providers/AppProviders.tsx
    theme.css
  features/
    cinema-entrance/
      components/
        CinemaEntrance/
        Auditorium/
      hooks/useCinemaJourney.ts
      journeyGeometry.ts
    schedule/
      pages/SchedulePage.tsx
      components/
        DatePicker/
        ScheduleFilters/
      hooks/
        useSchedule.ts
      model/
        schedulePresentation.ts
        scheduleFilters.ts
        scheduleDates.ts
        showtimeStatus.ts
      api/scheduleQueries.ts
    booking/
      pages/
        BookingPage.tsx
        ConfirmationPage.tsx
      components/
        Confirmation/
        SeatMap/
        Checkout/
      hooks/
        useBookingPage.ts
        useCheckout.ts
        useSeatSelection.ts
      model/bookingPresentation.ts
      booking.theme.ts
      api/bookingQueries.ts
    auth/
      pages/
        AccountPage.tsx
        MyBookingsPage.tsx
      components/
        AccountHeader/
        AccountLayout/
        AccountNav/
        RequireAccount/
      hooks/
        useAccountPage.ts
        useAccountNavigation.ts
        useAuth.ts
        useAuthSession.ts
        useMyBookings.ts
      api/
        authApi.ts
        accountQueries.ts
      model/
        accountNavigation.ts
        accountPresentation.ts
      providers/
        AuthProvider.tsx
        authContext.ts
      auth.theme.ts
      types.ts
      index.ts
  shared/
    components/
      MovieArtwork/
      Button/
      StatusMessage/
      Wordmark/
      ProjectorAtmosphere/
    hooks/
      usePageScrollLock.ts
      useProjectorAtmosphere.ts
```

`app` composes features and installs providers. `App.tsx` declares routes; `useAppNavigation` owns route scroll positioning, focus, document titles, and navigation from the entrance. Pages live under `pages/`; supporting UI lives under `components/`, with themes beside their owners. Hooks live directly in their owner’s `hooks/` folder without per-hook subfolders. Keep JSX expanded and separate logical blocks with blank lines. `CinemaEntrance` renders the auditorium and knows nothing about movie data. Schedule owns its screening response types and dated query. MovieArtwork and its local assets are shared by Schedule and Booking. There is no standalone Movies feature or unused catalog query; a future catalog browsing screen can establish its own boundary when needed. Shared UI must not import features or app code. Keep dependencies in one direction; compose features in the app and expose a small public interface when needed.

This is pragmatic feature-folder organization, not the formal Feature-Sliced Design layer system. Do not add empty booking/admin directories, generic repositories, or extra layers before there is code that needs them. The imports are conventions, not currently enforced by a lint rule. Substantial Tailwind class groups and visual variants live in adjacent `Component.theme.ts` files and are imported as named theme objects. Global tokens and atmospheric utilities remain in `app/theme.css`; runtime camera values remain inline CSS properties. Tailwind scans the complete utility strings in these TypeScript files.

## Pages, components, hooks, and pure functions

A **page** owns a route's screen layout and connects feature hooks to presentation components. Pages live in their owner's `pages/` folder. They read route parameters and compose UI, but delegate requests, business rules, effects, and state transitions to hooks and model modules. `HomePage` renders the cinema entrance; `BookingPage` and `ConfirmationPage` render their screens. A simple page can render its JSX directly; it needs no extra wrapper or separate view layer. A route may render an existing component directly if a page would only forward unchanged props.

A **component** is a focused UI piece, such as a seat map, checkout form, date picker, or loading placeholder. Components live under `components/`, render props, and emit events. Lists, conditional JSX, formatting-helper calls, simple layout calculations, and event adapters such as `onClick={() => onSelect(id)}` belong here. Small, self-contained UI state, such as a dropdown being open or an image failing to load, can stay local. Extract behavior when it involves effects, complex state, reuse, business rules, or external systems. A presentation component does not fetch data, navigate after a mutation, manage query caches, or calculate business eligibility.

**At most one React component per file**, including private helpers, skeletons, composition adapters, and lazy component declarations. A named component lives in a matching file; extract additional components and import them. Types and pure helpers may share a component file when they belong to that component, subject to the logic boundaries above. Do not create a second component inside another component.

A **hook** owns React state, lifecycle, and behavior. Feature hooks coordinate queries, mutations, retries, and state transitions. Pure calculations live in descriptive feature `model/` modules; network functions and query options stay in `api/`. Use meaningful module names rather than accumulating unrelated helpers in a generic `utils/` directory. Keep hook modules separate from domain constants and pure functions.

`SchedulePage` owns the schedule layout and calls `useSchedule`. The schedule renders only at `/schedule`; the homepage contains no schedule data or UI. Keep a page together when splitting it would only forward props through more files.

`BookingPage` owns the complete selection-or-checkout layout and calls `useBookingPage`. That hook loads seats and coordinates selection, checkout entry, and conflict recovery; `useSeatSelection` owns selection and showtime timing, and `useCheckout` owns submission, idempotent retries, and form reset. The page renders `SeatMap` or `Checkout` directly. The route keys BookingPage by pathname to reset its state when switching showtimes. Entering or leaving checkout resets form state explicitly, while an uncertain retry retains its original request.

Seat-selection rules belong to the booking model and hooks. `SeatMap` receives prepared selected/disabled flags and emits seat IDs; grid layout stays in that component. The feature's `booking.theme.ts` supplies styles shared by booking pages and loading UI.

## Visual direction

The app is named **cinemaR**. The homepage uses an original photorealistic auditorium image: upholstered burgundy seats, dark wood acoustic panels, warm aisle lights, and a dim charcoal screen. Illustrated room layers were replaced after visual review because they felt cartoonish. A thin inset frame with amber corner details surrounds the entrance. The centered brand pairs a screen-and-play emblem with the wordmark and links Home. During the zoom, “Your next story starts here.” reveals across two lines on the cinema screen in muted ivory, without a glow or bright accent color. Copy uses direct cinema language throughout, including loading, error, and empty states.

Inter is bundled locally through Fontsource in weights 400, 500, and 600 for body text and controls. Cormorant Garamond in weights 500 and 600 supplies the wordmark and headings. The shared wordmark uses tight spacing and an italic amber R. The entrance header has a centered clickable brand and a Schedule link at the right. The bottom arrow and “Scroll to discover” are decorative cues without click handlers, hover effects, or keyboard focus; Schedule opens the schedule directly. There is no Explore button in the header. The header, frame, and cue fade as the journey begins, and invisible entrance controls become inert. The theme retains near-black violet surfaces, amber accents, warm ivory text, and a dark color scheme regardless of system preference. No external font or image requests are required.

The schedule starts with a compact brand header, a single row of seven dates on mobile and desktop, and the movie list. The page heading and selected-date announcement remain available to screen readers. Repeated schedule labels, introductory instructions, film counts, timezone notes, and the routine refresh button are removed. Movie rows show the title, genre, runtime, synopsis on larger screens, and auditorium-specific times. The schedule background is plain rather than patterned with ceiling lights.

Movie artwork remains local only. Until posters and backdrops are supplied, MovieArtwork draws decorative placeholders. See [artwork instructions](../src/frontend/src/shared/components/MovieArtwork/artwork/assets/README.md). Showtime chips display stored screening instants in Kyiv time and label each auditorium. Upcoming showtimes link to seat selection. Booking uses a left-side back link, a poster/details card, a wider centered seat map, and a full-width summary beneath the map. Selection stays local and does not reserve seats. Keyboard focus, mobile layouts, and reduced-motion support remain required.

## Routes and auditorium journey

React Router's BrowserRouter provides Home at `/` and Schedule at `/schedule`. The schedule can be opened directly or refreshed without playing the entrance. Unknown URLs show a page-not-found view with a schedule link. Direct navigation resets the scroll position, focuses the main region, and sets the document title. Native history restoration is disabled while this app owns route scroll positioning. The Query provider stays above the router, preserving cached movie data across navigation.

The home route renders the entrance. The entrance remains 300svh with a one-viewport sticky stage and two viewports of scroll travel. Passive native scrolling drives a target progress; requestAnimationFrame applies a short, time-based damping step (65ms) and smoothstep easing. There is no intercepted scrolling, nested scroller, or additional scroll distance.

The realistic scene has three registered photographic layers: a room clean plate, transparent middle seats, and transparent foreground seats. Nearer seats translate and scale faster than the room, exposing reconstructed floor rather than duplicate seats. A shared camera aims at the screen center. Geometry is recalculated on resize from the image cover fit and measured source screen rectangle; its final scale covers every viewport edge with 3% overscan on portrait and wide screens. Camera arrival completes at 84% progress; reaching the end navigates to the schedule. As the camera approaches, a registered CSS-gradient screen surface replaces the photographic screen texture and dims it progressively. It is fully opaque before the closest zoom, so the full-viewport screen remains smooth rather than enlarging JPEG noise. The dim screen remains visible until the schedule appears. See [layer assets and generation prompts](auditorium-layers.md), and the [original reference](auditorium-asset.md).

The schedule retains a full-width carpet footer, cropped to 64px on mobile and 80px on desktop. A subtle overlay covers the pattern for legibility; there are no individual text plaques. A small wordmark and Back to top link align with the content container. The flex-column page keeps the footer below short and long results alike.

The homepage contains only the cinema entrance. Reaching the bottom finishes the camera movement and navigates to /schedule. The schedule renders only on its own route, starting at the top, and loads its data there. There is no hidden preview, shared animation timeline, or scroll lock waiting for requests or animations. Browser Back returns to the start of the entrance; Forward returns to the schedule. Query parameters survive navigation.

**Schedule ↗** is a normal router link supporting keyboard navigation and modified clicks. With reduced motion, the introduction stays static and uses a short scroll range to reach the schedule; the Schedule link remains available. Animation frames, observers, and listeners are cleaned up on unmount.

Production hosting must serve index.html for non-file frontend routes such as `/schedule`. Vite's development and preview servers already provide SPA fallback. Keep API routes separate when production hosting is implemented.

## Homepage entrance motion

On page load, a vignette dims the auditorium over 2.5 seconds, with the strongest dimming around the seats and walls. This replaces the previous 600ms brightness reveal. The logo, Schedule link, and bottom cue fade in with a 6px lift and staggered starts. Motion runs on separate wrappers so the scroll journey keeps control of its opacity and camera transforms. The projected headline stays hidden through the early zoom: its first line begins revealing at 42% of eased camera travel and its second at 57%. It fades away before the schedule handoff and reverses naturally when scrolling back. Reduced-motion preferences show the static introduction and complete headline immediately.

## Schedule presentation

The schedule uses a simple CSS entrance animation, disabled under reduced motion. It does not coordinate animations with homepage navigation or wait for effects to finish. Date and format controls retain their CSS color transitions.

Uncached filter combinations show three skeleton rows, with pulsing disabled under reduced motion. Results use a CSS minimum height of 32rem, without DOM measurement. Switching from a long list to loading or shorter results can move the footer. Different filter combinations never display one another's films while loading. Empty results appear only after a successful response. Background refreshes retain matching rows.

## Persistent schedule boundary

Genre and Format filters sit left-aligned below the date picker on the schedule page. Genre is a single-select dropdown; Format uses selectable pills for 2D, 3D, IMAX 2D, and IMAX 3D. Exactly one format is always selected, defaulting to 2D. A selected pill has an amber border and tint. Native buttons expose their pressed state and remain keyboard accessible; pills wrap on small screens.

The URL stores `date`, `genre`, and `format`, for example `/schedule?date=2026-10-28&genre=Sci-Fi&format=IMAX+3D`. Filters survive date changes, reloads, Back/Forward, and navigation from the homepage. Query-only changes preserve scroll and focus. Missing genres mean All genres; missing or invalid formats default to 2D, and dates outside the current seven-day window fall back to today. Reset filters removes genre and selects 2D while retaining the selected date and unrelated query parameters.

Each date, genre, or format change requests matching showtimes from the API. PostgreSQL applies the date interval, exact format, and optional genre predicates before rows are materialized. Genre matches any genre on a movie. The frontend groups the returned screenings into movie rows without filtering them again. Genre options come from the current filtered response, retaining the selected genre during loading or when no results match. They can narrow as selections change; no separate options metadata is requested yet. Each showtime chip displays its stored format and auditorium. Empty results consistently say No screenings match these filters, since the response does not describe the unfiltered day.

PostgreSQL stores the format on each showtime, with a constraint accepting the four supported values. Existing screenings default to 2D. A one-time Development seed assigns varied example formats to recognizable demo slots; these are illustrative schedule data. Custom screenings keep their stored format.

Run `node scripts/check-schedule-filters.cjs` for request parameters, cancellation, cache separation, fresh requests on filter changes, and shared-link parsing; `node scripts/check-entrance-scroll.cjs` also verifies query preservation during the homepage handoff.

The schedule loads `/api/showtimes?date=YYYY-MM-DD&format=2D` with an optional `genre` through TanStack Query. The API requires a valid date and one of the four supported formats; omitted or invalid formats return 400 rather than an unfiltered schedule. Movie titles, durations, genres, synopses, auditorium labels, and UTC screening instants come from PostgreSQL. The response remains a flat showtime array with embedded movie and auditorium details. No genre or date-wide metadata is returned. One row groups a movie's matching screenings across auditoriums; every chip identifies its room. No reservation or payment request is made.

The date selector offers seven days starting on the current cinema date in `Europe/Kyiv`. Calendar arithmetic uses UTC noon to preserve consecutive dates over daylight-saving and month/year boundaries. Dates are initialized when the page mounts; reload after midnight to advance the window. Displayed times are Kyiv wall-clock times, including earlier screenings on the selected date. Development seeding creates seven days once, not a rolling schedule. Dates with no stored screenings show an empty state.

Showtime chips use soft green for Upcoming, amber for Started, and muted gray for Finished, with matching tinted backgrounds and borders. A showtime becomes Started at its stored start instant and Finished when its movie runtime elapses, excluding turnaround. Status is calculated when the schedule renders, including when it opens or query data changes; there is no live clock. Started and Finished showtimes have no seat-selection link. A page left open can display an outdated Upcoming status until it renders again. The seat-selection API independently rejects selection after the screening starts.

Run `node scripts/check-entrance-scroll.cjs` for bottom-of-scroll navigation, overshoot, reversal, reduced motion, cleanup, and URL filter preservation. Run `npm run build` from `src/frontend` to check TypeScript and create the production bundle; use the walkthroughs below to verify browser behavior manually.

## Tailwind and the theme

Tailwind v4 runs through `@tailwindcss/vite` in `vite.config.ts`. `main.tsx` imports `app/theme.css`, which imports Tailwind and defines tokens with `@theme`. There is no Sass or CSS Module dependency.

For example, `--color-lobby` creates `bg-lobby`, while `--color-amber` creates `text-amber`, `border-amber`, and opacity variants such as `bg-amber/10`. Typography tokens create `font-display` and `font-label`. Shadow and background-image tokens expose `shadow-screen` and `bg-carpet`.

Use adjacent component theme objects for layout, spacing, responsive rules, and visual states. Keep complete Tailwind utility strings in those objects; do not construct class names from fragments. Tiny one-off class uses may remain inline. Keep recurring visual choices in the theme instead of scattering color literals through components. The placeholder illustrations use a few art-specific colors and dimensions that are not interface tokens.

`@layer base` sets the dark color scheme, body defaults, keyboard focus, and reduced-motion behavior. Theme `@utility` definitions supply atmospheric effects, including `ceiling-lights`, `auditorium-curtain`, and `ceiling-panels`. The carpet is an original local SVG tile in `public/carpet.svg`. Per-frame camera values are inline CSS properties; layout and responsive styles stay in Tailwind utilities in component theme files. Nothing requires an external stylesheet or a runtime styling library.

## Learn TanStack Query through this catalog

The provider creates one stable `QueryClient` for the mounted app. It stores server data and query state in memory. It does not replace the .NET API, perform HTTP by itself, or persist the cache across full page reloads. The schedule query uses native `fetch` and throws for non-success HTTP responses.

The schedule consumes a dated screening query:

```tsx
const scheduleQuery = useQuery(
  scheduleQueries.forFilters(selectedDate.key, genre, format),
);
```

The definition uses `queryOptions` to keep the key, request function, and settings together with TypeScript inference. The request receives TanStack Query's `AbortSignal`, so an abandoned request can be cancelled.

- **Query key:** `['showtimes', selectedDate.key, genre, format]` identifies this cache entry. Components requesting the same filters share its result. Different filter combinations never share results or placeholder data.
- **Freshness:** `staleTime: 0` makes cached results immediately stale. Switching filters starts a fresh request even when that combination is cached. A cached matching result can remain visible during its refresh. No timer polls the API.
- **Refetching:** stale data can refetch on mount, window visibility/focus changes, or network reconnection. There is no routine manual refresh control. A failed request exposes Try again. This page does not poll the API; showtime statuses are calculated locally when rendering.
- **Retries:** the schedule query retries once after one second, then shows the initial error or a failed-refresh notice. This policy must not be assumed suitable for seat holds or payment mutations.
- **Cache lifetime:** the default inactive cache lifetime is five minutes. That differs from freshness: stale cached data can still be displayed. A full reload creates a new in-memory cache.
- **Invalidation:** future movie/showtime mutations must invalidate affected schedule entries, including embedded movie details. There are no write operations in this increment.

Use `isPending` to identify a query with no result yet, and `isFetching` to identify an active request, including background updates. An offline request may be pending but paused; the UI explains that it is waiting for connectivity. After a successful fetch, a failed refresh retains `data`, so checking `isError` alone must not replace that data with a full-page error.

Server data belongs in Query. Local interactions, such as a dialog or search input, belong in React state. The glossary in `CONTEXT.md` is reserved for cinema concepts, not library terminology.

## Try it yourself

1. Run both projects and open the devtools toggle at the bottom-left. Inspect `['showtimes', selectedDate, genre, format]` and the cached screening array. Change each filter and verify the request URL and returned formats/genres.
2. Use browser network throttling and reload. Observe the loading state, then the cached result. Development Strict Mode can cancel the first mount's request; a cancelled request is expected.
3. Select an uncached date with throttling enabled. Observe skeleton rows, followed by only that date's movies or an empty state.
4. Return to a previously selected filter combination. Observe cached matching results and a fresh filtered request. Switch to another browser tab and return to observe a background refresh.
5. Stop the API after a successful load, and switch away and back to trigger refetching. After the retry, the previous matching rows remain alongside a failure notice. Restart the API and select Try again.
6. Stop the API and fully reload, then skip to the schedule to exercise an initial failure with no cached result. Restart it and use **Try again**.
7. Override the showtime response with `[]` using browser response overrides, then reload. Observe the empty state and remove the override afterward.
8. Toggle offline mode in Query devtools to inspect a paused request. Restore connectivity and observe recovery.

Open the schedule before these exercises. Schedule data loads when its route opens.

Devtools are lazy-loaded only under `import.meta.env.DEV`; Vite's production build removes the import branch. This keeps learning tools out of the delivered app.

## References

- [Query options](https://tanstack.com/query/latest/docs/framework/react/guides/query-options)
- [Important defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
- [Devtools](https://tanstack.com/query/latest/docs/framework/react/devtools)
- [Tailwind with Vite](https://tailwindcss.com/docs/installation/using-vite)
- [Tailwind theme variables](https://tailwindcss.com/docs/theme)
