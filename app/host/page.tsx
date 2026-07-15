// "use client";

// import { useEffect, useMemo, useState } from "react";
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
//   code: string;
//   started: boolean;
//   calledCount: number;
//   last: number | null;
//   players: PlayerLite[];
//   roundId: number;
//   winners: WinnerLite[];
//   pattern: PatternType;
//   allowAutoMark: boolean;
//   locked: boolean;
//   lockLobbyOnStart: boolean;
// };

// type HostRoom = { code: string; hostKey: string };
// const LS_KEY = "bingo_host_rooms";
// const saveHostRoom = (entry: HostRoom) => {
//   const list: HostRoom[] = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
//   const exists = list.some((x) => x.code === entry.code);
//   const next = exists ? list.map((x) => (x.code === entry.code ? entry : x)) : [...list, entry];
//   localStorage.setItem(LS_KEY, JSON.stringify(next));
// };

// // deterministic color chip per id
// function colorFromId(id: string) {
//   let h = 0;
//   for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
//   return `hsl(${h} 85% 45%)`;
// }
// function shortId(id: string) {
//   return id.slice(-4).toUpperCase();
// }

// export default function HostPage() {
//   const [summary, setSummary] = useState<Summary | null>(null);
//   const [history, setHistory] = useState<number[]>([]);
//   const [hostKey, setHostKey] = useState<string>("");

//   useEffect(() => {
//     const s = getSocket();
//     s.on("room:updated", (sum: Summary) => setSummary(sum));
//     s.on("game:called", ({ history }: { history: number[] }) => setHistory(history));
//     s.on("game:undo", ({ history }: { history: number[] }) => setHistory(history));
//     s.on("game:started", () => {
//       setHistory([]);
//       toast("New round started", { icon: "🎬" });
//     });
//     s.on("game:ended", () => toast("Round ended", { icon: "⏹️" }));
//     return () => {
//       s.off("room:updated");
//       s.off("game:called");
//       s.off("game:undo");
//       s.off("game:started");
//       s.off("game:ended");
//     };
//   }, []);

//   const createRoom = () => {
//     getSocket().emit("host:create_room", null, (res: { code: string; seed: number; hostKey: string }) => {
//       saveHostRoom({ code: res.code, hostKey: res.hostKey });
//       setHostKey(res.hostKey);
//       toast.success(`Room ${res.code} created`);
//       getSocket().emit("room:watch", res.code, (r: any) => r?.ok && setSummary(r.summary));
//     });
//   };

//   const resumeRoom = (entry: HostRoom) => {
//     getSocket().emit("room:watch", entry.code, (r: any) => {
//       if (!r?.ok) return toast.error("Room not found (maybe cleared)");
//       setSummary(r.summary);
//       setHostKey(entry.hostKey);
//       toast.success(`Resumed room ${entry.code}`);
//     });
//   };

//   const code = summary?.code ?? "";
//   const lastCalled = history.length ? history[history.length - 1] : null;

//   const started = !!summary?.started;
//   const canCall = started && history.length < 75;
//   const canUndo = started && history.length > 0;

//   const start = () => code && getSocket().emit("host:start", { code, hostKey });
//   const endRound = () => code && getSocket().emit("host:end_round", { code, hostKey });
//   const callNext = () => code && getSocket().emit("host:call_next", { code, hostKey });
//   const undo = () => code && getSocket().emit("host:undo", { code, hostKey });

//   const setPattern = (p: PatternType) => code && getSocket().emit("host:set_pattern", { code, hostKey, pattern: p });
//   const setAllowAuto = (allow: boolean) => code && getSocket().emit("host:set_allow_automark", { code, hostKey, allow });
//   const setLockOnStart = (v: boolean) => code && getSocket().emit("host:set_lock_on_start", { code, hostKey, lockOnStart: v });
//   const setLocked = (v: boolean) => code && getSocket().emit("host:set_locked", { code, hostKey, locked: v });

//   const joinUrl = typeof window !== "undefined" && code ? `${window.location.origin}/play/${code}` : code || "JOIN";

//   // compact paging for called numbers (chunks of 36)
//   const pageSize = 36;
//   const pages = Math.max(1, Math.ceil(history.length / pageSize));
//   const [page, setPage] = useState(0);
//   const pageItems = useMemo(() => {
//     const start = Math.max(0, history.length - (page + 1) * pageSize);
//     const end = history.length - page * pageSize;
//     return history.slice(start, end);
//   }, [history, page]);

