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

// // app/play/[code]/page.tsx

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
// 	const [paused, setPaused] = useState(false);

// 	const [waitingMsg, setWaitingMsg] = useState<string>("");

// 	const calledSet = useMemo(() => new Set(history), [history]);
// 	const retryRef = useRef<number>(0);

// 	// keep marks size synced
// 	useEffect(() => {
// 		setMarks(prev => (prev.length === cards.length ? prev : cards.map((_, i) => prev[i] ?? [])));
// 	}, [cards.length]);

// 	useEffect(() => {
// 		const socket = getSocket();

// 		const onRoomUpdated = (summary: any) => {
// 			if (typeof summary.allowAutoMark === "boolean") {
// 				setAllowAutoMark(summary.allowAutoMark);
// 				if (!summary.allowAutoMark) setAutoMark(false);
// 			}
// 			if (typeof summary.locked === "boolean") setLocked(summary.locked);
// 			if (typeof summary.pattern === "string") setPattern(summary.pattern as PatternType);
// 			if (Array.isArray(summary.players)) setPlayers(summary.players);
// 			if (Array.isArray(summary.winners)) setWinners(summary.winners);
// 			if (typeof summary.started === "boolean") setStarted(summary.started);
// 			if (typeof summary.paused === "boolean") setPaused(summary.paused);
// 		};

// 		const onStarted = () => {
// 			setHistory([]);
// 			setWinners([]);
// 			setStarted(true);
// 			setPaused(false);
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

// 	// Verify room exists early
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
// 				if (!res?.ok) setWaitingMsg("Room not found (maybe deleted)");
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

"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getSocket, waitForConnected } from "@/app/lib/socket";
import { getClientId } from "@/app/lib/clientId";
import BingoCard from "@/app/components/BingoCard";
import LottoBall from "@/app/components/LottoBall";
import Toggle from "@/app/components/Toggle";
import toast from "react-hot-toast";
import { sfx, burstConfetti } from "@/app/lib/sfx";

