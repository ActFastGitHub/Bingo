// components/CalledBoard.tsx

"use client";

import { useMemo, useState } from "react";
import LottoBall from "@/app/components/LottoBall";

export default function CalledBoard({ last, history }: { last: number | null; history: number[] }) {
  const pageSize = 36;
  const [page, setPage] = useState(0);

  const pages = Math.max(1, Math.ceil(history.length / pageSize));
  const pageItems = useMemo(() => {
    const start = Math.max(0, history.length - (page + 1) * pageSize);
    const end = history.length - page * pageSize;
    return history.slice(start, end);
  }, [history, page]);

  return (
    <div className="w-full card p-5">
      <div className="text-center space-y-3">
        <div className="text-xs uppercase tracking-widest text-slate-500">Last Number</div>
        <div className="flex justify-center">
          <LottoBall value={last ?? "—"} size="xl" glow />
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs uppercase tracking-widest text-slate-500">Recent</div>
          {pages > 1 && (
            <div className="flex gap-2">
              <button className="rounded-2xl px-3 py-2 bg-white border hover:bg-slate-50" onClick={() => setPage((p) => Math.min(p + 1, pages - 1))}>Prev</button>
              <button className="rounded-2xl px-3 py-2 bg-white border hover:bg-slate-50" onClick={() => setPage((p) => Math.max(p - 1, 0))}>Next</button>
              <span className="text-xs text-slate-600 self-center">Page {pages - page}/{pages}</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {[...pageItems].reverse().map((n, i) => (
            <LottoBall key={`${n}-${i}-${page}`} value={n} size="lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
