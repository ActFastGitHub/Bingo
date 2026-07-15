"use client";

import { useEffect, useState } from "react";
import { getSocket, waitForConnected } from "@/app/lib/socket";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

type RoomSummary = {
	code: string;
	players?: { id: string; name: string; cards: number }[];
	started?: boolean;
	paused?: boolean;
	locked?: boolean;
};

export default function JoinPage() {
	const [rooms, setRooms] = useState<RoomSummary[] | null>(null);
	const [code, setCode] = useState("");
	const [checking, setChecking] = useState(false);
	const router = useRouter();

	const refresh = () => {
		setRooms(null);
		getSocket().emit("room:list", (res: { ok?: boolean; rooms?: RoomSummary[] }) => {
			if (res?.ok) setRooms(res.rooms || []);
			else {
				setRooms([]);
				toast.error("Could not fetch rooms");
			}
		});
	};

	useEffect(() => {
		(async () => {
			await waitForConnected(getSocket());
			refresh();
		})();
	}, []);

	const tryJoin = (roomCode = code) => {
		const normalized = roomCode.trim().toUpperCase();
		if (normalized.length !== 6) return;
		setChecking(true);
		getSocket().emit("room:exists", normalized, (res: { ok?: boolean }) => {
			setChecking(false);
			if (!res?.ok) return toast.error("Room not found or deleted");
			router.push(`/play/${normalized}`);
		});
	};

	return (
		<section className='mx-auto max-w-5xl space-y-7'>
			<header className='grid gap-6 py-3 md:grid-cols-[1fr_auto] md:items-end'>
				<div>
					<p className='eyebrow mb-2'>Player check-in</p>
					<h1 className='page-title'>Join the game.</h1>
					<p className='page-copy mt-4 max-w-xl'>Enter the six-character code from your host, or choose an open room below.</p>
				</div>
				<Link href='/' className='btn-secondary w-fit'>← Back home</Link>
			</header>

			<div className='grid gap-6 lg:grid-cols-[.9fr_1.1fr]'>
				<div className='card h-fit overflow-hidden'>
					<div className='bg-[#17181c] p-6 text-white sm:p-8'>
						<p className='text-xs font-black uppercase tracking-[.16em] text-white/50'>Have a room code?</p>
						<h2 className='mt-2 text-2xl font-black tracking-tight'>Enter it here</h2>
					</div>
					<form className='space-y-4 p-6 sm:p-8' onSubmit={event => { event.preventDefault(); tryJoin(); }}>
						<label htmlFor='room-code' className='block text-sm font-bold text-slate-700'>Room code</label>
						<input
							id='room-code'
							className='h-16 w-full rounded-2xl border px-4 text-center font-mono text-2xl font-black uppercase tracking-[.22em] sm:text-3xl'
							placeholder='ABC123'
							maxLength={6}
							autoComplete='off'
							autoCapitalize='characters'
							value={code}
							onChange={event => setCode(event.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())}
						/>
						<p className='text-xs text-slate-500'>Room codes contain six letters or numbers.</p>
						<button type='submit' disabled={code.length !== 6 || checking} className='btn-primary w-full'>
							{checking ? "Checking room…" : "Continue to game"} <span aria-hidden>→</span>
						</button>
					</form>
				</div>

				<div className='card p-5 sm:p-7'>
					<div className='mb-5 flex items-center justify-between gap-3'>
						<div>
							<p className='metric-label'>Live lobby</p>
							<h2 className='mt-1 text-xl font-black'>Available rooms</h2>
						</div>
						<button type='button' onClick={refresh} className='btn-secondary min-h-10 px-3 py-2 text-sm'>Refresh</button>
					</div>

					{rooms === null ? (
						<div className='empty-state'>Looking for active rooms…</div>
					) : rooms.length === 0 ? (
						<div className='empty-state'><div className='text-2xl' aria-hidden>○</div><p className='mt-2 font-bold text-slate-700'>No open rooms right now</p><p className='mt-1'>Ask your host to create one, then refresh.</p></div>
					) : (
						<ul className='space-y-3'>
							{rooms.map(room => {
								const state = room.started ? (room.paused ? "Winner found" : "In progress") : "Waiting";
								return (
									<li key={room.code} className='flex flex-col gap-3 rounded-2xl border border-[#e8e4df] bg-[#fbfaf8] p-4 sm:flex-row sm:items-center sm:justify-between'>
										<div className='flex items-center gap-4'>
											<div className='grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#ef2b2d] font-black text-white'>{room.code.slice(0, 1)}</div>
											<div><div className='font-mono text-lg font-black tracking-[.16em]'>{room.code}</div><div className='mt-1 flex flex-wrap gap-x-3 text-xs text-slate-500'><span>{room.players?.length ?? 0} player{room.players?.length === 1 ? "" : "s"}</span><span>{state}</span><span>{room.locked ? "Locked" : "Open"}</span></div></div>
										</div>
										<button type='button' onClick={() => tryJoin(room.code)} className='btn-primary min-h-10 px-4 py-2 text-sm'>Join room</button>
									</li>
								);
							})}
						</ul>
					)}
				</div>
			</div>
		</section>
	);
}
