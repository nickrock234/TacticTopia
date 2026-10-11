// A class portrait from packet 002: frame 0 normal, 1 hurt, 2 defeated.
// Drawn on a tiny canvas so the team-colour swap from the atlas applies.

import { useEffect, useRef } from 'react';
import type { Atlas } from '../art/sprites.ts';

export function Portrait({ atlas, cls, team, state }: { atlas: Atlas; cls: string; team: number; state: 0 | 1 | 2 }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    const s = atlas.get(`portraits/portrait_${cls}`, team);
    if (!cv || !s) return;
    const ctx = cv.getContext('2d')!;
    ctx.clearRect(0, 0, 32, 32);
    ctx.drawImage(s.img, state * 32, 0, 32, 32, 0, 0, 32, 32);
  }, [atlas, cls, team, state]);
  return <canvas ref={ref} width={32} height={32} className="portrait-img" />;
}
