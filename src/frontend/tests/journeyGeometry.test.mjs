import test from 'node:test';
import assert from 'node:assert/strict';
import { getJourneyGeometry, getScheduleScrollOffset } from '../src/features/cinema-entrance/journeyGeometry.ts';

for (const [width, height] of [[1440, 900], [2560, 1080], [390, 844], [844, 390]]) {
  test(`screen covers every edge at camera arrival in a ${width}×${height} viewport`, () => {
    const geometry = getJourneyGeometry(width, height);
    assert.ok(geometry.imageWidth >= width);
    assert.ok(geometry.imageHeight >= height);
    const centerX = geometry.originX + geometry.shiftX;
    const centerY = geometry.originY + geometry.shiftY;
    const halfWidth = geometry.screenWidth * geometry.scale / 2;
    const halfHeight = geometry.screenHeight * geometry.scale / 2;
    assert.ok(centerX - halfWidth <= 0);
    assert.ok(centerX + halfWidth >= width);
    assert.ok(centerY - halfHeight <= 0);
    assert.ok(centerY + halfHeight >= height);
  });
}

test('route handoff preserves content position after overscrolling the preview', () => {
  const previewTop = -137.5;
  const headingWithinSchedule = 260;
  const before = previewTop + headingWithinSchedule;
  const after = headingWithinSchedule - getScheduleScrollOffset(previewTop);
  assert.equal(after, before);
});

test('a preview arriving at the top enters the schedule without extra scrolling', () => {
  assert.equal(getScheduleScrollOffset(0), 0);
});
