# Photographic auditorium layers

Created with the built-in image generation tool on 2026-10-27, using the original `public/auditorium-realistic.jpg` as the registered reference.

- `src/frontend/public/auditorium-room.jpg`: room clean plate without seats, quality-88 JPEG.
- `src/frontend/public/auditorium-middle.png`: transparent far and middle seat rows.
- `src/frontend/public/auditorium-foreground.png`: transparent nearest seat rows.

All layers retain the original 1672 × 941 canvas. The screen is registered at x=570, y=225, width=532, height=260 source pixels. The runtime fits the image canvas to the viewport and calculates the camera's final cover scale from that screen rectangle, with 3% overscan.

The original remains in the project as the reference asset; the entrance consumes the three new layers. Transparency is preserved in the seat PNGs.

## room

```text
Edit target: the supplied realistic cinema interior. Create an aligned background clean plate for layered parallax. Preserve exactly the camera, framing, aspect ratio, room architecture, lighting and dim screen position/size (screen bounds x34%–66%, y24%–52%). Remove ALL seats and armrests, reconstruct the empty sloping dark carpeted auditorium floor and central aisle naturally behind them. Retain walls, speakers, ceiling, blank charcoal screen and warm aisle lighting. Same image canvas and registration as the reference. No text, no white screen, no people. Photographic realism, not illustration. This is only the background room layer.
```

## middle

```text
Edit target: supplied realistic cinema interior. Produce an ALIGNED TRANSPARENT PNG parallax layer containing ONLY the far and middle seat rows: the smaller burgundy seat rows starting at about y58% and ending around y75% of the reference, left and right of the central aisle. Exclude the large two foreground seat rows at the bottom of the reference. Preserve their exact photographic appearance, perspective, lighting, x/y position and scale on the ORIGINAL full-size canvas. Reconstruct any slightly occluded lower parts of these smaller seats naturally where needed. Everything else must be truly transparent: no room, no screen, no carpet, no lighting baked into background, no shadow plane, no checkerboard. No image reframing, no zooming, no recentering. Image layer must register over the original.
```

## foreground

```text
Edit target: supplied realistic cinema interior. Produce an ALIGNED TRANSPARENT PNG parallax layer containing ONLY the nearest two rows of large burgundy seat backs and their armrests at the lower left and lower right of the reference, starting approximately y67% down and continuing to the image bottom edges. Remove the smaller distant seat rows, screen, room, floor, central aisle and all background; those pixels must be genuinely transparent. Keep the exact photographic seat texture, lighting, perspective and their original x/y positions and scale on the original full-size canvas. Preserve the open transparent central aisle. No recentering, no reframing, no zooming. It must register over the original as a foreground cutout.
```
