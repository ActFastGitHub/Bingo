"use client";

import { useEffect, useMemo, useState } from "react";
import { getSocket } from "@/app/lib/socket";
import CalledBoard from "@/app/components/CalledBoard";
import QRCode from "react-qr-code";
import toast from "react-hot-toast";

type PlayerLite = { id: string; name: string; cards: number };
type Winner = { playerId: string; name: string; pattern: string; round: number; cardIndex?: number };
type Pattern = "line" | "diagonal" | "blackout" | "cross" | "t" | "l";

export default function HostPage() {
  const [code, setCode] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [players, setPlayers] = useState<PlayerLite[]>([]);
  const [round, setRound] = useState(1);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [pattern, setPattern] = useState<Pattern>("line");
  const [allowAutoMark, setAllowAutoMark] = useState(true);
  const [lockOnStart, setLockOnStart] = useState(true);
  const [locked, setLocked] = useState(false);

  const last = history[history.length - 1] ?? null;
  const shareUrl = typeof window !== "undefined" && code ? `${window.location.origin}/play/${code}` : "";

  useEffect(() => {
    const socket = getSocket();

    const onSummary = (summary: any) => {
      setStarted(!!summary.started);
      setPlayers(summary.players ?? []);
      if (summary.pattern) setPattern(summary.pattern);
      if (typeof summary.allowAutoMark === "boolean") setAllowAutoMark(summary.allowAutoMark);
      if (typeof summary.lockLobbyOnStart === "boolean") setLockOnStart(summary.lockLobbyOnStart);
      if (typeof summary.locked === "boolean") setLocked(summary.locked);
    };

    socket.on("room:updated", onSummary);
    socket.on("policy:allow_automark", (allow: boolean) => setAllowAutoMark(allow));
    socket.on("policy:locked", (v: boolean) => setLocked(v));

    socket.on("game:started", () => {
      setStarted(true);
      setHistory([]);
      toast.success(`Round ${round} started (${pattern})`);
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
        if (prev.some(p => p.playerId === w.playerId && p.round === round)) return prev;
        return [...prev, { playerId: w.playerId, name: w.name, pattern: w.pattern, round, cardIndex: w.cardIndex }];
      });
      toast.success(`🎉 Winner: ${w.name} (${w.pattern})`, { duration: 3000 });
    });

    return () => {
      socket.off("room:updated", onSummary);
      socket.off("policy:allow_automark");
      socket.off("policy:locked");
      socket.off("game:started");
      socket.off("game:called");
      socket.off("game:undo");
      socket.off("game:winner");
    };
  }, [round, pattern]);

  const createRoom = () => {
    getSocket().emit("host:create_room", {}, ({ code }: { code: string }) => {
      setCode(code);
      setRound(1);
      setWinners([]);
      toast.success("Room created");
    });
  };

  const applyPattern = () => code && getSocket().emit("host:set_pattern", { code, pattern });
  const applyAllowAuto = () => code && getSocket().emit("host:set_allow_automark", { code, allow: allowAutoMark });
  const applyLockOnStart = () => code && getSocket().emit("host:set_lock_on_start", { code, lockOnStart });

  const start = () => {
    if (!code) return;
    applyPattern();
    applyAllowAuto();
    applyLockOnStart();
    setRound((r) => r + (started ? 1 : 0));
    getSocket().emit("host:start", code);
  };

  const callNext = () => code && getSocket().emit("host:call_next", code);
  const undo = () => code && getSocket().emit("host:undo", code);
  const manualLock = (v: boolean) => code && getSocket().emit("host:set_locked", { code, locked: v });

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
          <div className="card p-5 flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-500">Round</div>
                <div className="text-lg font-bold">#{round}</div>

                <div className="mt-2 text-xs uppercase tracking-widest text-slate-500">Room Code</div>
                <div className="text-3xl font-black tracking-widest">{code}</div>
                <div className="text-sm text-slate-500 break-all">Share: {shareUrl}</div>
                <div className="mt-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-full ${locked ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {locked ? "Lobby Locked" : "Lobby Open"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {!started ? (
                  <button className="rounded-2xl px-5 py-3 text-lg text-white bg-gradient-to-br from-emerald-500 to-emerald-700 hover:opacity-95 shadow-sm" onClick={start}>
                    Start Game
                  </button>
                ) : (
                  <>
                    <button className="rounded-2xl px-5 py-3 text-lg text-white bg-gradient-to-br from-amber-400 to-orange-600 hover:opacity-95 shadow-sm" onClick={callNext}>
                      Call Next
                    </button>
                    <button className="rounded-2xl px-5 py-3 text-lg bg-white border hover:bg-slate-50 shadow-sm" onClick={undo}>
                      Undo
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* QR code */}
            {shareUrl && (
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-2xl border shadow-sm">
                  <QRCode value={shareUrl} size={180} style={{ height: "180px", width: "180px" }} aria-label="Join QR code" />
                </div>
                <div className="text-sm text-slate-600">
                  Scan to join or visit:
                  <div className="font-mono text-slate-800 break-all">{shareUrl}</div>
                </div>
              </div>
            )}

            {/* Pattern + Policies (apply before start) */}
            {!started && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600">Winning pattern</label>
                  <select
                    className="border rounded-xl p-2"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value as Pattern)}
                    onBlur={applyPattern}
                  >
                    <option value="line">Any line (row/col)</option>
                    <option value="diagonal">Diagonal</option>
                    <option value="cross">Cross (+)</option>
                    <option value="t">T-shape</option>
                    <option value="l">L-shape</option>
                    <option value="blackout">Blackout (full)</option>
                  </select>
                </div>

                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={allowAutoMark} onChange={(e) => { setAllowAutoMark(e.target.checked); getSocket().emit("host:set_allow_automark", { code, allow: e.target.checked }); }} />
                  Allow auto-mark for players
                </label>

                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={lockOnStart} onChange={(e) => { setLockOnStart(e.target.checked); getSocket().emit("host:set_lock_on_start", { code, lockOnStart: e.target.checked }); }} />
                  Lock lobby on start
                </label>

                <div className="flex gap-2">
                  <button className="rounded-xl px-3 py-1 text-sm border bg-white hover:bg-slate-50" onClick={() => manualLock(false)} disabled={!locked}>
                    Unlock lobby
                  </button>
                  <button className="rounded-xl px-3 py-1 text-sm border bg-white hover:bg-slate-50" onClick={() => manualLock(true)} disabled={locked}>
                    Lock lobby
                  </button>
                </div>
              </div>
            )}
          </div>

          <CalledBoard last={last} history={history} />

          <div className={`card p-4 ${currentRoundWinners.length ? "ring-2 ring-emerald-500" : ""}`}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-700">Winner(s) this round:</span>
              {currentRoundWinners.length === 0 ? (
                <span className="text-sm text-slate-500">— none yet —</span>
              ) : (
                currentRoundWinners.map((w) => (
                  <span key={w.playerId} className="px-3 py-1 rounded-2xl text-white bg-gradient-to-r from-emerald-500 to-emerald-700">
                    {w.name} <span className="opacity-85 text-xs">({w.pattern}{typeof w.cardIndex==="number" ? ` · Card ${w.cardIndex+1}` : ""})</span>
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
                {players.map((p) => (
                  <li key={p.id} className="px-3 py-1 rounded-2xl border shadow-sm bg-white">
                    <span className="font-semibold">{p.name || p.id.slice(0, 6)}</span>
                    <span className="ml-2 text-xs text-slate-500">({p.cards} card{p.cards>1 ? "s" : ""})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
