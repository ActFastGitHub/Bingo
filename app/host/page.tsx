// "use client";

// import { useEffect, useState } from "react";
// import toast from "react-hot-toast";
// import { getSocket } from "@/app/lib/socket";
// import QRCode from "react-qr-code";
// import LottoBall from "@/app/components/LottoBall";
// import Toggle from "@/app/components/Toggle";
// import PatternPicker from "@/app/components/PatternPicker";
// import ResumeRoom from "@/app/components/ResumeRoom";

// type PatternType = "line" | "x" | "plus" | "blackout" | "corners" | "t" | "l";
// type PlayerLite = { id: string; name: string; cards: number };
// type WinnerLite = { playerId: string; name: string; pattern: string; at: number; cardIndex: number };

// type Summary = {
// 	code: string;
// 	started: boolean;
// 	calledCount: number;
// 	last: number | null;
// 	players: PlayerLite[];
// 	roundId: number;
// 	winners: WinnerLite[];
// 	pattern: PatternType;
// 	allowAutoMark: boolean;
// 	locked: boolean;
// 	lockLobbyOnStart: boolean;
// };

// type HostRoom = { code: string; hostKey: string };
// const LS_KEY = "bingo_host_rooms";
// const saveHostRoom = (entry: HostRoom) => {
// 	const list: HostRoom[] = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
// 	const exists = list.some(x => x.code === entry.code);
// 	const next = exists ? list.map(x => (x.code === entry.code ? entry : x)) : [...list, entry];
// 	localStorage.setItem(LS_KEY, JSON.stringify(next));
// };

// export default function HostPage() {
// 	const [summary, setSummary] = useState<Summary | null>(null);
// 	const [history, setHistory] = useState<number[]>([]);
// 	const [hostKey, setHostKey] = useState<string>("");

// 	useEffect(() => {
// 		const s = getSocket();
// 		s.on("room:updated", (sum: Summary) => setSummary(sum));
// 		s.on("game:called", ({ history }: { history: number[] }) => setHistory(history));
// 		s.on("game:undo", ({ history }: { history: number[] }) => setHistory(history));
// 		s.on("game:started", () => {
// 			setHistory([]);
// 			toast("New round started", { icon: "🎬" });
// 		});
// 		s.on("game:ended", () => toast("Round ended", { icon: "⏹️" }));
// 		return () => {
// 			s.off("room:updated");
// 			s.off("game:called");
// 			s.off("game:undo");
// 			s.off("game:started");
// 			s.off("game:ended");
// 		};
// 	}, []);

// 	const createRoom = () => {
// 		getSocket().emit("host:create_room", null, (res: { code: string; seed: number; hostKey: string }) => {
// 			saveHostRoom({ code: res.code, hostKey: res.hostKey });
// 			setHostKey(res.hostKey);
// 			toast.success(`Room ${res.code} created`);
// 			getSocket().emit("room:watch", res.code, (r: any) => r?.ok && setSummary(r.summary));
// 		});
// 	};

// 	const resumeRoom = (entry: HostRoom) => {
// 		getSocket().emit("room:watch", entry.code, (r: any) => {
// 			if (!r?.ok) return toast.error("Room not found (maybe cleared)");
// 			setSummary(r.summary);
// 			setHostKey(entry.hostKey);
// 			toast.success(`Resumed room ${entry.code}`);
// 		});
// 	};

// 	const code = summary?.code ?? "";
// 	const lastCalled = history.length ? history[history.length - 1] : null;

// 	const start = () => code && getSocket().emit("host:start", { code, hostKey });
// 	const endRound = () => code && getSocket().emit("host:end_round", { code, hostKey });
// 	const callNext = () => code && getSocket().emit("host:call_next", { code, hostKey });
// 	const undo = () => code && getSocket().emit("host:undo", { code, hostKey });

