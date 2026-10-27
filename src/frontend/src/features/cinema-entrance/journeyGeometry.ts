const image = { width: 1672, height: 941 };
// Registered screen rectangle in the photographic room plate, in source pixels.
const screen = { x: 570, y: 225, width: 532, height: 260 };

export function getJourneyGeometry(width: number, height: number) {
  const cover = Math.max(width / image.width, height / image.height);
  const imageWidth = image.width * cover;
  const imageHeight = image.height * cover;
  const left = (width - imageWidth) / 2;
  const top = (height - imageHeight) * 0.4;
  const originX = left + (screen.x + screen.width / 2) * cover;
  const originY = top + (screen.y + screen.height / 2) * cover;
  // A small overscan prevents a sliver of the screen frame at the viewport edge.
  const scale = Math.max(width / (screen.width * cover), height / (screen.height * cover)) * 1.03;

  return { imageWidth, imageHeight, left, top, originX, originY, scale,
    shiftX: width / 2 - originX, shiftY: height / 2 - originY,
    screenWidth: screen.width * cover, screenHeight: screen.height * cover };
}

export function getScheduleScrollOffset(previewTop: number) {
  return Math.max(0, -previewTop);
}