//   return (
//     <section className="space-y-6">
//       <div className="card p-5">
//         <div className="flex items-center justify-between">
//           <div className="text-2xl font-bold">Host Console</div>
//           <a className="text-sm text-slate-600 hover:text-slate-900" href="/">Home</a>
//         </div>
//       </div>

//       {!summary && (
//         <div className="grid gap-6 md:grid-cols-2">
//           <div className="card p-5 space-y-3">
//             <div className="text-lg font-semibold">Create a new room</div>
//             <button
//               className="rounded-2xl bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700"
//               onClick={createRoom}
//             >
//               Create Room
//             </button>
//           </div>
//           <ResumeRoom onResume={resumeRoom} />
//         </div>
//       )}

//       {summary && (
//         <>
//           {/* Top strip: room + QR + giant LAST ball */}
//           <div className="grid gap-4 xl:grid-cols-[1fr_auto_1fr]">
//             <div className="card p-5">
//               <div className="text-sm text-slate-500">ROOM</div>
//               <div className="text-3xl font-bold tracking-widest">{code}</div>
//               <div className="text-xs text-slate-500 mt-1">Share: <span className="font-mono">/play/{code}</span></div>

//               <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-md">
//                 <button
//                   className="rounded-2xl px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-600"
//                   onClick={start}
//                   disabled={started}
//                   title={started ? "Round already started" : "Start a new round"}
//                 >
//                   Start Round
//                 </button>

//                 <button
//                   className="rounded-2xl px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed bg-rose-600"
//                   onClick={endRound}
//                   disabled={!started}
//                   title={!started ? "No active round" : "End current round"}
//                 >
//                   End Round
//                 </button>

//                 <button
//                   className="rounded-2xl px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600"
//                   onClick={callNext}
//                   disabled={!canCall}
//                 >
//                   Call Next
//                 </button>

//                 <button
//                   className="rounded-2xl px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed bg-slate-200"
//                   onClick={undo}
//                   disabled={!canUndo}
//                 >
//                   Undo
//                 </button>
//               </div>
//             </div>

//             <div className="card p-5 grid place-items-center">
//               <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Scan to join</div>
//               <div className="rounded-2xl border p-3 bg-white">
//                 <QRCode value={joinUrl} size={132} />
//               </div>
//             </div>

//             <div className="card p-5 grid place-items-center">
//               <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Last Number</div>
//               {/* BIG ball to emphasize most recent call */}
//               <LottoBall value={lastCalled ?? "—"} size="xl" glow />
//             </div>
//           </div>

//           {/* Middle: pattern + policies + paged recent numbers */}
//           <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
//             <div className="card p-5 space-y-4">
//               <div className="text-sm font-semibold">Win pattern</div>
//               <PatternPicker value={summary.pattern} onChange={setPattern} disabled={started} />
//               <div className="grid gap-3 sm:grid-cols-3">
//                 <Toggle checked={summary.allowAutoMark} onChange={setAllowAuto} label="Allow auto-mark" />
//                 <Toggle checked={summary.lockLobbyOnStart} onChange={setLockOnStart} label="Lock on start" />
//                 <Toggle checked={summary.locked} onChange={setLocked} label="Locked now" />
//               </div>
//             </div>

