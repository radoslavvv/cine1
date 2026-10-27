# Frontend guide

## Organize by feature

Product areas own their code. Movies lives in one feature today; booking and admin can become sibling features when we build them.

```text
src/
  main.tsx
  app/
    App.tsx
    providers/AppProviders.tsx
    theme.css
  features/
    movies/
      index.ts
      MoviesPage.tsx
      types.ts
      presentation.ts
      assets/README.md
      api/
        getMovies.ts
        movieQueries.ts
      components/
        CatalogMessage.tsx
        FeaturedMovie.tsx
        MovieArtwork.tsx
        MovieCard.tsx
  shared/
    ui/
      Button.tsx
```

`app` composes features and installs providers. It imports movies through `features/movies/index.ts`; this is the feature's public entry point. The feature owns its types, backend calls, query keys, and presentation. Shared UI has no knowledge of movies and must not import features or app code. Future features should not reach into another feature's internal components or API files; compose them in the app and expose a small public interface when necessary.

This is pragmatic feature-folder organization, not the formal Feature-Sliced Design layer system. Do not add empty booking/admin directories, generic repositories, or extra layers before there is code that needs them. The imports are conventions, not currently enforced by a lint rule. Tailwind utilities style components directly in JSX; the separate `app/theme.css` owns the theme.

## Visual direction

Frame is a dark cinema lobby with a futuristic edge: near-black violet surfaces, amber lighting, warm ivory typography, subtle ceiling lights, and a patterned carpet. The carpet recalls the odd carpets of 90s multiplexes; the interface uses contemporary spacing and restrained lighting. Playful copy evokes popcorn, shared laughter, and leaving the outside world behind. The theme stays dark regardless of system preference.

Artwork is local only. Until the user supplies movie posters and backdrops, `MovieArtwork` draws decorative placeholders with Tailwind utilities. Add the documented files to `features/movies/assets/` and Vite discovers them; see [artwork instructions](../src/frontend/src/features/movies/assets/README.md). Load failures retain the illustration rather than a broken image. `presentation.ts` maps the sample movie titles to artwork, genre labels, and short editorial notes; these are frontend presentation metadata, not backend fields. Unknown titles use a generic illustration and label. The hero features the first catalog entry and stays generic when no entries are available. There are no external font or image requests.

Interactive elements must perform a real action. Preserve visible keyboard focus, readable text, mobile layouts, and reduced-motion support. Keep decoration hidden from assistive technology and movie titles available as headings. These are catalog listings; booking and seat availability are not implemented yet.

## Tailwind and the theme

Tailwind v4 runs through `@tailwindcss/vite` in `vite.config.ts`. `main.tsx` imports `app/theme.css`, which imports Tailwind and defines tokens with `@theme`. There is no Sass or CSS Module dependency.

For example, `--color-lobby` creates `bg-lobby`, while `--color-amber` creates `text-amber`, `border-amber`, and opacity variants such as `bg-amber/10`. Typography tokens create `font-display` and `font-label`. Shadow and background-image tokens expose `shadow-screen` and `bg-carpet`.

Use utilities in JSX for layout, spacing, responsive rules, and component states. Keep recurring visual choices in the theme instead of scattering color literals through components. The placeholder illustrations use a few art-specific colors and dimensions that are not interface tokens.

`@layer base` sets the dark color scheme, body defaults, keyboard focus, and reduced-motion behavior. The theme's `@utility` definitions supply three reusable atmospheric effects: `ceiling-lights`, `aisle-glow`, and `screen-vignette`. The carpet is an original local SVG tile in `public/carpet.svg`. Nothing requires an external stylesheet or a runtime styling library.

## Learn TanStack Query through this catalog

The provider creates one stable `QueryClient` for the mounted app. It stores server data and query state in memory. It does not replace the .NET API, perform HTTP by itself, or persist the cache across full page reloads. `getMovies` still uses native `fetch` and throws for non-success HTTP responses.

The page consumes the feature's query definition:

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
6. Stop the API and fully reload to exercise an initial failure with no cached result. Restart it and use **Try again**.
7. Override the movie response with `[]` using browser response overrides, then reload. Observe the empty state and remove the override afterward.
8. Toggle offline mode in Query devtools to inspect a paused request. Restore connectivity and observe recovery.

Devtools are lazy-loaded only under `import.meta.env.DEV`; Vite's production build removes the import branch. This keeps learning tools out of the delivered app.

## References

- [Query options](https://tanstack.com/query/latest/docs/framework/react/guides/query-options)
- [Important defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
- [Devtools](https://tanstack.com/query/latest/docs/framework/react/devtools)
- [Tailwind with Vite](https://tailwindcss.com/docs/installation/using-vite)
- [Tailwind theme variables](https://tailwindcss.com/docs/theme)
