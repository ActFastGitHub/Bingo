"use client";
import { useEffect, useState } from "react";
import { TextInput, Label, Helper } from "./Field";
import Modal from "./Modal";

type HostRoom = { code: string; hostKey: string };
const LS_KEY = "bingo_host_rooms";

function loadHostRooms(): HostRoom[] {
	try {
		return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
	} catch {
		return [];
	}
}
function saveHostRoom(entry: HostRoom) {
	const list = loadHostRooms();
	const exists = list.some(x => x.code === entry.code);
	const next = exists ? list.map(x => (x.code === entry.code ? entry : x)) : [...list, entry];
	localStorage.setItem(LS_KEY, JSON.stringify(next));
}
function removeHostRoom(code: string) {
	const next = loadHostRooms().filter(x => x.code !== code);
	localStorage.setItem(LS_KEY, JSON.stringify(next));
}

export default function ResumeRoom({ onResume }: { onResume: (r: HostRoom) => void }) {
	const [saved, setSaved] = useState<HostRoom[]>([]);
	const [open, setOpen] = useState(false);
	const [code, setCode] = useState("");
	const [hostKey, setHostKey] = useState("");

	useEffect(() => setSaved(loadHostRooms()), []);

	return (
		<div className='card p-5 space-y-3'>
			<div className='flex items-center justify-between'>
				<div className='text-lg font-semibold'>Resume existing room</div>
				<button className='rounded-xl border px-3 py-2' onClick={() => setOpen(true)}>
					Enter code & host key
				</button>
			</div>
			{saved.length === 0 ? (
				<div className='text-sm text-slate-500'>No saved rooms yet.</div>
			) : (
				<div className='space-y-2'>
					{saved.map(r => (
						<div key={r.code} className='flex items-center justify-between rounded-xl border p-3'>
							<div>
								<div className='font-mono font-semibold'>{r.code}</div>
								<div className='text-xs text-slate-500 truncate'>hostKey: {r.hostKey}</div>
							</div>
							<div className='flex gap-2'>
								<button className='rounded-xl border px-3 py-2' onClick={() => onResume(r)}>
									Resume
								</button>
								<button
									className='rounded-xl border px-3 py-2'
									onClick={() => {
										removeHostRoom(r.code);
										setSaved(loadHostRooms());
									}}>
									Remove
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			<Modal
				open={open}
				title='Resume with code & host key'
				onClose={() => setOpen(false)}
				footer={
					<>
						<button className='rounded-xl border px-4 py-2' onClick={() => setOpen(false)}>
							Cancel
						</button>
						<button
							className='rounded-xl bg-indigo-600 px-4 py-2 text-white'
							onClick={() => {
								const entry = { code: code.trim().toUpperCase(), hostKey: hostKey.trim() };
								if (!entry.code || !entry.hostKey) return;
								saveHostRoom(entry);
								setOpen(false);
								onResume(entry);
							}}>
							Resume
						</button>
					</>
				}>
				<div className='space-y-3'>
					<div className='space-y-1'>
						<Label>Room code</Label>
						<TextInput
							maxLength={6}
							value={code}
							onChange={e => setCode(e.currentTarget.value.toUpperCase())}
						/>
						<Helper>6 characters (e.g., TK9TTP)</Helper>
					</div>
					<div className='space-y-1'>
						<Label>Host key</Label>
						<TextInput value={hostKey} onChange={e => setHostKey(e.currentTarget.value)} />
						<Helper>Secret shown only to the host on creation.</Helper>
					</div>
				</div>
			</Modal>
		</div>
	);
}