//             <div className="card p-5">
//               <div className="flex items-center justify-between mb-3">
//                 <div className="text-sm font-semibold">Called numbers ({history.length})</div>
//                 {pages > 1 && (
//                   <div className="flex gap-2 items-center">
//                     <button className="rounded-2xl px-3 py-2 bg-white border hover:bg-slate-50"
//                             onClick={() => setPage((p) => Math.min(p + 1, pages - 1))}>Prev</button>
//                     <button className="rounded-2xl px-3 py-2 bg-white border hover:bg-slate-50"
//                             onClick={() => setPage((p) => Math.max(p - 1, 0))}>Next</button>
//                     <span className="text-xs text-slate-600">Page {pages - page}/{pages}</span>
//                   </div>
//                 )}
//               </div>
//               <div className="flex flex-wrap gap-3">
//                 {[...pageItems].reverse().map((n, i) => (
//                   <LottoBall key={`${n}-${i}-${page}`} value={n} size="lg" />
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Bottom: compact Players + Winners side-by-side */}
//           <div className="grid gap-6 xl:grid-cols-2">
//             <div className="card p-5">
//               <div className="text-sm font-semibold mb-2">
//                 Players ({summary.players.length})
//               </div>
//               {summary.players.length === 0 ? (
//                 <div className="text-sm text-slate-500">No players yet.</div>
//               ) : (
//                 <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
//                   {summary.players.map((p) => (
//                     <li key={p.id} className="flex items-center justify-between rounded-xl border px-3 py-2 bg-white">
//                       <div className="min-w-0">
//                         <div className="flex items-center gap-2">
//                           <span
//                             aria-hidden
//                             className="inline-block h-2.5 w-2.5 rounded-full"
//                             style={{ background: colorFromId(p.id) }}
//                           />
//                           <span className="truncate">{p.name}</span>
//                         </div>
//                         <div className="text-[11px] text-slate-500 font-mono">#{shortId(p.id)}</div>
//                       </div>
//                       <span className="text-xs text-slate-600">{p.cards} card(s)</span>
//                     </li>
//                   ))}
//                 </ul>
//               )}
//             </div>

//             <div className="card p-5">
//               <div className="text-sm font-semibold mb-2">Winners ({summary.winners.length})</div>
//               {summary.winners.length === 0 ? (
//                 <div className="text-sm text-slate-500">None yet.</div>
//               ) : (
//                 <ul className="space-y-1">
//                   {summary.winners.map((w, i) => (
//                     <li key={w.playerId + i} className="flex items-center justify-between rounded-xl border px-3 py-2 bg-white">
//                       <div className="min-w-0">
//                         <div className="flex items-center gap-2">
//                           <span
//                             aria-hidden
//                             className="inline-block h-2.5 w-2.5 rounded-full"
//                             style={{ background: colorFromId(w.playerId) }}
//                           />
//                           <span className="font-semibold truncate">{w.name}</span>
//                           <span className="text-xs text-slate-500">({w.pattern})</span>
//                         </div>
//                         <div className="text-[11px] text-slate-500 font-mono">#{shortId(w.playerId)}</div>
//                       </div>
//                       <div className="text-xs text-slate-500">after {w.at} calls</div>
//                     </li>
//                   ))}
//                 </ul>
//               )}
//             </div>
//           </div>
//         </>
//       )}
//     </section>
//   );
// }

// "use client";

// import { useEffect, useMemo, useState } from "react";
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

// function colorFromId(id: string) {
// 	let h = 0;
// 	for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
// 	return `hsl(${h} 85% 45%)`;
// }
// function shortId(id: string) {
// 	return id.slice(-4).toUpperCase();
// }

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
// 		s.on("room:deleted", () => {
// 			setSummary(null);
// 			setHistory([]);
// 			toast("Room deleted", { icon: "🗑️" });
// 		});
// 		return () => {
// 			s.off("room:updated");
// 			s.off("game:called");
// 			s.off("game:undo");
// 			s.off("game:started");
// 			s.off("game:ended");
// 			s.off("room:deleted");
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

// 	const started = !!summary?.started;
// 	const canCall = started && history.length < 75;
// 	const canUndo = started && history.length > 0;

// 	const start = () => code && getSocket().emit("host:start", { code, hostKey });
// 	const endRound = () => code && getSocket().emit("host:end_round", { code, hostKey });
// 	const callNext = () => code && getSocket().emit("host:call_next", { code, hostKey });
// 	const undo = () => code && getSocket().emit("host:undo", { code, hostKey });
// 	const doDelete = () => {
// 		if (!code) return;
// 		if (!confirm(`Delete room ${code}? Players will be disconnected.`)) return;
// 		getSocket().emit("host:delete_room", { code, hostKey }, (r: any) => {
// 			if (r?.ok) {
// 				toast.success("Room deleted");
// 				setSummary(null);
// 				setHistory([]);
// 			} else toast.error("Delete failed");
// 		});
// 	};

// 	const joinUrl = typeof window !== "undefined" && code ? `${window.location.origin}/play/${code}` : code || "JOIN";

