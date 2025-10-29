// "use client";

// import { useParams } from "next/navigation";
// import { useEffect, useMemo, useRef, useState } from "react";
// import { getSocket, waitForConnected } from "@/app/lib/socket";
// import { getClientId } from "@/app/lib/clientId";
// import BingoCard from "@/app/components/BingoCard";
// import LottoBall from "@/app/components/LottoBall";
// import Toggle from "@/app/components/Toggle";
// import toast from "react-hot-toast";

// type PatternType = "line" | "x" | "plus" | "blackout" | "corners" | "t" | "l";

// function colorFromId(id: string) {
// 	let h = 0;
// 	for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
// 	return `hsl(${h} 85% 45%)`;
// }
// function shortId(id: string) {
// 	return id.slice(-4).toUpperCase();
// }

// export default function PlayerPage() {
// 	const params = useParams<{ code: string }>();
// 	const code = (params.code || "").toString().toUpperCase();
// 	const clientId = getClientId();

// 	const [name, setName] = useState("");
// 	const [joined, setJoined] = useState(false);
// 	const [stickyName, setStickyName] = useState<string>("");

// 	const [cards, setCards] = useState<number[][][]>([]);
// 	const [activeCard, setActiveCard] = useState(0);
// 	const [history, setHistory] = useState<number[]>([]);
// 	const [allowAutoMark, setAllowAutoMark] = useState(true);
// 	const [autoMark, setAutoMark] = useState(true);
// 	const [marks, setMarks] = useState<[number, number][][]>([]);
// 	const [desiredCards, setDesiredCards] = useState(1);
// 	const [locked, setLocked] = useState(false);

// 	const [pattern, setPattern] = useState<PatternType>("line");
// 	const [players, setPlayers] = useState<{ id: string; name: string; cards: number }[]>([]);
// 	const [winners, setWinners] = useState<
// 		{ playerId: string; name: string; pattern: string; at: number; cardIndex: number }[]
// 	>([]);
// 	const [started, setStarted] = useState(false);

// 	const [waitingMsg, setWaitingMsg] = useState<string>("");
// 	const [roomList, setRoomList] = useState<any[] | null>(null); // optional discovery

// 	const calledSet = useMemo(() => new Set(history), [history]);
// 	const retryRef = useRef<number>(0);

// 	// keep marks size synced
// 	useEffect(() => {
// 		setMarks(prev => {
// 			if (prev.length === cards.length) return prev;
// 			return cards.map((_, i) => prev[i] ?? []);
// 		});
// 	}, [cards.length]);

// 	useEffect(() => {
// 		const socket = getSocket();

// 		const onRoomUpdated = (summary: any) => {
// 			if (typeof summary.allowAutoMark === "boolean") {
// 				setAllowAutoMark(summary.allowAutoMark);
// 				if (!summary.allowAutoMark) setAutoMark(false);
// 			}
// 			if (typeof summary.locked === "boolean") setLocked(summary.locked);
// 			if (typeof summary.pattern === "string") setPattern(summary.pattern);
// 			if (Array.isArray(summary.players)) setPlayers(summary.players);
// 			if (Array.isArray(summary.winners)) setWinners(summary.winners);
// 			if (typeof summary.started === "boolean") setStarted(summary.started);
// 		};

// 		const onStarted = () => {
// 			setHistory([]);
// 			setWinners([]);
// 			setStarted(true);
// 			// marks will be reset by player:new_round event
// 			toast("New round!", { icon: "🎬" });
// 		};

// 		const onCalled = ({ n, history }: { n: number; history: number[] }) => {
// 			setHistory(history);
// 			toast(`Called: ${n}`, { icon: "🔔", duration: 900 });
// 		};

// 		const onUndo = ({ history }: { history: number[] }) => {
// 			setHistory(history);
// 			toast("Host undid last call", { icon: "↩️", duration: 900 });
// 		};

// 		const onWinner = (w: any) => {
// 			setWinners(prev => (prev.some(x => x.playerId === w.playerId) ? prev : [...prev, w]));
// 			toast.success(`🎉 ${w.name} has BINGO! (${w.pattern})`);
// 		};

// 		const onActiveCard = (idx: number) => setActiveCard(idx);