// 	const setPattern = (p: PatternType) => code && getSocket().emit("host:set_pattern", { code, hostKey, pattern: p });
// 	const setAllowAuto = (allow: boolean) =>
// 		code && getSocket().emit("host:set_allow_automark", { code, hostKey, allow });
// 	const setLockOnStart = (v: boolean) =>
// 		code && getSocket().emit("host:set_lock_on_start", { code, hostKey, lockOnStart: v });
// 	const setLocked = (v: boolean) => code && getSocket().emit("host:set_locked", { code, hostKey, locked: v });

// 	const started = !!summary?.started;
// 	const canCall = started && history.length < 75;
// 	const canUndo = started && history.length > 0;

// 	const joinUrl = typeof window !== "undefined" && code ? `${window.location.origin}/play/${code}` : code || "JOIN";

// 	return (
// 		<section className='space-y-6'>
// 			<div className='card p-5'>
// 				<div className='flex items-center justify-between'>
// 					<div className='text-2xl font-bold'>Host Console</div>
// 					<a className='text-sm text-slate-600 hover:text-slate-900' href='/'>
// 						Home
// 					</a>
// 				</div>
// 			</div>

// 			{!summary && (
// 				<div className='grid gap-6 md:grid-cols-2'>
// 					<div className='card p-5 space-y-3'>
// 						<div className='text-lg font-semibold'>Create a new room</div>
// 						<button
// 							className='rounded-2xl bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700'
// 							onClick={createRoom}>
// 							Create Room
// 						</button>
// 					</div>
// 					<ResumeRoom onResume={resumeRoom} />
// 				</div>
// 			)}

// 			{summary && (
// 				<>
// 					<div className='card p-5 grid gap-4 md:grid-cols-[1fr_auto]'>
// 						<div>
// 							<div className='text-sm text-slate-500'>ROOM</div>
// 							<div className='text-3xl font-bold tracking-widest'>{code}</div>
// 							<div className='text-xs text-slate-500'>
// 								Share: <span className='font-mono'>/play/{code}</span>
// 							</div>

// 							<div className='mt-4 grid grid-cols-2 gap-3 sm:max-w-md'>
// 								<button
// 									className='rounded-2xl px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-600'
// 									onClick={start}
// 									disabled={started}
// 									title={started ? "Round already started" : "Start a new round"}>
// 									Start Round
// 								</button>

// 								<button
// 									className='rounded-2xl px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed bg-rose-600'
// 									onClick={endRound}
// 									disabled={!started}
// 									title={!started ? "No active round" : "End current round"}>
// 									End Round
// 								</button>

// 								<button
// 									className='rounded-2xl px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600'
// 									onClick={callNext}
// 									disabled={!canCall}
// 									title={
// 										!started
// 											? "Start the round first"
// 											: history.length >= 75
// 											? "No more numbers"
// 											: "Call next number"
// 									}>
// 									Call Next
// 								</button>

// 								<button
// 									className='rounded-2xl px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed bg-slate-200'
// 									onClick={undo}
// 									disabled={!canUndo}
// 									title={
// 										!started
// 											? "Start the round first"
// 											: !canUndo
// 											? "Nothing to undo"
// 											: "Undo last call"
// 									}>
// 									Undo
// 								</button>

// 								<div className='col-span-2 flex items-center text-sm text-slate-600'>
// 									Last: <span className='ml-1 font-semibold'>{lastCalled ?? "—"}</span>
// 								</div>
// 							</div>
// 						</div>

// 						<div className='justify-self-end'>
// 							<div className='rounded-2xl border p-3 bg-white'>
// 								<QRCode value={joinUrl} size={128} />
// 							</div>
// 							<div className='mt-2 text-center text-xs text-slate-500'>Scan to join</div>
// 						</div>
// 					</div>

// 					<div className='card p-5'>
// 						<div className='text-sm font-semibold mb-3'>Called numbers ({history.length})</div>
// 						<div className='flex flex-wrap gap-3'>
// 							{history.map((n, i) => (
// 								<LottoBall key={`${n}-${i}`} value={n} size='lg' />
// 							))}
// 						</div>
// 					</div>