// 	// compact paging for called numbers
// 	const pageSize = 36;
// 	const pages = Math.max(1, Math.ceil(history.length / pageSize));
// 	const [page, setPage] = useState(0);
// 	const pageItems = useMemo(() => {
// 		const start = Math.max(0, history.length - (page + 1) * pageSize);
// 		const end = history.length - page * pageSize;
// 		return history.slice(start, end);
// 	}, [history, page]);

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
// 							className='rounded-2xl bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700 w-full sm:w-auto'
// 							onClick={createRoom}>
// 							Create Room
// 						</button>
// 					</div>
// 					<ResumeRoom onResume={resumeRoom} />
// 				</div>
// 			)}

// 			{summary && (
// 				<>
// 					{/* Top strip: room + controls + delete */}
// 					<div className='grid gap-4 xl:grid-cols-[1fr_auto_1fr]'>
// 						<div className='card p-5'>
// 							<div className='text-sm text-slate-500'>ROOM</div>
// 							<div className='text-3xl font-bold tracking-widest'>{code}</div>
// 							<div className='text-xs text-slate-500 mt-1'>
// 								Share: <span className='font-mono'>/play/{code}</span>
// 							</div>

// 							<div className='mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3'>
// 								<button
// 									className='rounded-2xl px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-600'
// 									onClick={start}
// 									disabled={started}
// 									title={started ? "Round already started" : "Start a new round"}>
// 									Start
// 								</button>
// 								<button
// 									className='rounded-2xl px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed bg-rose-600'
// 									onClick={endRound}
// 									disabled={!started}
// 									title={!started ? "No active round" : "End current round"}>
// 									Stop
// 								</button>
// 								<button
// 									className='rounded-2xl px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600'
// 									onClick={callNext}
// 									disabled={!canCall}>
// 									Call Next
// 								</button>
// 								<button
// 									className='rounded-2xl px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed bg-slate-200'
// 									onClick={undo}
// 									disabled={!canUndo}>
// 									Undo
// 								</button>
// 								<button
// 									className='rounded-2xl px-4 py-3 bg-white border hover:bg-slate-50 col-span-2 sm:col-span-4'
// 									onClick={doDelete}>
// 									Delete Room
// 								</button>
// 							</div>
// 						</div>

// 						<div className='card p-5 grid place-items-center'>
// 							<div className='text-xs uppercase tracking-widest text-slate-500 mb-2'>Scan to join</div>
// 							<div className='rounded-2xl border p-3 bg-white'>
// 								<QRCode value={joinUrl} size={132} />
// 							</div>
// 						</div>

// 						<div className='card p-5 grid place-items-center'>
// 							<div className='text-xs uppercase tracking-widest text-slate-500 mb-2'>Last Number</div>
// 							<LottoBall value={lastCalled ?? "—"} size='xl' glow />
// 						</div>
// 					</div>

// 					{/* Middle: pattern + policies + recent numbers */}
// 					<div className='grid gap-6 lg:grid-cols-[1fr,1fr]'>
// 						<div className='card p-5 space-y-4'>
// 							<div className='text-sm font-semibold'>Win pattern</div>
// 							<PatternPicker
// 								value={summary.pattern}
// 								onChange={p => getSocket().emit("host:set_pattern", { code, hostKey, pattern: p })}
// 								disabled={started}
// 							/>
// 							<div className='grid gap-3 sm:grid-cols-3'>
// 								<Toggle
// 									checked={summary.allowAutoMark}
// 									onChange={v =>
// 										getSocket().emit("host:set_allow_automark", { code, hostKey, allow: v })
// 									}
// 									label='Allow auto-mark'
// 								/>
// 								<Toggle
// 									checked={summary.lockLobbyOnStart}
// 									onChange={v =>
// 										getSocket().emit("host:set_lock_on_start", { code, hostKey, lockOnStart: v })
// 									}
// 									label='Lock on start'
// 								/>
// 								<Toggle
// 									checked={summary.locked}
// 									onChange={v => getSocket().emit("host:set_locked", { code, hostKey, locked: v })}
// 									label='Locked now'
// 								/>
// 							</div>
// 						</div>