// 		const onMarksCorrected = (payload: { cardIndex: number; marks: [number, number][] }) => {
// 			setMarks(prev => {
// 				const next = prev.slice();
// 				next[payload.cardIndex] = payload.marks;
// 				return next;
// 			});
// 			toast("Incorrect marks cleared on this card", { icon: "🧹", duration: 1500 });
// 		};

// 		const onNewRound = (payload: { cards: number[][][]; activeCard: number; roundId: number }) => {
// 			setCards(payload.cards);
// 			setActiveCard(payload.activeCard ?? 0);
// 			setMarks(payload.cards.map(() => []));
// 			setHistory([]);
// 		};

// 		socket.on("room:updated", onRoomUpdated);
// 		socket.on("room:winners", setWinners);
// 		socket.on("policy:allow_automark", (v: boolean) => {
// 			setAllowAutoMark(v);
// 			if (!v) setAutoMark(false);
// 		});
// 		socket.on("policy:locked", setLocked);
// 		socket.on("game:started", onStarted);
// 		socket.on("game:called", onCalled);
// 		socket.on("game:undo", onUndo);
// 		socket.on("game:winner", onWinner);
// 		socket.on("player:active_card", onActiveCard);
// 		socket.on("player:marks_corrected", onMarksCorrected);
// 		socket.on("player:new_round", onNewRound);
// 		socket.on("room:deleted", () => {
// 			setJoined(false);
// 			setCards([]);
// 			setHistory([]);
// 			setWinners([]);
// 			toast("Room was deleted by host.", { icon: "🗑️" });
// 		});

// 		return () => {
// 			socket.off("room:updated", onRoomUpdated);
// 			socket.off("room:winners", setWinners);
// 			socket.off("policy:allow_automark");
// 			socket.off("policy:locked");
// 			socket.off("game:started", onStarted);
// 			socket.off("game:called", onCalled);
// 			socket.off("game:undo", onUndo);
// 			socket.off("game:winner", onWinner);
// 			socket.off("player:active_card", onActiveCard);
// 			socket.off("player:marks_corrected", onMarksCorrected);
// 			socket.off("player:new_round", onNewRound);
// 			socket.off("room:deleted");
// 		};
// 	}, []);

// 	// Pre-join: watch room; also let user discover rooms (optional)
// 	useEffect(() => {
// 		(async () => {
// 			const socket = getSocket();
// 			await waitForConnected(socket);

// 			const tryWatch = () => {
// 				socket.emit("room:watch", code, (res: any) => {
// 					if (res?.ok && res.summary) {
// 						setWaitingMsg("");
// 						return;
// 					}
// 					const attempt = ++retryRef.current;
// 					const delay = Math.min(500 * 2 ** (attempt - 1), 5000);
// 					setWaitingMsg("Waiting for host to create the room…");
// 					setTimeout(tryWatch, delay);
// 				});
// 			};

// 			socket.emit("room:exists", code, (res: any) => {
// 				if (!res?.ok) setWaitingMsg("Waiting for host to create the room…");
// 				tryWatch();
// 			});
// 		})();
// 	}, [code]);

// 	const join = () => {
// 		if (!name.trim() && !stickyName) return toast.error("Enter your name");
// 		getSocket().emit(
// 			"player:join",
// 			{
// 				code,
// 				name: stickyName || name.trim(),
// 				clientId,
// 				cardCount: desiredCards,
// 				autoMark,
// 				manual: !autoMark,
// 				marks
// 			},
// 			(res: any) => {
// 				if (!res?.ok) return toast.error(res?.msg || "Join failed");
// 				setCards(res.cards || []);
// 				setJoined(true);
// 				if (res.name) {
// 					setStickyName(res.name);
// 					setName(res.name);
// 				}
// 				if (typeof res.allowAutoMark === "boolean") {
// 					setAllowAutoMark(res.allowAutoMark);
// 					if (!res.allowAutoMark) setAutoMark(false);
// 				}
// 				if (typeof res.activeCard === "number") setActiveCard(res.activeCard);
// 				toast.success("You joined the game");
// 			}
// 		);
// 	};

// 	const claim = () => {
// 		getSocket().emit("player:claim_bingo", code, clientId, activeCard, (res: any) => {
// 			if (!res?.ok) return toast.error(res?.msg || "Not valid yet");
// 			toast("Claim sent!", { icon: "📣" });
// 		});
// 	};