type PatternType = "line" | "x" | "plus" | "blackout" | "corners" | "t" | "l";
type PlayerLite = { id: string; name: string; cards: number };
type WinnerLite = { playerId: string; name: string; pattern: string; at: number; cardIndex: number };
type RoomSummary = {
	allowAutoMark?: boolean;
	locked?: boolean;
	pattern?: PatternType;
	players?: PlayerLite[];
	winners?: WinnerLite[];
	started?: boolean;
	paused?: boolean;
};
type RoomWatchResponse = { ok?: boolean; summary?: RoomSummary };
type JoinResponse = { ok?: boolean; msg?: string; cards?: number[][][]; name?: string; allowAutoMark?: boolean; activeCard?: number };
type OkResponse = { ok?: boolean; msg?: string };

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
	const [players, setPlayers] = useState<PlayerLite[]>([]);
	const [winners, setWinners] = useState<WinnerLite[]>([]);
	const [started, setStarted] = useState(false);
	const [paused, setPaused] = useState(false);

	const [waitingMsg, setWaitingMsg] = useState<string>("");

	const calledSet = useMemo(() => new Set(history), [history]);
	const retryRef = useRef<number>(0);

	useEffect(() => {
		const socket = getSocket();

		const onRoomUpdated = (summary: RoomSummary) => {
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

			sfx.play("start");
			burstConfetti(0.4);

			toast("New round!", { icon: "🎬" });
		};

		const onCalled = ({ n, history }: { n: number; history: number[] }) => {
			setHistory(history);

			sfx.play("call");

			toast(`Called: ${n}`, { icon: "🔔", duration: 900 });
		};

		const onUndo = ({ history }: { history: number[] }) => {
			setHistory(history);

			sfx.play("undo");

			toast("Host undid last call", { icon: "↩️", duration: 900 });
		};

		const onWinner = (w: WinnerLite) => {
			setWinners(prev => (prev.some(x => x.playerId === w.playerId) ? prev : [...prev, w]));

			sfx.play("winner");
			burstConfetti(1);

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

			sfx.play("error");

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

	useEffect(() => {
		(async () => {
			const socket = getSocket();
			await waitForConnected(socket);

			const tryWatch = () => {
				socket.emit("room:watch", code, (res: RoomWatchResponse) => {
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

			socket.emit("room:exists", code, (res: OkResponse) => {
				if (!res?.ok) setWaitingMsg("Room not found (maybe deleted)");
				tryWatch();
			});
		})();
	}, [code]);

	const join = () => {
		if (!name.trim() && !stickyName) {
			sfx.play("error");
			return toast.error("Enter your name");
		}

		sfx.play("click");

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
			(res: JoinResponse) => {
				if (!res?.ok) {
					sfx.play("error");
					return toast.error(res?.msg || "Join failed");
				}

				const nextCards = res.cards || [];
				setCards(nextCards);
				setMarks(nextCards.map(() => []));
				setJoined(true);

				sfx.play("join");

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
		sfx.play("click");

		getSocket().emit("player:claim_bingo", code, clientId, activeCard, (res: OkResponse) => {
			if (!res?.ok) {
				sfx.play("error");
				return toast.error(res?.msg || "Not valid yet");
			}
			toast("Claim sent!", { icon: "📣" });
		});
	};

	const switchCard = (index: number) => {
		setActiveCard(index);
		getSocket().emit("player:switch_card", code, clientId, index);
		sfx.play("click");
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
		<section className='space-y-6'>
			<div className='grid gap-4 md:grid-cols-[1fr_auto]'>
				<div className='card flex flex-col justify-between gap-4 bg-[#17181c] p-5 text-white sm:flex-row sm:items-center sm:p-6'>
					<div><p className='text-xs font-black uppercase tracking-[.16em] text-white/45'>Room</p><div className='mt-1 font-mono text-3xl font-black tracking-[.18em]'>{code}</div>{!joined && waitingMsg && <p className='mt-2 text-xs text-amber-300'>{waitingMsg}</p>}</div>
					<span className='status-pill border-white/10 bg-white/10 text-white'><span className={`status-dot ${paused ? "bg-amber-400" : started ? "bg-emerald-400" : "bg-slate-400"}`} />{paused ? "Winner found" : started ? "Round live" : "Waiting for host"}</span>
				</div>
				<div className='card flex min-w-[180px] items-center justify-center gap-4 p-4 sm:p-5'>
					<div><p className='metric-label'>Last number</p><p className='mt-1 text-xs font-bold text-slate-500'>{history.length} called</p></div>
					<LottoBall value={last ?? "—"} size='lg' glow />
				</div>
			</div>

			{!joined ? (
				<div className='mx-auto grid max-w-4xl gap-6 py-4 lg:grid-cols-[.82fr_1.18fr]'>
					<div className='rounded-[1.4rem] bg-[#ef2b2d] p-6 text-white shadow-[0_18px_45px_rgba(201,21,33,.2)] sm:p-8'>
						<p className='text-xs font-black uppercase tracking-[.16em] text-white/65'>You&apos;re almost in</p>
						<h1 className='mt-3 text-4xl font-black leading-none tracking-tight'>Pick your cards. Bring your luck.</h1>
						<p className='mt-4 text-sm leading-relaxed text-white/80'>Choose how you want to play, then wait for the host to start the next round.</p>
						<div className='mt-8 grid grid-cols-3 gap-2 border-t border-white/20 pt-5 text-center'><div><div className='text-xl font-black'>{players.length}</div><div className='text-[10px] uppercase tracking-wider text-white/60'>Players</div></div><div><div className='text-xl font-black uppercase'>{pattern}</div><div className='text-[10px] uppercase tracking-wider text-white/60'>Pattern</div></div><div><div className='text-xl font-black'>{locked ? "Yes" : "No"}</div><div className='text-[10px] uppercase tracking-wider text-white/60'>Locked</div></div></div>
					</div>

					<div className='card p-6 sm:p-8'>
						<p className='metric-label'>Player setup</p>
						<h2 className='mt-1 text-2xl font-black'>Join room {code}</h2>
						<div className='mt-6 space-y-5'>
							<div><label htmlFor='player-name' className='mb-2 block text-sm font-bold text-slate-700'>Your name</label><input id='player-name' className='h-14 w-full rounded-2xl border px-4 text-lg font-bold' placeholder='What should we call you?' maxLength={40} value={name} onChange={event => setName(event.target.value)} disabled={!!stickyName} />{stickyName && <p className='mt-2 text-xs text-slate-500'>Returning as <strong>{stickyName}</strong> on this device.</p>}</div>
							<div><label htmlFor='card-count' className='mb-2 block text-sm font-bold text-slate-700'>Number of cards</label><select id='card-count' className='h-12 w-full rounded-xl border px-3' value={desiredCards} onChange={event => setDesiredCards(Math.max(1, Math.min(4, Number(event.target.value))))} disabled={stickyName !== ""}>{[1, 2, 3, 4].map(number => <option key={number} value={number}>{number} card{number === 1 ? "" : "s"}</option>)}</select></div>
							<div className='rounded-2xl border border-[#e8e4df] bg-[#fbfaf8] p-4'><Toggle checked={autoMark} onChange={setAutoMark} disabled={!allowAutoMark} label='Automatically mark tiles as numbers are called' />{!allowAutoMark && <p className='mt-2 pl-[60px] text-xs text-slate-500'>The host has chosen manual marking for this game.</p>}</div>
							<button type='button' className='btn-primary w-full text-base' onClick={join} disabled={locked && !stickyName}>{locked && !stickyName ? "Lobby is locked" : "Join game"} <span aria-hidden>→</span></button>
						</div>
					</div>
				</div>
			) : (
				<>
					<div className='card grid gap-4 p-4 sm:grid-cols-3 sm:p-5'>
						<div className='flex items-center gap-3'><span className='h-3 w-3 rounded-full' style={{ background: colorFromId(clientId) }} /><div><p className='metric-label'>Playing as</p><p className='font-black'>{name} <span className='font-mono text-xs font-normal text-slate-400'>#{shortId(clientId)}</span></p></div></div>
						<div><p className='metric-label'>Win pattern</p><p className='mt-1 font-black uppercase'>{pattern}</p></div>
						<div><p className='metric-label'>Round status</p><p className='mt-1 font-black'>{paused ? "Winner found—round paused" : started ? "In progress" : "Waiting for host"}</p></div>
					</div>

					<div className='grid gap-6 lg:grid-cols-[minmax(320px,480px)_1fr]'>
						<div className='card p-4 sm:p-6'>
							{cards.length > 1 && <div className='mb-5 flex flex-wrap items-center justify-between gap-3'><p className='text-sm font-black'>Your cards</p><div className='flex gap-2' role='group' aria-label='Choose bingo card'>{cards.map((_, index) => <button type='button' key={index} onClick={() => switchCard(index)} aria-pressed={activeCard === index} className={`grid h-9 w-9 place-items-center rounded-xl border text-sm font-black ${activeCard === index ? "border-[#ef2b2d] bg-red-50 text-[#b42318]" : "border-[#e8e4df] bg-white text-slate-600"}`}>{index + 1}</button>)}</div></div>}
							<BingoCard card={cards[activeCard]} calledSet={calledSet} manual={!autoMark} marks={marks[activeCard] ?? []} onToggle={toggleCell} />
							<div className='mt-5 space-y-4 border-t border-[#e8e4df] pt-5'><Toggle checked={autoMark} onChange={setAutoMark} disabled={!allowAutoMark} label='Auto-mark this card' /><button type='button' className='btn-success w-full text-lg' onClick={claim} disabled={paused || !started}>{paused ? "Round paused" : started ? "Claim BINGO!" : "Waiting for round"}</button></div>
						</div>

						<div className='space-y-6'>
							<div className='card p-5 sm:p-6'><div className='mb-5 flex items-center justify-between'><div><p className='metric-label'>Draw history</p><h2 className='mt-1 text-xl font-black'>Called numbers</h2></div><span className='status-pill'>{history.length} of 75</span></div>{history.length === 0 ? <div className='empty-state'>Numbers will appear here when the host starts calling.</div> : <div className='flex flex-wrap gap-3'>{history.slice(-60).reverse().map((number, index) => <LottoBall key={`${number}-${index}`} value={number} size='lg' />)}</div>}</div>
							<div className='grid gap-6 sm:grid-cols-2'>
								<div className='card p-5'><div className='mb-3 flex items-center justify-between'><h2 className='font-black'>Players</h2><span className='text-xs font-bold text-slate-400'>{players.length}</span></div>{players.length === 0 ? <div className='text-sm text-slate-500'>Waiting for players.</div> : <div className='flex flex-wrap gap-2'>{players.map(player => <span key={player.id} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${player.id === clientId ? "border-red-200 bg-red-50 text-[#b42318]" : "border-[#e8e4df] bg-white text-slate-600"}`}><span className='h-2 w-2 rounded-full' style={{ background: colorFromId(player.id) }} />{player.name}{player.id === clientId && " (you)"}</span>)}</div>}</div>
								<div className='card p-5'><div className='mb-3 flex items-center justify-between'><h2 className='font-black'>Winners</h2><span className='text-xs font-bold text-slate-400'>{winners.length}</span></div>{winners.length === 0 ? <div className='text-sm text-slate-500'>No winners yet.</div> : <div className='space-y-2'>{winners.map((winner, index) => <div key={winner.playerId + index} className='rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold'>★ {winner.name} <span className='text-xs font-normal text-slate-500'>({winner.pattern})</span></div>)}</div>}</div>
							</div>
						</div>
					</div>
				</>
			)}
		</section>
	);
}