// 						<div className='card p-5'>
// 							<div className='flex items-center justify-between mb-3'>
// 								<div className='text-sm font-semibold'>Called numbers ({history.length})</div>
// 								{pages > 1 && (
// 									<div className='flex gap-2 items-center'>
// 										<button
// 											className='rounded-2xl px-3 py-2 bg-white border hover:bg-slate-50'
// 											onClick={() => setPage(p => Math.min(p + 1, pages - 1))}>
// 											Prev
// 										</button>
// 										<button
// 											className='rounded-2xl px-3 py-2 bg-white border hover:bg-slate-50'
// 											onClick={() => setPage(p => Math.max(p - 1, 0))}>
// 											Next
// 										</button>
// 										<span className='text-xs text-slate-600'>
// 											Page {pages - page}/{pages}
// 										</span>
// 									</div>
// 								)}
// 							</div>
// 							<div className='flex flex-wrap gap-3'>
// 								{[...pageItems].reverse().map((n, i) => (
// 									<LottoBall key={`${n}-${i}-${page}`} value={n} size='lg' />
// 								))}
// 							</div>
// 						</div>
// 					</div>

// 					{/* Bottom: Players + Winners */}
// 					<div className='grid gap-6 xl:grid-cols-2'>
// 						<div className='card p-5'>
// 							<div className='text-sm font-semibold mb-2'>Players ({summary.players.length})</div>
// 							{summary.players.length === 0 ? (
// 								<div className='text-sm text-slate-500'>No players yet.</div>
// 							) : (
// 								<ul className='grid sm:grid-cols-2 lg:grid-cols-3 gap-2'>
// 									{summary.players.map(p => (
// 										<li
// 											key={p.id}
// 											className='flex items-center justify-between rounded-xl border px-3 py-2 bg-white'>
// 											<div className='min-w-0'>
// 												<div className='flex items-center gap-2'>
// 													<span
// 														aria-hidden
// 														className='inline-block h-2.5 w-2.5 rounded-full'
// 														style={{ background: colorFromId(p.id) }}
// 													/>
// 													<span className='truncate'>{p.name}</span>
// 												</div>
// 												<div className='text-[11px] text-slate-500 font-mono'>
// 													#{shortId(p.id)}
// 												</div>
// 											</div>
// 											<span className='text-xs text-slate-600'>{p.cards} card(s)</span>
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
// 											className='flex items-center justify-between rounded-xl border px-3 py-2 bg-white'>
// 											<div className='min-w-0'>
// 												<div className='flex items-center gap-2'>
// 													<span
// 														aria-hidden
// 														className='inline-block h-2.5 w-2.5 rounded-full'
// 														style={{ background: colorFromId(w.playerId) }}
// 													/>
// 													<span className='font-semibold truncate'>{w.name}</span>
// 													<span className='text-xs text-slate-500'>({w.pattern})</span>
// 												</div>
// 												<div className='text-[11px] text-slate-500 font-mono'>
// 													#{shortId(w.playerId)}
// 												</div>
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
import Link from "next/link";
import toast from "react-hot-toast";
import { getSocket } from "@/app/lib/socket";
import QRCode from "react-qr-code";
import LottoBall from "@/app/components/LottoBall";
import Toggle from "@/app/components/Toggle";
import PatternPicker from "@/app/components/PatternPicker";
import ResumeRoom from "@/app/components/ResumeRoom";
import { sfx, burstConfetti } from "@/app/lib/sfx";

type PatternType = "line" | "x" | "plus" | "blackout" | "corners" | "t" | "l";
type PlayerLite = { id: string; name: string; cards: number };
type WinnerLite = { playerId: string; name: string; pattern: string; at: number; cardIndex: number };

