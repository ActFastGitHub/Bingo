"use client";

type Props = {
  card: number[][] | number[] | null | undefined; // a single 5x5 card
  calledSet: Set<number>;
  manual?: boolean;
  marks?: [number, number][];
  onToggle?: (r: number, c: number) => void;
};

const headers = ["B", "I", "N", "G", "O"];

function normalize(card: Props["card"]): number[][] | null {
  if (!card) return null;

  if (Array.isArray(card) && Array.isArray(card[0]) && card.length === 5 && (card[0] as number[]).length === 5) {
    const grid = (card as number[][]).map(r => r.slice());
    grid[2][2] = 0;
    return grid;
  }
  if (Array.isArray(card) && card.length === 25 && !Array.isArray(card[0])) {
    const flat = (card as (number|string)[]).map(v => (typeof v === "number" ? v : parseInt(String(v), 10) || 0));
    const grid: number[][] = [];
    for (let i = 0; i < 25; i += 5) grid.push(flat.slice(i, i + 5));
    grid[2][2] = 0;
    return grid;
  }
  return null;
}

export default function BingoCard({ card, calledSet, manual, marks, onToggle }: Props) {
  const grid = normalize(card);

  if (!grid) {
    return (
      <div className="w-full max-w-sm mx-auto text-center text-slate-500">
        Waiting for card…
      </div>
    );
  }

  const markSet = new Set((marks ?? []).map(([r, c]) => `${r}-${c}`));

  const isMarked = (r: number, c: number, val: number) => {
    if (val === 0) return true;
    if (manual) return markSet.has(`${r}-${c}`);
    return calledSet.has(val);
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="rounded-2xl border border-slate-300 bg-white shadow-sm p-3">
        <div className="grid grid-cols-5 text-center text-2xl font-extrabold mb-2 text-slate-900">
          {headers.map((h) => (
            <div key={h} className="py-1">{h}</div>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-1">
          {grid.map((row, r) =>
            row.map((val, c) => {
              const free = val === 0;
              const marked = isMarked(r, c, val);

              const cellBase = free
                ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                : marked
                  ? "bg-emerald-600 text-white border-emerald-700"
                  : "bg-white text-slate-900 border-slate-300";

              return (
                <button
                  type="button"
                  key={`${r}-${c}`}
                  className={`h-16 rounded-xl border grid place-items-center font-bold ${cellBase} select-none`}
                  aria-label={free ? "FREE" : `Value ${val}`}
                  onClick={() => onToggle?.(r, c)}
                >
                  <span className="text-xl">{free ? "FREE" : val}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
