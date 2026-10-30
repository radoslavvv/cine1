# Site motion

Status: all interview choices agreed. Awaiting confirmation of the complete direction before implementation.

## Agreed direction

- Give the site consistent entrance and exit motion across components and dynamic content.
- Use a cinematic, flowing feel: noticeable fades, short slides, staggered entrances, and smooth resizing. Keep seat selection and button feedback fast.
- Reveal sections once per page visit. Animate newly added and removed content; keep previously revealed sections stable when scrolling back.
- Stagger movie cards individually and seat-map entrances by row, keeping the overall sequence short.
- Respond immediately to individual seat selection, animate selected-seat chips entering and leaving, and smoothly resize the summary.

- For page and checkout-step changes, use a brief exit followed immediately by the entrance, targeting around 300–450 ms total. Navigation responds immediately and outgoing controls stop accepting input.
- Transition loading placeholders, loaded content, empty states, and errors. Smoothly replace placeholders with content, animate filtered cards entering and leaving, and soften size changes.
- Show errors promptly with a quick fade.
- When another action interrupts an animation, move toward the latest state without queuing animations.

## Existing constraints

- Preserve reduced-motion support.
- Coordinate page and checkout focus with transitions.
- Keep exiting controls from accepting input and avoid duplicate live announcements.