type Summary = {
	code: string;
	started: boolean;
	paused?: boolean;
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
type RoomWatchResponse = { ok?: boolean; summary?: Summary };
type OkResponse = { ok?: boolean };

const LS_KEY = "bingo_host_rooms";

const saveHostRoom = (entry: HostRoom) => {
	const list: HostRoom[] = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
	const exists = list.some(x => x.code === entry.code);
	const next = exists ? list.map(x => (x.code === entry.code ? entry : x)) : [...list, entry];
	localStorage.setItem(LS_KEY, JSON.stringify(next));
};

const removeSavedHostRoom = (code: string) => {
	const list: HostRoom[] = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
	localStorage.setItem(LS_KEY, JSON.stringify(list.filter(room => room.code !== code)));
};

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

		s.on("game:called", ({ history }: { history: number[] }) => {
			setHistory(history);
			sfx.play("call");
		});

		s.on("game:undo", ({ history }: { history: number[] }) => {
			setHistory(history);
			sfx.play("undo");
		});

		s.on("game:started", () => {
			setHistory([]);
			sfx.play("start");
			burstConfetti(0.5);
			toast("New round started", { icon: "🎬" });
		});

		s.on("game:ended", () => {
			sfx.play("end");
			toast("Round ended", { icon: "⏹️" });
		});

		s.on("game:winner", () => {
			sfx.play("winner");
			burstConfetti(1);
		});

		s.on("room:deleted", () => {
			setSummary(null);
			setHistory([]);
			sfx.play("error");
			toast("Room deleted", { icon: "🗑️" });
		});

		return () => {
			s.off("room:updated");
			s.off("game:called");
			s.off("game:undo");
			s.off("game:started");
			s.off("game:ended");
			s.off("game:winner");
			s.off("room:deleted");
		};
	}, []);

	const createRoom = () => {
		sfx.play("click");

		getSocket().emit("host:create_room", null, (res: { code: string; seed: number; hostKey: string }) => {
			saveHostRoom({ code: res.code, hostKey: res.hostKey });

			setHostKey(res.hostKey);

			toast.success(`Room ${res.code} created`);

			getSocket().emit("room:watch", res.code, (r: RoomWatchResponse) => {
				if (r?.ok && r.summary) setSummary(r.summary);
			});
		});
	};

	const resumeRoom = (entry: HostRoom) => {
		sfx.play("click");

		getSocket().emit("room:watch", entry.code, (r: RoomWatchResponse) => {
			if (!r?.ok) {
				sfx.play("error");
				return toast.error("Room not found (maybe cleared)");
			}

			if (!r.summary) return toast.error("Room details could not be loaded");
			setSummary(r.summary);
			setHostKey(entry.hostKey);
			toast.success(`Resumed room ${entry.code}`);
		});
	};

	const code = summary?.code ?? "";
	const lastCalled = history.length ? history[history.length - 1] : null;

	const started = !!summary?.started;
	const paused = !!summary?.paused;
	const canCall = started && !paused && history.length < 75;
	const canUndo = started && !paused && history.length > 0;

	const start = () => {
		sfx.play("click");
		if (code) getSocket().emit("host:start", { code, hostKey });
	};

	const endRound = () => {
		sfx.play("click");
		if (code) getSocket().emit("host:end_round", { code, hostKey });
	};

	const callNext = () => {
		sfx.play("click");
		if (code) getSocket().emit("host:call_next", { code, hostKey });
	};

	const undo = () => {
		sfx.play("click");
		if (code) getSocket().emit("host:undo", { code, hostKey });
	};

	const doDelete = () => {
		if (!code) return;

		if (!confirm(`Delete room ${code}? Players will be disconnected.`)) return;

		sfx.play("click");

		getSocket().emit("host:delete_room", { code, hostKey }, (r: OkResponse) => {
			if (r?.ok) {
				toast.success("Room deleted");
				removeSavedHostRoom(code);
				setSummary(null);
				setHistory([]);
			} else {
				sfx.play("error");
				toast.error("Delete failed");
			}
		});
	};

	const joinUrl = typeof window !== "undefined" && code ? `${window.location.origin}/play/${code}` : code || "JOIN";
	const copyJoinLink = async () => {
		try {
			await navigator.clipboard.writeText(joinUrl);
			toast.success("Join link copied");
		} catch {
			toast.error("Could not copy the link");
		}
	};

	const pageSize = 36;
	const pages = Math.max(1, Math.ceil(history.length / pageSize));

	const [page, setPage] = useState(0);

	const pageItems = useMemo(() => {
		const start = Math.max(0, history.length - (page + 1) * pageSize);
		const end = history.length - page * pageSize;

		return history.slice(start, end);
	}, [history, page]);

	return (
		<section className='space-y-7'>
			<header className='grid gap-5 py-2 md:grid-cols-[1fr_auto] md:items-end'>
				<div>
					<p className='eyebrow mb-2'>Game control</p>
					<h1 className='page-title'>Host console.</h1>
					<p className='page-copy mt-3 max-w-2xl'>Create a room, invite players, choose the winning pattern, and run the round from one place.</p>
				</div>
				<Link href='/' className='btn-secondary w-fit'>← Back home</Link>
			</header>

			{!summary ? (
				<div className='grid gap-6 lg:grid-cols-[.72fr_1.28fr]'>
					<div className='card overflow-hidden'>
						<div className='bg-[#17181c] p-6 text-white sm:p-7'>
							<p className='text-xs font-black uppercase tracking-[.16em] text-white/50'>New game</p>
							<h2 className='mt-2 text-2xl font-black'>Start fresh</h2>
							<p className='mt-2 text-sm leading-relaxed text-white/65'>Create an empty lobby and get a shareable room code instantly.</p>
						</div>
						<div className='p-6 sm:p-7'>
							<div className='mb-5 flex gap-3'>
								<div className='grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 font-black text-[#ef2b2d]'>1</div>
								<div><p className='font-bold'>Create your lobby</p><p className='text-sm text-slate-500'>Then share the code or QR with everyone.</p></div>
							</div>
							<button type='button' className='btn-primary w-full' onClick={createRoom}>Create a room <span aria-hidden>→</span></button>
						</div>
					</div>
					<ResumeRoom onResume={resumeRoom} />
				</div>
			) : (
				<>
					<div className='grid gap-5 xl:grid-cols-[1.2fr_.7fr_.55fr]'>
						<div className='card overflow-hidden'>
							<div className='flex flex-col gap-5 bg-[#17181c] p-6 text-white sm:p-7'>
								<div className='flex flex-wrap items-start justify-between gap-4'>
									<div><p className='text-xs font-black uppercase tracking-[.16em] text-white/45'>Room code</p><div className='mt-2 font-mono text-4xl font-black tracking-[.18em] sm:text-5xl'>{code}</div></div>
									<span className='status-pill border-white/10 bg-white/10 text-white'><span className={`status-dot ${paused ? "bg-amber-400" : started ? "bg-emerald-400" : "bg-slate-400"}`} />{paused ? "Winner found" : started ? "Round live" : "Lobby open"}</span>
								</div>
								<div className='flex flex-col gap-2 sm:flex-row'>
									<button type='button' onClick={copyJoinLink} className='min-h-11 rounded-xl bg-white px-4 text-sm font-black text-[#17181c] hover:bg-white/90'>Copy join link</button>
									<a href={`/play/${code}`} className='inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-4 text-sm font-bold text-white hover:bg-white/10'>Open player view</a>
								</div>
							</div>
							<div className='grid grid-cols-2 gap-3 p-5 sm:grid-cols-4 sm:p-6'>
								<button type='button' className='btn-success' onClick={start} disabled={started}>Start round</button>
								<button type='button' className='btn-primary' onClick={callNext} disabled={!canCall}>Call next</button>
								<button type='button' className='btn-secondary' onClick={undo} disabled={!canUndo}>Undo call</button>
								<button type='button' className='btn-danger' onClick={endRound} disabled={!started}>End round</button>
							</div>
						</div>

						<div className='card grid place-items-center p-5 text-center sm:p-6'>
							<div><p className='metric-label mb-3'>Scan to join</p><div className='rounded-2xl border border-[#e8e4df] bg-white p-3 shadow-sm'><QRCode value={joinUrl} size={140} /></div><p className='mt-3 text-xs text-slate-500'>Point any phone camera here</p></div>
						</div>

						<div className='card grid place-items-center p-5 text-center sm:p-6'>
							<div><p className='metric-label mb-3'>Last number</p><LottoBall value={lastCalled ?? "—"} size='xl' glow /><p className='mt-3 text-xs font-bold text-slate-500'>{history.length} of 75 called</p></div>
						</div>
					</div>

					<div className='grid gap-6 lg:grid-cols-[1.08fr_.92fr]'>
						<div className='card p-5 sm:p-7'>
							<div className='mb-5'><p className='metric-label'>Game rules</p><h2 className='mt-1 text-xl font-black'>Winning pattern</h2><p className='mt-1 text-sm text-slate-500'>{started ? "Pattern changes are disabled during a round." : "Choose what players need to complete."}</p></div>
							<PatternPicker value={summary.pattern} onChange={pattern => getSocket().emit("host:set_pattern", { code, hostKey, pattern })} disabled={started} />
							<div className='mt-6 grid gap-3 border-t border-[#e8e4df] pt-5 sm:grid-cols-3'>
								<Toggle checked={summary.allowAutoMark} onChange={allow => getSocket().emit("host:set_allow_automark", { code, hostKey, allow })} label='Allow auto-mark' />
								<Toggle checked={summary.lockLobbyOnStart} onChange={lockOnStart => getSocket().emit("host:set_lock_on_start", { code, hostKey, lockOnStart })} label='Lock when round starts' />
								<Toggle checked={summary.locked} onChange={locked => getSocket().emit("host:set_locked", { code, hostKey, locked })} label='Lock lobby now' />
							</div>
						</div>

						<div className='card p-5 sm:p-7'>
							<div className='mb-5 flex flex-wrap items-center justify-between gap-3'>
								<div><p className='metric-label'>Draw history</p><h2 className='mt-1 text-xl font-black'>Called numbers <span className='text-slate-400'>({history.length})</span></h2></div>
								{pages > 1 && <div className='flex items-center gap-2'><button type='button' className='btn-secondary min-h-9 px-3 py-1 text-xs' onClick={() => { sfx.play("click"); setPage(current => Math.min(current + 1, pages - 1)); }}>Older</button><button type='button' className='btn-secondary min-h-9 px-3 py-1 text-xs' onClick={() => { sfx.play("click"); setPage(current => Math.max(current - 1, 0)); }}>Newer</button><span className='text-xs text-slate-500'>{pages - page}/{pages}</span></div>}
							</div>
							{pageItems.length === 0 ? <div className='empty-state'>Called numbers will appear here once the round begins.</div> : <div className='flex flex-wrap gap-3'>{[...pageItems].reverse().map((number, index) => <LottoBall key={`${number}-${index}-${page}`} value={number} size='lg' />)}</div>}
						</div>
					</div>

					<div className='grid gap-6 xl:grid-cols-2'>
						<div className='card p-5 sm:p-7'>
							<div className='mb-4 flex items-center justify-between'><div><p className='metric-label'>Lobby</p><h2 className='mt-1 text-xl font-black'>Players</h2></div><span className='status-pill'>{summary.players.length} connected</span></div>
							{summary.players.length === 0 ? <div className='empty-state'>Waiting for players to join with code <strong>{code}</strong>.</div> : <ul className='grid gap-2 sm:grid-cols-2'>{summary.players.map(player => <li key={player.id} className='flex items-center justify-between rounded-2xl border border-[#e8e4df] bg-[#fbfaf8] px-4 py-3'><div className='flex min-w-0 items-center gap-3'><span className='h-3 w-3 shrink-0 rounded-full' style={{ background: colorFromId(player.id) }} /><div className='min-w-0'><div className='truncate font-bold'>{player.name}</div><div className='font-mono text-[11px] text-slate-500'>#{shortId(player.id)}</div></div></div><span className='text-xs font-bold text-slate-500'>{player.cards} card{player.cards === 1 ? "" : "s"}</span></li>)}</ul>}
						</div>

						<div className='card p-5 sm:p-7'>
							<div className='mb-4 flex items-center justify-between'><div><p className='metric-label'>Results</p><h2 className='mt-1 text-xl font-black'>Winners</h2></div><span className='status-pill'>{summary.winners.length} total</span></div>
							{summary.winners.length === 0 ? <div className='empty-state'>No winners yet. Good luck, everyone!</div> : <ul className='space-y-2'>{summary.winners.map((winner, index) => <li key={winner.playerId + index} className='flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3'><div className='flex min-w-0 items-center gap-3'><span className='text-xl' aria-hidden>★</span><div className='min-w-0'><div className='truncate font-black'>{winner.name}</div><div className='text-xs text-slate-500'>{winner.pattern} · #{shortId(winner.playerId)}</div></div></div><span className='text-xs font-bold text-slate-600'>after {winner.at} calls</span></li>)}</ul>}
						</div>
					</div>

					<div className='flex justify-end border-t border-[#e8e4df] pt-6'>
						<button type='button' onClick={doDelete} className='btn-danger min-h-10 px-4 py-2 text-sm'>Delete room from server</button>
					</div>
				</>
			)}
		</section>
	);
}
