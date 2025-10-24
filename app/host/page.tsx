"use client";

import { useEffect, useMemo, useState } from "react";
import { getSocket } from "@/app/lib/socket";
import CalledBoard from "@/app/components/CalledBoard";
import toast from "react-hot-toast";

type PlayerLite = { id: string; name: string };
type Winner = { playerId: string; name: string; pattern: string; round: number };

export default function HostPage() {
  const [code, setCode] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [players, setPlayers] = useState<PlayerLite[]>([]);
  const [round, setRound] = useState(1);
  const [winners, setWinners] = useState<Winner[]>([]);

  const last = history[history.length - 1] ?? null;
  const shareUrl = typeof window !== "undefined" && code ? `${window.location.origin}/play/${code}` : "";

  useEffect(() => {
    const socket = getSocket();

    socket.on("room:updated", (summary: any) => {
      setStarted(!!summary.started);
      setPlayers(summary.players ?? []);
    });

    socket.on("game:started", () => {
      setStarted(true);
      setHistory([]);
      toast.success(`Round ${round} started`);
    });

    socket.on("game:called", ({ n, history }: { n: number; history: number[] }) => {
      setHistory(history);
      toast.dismiss();
      toast(`Called: ${n}`, { icon: "🔔" });
    });

    socket.on("game:undo", ({ history }: { history: number[] }) => {
      setHistory(history);
      toast("Undid last draw", { icon: "↩️" });
    });

    socket.on("game:winner", (w: any) => {
      setWinners((prev) => {
        // avoid duplicates for same round
        if (prev.some(p => p.playerId === w.playerId && p.round === round)) return prev;
        return [...prev, { playerId: w.playerId, name: w.name, pattern: w.pattern, round }];
      });
      toast.success(`🎉 Winner: ${w.name} (${w.pattern})`, { duration: 2500 });
    });

    return () => {
      socket.off("room:updated");
      socket.off("game:started");
      socket.off("game:called");
      socket.off("game:undo");
      socket.off("game:winner");
    };
  }, [round]);

  const createRoom = () => {
    getSocket().emit("host:create_room", {}, ({ code }: { code: string }) => {
      setCode(code);
      setRound(1);
      setWinners([]);
      toast.success("Room created");
    });
  };

  const start = () => {
    if (!code) return;
    // increment when restarting a new round (if already started)
    setRound((r) => r + (started ? 1 : 0));
    getSocket().emit("host:start", code);
  };

  const callNext = () => code && getSocket().emit("host:call_next", code);
  const undo = () => code && getSocket().emit("host:undo", code);

  const currentRoundWinners = useMemo(
    () => winners.filter((w) => w.round === round),
    [winners, round]
  );

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Host Console</h1>

      {!code ? (
        <div className="card p-6">
          <p className="text-slate-600 mb-4">Create a room and share the link/code so everyone can join on their phones.</p>
          <button className="rounded-2xl px-5 py-3 text-lg text-white bg-gradient-to-br from-indigo-500 to-indigo-700 hover:opacity-95 shadow-sm" onClick={createRoom}>
            Create Room
          </button>
        </div>
      ) : (
        <>
          <div className="card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-500">Round</div>
              <div className="text-lg font-bold">#{round}</div>

              <div className="mt-2 text-xs uppercase tracking-widest text-slate-500">Room Code</div>
              <div className="text-3xl font-black tracking-widest">{code}</div>
              <div className="text-sm text-slate-500 break-all">Share: {shareUrl}</div>
            </div>
            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              {!started ? (
                <button className="flex-1 sm:flex-none rounded-2xl px-5 py-3 text-lg text-white bg-gradient-to-br from-emerald-500 to-emerald-700 hover:opacity-95 shadow-sm" onClick={start}>
                  Start Game
                </button>
              ) : (
                <>
                  <button className="flex-1 sm:flex-none rounded-2xl px-5 py-3 text-lg text-white bg-gradient-to-br from-amber-400 to-orange-600 hover:opacity-95 shadow-sm" onClick={callNext}>
                    Call Next
                  </button>
                  <button className="flex-1 sm:flex-none rounded-2xl px-5 py-3 text-lg bg-white border hover:bg-slate-50 shadow-sm" onClick={undo}>
                    Undo
                  </button>
                </>
              )}
            </div>
          </div>

          <CalledBoard last={last} history={history} />

          {/* Winners bar (this round) */}
          <div className="card p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-700">Winner(s) this round:</span>
              {currentRoundWinners.length === 0 ? (
                <span className="text-sm text-slate-500">— none yet —</span>
              ) : (
                currentRoundWinners.map((w) => (
                  <span key={w.playerId} className="px-3 py-1 rounded-2xl text-white bg-gradient-to-r from-emerald-500 to-emerald-700">
                    {w.name} <span className="opacity-85 text-xs">({w.pattern})</span>
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-lg font-semibold mb-3">Players</h2>
            {players.length === 0 ? (
              <p className="text-slate-500 text-sm">Waiting for players…</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {players.map((p) => {
                  const isWinner = currentRoundWinners.some((w) => w.playerId === p.id);
                  return (
                    <li
                      key={p.id}
                      className={`px-3 py-1 rounded-2xl border shadow-sm ${
                        isWinner ? "bg-gradient-to-r from-emerald-500 to-emerald-700 text-white border-emerald-700"
                        : "bg-white"
                      }`}
                    >
                      <span className="font-semibold">{p.name || p.id.slice(0, 6)}</span>
                      {isWinner && <span className="ml-2 text-xs font-bold uppercase tracking-wide">Winner</span>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Historical winners by round */}
          {winners.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold mb-3">Winners (by round)</h2>
              <div className="space-y-2">
                {Array.from(new Set(winners.map(w => w.round))).sort((a,b)=>a-b).map((r) => (
                  <div key={r}>
                    <div className="text-sm font-semibold mb-1">Round #{r}</div>
                    <div className="flex flex-wrap gap-2">
                      {winners.filter(w => w.round === r).map(w => (
                        <span key={w.playerId + r} className="px-3 py-1 rounded-2xl text-white bg-gradient-to-r from-emerald-500 to-emerald-700">
                          {w.name} <span className="opacity-80 text-xs">({w.pattern})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