// 	const toggleCell = (r: number, c: number) => {
// 		if (autoMark) return;
// 		setMarks(prev => {
// 			const next = prev.map(x => x.slice());
// 			const arr = next[activeCard] ?? [];
// 			const i = arr.findIndex(([rr, cc]) => rr === r && cc === c);
// 			if (i >= 0) arr.splice(i, 1);
// 			else if (arr.length < 25) arr.push([r, c]);
// 			next[activeCard] = arr;
// 			return next;
// 		});
// 	};

// 	const last = history.length ? history[history.length - 1] : null;

// 	const refreshRooms = () => {
// 		getSocket().emit("room:list", (res: any) => {
// 			if (res?.ok) setRoomList(res.rooms || []);
// 		});
// 	};

// 	return (
// 		<section className='space-y-5'>
// 			{/* Top: room + last number */}
// 			<div className='grid gap-3 md:grid-cols-2'>
// 				<div className='card p-4 text-center'>
// 					<div className='text-xs uppercase tracking-widest text-slate-500'>Room</div>
// 					<div className='text-2xl font-bold tracking-widest'>{code}</div>
// 					{!!(!joined && waitingMsg) && <div className='text-xs text-slate-500 mt-2'>{waitingMsg}</div>}
// 				</div>

// 				<div className='card p-4 grid place-items-center'>
// 					<div className='text-xs uppercase tracking-widest text-slate-500 mb-1'>Last Number</div>
// 					<LottoBall value={last ?? "—"} size='lg' />
// 				</div>
// 			</div>

// 			{!joined ? (
// 				<div className='card p-5 space-y-4 max-w-md mx-auto'>
// 					<input
// 						className='w-full border rounded-2xl p-3'
// 						placeholder='Your name'
// 						value={name}
// 						onChange={e => setName(e.target.value)}
// 						disabled={!!stickyName}
// 					/>
// 					{stickyName && (
// 						<div className='text-xs text-slate-500'>
// 							Name is locked for this room as <span className='font-semibold'>{stickyName}</span>.
// 						</div>
// 					)}

// 					<div className='flex items-center justify-between gap-2'>
// 						<label className='text-sm text-slate-600'>Number of cards</label>
// 						<select
// 							className='border rounded-xl p-2'
// 							value={desiredCards}
// 							onChange={e => setDesiredCards(Math.max(1, Math.min(4, Number(e.target.value))))}
// 							disabled={stickyName !== ""}>
// 							{[1, 2, 3, 4].map(n => (
// 								<option key={n} value={n}>
// 									{n}
// 								</option>
// 							))}
// 						</select>
// 					</div>

// 					<Toggle
// 						checked={autoMark}
// 						onChange={v => setAutoMark(v)}
// 						disabled={!allowAutoMark}
// 						label='Auto-mark tiles when numbers are called'
// 					/>

// 					<button
// 						className='w-full rounded-2xl px-5 py-3 text-lg text-white bg-gradient-to-br from-indigo-500 to-indigo-700 hover:opacity-95 shadow-sm disabled:opacity-50'
// 						onClick={join}
// 						disabled={locked && !stickyName}>
// 						Join Game
// 					</button>

