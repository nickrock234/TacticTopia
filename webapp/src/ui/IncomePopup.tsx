// Start-of-turn summary: every source of gold and XP that paid out as your turn began (base, buildings,
// landmarks, gold mines, quests, a base raid...), so the numbers going up are never a mystery.
// Terse on purpose: a label and the amounts. Dismissed with OK (or a tap on the dim).

import type { IncomeLine } from '@engine/state.ts';

export function IncomePopup({ lines, onClose }: { lines: IncomeLine[]; onClose: () => void }) {
  const xp = lines.reduce((s, l) => s + l.xp, 0), gold = lines.reduce((s, l) => s + l.gold, 0);
  const amount = (ic: 'gold' | 'xp', n: number) => (
    <span className={`inc-amt${n < 0 ? ' neg' : ''}`}>{n ? <>{n > 0 ? '+' : '−'}{Math.abs(n)}<img src={`art/icons/icon_${ic}.png`} alt={ic} /></> : null}</span>
  );
  return (
    <div className="overlay income-overlay" onPointerDown={onClose}>
      <div className="window income-popup" onPointerDown={e => e.stopPropagation()}>
        <div className="income-title">INCOME</div>
        {lines.map((l, i) => (
          <div key={i} className="income-row">
            <span className="income-label">{l.label}</span>
            {amount('gold', l.gold)}
            {amount('xp', l.xp)}
          </div>
        ))}
        <div className="income-row total">
          <span className="income-label">Total</span>
          {amount('gold', gold)}
          {amount('xp', xp)}
        </div>
        <button className="confirm-yes income-ok" onClick={onClose}>OK</button>
      </div>
    </div>
  );
}