// 					<div className='card p-5 space-y-4'>
// 						<div className='text-sm font-semibold'>Win pattern</div>
// 						<PatternPicker value={summary.pattern} onChange={setPattern} disabled={started} />

// 						<div className='grid gap-3 sm:grid-cols-3'>
// 							<Toggle
// 								checked={summary.allowAutoMark}
// 								onChange={setAllowAuto}
// 								label='Allow auto-mark for players'
// 							/>
// 							<Toggle
// 								checked={summary.lockLobbyOnStart}
// 								onChange={setLockOnStart}
// 								label='Lock lobby when round starts'
// 							/>
// 							<Toggle checked={summary.locked} onChange={setLocked} label='Locked now' />
// 						</div>
// 					</div>

// 					<div className='grid gap-6 md:grid-cols-2'>
// 						<div className='card p-5'>
// 							<div className='text-sm font-semibold mb-2'>Players ({summary.players.length})</div>
// 							{summary.players.length === 0 ? (
// 								<div className='text-sm text-slate-500'>No players yet.</div>
// 							) : (
// 								<ul className='space-y-1'>
// 									{summary.players.map(p => (
// 										<li
// 											key={p.id}
// 											className='flex items-center justify-between rounded-xl border px-3 py-2'>
// 											<span>{p.name}</span>
// 											<span className='text-xs text-slate-500'>{p.cards} card(s)</span>
// 										</li>
// 									))}
// 								</ul>
// 							)}
// 						</div>

// 						<div className='card p-5'>
// 							<div className='text-sm font-semibold mb-2'>Winners ({summary.winners.length})</div>
// 							{summary.winners.length === 0 ? (
// 								<div className='text-sm text-slate-500'>None yet.</div>
// 							) : (
// 								<ul className='space-y-1'>
// 									{summary.winners.map((w, i) => (
// 										<li
// 											key={w.playerId + i}
// 											className='flex items-center justify-between rounded-xl border px-3 py-2'>
// 											<div>
// 												<span className='font-semibold'>{w.name}</span>{" "}
// 												<span className='text-xs text-slate-500'>({w.pattern})</span>
// 											</div>
// 											<div className='text-xs text-slate-500'>after {w.at} calls</div>
// 										</li>
// 									))}
// 								</ul>
// 							)}
// 						</div>
// 					</div>
// 				</>
// 			)}
// 		</section>
// 	);
// }

"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getSocket } from "@/app/lib/socket";
import QRCode from "react-qr-code";
import LottoBall from "@/app/components/LottoBall";
import Toggle from "@/app/components/Toggle";
import PatternPicker from "@/app/components/PatternPicker";
import ResumeRoom from "@/app/components/ResumeRoom";

type PatternType = "line" | "x" | "plus" | "blackout" | "corners" | "t" | "l";
type PlayerLite = { id: string; name: string; cards: number };
type WinnerLite = { playerId: string; name: string; pattern: string; at: number; cardIndex: number };

type Summary = {
  code: string;
  started: boolean;
  calledCount: number;
  last: number | null;
  players: PlayerLite[];
  roundId: number;
  winners: WinnerLite[];
  pattern: PatternType;
  allowAutoMark: boolean;
  locked: boolean;
  lockLobbyOnStart: boolean;
};

type HostRoom = { code: string; hostKey: string };
const LS_KEY = "bingo_host_rooms";
const saveHostRoom = (entry: HostRoom) => {
  const list: HostRoom[] = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  const exists = list.some((x) => x.code === entry.code);
  const next = exists ? list.map((x) => (x.code === entry.code ? entry : x)) : [...list, entry];
  localStorage.setItem(LS_KEY, JSON.stringify(next));
};

// deterministic color chip per id
function colorFromId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return `hsl(${h} 85% 45%)`;
}
function shortId(id: string) {
  return id.slice(-4).toUpperCase();
}