// 					{/* OPTIONAL: discover rooms */}
// 					<div className='pt-2 border-t mt-2'>
// 						<button
// 							onClick={refreshRooms}
// 							className='w-full rounded-2xl px-4 py-2 bg-white border hover:bg-slate-50'>
// 							Refresh: See available rooms
// 						</button>
// 						{roomList && (
// 							<ul className='mt-2 space-y-2'>
// 								{roomList.map(r => (
// 									<li key={r.code} className='rounded-xl border p-3 bg-white'>
// 										<div className='flex items-center justify-between gap-2 flex-wrap'>
// 											<div>
// 												<div className='font-mono font-semibold'>{r.code}</div>
// 												<div className='text-xs text-slate-500'>
// 													{r.players?.length ?? 0} player(s) •{" "}
// 													{r.started ? "Started" : "Waiting"} • {r.locked ? "Locked" : "Open"}
// 												</div>
// 											</div>
// 											<a
// 												className='rounded-2xl px-3 py-1 bg-indigo-600 text-white'
// 												href={`/play/${r.code}`}>
// 												Join
// 											</a>
// 										</div>
// 									</li>
// 								))}
// 							</ul>
// 						)}
// 					</div>
// 				</div>
// 			) : (
// 				<>
// 					{/* Status strip: pattern, players, winners */}
// 					<div className='card p-3 grid gap-3 sm:grid-cols-3'>
// 						<div className='text-sm'>
// 							<div className='text-[11px] text-slate-500'>Pattern</div>
// 							<div className='font-semibold uppercase'>{pattern}</div>
// 						</div>
// 						<div className='text-sm'>
// 							<div className='text-[11px] text-slate-500'>Players ({players.length})</div>
// 							<div className='flex flex-wrap gap-2 mt-1'>
// 								{players.slice(0, 10).map(p => (
// 									<span key={p.id} className='px-2 py-0.5 rounded-full border bg-white text-xs'>
// 										<span
// 											aria-hidden
// 											className='inline-block h-2 w-2 rounded-full mr-1'
// 											style={{ background: colorFromId(p.id) }}
// 										/>
// 										{p.name}
// 									</span>
// 								))}
// 								{players.length > 10 && (
// 									<span className='text-xs text-slate-500'>+{players.length - 10} more</span>
// 								)}
// 							</div>
// 						</div>
// 						<div className='text-sm'>
// 							<div className='text-[11px] text-slate-500'>Winners</div>
// 							{winners.length === 0 ? (
// 								<div className='text-xs text-slate-500'>None yet</div>
// 							) : (
// 								<div className='flex flex-wrap gap-2 mt-1'>
// 									{winners.map((w, i) => (
// 										<span
// 											key={w.playerId + i}
// 											className='px-2 py-0.5 rounded-full border bg-emerald-50 text-xs'>
// 											{w.name} ({w.pattern})
// 										</span>
// 									))}
// 								</div>
// 							)}
// 						</div>
// 					</div>

// 					{/* Card switcher */}
// 					{cards.length > 1 && (
// 						<div className='card p-3 flex gap-2 flex-wrap'>
// 							{cards.map((_, i) => (
// 								<button
// 									key={i}
// 									className={`px-3 py-1 rounded-2xl border ${
// 										i === activeCard ? "bg-indigo-600 text-white border-indigo-700" : "bg-white"
// 									}`}
// 									onClick={() => {
// 										setActiveCard(i);
// 										getSocket().emit("player:switch_card", code, clientId, i);
// 									}}>
// 									Card {i + 1}
// 								</button>
// 							))}
// 						</div>
// 					)}

// 					{/* Card + Controls */}
// 					<div className='grid gap-5 lg:grid-cols-[minmax(260px,420px),1fr]'>
// 						<div className='card p-4'>
// 							<BingoCard
// 								card={cards[activeCard]}
// 								calledSet={calledSet}
// 								manual={!autoMark}
// 								marks={marks[activeCard] ?? []}
// 								onToggle={toggleCell}
// 							/>
// 							<div className='flex justify-between items-center gap-2 mt-4'>
// 								<Toggle
// 									checked={autoMark}
// 									onChange={v => setAutoMark(v)}
// 									disabled={!allowAutoMark}
// 									label='Auto-mark'
// 								/>
// 								<button
// 									className='rounded-2xl px-5 py-3 text-lg text-white bg-gradient-to-br from-emerald-500 to-emerald-700 hover:opacity-95 shadow-sm'
// 									onClick={claim}>
// 									Claim BINGO!
// 								</button>
// 							</div>
// 						</div>

// 						<div className='card p-4'>
// 							<div className='text-slate-600 text-sm mb-2'>Called numbers ({history.length})</div>
// 							<div className='flex flex-wrap gap-3'>
// 								{history
// 									.slice(-60)
// 									.reverse()
// 									.map((n, i) => (
// 										<LottoBall key={`${n}-${i}`} value={n} size='lg' />
// 									))}
// 							</div>
// 						</div>
// 					</div>
// 				</>
// 			)}
// 		</section>
// 	);
// }

// app/play/[code]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getSocket, waitForConnected } from "@/app/lib/socket";
import { getClientId } from "@/app/lib/clientId";
import BingoCard from "@/app/components/BingoCard";
import LottoBall from "@/app/components/LottoBall";
import Toggle from "@/app/components/Toggle";
import toast from "react-hot-toast";

type PatternType = "line" | "x" | "plus" | "blackout" | "corners" | "t" | "l";

function colorFromId(id: string) {
	let h = 0;
	for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
	return `hsl(${h} 85% 45%)`;
}
function shortId(id: string) {
	return id.slice(-4).toUpperCase();
}

