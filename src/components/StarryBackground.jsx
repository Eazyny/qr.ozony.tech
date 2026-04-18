import React, { useId, useMemo } from 'react';
import './starry-background.css';

const createSeededRandom = (seed) => {
  let value = seed % 2147483647;

  if (value <= 0) {
    value += 2147483646;
  }

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

const buildStars = (count, seed) => {
  const random = createSeededRandom(seed);

  return Array.from({ length: count }, (_, index) => {
    let opacity = 1;

    if (index % 19 === 0) opacity = 0.2;
    else if (index % 13 === 0) opacity = 0.4;
    else if (index % 7 === 0) opacity = 0.6;
    else if (index % 3 === 0) opacity = 0.8;

    return {
      id: `${seed}-${index}`,
      x: (random() * 100).toFixed(2),
      y: (random() * 100).toFixed(2),
      r: (0.5 + random()).toFixed(2),
      opacity,
    };
  });
};

export default function StarryBackground({ className = '' }) {
  const gradientId = useId().replace(/:/g, '');
  const layers = useMemo(
    () => [buildStars(200, 11), buildStars(200, 27), buildStars(200, 43)],
    []
  );

  return (
    <div className={`starry-sky ${className}`.trim()} aria-hidden="true">
      {layers.map((stars, layerIndex) => (
        <svg
          key={layerIndex}
          className="starry-sky__layer"
          width="100%"
          height="100%"
          preserveAspectRatio="none"
        >
          {stars.map((star) => (
            <circle
              key={star.id}
              className="starry-sky__star"
              cx={`${star.x}%`}
              cy={`${star.y}%`}
              r={star.r}
              opacity={star.opacity}
            />
          ))}
        </svg>
      ))}

      <svg
        className="starry-sky__extras"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient id={`comet-gradient-${gradientId}`} cx="0" cy=".5" r="0.5">
            <stop offset="0%" stopColor="rgba(255,255,255,.85)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        <g transform="rotate(-135)">
          <ellipse
            className="starry-sky__comet"
            fill={`url(#comet-gradient-${gradientId})`}
            cx="0"
            cy="0"
            rx="150"
            ry="2"
          />
        </g>

        <g transform="rotate(20)">
          <ellipse
            className="starry-sky__comet starry-sky__comet--b"
            fill={`url(#comet-gradient-${gradientId})`}
            cx="100%"
            cy="0"
            rx="150"
            ry="2"
          />
        </g>

        <g transform="rotate(300)">
          <ellipse
            className="starry-sky__comet starry-sky__comet--c"
            fill={`url(#comet-gradient-${gradientId})`}
            cx="40%"
            cy="100%"
            rx="150"
            ry="2"
          />
        </g>
      </svg>
    </div>
  );
}