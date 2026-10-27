# Local movie artwork

Add images you provide here. Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`, and `.avif`. Use one format per filename stem.

- `interstellar-poster.jpg`
- `interstellar-backdrop.jpg`
- `spirited-away-poster.jpg`
- `spirited-away-backdrop.jpg` (optional)
- `grand-budapest-poster.jpg`
- `grand-budapest-backdrop.jpg` (optional)

Posters work best at a 2:3 aspect ratio, about 600 × 900 pixels. Backdrops work best at 16:9, about 1600 × 900 pixels. Other sizes are cropped with `object-fit: cover`.

Vite discovers these files through `presentation.ts`. Save the images, then reload during development or rebuild for production. No backend changes or external image requests are needed. Until files are supplied, illustrated placeholders are displayed. Failed image loads also fall back to the illustration. Artwork names are mapped to sample movie titles, not inferred from database IDs.

Actual movie artwork has not been downloaded or bundled. Add source/credit information here when supplying images.
