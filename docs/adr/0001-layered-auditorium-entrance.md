# Auditorium entrance: original approach and visual refinement

## Original decision

Use a scroll-driven 2.5D auditorium built from DOM and Tailwind, with independently moving seats and room layers. A schedule preview overlaps the final viewport, and a skip link plus reduced-motion behavior keep the schedule accessible.

## Superseding visual decision — 2026-10-27

User review found the illustrated room too cartoonish and the blank projection too white. Replace those layers with an original photorealistic auditorium image: real material textures, restrained lighting, and a dim charcoal screen. Preserve native scrolling, temporal damping, the original scroll distance, and the route handoff.

An initial single-image zoom lost the depth effect and did not reach the screen. The final refinement restores independent movement using registered photographic room and seat layers, and calculates full-viewport screen arrival before revealing the schedule. The image is bundled locally so the entrance requires no external image service. See [asset provenance and prompt](../auditorium-asset.md).

Complete the handoff by navigating to the dedicated schedule route; direct links bypass the entrance. The preview remains inert until navigation. Reverse scrolling is available before completion; browser Back returns Home afterward. A static reduced-motion entrance and direct skip link remain available.

The automatic route handoff preserves the preview’s scroll offset before paint, including any overscroll accumulated during damping. Direct navigation still starts at the top. See [layer provenance and prompts](../auditorium-layers.md).
