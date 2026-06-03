import { useEffect, useState } from 'react';
import { LifeHQBrand } from './LifeHQBrand';

const defaultIntroDurationMs = 850;
const reducedMotionIntroDurationMs = 260;

function getIntroDuration() {
  if (typeof window === 'undefined') {
    return defaultIntroDurationMs;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? reducedMotionIntroDurationMs
    : defaultIntroDurationMs;
}

export function LifeHQLaunchIntro() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const introTimer = window.setTimeout(() => {
      setIsVisible(false);
    }, getIntroDuration());

    return () => window.clearTimeout(introTimer);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="lifehq-launch-intro" aria-hidden="true">
      <div className="lifehq-launch-brand">
        <LifeHQBrand />
      </div>
    </div>
  );
}