export default function PlayerPage() {
	const params = useParams<{ code: string }>();
	const code = (params.code || "").toString().toUpperCase();
	const clientId = getClientId();

	const [name, setName] = useState("");
	const [joined, setJoined] = useState(false);
	const [stickyName, setStickyName] = useState<string>("");

	const [cards, setCards] = useState<number[][][]>([]);
	const [activeCard, setActiveCard] = useState(0);
	const [history, setHistory] = useState<number[]>([]);
	const [allowAutoMark, setAllowAutoMark] = useState(true);
	const [autoMark, setAutoMark] = useState(true);
	const [marks, setMarks] = useState<[number, number][][]>([]);
	const [desiredCards, setDesiredCards] = useState(1);
	const [locked, setLocked] = useState(false);

	const [pattern, setPattern] = useState<PatternType>("line");
	const [players, setPlayers] = useState<{ id: string; name: string; cards: number }[]>([]);
	const [winners, setWinners] = useState<
		{ playerId: string; name: string; pattern: string; at: number; cardIndex: number }[]
	>([]);
	const [started, setStarted] = useState(false);
	const [paused, setPaused] = useState(false);

	const [waitingMsg, setWaitingMsg] = useState<string>("");

	const calledSet = useMemo(() => new Set(history), [history]);
	const retryRef = useRef<number>(0);

	// keep marks size synced
	useEffect(() => {
		setMarks(prev => (prev.length === cards.length ? prev : cards.map((_, i) => prev[i] ?? [])));
	}, [cards.length]);

	useEffect(() => {
		const socket = getSocket();

		const onRoomUpdated = (summary: any) => {
			if (typeof summary.allowAutoMark === "boolean") {
				setAllowAutoMark(summary.allowAutoMark);
				if (!summary.allowAutoMark) setAutoMark(false);
			}
			if (typeof summary.locked === "boolean") setLocked(summary.locked);
			if (typeof summary.pattern === "string") setPattern(summary.pattern as PatternType);
			if (Array.isArray(summary.players)) setPlayers(summary.players);
			if (Array.isArray(summary.winners)) setWinners(summary.winners);
			if (typeof summary.started === "boolean") setStarted(summary.started);
			if (typeof summary.paused === "boolean") setPaused(summary.paused);
		};

		const onStarted = () => {
			setHistory([]);
			setWinners([]);
			setStarted(true);
			setPaused(false);
			toast("New round!", { icon: "🎬" });
		};
		const onCalled = ({ n, history }: { n: number; history: number[] }) => {
			setHistory(history);
			toast(`Called: ${n}`, { icon: "🔔", duration: 900 });
		};
		const onUndo = ({ history }: { history: number[] }) => {
			setHistory(history);
			toast("Host undid last call", { icon: "↩️", duration: 900 });
		};
		const onWinner = (w: any) => {
			setWinners(prev => (prev.some(x => x.playerId === w.playerId) ? prev : [...prev, w]));
			toast.success(`🎉 ${w.name} has BINGO! (${w.pattern})`);
		};
		const onActiveCard = (idx: number) => setActiveCard(idx);
		const onMarksCorrected = (payload: { cardIndex: number; marks: [number, number][] }) => {
			setMarks(prev => {
				const next = prev.slice();
				next[payload.cardIndex] = payload.marks;
				return next;
			});
			toast("Incorrect marks cleared on this card", { icon: "🧹", duration: 1500 });
		};
		const onNewRound = (payload: { cards: number[][][]; activeCard: number; roundId: number }) => {
			setCards(payload.cards);
			setActiveCard(payload.activeCard ?? 0);
			setMarks(payload.cards.map(() => []));
			setHistory([]);
		};

		socket.on("room:updated", onRoomUpdated);
		socket.on("room:winners", setWinners);
		socket.on("policy:allow_automark", (v: boolean) => {
			setAllowAutoMark(v);
			if (!v) setAutoMark(false);
		});
		socket.on("policy:locked", setLocked);
		socket.on("game:started", onStarted);
		socket.on("game:called", onCalled);
		socket.on("game:undo", onUndo);
		socket.on("game:winner", onWinner);
		socket.on("player:active_card", onActiveCard);
		socket.on("player:marks_corrected", onMarksCorrected);
		socket.on("player:new_round", onNewRound);
		socket.on("room:deleted", () => {
			setJoined(false);
			setCards([]);
			setHistory([]);
			setWinners([]);
			toast("Room was deleted by host.", { icon: "🗑️" });
		});

		return () => {
			socket.off("room:updated", onRoomUpdated);
			socket.off("room:winners", setWinners);
			socket.off("policy:allow_automark");
			socket.off("policy:locked");
			socket.off("game:started", onStarted);
			socket.off("game:called", onCalled);
			socket.off("game:undo", onUndo);
			socket.off("game:winner", onWinner);
			socket.off("player:active_card", onActiveCard);
			socket.off("player:marks_corrected", onMarksCorrected);
			socket.off("player:new_round", onNewRound);
			socket.off("room:deleted");
		};
	}, []);

	// Verify room exists early
	useEffect(() => {
		(async () => {
			const socket = getSocket();
			await waitForConnected(socket);
			const tryWatch = () => {
				socket.emit("room:watch", code, (res: any) => {
					if (res?.ok && res.summary) {
						setWaitingMsg("");
						return;
					}
					const attempt = ++retryRef.current;
					const delay = Math.min(500 * 2 ** (attempt - 1), 5000);
					setWaitingMsg("Waiting for host to create the room…");
					setTimeout(tryWatch, delay);
				});
			};
			socket.emit("room:exists", code, (res: any) => {
				if (!res?.ok) setWaitingMsg("Room not found (maybe deleted)");
				tryWatch();
			});
		})();
	}, [code]);

	const join = () => {
		if (!name.trim() && !stickyName) return toast.error("Enter your name");
		getSocket().emit(
			"player:join",
			{
				code,
				name: stickyName || name.trim(),
				clientId,
				cardCount: desiredCards,
				autoMark,
				manual: !autoMark,
				marks
			},
			(res: any) => {
				if (!res?.ok) return toast.error(res?.msg || "Join failed");
				setCards(res.cards || []);
				setJoined(true);
				if (res.name) {
					setStickyName(res.name);
					setName(res.name);
				}
				if (typeof res.allowAutoMark === "boolean") {
					setAllowAutoMark(res.allowAutoMark);
					if (!res.allowAutoMark) setAutoMark(false);
				}
				if (typeof res.activeCard === "number") setActiveCard(res.activeCard);
				toast.success("You joined the game");
			}
		);
	};

	const claim = () => {
		getSocket().emit("player:claim_bingo", code, clientId, activeCard, (res: any) => {
			if (!res?.ok) return toast.error(res?.msg || "Not valid yet");
			toast("Claim sent!", { icon: "📣" });
		});
	};

	const toggleCell = (r: number, c: number) => {
		if (autoMark) return;
		setMarks(prev => {
			const next = prev.map(x => x.slice());
			const arr = next[activeCard] ?? [];
			const i = arr.findIndex(([rr, cc]) => rr === r && cc === c);
			if (i >= 0) arr.splice(i, 1);
			else if (arr.length < 25) arr.push([r, c]);
			next[activeCard] = arr;
			return next;
		});
	};

	const last = history.length ? history[history.length - 1] : null;

	return (
		<section className='space-y-5'>
			{/* Top: room + last number */}
			<div className='grid gap-3 md:grid-cols-2'>
				<div className='card p-4 text-center'>
					<div className='text-xs uppercase tracking-widest text-slate-500'>Room</div>
					<div className='text-2xl font-bold tracking-widest'>{code}</div>
					{!!(!joined && waitingMsg) && <div className='text-xs text-slate-500 mt-2'>{waitingMsg}</div>}
				</div>

				<div className='card p-4 grid place-items-center'>
					<div className='text-xs uppercase tracking-widest text-slate-500 mb-1'>Last Number</div>
					<LottoBall value={last ?? "—"} size='lg' />
				</div>
			</div>

			{!joined ? (
				<div className='card p-5 space-y-4 max-w-md mx-auto'>
					<input
						className='w-full border rounded-2xl p-3'
						placeholder='Your name'
						value={name}
						onChange={e => setName(e.target.value)}
						disabled={!!stickyName}
					/>
					{stickyName && (
						<div className='text-xs text-slate-500'>
							Name is locked for this room as <span className='font-semibold'>{stickyName}</span>.
						</div>
					)}

					<div className='flex items-center justify-between gap-2'>
						<label className='text-sm text-slate-600'>Number of cards</label>
						<select
							className='border rounded-xl p-2'
							value={desiredCards}
							onChange={e => setDesiredCards(Math.max(1, Math.min(4, Number(e.target.value))))}
							disabled={stickyName !== ""}>
							{[1, 2, 3, 4].map(n => (
								<option key={n} value={n}>
									{n}
								</option>
							))}
						</select>
					</div>

					<Toggle
						checked={autoMark}
						onChange={v => setAutoMark(v)}
						disabled={!allowAutoMark}
						label='Auto-mark tiles when numbers are called'
					/>

					<button
						className='w-full rounded-2xl px-5 py-3 text-lg text-white bg-gradient-to-br from-indigo-500 to-indigo-700 hover:opacity-95 shadow-sm disabled:opacity-50'
						onClick={join}
						disabled={locked && !stickyName}>
						Join Game
					</button>
				</div>
			) : (
				<>
					{/* Identity + status */}
					<div className='card p-3 grid gap-3 sm:grid-cols-3'>
						<div className='text-sm flex items-center gap-2'>
							<span
								aria-hidden
								className='inline-block h-2.5 w-2.5 rounded-full'
								style={{ background: colorFromId(clientId) }}
							/>
							<div>
								<div className='text-[11px] text-slate-500'>You are</div>
								<div className='font-semibold'>
									{name}{" "}
									<span className='text-xs text-slate-500 font-mono'>#{shortId(clientId)}</span>
								</div>
							</div>
						</div>
						<div className='text-sm'>
							<div className='text-[11px] text-slate-500'>Pattern</div>
							<div className='font-semibold uppercase'>{pattern}</div>
						</div>
						<div className='text-sm'>
							<div className='text-[11px] text-slate-500'>Round</div>
							<div className='font-semibold'>
								{started ? (paused ? "Paused (winner)" : "In progress") : "Waiting"}
							</div>
						</div>
					</div>

					{/* Players + Winners */}
					<div className='grid gap-4 sm:grid-cols-2'>
						<div className='card p-3'>
							<div className='text-sm font-semibold mb-1'>Players ({players.length})</div>
							<div className='flex flex-wrap gap-2'>
								{players.map(p => (
									<span
										key={p.id}
										className={`px-2 py-0.5 rounded-full border text-xs ${
											p.id === clientId ? "bg-indigo-50 border-indigo-200" : "bg-white"
										}`}>
										<span
											aria-hidden
											className='inline-block h-2 w-2 rounded-full mr-1'
											style={{ background: colorFromId(p.id) }}
										/>
										{p.name}
										{p.id === clientId && " (you)"}
									</span>
								))}
							</div>
						</div>
						<div className='card p-3'>
							<div className='text-sm font-semibold mb-1'>Winners</div>
							{winners.length === 0 ? (
								<div className='text-xs text-slate-500'>None yet</div>
							) : (
								<div className='flex flex-wrap gap-2'>
									{winners.map((w, i) => (
										<span
											key={w.playerId + i}
											className='px-2 py-0.5 rounded-full border bg-emerald-50 text-xs'>
											{w.name} ({w.pattern})
										</span>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Card + Controls */}
					<div className='grid gap-5 lg:grid-cols-[minmax(260px,420px),1fr]'>
						<div className='card p-4'>
							<BingoCard
								card={cards[activeCard]}
								calledSet={calledSet}
								manual={!autoMark}
								marks={marks[activeCard] ?? []}
								onToggle={toggleCell}
							/>
							<div className='flex justify-between items-center gap-2 mt-4'>
								<Toggle
									checked={autoMark}
									onChange={v => setAutoMark(v)}
									disabled={!allowAutoMark}
									label='Auto-mark'
								/>
								<button
									className='rounded-2xl px-5 py-3 text-lg text-white bg-gradient-to-br from-emerald-500 to-emerald-700 hover:opacity-95 shadow-sm'
									onClick={claim}
									disabled={paused}>
									{paused ? "Round Paused" : "Claim BINGO!"}
								</button>
							</div>
						</div>

						<div className='card p-4'>
							<div className='text-slate-600 text-sm mb-2'>Called numbers ({history.length})</div>
							<div className='flex flex-wrap gap-3'>
								{history
									.slice(-60)
									.reverse()
									.map((n, i) => (
										<LottoBall key={`${n}-${i}`} value={n} size='lg' />
									))}
							</div>
						</div>
					</div>
				</>
			)}
		</section>
	);
}
