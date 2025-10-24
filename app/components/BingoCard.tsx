"use client";

type Props = {
  card: number[][] | number[] | null | undefined;
  calledSet: Set<number>;
};

const headers = ["B", "I", "N", "G", "O"];

// Normalize to 5×5 no matter what comes in
function normalize(card: Props["card"]): number[][] | null {
  if (!card) return null;

  // Already 5×5?
  if (Array.isArray(card) && Array.isArray(card[0]) && card.length === 5 && (card[0] as number[]).length === 5) {
    const grid = (card as number[][]).map(r => r.slice());
    grid[2][2] = 0; // enforce FREE
    return grid;
  }
  // Flat 25
  if (Array.isArray(card) && card.length === 25 && !Array.isArray(card[0])) {
    const flat = (card as (number | string)[]).map(v => (typeof v === "number" ? v : parseInt(String(v), 10) || 0));
    const grid: number[][] = [];
    for (let i = 0; i < 25; i += 5) grid.push(flat.slice(i, i + 5));
    grid[2][2] = 0;
    return grid;
  }
  return null;
}

export default function BingoCard({ card, calledSet }: Props) {
  const grid = normalize(card);

  if (!grid) {
    return (
      <div className="w-full max-w-sm mx-auto text-center text-slate-500">
        Waiting for card…
      </div>
    );
  }

  const isMarked = (v: number) => v === 0 || calledSet.has(v);

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="rounded-2xl border border-slate-300 bg-white shadow-sm p-3">
        {/* Column headers */}
        <div className="grid grid-cols-5 text-center text-2xl font-extrabold mb-2 text-slate-900">
          {headers.map((h) => (
            <div key={h} className="py-1">{h}</div>
          ))}
        </div>

        {/* Very explicit grid (no overlays) */}
        <div className="grid grid-cols-5 gap-1">
          {grid.map((row, r) =>
            row.map((val, c) => {
              const free = val === 0;
              const marked = isMarked(val);

              // Solid, high-contrast backgrounds and borders
              const cellBase = free
                ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                : marked
                  ? "bg-emerald-600 text-white border-emerald-700"
                  : "bg-white text-slate-900 border-slate-300";

              return (
                <div
                  key={`${r}-${c}`}
                  className={`h-16 rounded-xl border grid place-items-center font-bold ${cellBase}`}
                  aria-label={free ? "FREE" : `Value ${val}`}
                >
                  <span className="text-xl">{free ? "FREE" : val}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