export default function HostPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [hostKey, setHostKey] = useState<string>("");

  useEffect(() => {
    const s = getSocket();
    s.on("room:updated", (sum: Summary) => setSummary(sum));
    s.on("game:called", ({ history }: { history: number[] }) => setHistory(history));
    s.on("game:undo", ({ history }: { history: number[] }) => setHistory(history));
    s.on("game:started", () => {
      setHistory([]);
      toast("New round started", { icon: "🎬" });
    });
    s.on("game:ended", () => toast("Round ended", { icon: "⏹️" }));
    return () => {
      s.off("room:updated");
      s.off("game:called");
      s.off("game:undo");
      s.off("game:started");
      s.off("game:ended");
    };
  }, []);

  const createRoom = () => {
    getSocket().emit("host:create_room", null, (res: { code: string; seed: number; hostKey: string }) => {
      saveHostRoom({ code: res.code, hostKey: res.hostKey });
      setHostKey(res.hostKey);
      toast.success(`Room ${res.code} created`);
      getSocket().emit("room:watch", res.code, (r: any) => r?.ok && setSummary(r.summary));
    });
  };

  const resumeRoom = (entry: HostRoom) => {
    getSocket().emit("room:watch", entry.code, (r: any) => {
      if (!r?.ok) return toast.error("Room not found (maybe cleared)");
      setSummary(r.summary);
      setHostKey(entry.hostKey);
      toast.success(`Resumed room ${entry.code}`);
    });
  };

  const code = summary?.code ?? "";
  const lastCalled = history.length ? history[history.length - 1] : null;

  const started = !!summary?.started;
  const canCall = started && history.length < 75;
  const canUndo = started && history.length > 0;

  const start = () => code && getSocket().emit("host:start", { code, hostKey });
  const endRound = () => code && getSocket().emit("host:end_round", { code, hostKey });
  const callNext = () => code && getSocket().emit("host:call_next", { code, hostKey });
  const undo = () => code && getSocket().emit("host:undo", { code, hostKey });

  const setPattern = (p: PatternType) => code && getSocket().emit("host:set_pattern", { code, hostKey, pattern: p });
  const setAllowAuto = (allow: boolean) => code && getSocket().emit("host:set_allow_automark", { code, hostKey, allow });
  const setLockOnStart = (v: boolean) => code && getSocket().emit("host:set_lock_on_start", { code, hostKey, lockOnStart: v });
  const setLocked = (v: boolean) => code && getSocket().emit("host:set_locked", { code, hostKey, locked: v });

  const joinUrl = typeof window !== "undefined" && code ? `${window.location.origin}/play/${code}` : code || "JOIN";

  // compact paging for called numbers (chunks of 36)
  const pageSize = 36;
  const pages = Math.max(1, Math.ceil(history.length / pageSize));
  const [page, setPage] = useState(0);
  const pageItems = useMemo(() => {
    const start = Math.max(0, history.length - (page + 1) * pageSize);
    const end = history.length - page * pageSize;
    return history.slice(start, end);
  }, [history, page]);

  return (
    <section className="space-y-6">
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">Host Console</div>
          <a className="text-sm text-slate-600 hover:text-slate-900" href="/">Home</a>
        </div>
      </div>

      {!summary && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card p-5 space-y-3">
            <div className="text-lg font-semibold">Create a new room</div>
            <button
              className="rounded-2xl bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700"
              onClick={createRoom}
            >
              Create Room
            </button>
          </div>
          <ResumeRoom onResume={resumeRoom} />
        </div>
      )}

      {summary && (
        <>
          {/* Top strip: room + QR + giant LAST ball */}
          <div className="grid gap-4 xl:grid-cols-[1fr_auto_1fr]">
            <div className="card p-5">
              <div className="text-sm text-slate-500">ROOM</div>
              <div className="text-3xl font-bold tracking-widest">{code}</div>
              <div className="text-xs text-slate-500 mt-1">Share: <span className="font-mono">/play/{code}</span></div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-md">
                <button
                  className="rounded-2xl px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-600"
                  onClick={start}
                  disabled={started}
                  title={started ? "Round already started" : "Start a new round"}
                >
                  Start Round
                </button>

                <button
                  className="rounded-2xl px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed bg-rose-600"
                  onClick={endRound}
                  disabled={!started}
                  title={!started ? "No active round" : "End current round"}
                >
                  End Round
                </button>

                <button
                  className="rounded-2xl px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600"
                  onClick={callNext}
                  disabled={!canCall}
                >
                  Call Next
                </button>

                <button
                  className="rounded-2xl px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed bg-slate-200"
                  onClick={undo}
                  disabled={!canUndo}
                >
                  Undo
                </button>
              </div>
            </div>

            <div className="card p-5 grid place-items-center">
              <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Scan to join</div>
              <div className="rounded-2xl border p-3 bg-white">
                <QRCode value={joinUrl} size={132} />
              </div>
            </div>

            <div className="card p-5 grid place-items-center">
              <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Last Number</div>
              {/* BIG ball to emphasize most recent call */}
              <LottoBall value={lastCalled ?? "—"} size="xl" glow />
            </div>
          </div>

          {/* Middle: pattern + policies + paged recent numbers */}
          <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
            <div className="card p-5 space-y-4">
              <div className="text-sm font-semibold">Win pattern</div>
              <PatternPicker value={summary.pattern} onChange={setPattern} disabled={started} />
              <div className="grid gap-3 sm:grid-cols-3">
                <Toggle checked={summary.allowAutoMark} onChange={setAllowAuto} label="Allow auto-mark" />
                <Toggle checked={summary.lockLobbyOnStart} onChange={setLockOnStart} label="Lock on start" />
                <Toggle checked={summary.locked} onChange={setLocked} label="Locked now" />
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold">Called numbers ({history.length})</div>
                {pages > 1 && (
                  <div className="flex gap-2 items-center">
                    <button className="rounded-2xl px-3 py-2 bg-white border hover:bg-slate-50"
                            onClick={() => setPage((p) => Math.min(p + 1, pages - 1))}>Prev</button>
                    <button className="rounded-2xl px-3 py-2 bg-white border hover:bg-slate-50"
                            onClick={() => setPage((p) => Math.max(p - 1, 0))}>Next</button>
                    <span className="text-xs text-slate-600">Page {pages - page}/{pages}</span>
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

          {/* Bottom: compact Players + Winners side-by-side */}
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="card p-5">
              <div className="text-sm font-semibold mb-2">
                Players ({summary.players.length})
              </div>
              {summary.players.length === 0 ? (
                <div className="text-sm text-slate-500">No players yet.</div>
              ) : (
                <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {summary.players.map((p) => (
                    <li key={p.id} className="flex items-center justify-between rounded-xl border px-3 py-2 bg-white">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            aria-hidden
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ background: colorFromId(p.id) }}
                          />
                          <span className="truncate">{p.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">#{shortId(p.id)}</div>
                      </div>
                      <span className="text-xs text-slate-600">{p.cards} card(s)</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card p-5">
              <div className="text-sm font-semibold mb-2">Winners ({summary.winners.length})</div>
              {summary.winners.length === 0 ? (
                <div className="text-sm text-slate-500">None yet.</div>
              ) : (
                <ul className="space-y-1">
                  {summary.winners.map((w, i) => (
                    <li key={w.playerId + i} className="flex items-center justify-between rounded-xl border px-3 py-2 bg-white">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            aria-hidden
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ background: colorFromId(w.playerId) }}
                          />
                          <span className="font-semibold truncate">{w.name}</span>
                          <span className="text-xs text-slate-500">({w.pattern})</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">#{shortId(w.playerId)}</div>
                      </div>
                      <div className="text-xs text-slate-500">after {w.at} calls</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
