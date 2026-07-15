"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/app/lib/socket";
import toast from "react-hot-toast";

type HostRoom = { code: string; hostKey: string };
const LS_KEY = "bingo_host_rooms";

export default function ResumeRoom({ onResume }: { onResume: (entry: HostRoom) => void }) {
	const [rooms, setRooms] = useState<HostRoom[]>([]);
	const [code, setCode] = useState("");
	const [hostKey, setHostKey] = useState("");

	useEffect(() => {
		let next: HostRoom[] = [];
		try {
			const list: HostRoom[] = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
			next = Array.isArray(list) ? list : [];
		} catch {}
		queueMicrotask(() => setRooms(next));
	}, []);

	const saveRooms = (next: HostRoom[]) => {
		setRooms(next);
		localStorage.setItem(LS_KEY, JSON.stringify(next));
	};

	const removeLocal = (entry: HostRoom) => saveRooms(rooms.filter(room => room.code !== entry.code));

	const deleteOnServer = (entry: HostRoom) => {
		if (!confirm(`Permanently delete room ${entry.code}? Players in the room will be disconnected.`)) return;
		getSocket().emit("host:delete_room", { code: entry.code, hostKey: entry.hostKey }, (res: { ok?: boolean }) => {
			if (res?.ok) {
				toast.success("Room deleted from the server");
				removeLocal(entry);
			} else toast.error("Delete failed. Check the host key and server connection.");
		});
	};

	const addManual = () => {
		const normalizedCode = code.trim().toUpperCase();
		const normalizedKey = hostKey.trim();
		if (normalizedCode.length !== 6 || normalizedKey.length < 8) return;
		const exists = rooms.some(room => room.code === normalizedCode);
		const next = exists
			? rooms.map(room => room.code === normalizedCode ? { code: normalizedCode, hostKey: normalizedKey } : room)
			: [{ code: normalizedCode, hostKey: normalizedKey }, ...rooms];
		saveRooms(next);
		setCode("");
		setHostKey("");
		toast.success("Host access saved on this device");
	};

	return (
		<div className='card overflow-hidden'>
			<div className='border-b border-[#e8e4df] p-5 sm:p-6'>
				<p className='metric-label'>Saved on this device</p>
				<h2 className='mt-1 text-xl font-black'>Resume a room</h2>
				<p className='mt-2 text-sm leading-relaxed text-slate-500'>Return to a room you hosted earlier, or save its host credentials manually.</p>
			</div>

			<div className='space-y-5 p-5 sm:p-6'>
				<div className='grid gap-2 sm:grid-cols-[150px_1fr_auto]'>
					<input
						aria-label='Room code'
						className='h-12 w-full rounded-xl border px-3 font-mono font-bold uppercase tracking-widest'
						placeholder='ROOM CODE'
						maxLength={6}
						value={code}
						onChange={event => setCode(event.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())}
					/>
					<input
						aria-label='Host key'
						className='h-12 w-full rounded-xl border px-3'
						placeholder='Host key'
						type='password'
						value={hostKey}
						onChange={event => setHostKey(event.target.value)}
					/>
					<button type='button' className='btn-secondary' onClick={addManual} disabled={code.length !== 6 || hostKey.trim().length < 8}>Save</button>
				</div>

				{rooms.length === 0 ? (
					<div className='empty-state'>No hosted rooms are saved in this browser yet.</div>
				) : (
					<ul className='space-y-3'>
						{rooms.map(room => (
							<li key={room.code} className='rounded-2xl border border-[#e8e4df] bg-[#fbfaf8] p-4'>
								<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
									<div><div className='font-mono text-lg font-black tracking-[.16em]'>{room.code}</div><div className='mt-1 text-xs text-slate-500'>Host access stored only in this browser</div></div>
									<div className='flex flex-col gap-2 sm:flex-row'>
										<button type='button' onClick={() => onResume(room)} className='btn-primary min-h-10 px-4 py-2 text-sm'>Resume</button>
										<button type='button' onClick={() => removeLocal(room)} className='btn-secondary min-h-10 px-4 py-2 text-sm'>Forget on device</button>
										<button type='button' onClick={() => deleteOnServer(room)} className='btn-danger min-h-10 px-4 py-2 text-sm'>Delete room</button>
									</div>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
