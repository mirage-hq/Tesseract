// Constant gravity: ascent follows 2t − t², descent follows t².
export const HALF_BOUNCE_MS = 450;
export const GRAVITY_CURVE = [1 / 3, 2 / 3, 2 / 3, 1];

// The curve controls ascent; reversing it gives the matching descent.
export function bounceActions(compositionId, height, [x1, y1, x2, y2]) {
  return [
    [1, "positionY", 830, 830 - height, "bounce"],
    [2, "opacity", 100, 30, "shadow-opacity"],
    [2, "scaleX", 100, 55, "shadow-width"],
    [2, "scaleY", 12, 6.6, "shadow-height"],
  ].map(([layerId, propertyType, ground, peak, id]) => ({
    type: "setFxPropertyKeyframes",
    compositionId,
    property: { layerId, propertyType },
    keyframes: Array.from({ length: 3 }, (_, i) => ({
      id: `${id}-${i}`,
      layerTime: i * HALF_BOUNCE_MS,
      value: { type: "float", value: i % 2 ? peak : ground },
      easing:
        i % 2
          ? { type: "cubicBezier", x1, y1, x2, y2 }
          : {
              type: "cubicBezier",
              x1: 1 - x2,
              y1: 1 - y2,
              x2: 1 - x1,
              y2: 1 - y1,
            },
    })),
  }));
}

export function curveRange([, y1, , y2]) {
  return [Math.min(0, y1, y2) - 0.25, Math.max(1, y1, y2) + 0.25];
}
