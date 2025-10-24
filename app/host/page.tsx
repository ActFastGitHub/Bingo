"use client";

import { useEffect, useState } from "react";
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
	const exists = list.some(x => x.code === entry.code);
	const next = exists ? list.map(x => (x.code === entry.code ? entry : x)) : [...list, entry];
	localStorage.setItem(LS_KEY, JSON.stringify(next));
};

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

	const start = () => code && getSocket().emit("host:start", { code, hostKey });
	const endRound = () => code && getSocket().emit("host:end_round", { code, hostKey });
	const callNext = () => code && getSocket().emit("host:call_next", { code, hostKey });
	const undo = () => code && getSocket().emit("host:undo", { code, hostKey });

	const setPattern = (p: PatternType) => code && getSocket().emit("host:set_pattern", { code, hostKey, pattern: p });
	const setAllowAuto = (allow: boolean) =>
		code && getSocket().emit("host:set_allow_automark", { code, hostKey, allow });
	const setLockOnStart = (v: boolean) =>
		code && getSocket().emit("host:set_lock_on_start", { code, hostKey, lockOnStart: v });
	const setLocked = (v: boolean) => code && getSocket().emit("host:set_locked", { code, hostKey, locked: v });

	const started = !!summary?.started;
	const canCall = started && history.length < 75;
	const canUndo = started && history.length > 0;

	const joinUrl = typeof window !== "undefined" && code ? `${window.location.origin}/play/${code}` : code || "JOIN";

	return (
		<section className='space-y-6'>
			<div className='card p-5'>
				<div className='flex items-center justify-between'>
					<div className='text-2xl font-bold'>Host Console</div>
					<a className='text-sm text-slate-600 hover:text-slate-900' href='/'>
						Home
					</a>
				</div>
			</div>

			{!summary && (
				<div className='grid gap-6 md:grid-cols-2'>
					<div className='card p-5 space-y-3'>
						<div className='text-lg font-semibold'>Create a new room</div>
						<button
							className='rounded-2xl bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700'
							onClick={createRoom}>
							Create Room
						</button>
					</div>
					<ResumeRoom onResume={resumeRoom} />
				</div>
			)}

			{summary && (
				<>
					<div className='card p-5 grid gap-4 md:grid-cols-[1fr_auto]'>
						<div>
							<div className='text-sm text-slate-500'>ROOM</div>
							<div className='text-3xl font-bold tracking-widest'>{code}</div>
							<div className='text-xs text-slate-500'>
								Share: <span className='font-mono'>/play/{code}</span>
							</div>

							<div className='mt-4 grid grid-cols-2 gap-3 sm:max-w-md'>
								<button
									className='rounded-2xl px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-600'
									onClick={start}
									disabled={started}
									title={started ? "Round already started" : "Start a new round"}>
									Start Round
								</button>

								<button
									className='rounded-2xl px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed bg-rose-600'
									onClick={endRound}
									disabled={!started}
									title={!started ? "No active round" : "End current round"}>
									End Round
								</button>

								<button
									className='rounded-2xl px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600'
									onClick={callNext}
									disabled={!canCall}
									title={
										!started
											? "Start the round first"
											: history.length >= 75
											? "No more numbers"
											: "Call next number"
									}>
									Call Next
								</button>

								<button
									className='rounded-2xl px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed bg-slate-200'
									onClick={undo}
									disabled={!canUndo}
									title={
										!started
											? "Start the round first"
											: !canUndo
											? "Nothing to undo"
											: "Undo last call"
									}>
									Undo
								</button>

								<div className='col-span-2 flex items-center text-sm text-slate-600'>
									Last: <span className='ml-1 font-semibold'>{lastCalled ?? "—"}</span>
								</div>
							</div>
						</div>

						<div className='justify-self-end'>
							<div className='rounded-2xl border p-3 bg-white'>
								<QRCode value={joinUrl} size={128} />
							</div>
							<div className='mt-2 text-center text-xs text-slate-500'>Scan to join</div>
						</div>
					</div>

					<div className='card p-5'>
						<div className='text-sm font-semibold mb-3'>Called numbers ({history.length})</div>
						<div className='flex flex-wrap gap-3'>
							{history.map((n, i) => (
								<LottoBall key={`${n}-${i}`} value={n} size='lg' />
							))}
						</div>
					</div>

					<div className='card p-5 space-y-4'>
						<div className='text-sm font-semibold'>Win pattern</div>
						<PatternPicker value={summary.pattern} onChange={setPattern} disabled={started} />

						<div className='grid gap-3 sm:grid-cols-3'>
							<Toggle
								checked={summary.allowAutoMark}
								onChange={setAllowAuto}
								label='Allow auto-mark for players'
							/>
							<Toggle
								checked={summary.lockLobbyOnStart}
								onChange={setLockOnStart}
								label='Lock lobby when round starts'
							/>
							<Toggle checked={summary.locked} onChange={setLocked} label='Locked now' />
						</div>
					</div>

					<div className='grid gap-6 md:grid-cols-2'>
						<div className='card p-5'>
							<div className='text-sm font-semibold mb-2'>Players ({summary.players.length})</div>
							{summary.players.length === 0 ? (
								<div className='text-sm text-slate-500'>No players yet.</div>
							) : (
								<ul className='space-y-1'>
									{summary.players.map(p => (
										<li
											key={p.id}
											className='flex items-center justify-between rounded-xl border px-3 py-2'>
											<span>{p.name}</span>
											<span className='text-xs text-slate-500'>{p.cards} card(s)</span>
										</li>
									))}
								</ul>
							)}
						</div>

						<div className='card p-5'>
							<div className='text-sm font-semibold mb-2'>Winners ({summary.winners.length})</div>
							{summary.winners.length === 0 ? (
								<div className='text-sm text-slate-500'>None yet.</div>
							) : (
								<ul className='space-y-1'>
									{summary.winners.map((w, i) => (
										<li
											key={w.playerId + i}
											className='flex items-center justify-between rounded-xl border px-3 py-2'>
											<div>
												<span className='font-semibold'>{w.name}</span>{" "}
												<span className='text-xs text-slate-500'>({w.pattern})</span>
											</div>
											<div className='text-xs text-slate-500'>after {w.at} calls</div>
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
