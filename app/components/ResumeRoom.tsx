// "use client";
// import { useEffect, useState } from "react";
// import { TextInput, Label, Helper } from "./Field";
// import Modal from "./Modal";

// type HostRoom = { code: string; hostKey: string };
// const LS_KEY = "bingo_host_rooms";

// function loadHostRooms(): HostRoom[] {
// 	try {
// 		return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
// 	} catch {
// 		return [];
// 	}
// }
// function saveHostRoom(entry: HostRoom) {
// 	const list = loadHostRooms();
// 	const exists = list.some(x => x.code === entry.code);
// 	const next = exists ? list.map(x => (x.code === entry.code ? entry : x)) : [...list, entry];
// 	localStorage.setItem(LS_KEY, JSON.stringify(next));
// }
// function removeHostRoom(code: string) {
// 	const next = loadHostRooms().filter(x => x.code !== code);
// 	localStorage.setItem(LS_KEY, JSON.stringify(next));
// }

// export default function ResumeRoom({ onResume }: { onResume: (r: HostRoom) => void }) {
// 	const [saved, setSaved] = useState<HostRoom[]>([]);
// 	const [open, setOpen] = useState(false);
// 	const [code, setCode] = useState("");
// 	const [hostKey, setHostKey] = useState("");

// 	useEffect(() => setSaved(loadHostRooms()), []);

// 	return (
// 		<div className='card p-5 space-y-3'>
// 			<div className='flex items-center justify-between'>
// 				<div className='text-lg font-semibold'>Resume existing room</div>
// 				<button className='rounded-xl border px-3 py-2' onClick={() => setOpen(true)}>
// 					Enter code & host key
// 				</button>
// 			</div>
// 			{saved.length === 0 ? (
// 				<div className='text-sm text-slate-500'>No saved rooms yet.</div>
// 			) : (
// 				<div className='space-y-2'>
// 					{saved.map(r => (
// 						<div key={r.code} className='flex items-center justify-between rounded-xl border p-3'>
// 							<div>
// 								<div className='font-mono font-semibold'>{r.code}</div>
// 								<div className='text-xs text-slate-500 truncate'>hostKey: {r.hostKey}</div>
// 							</div>
// 							<div className='flex gap-2'>
// 								<button className='rounded-xl border px-3 py-2' onClick={() => onResume(r)}>
// 									Resume
// 								</button>
// 								<button
// 									className='rounded-xl border px-3 py-2'
// 									onClick={() => {
// 										removeHostRoom(r.code);
// 										setSaved(loadHostRooms());
// 									}}>
// 									Remove
// 								</button>
// 							</div>
// 						</div>
// 					))}
// 				</div>
// 			)}

// 			<Modal
// 				open={open}
// 				title='Resume with code & host key'
// 				onClose={() => setOpen(false)}
// 				footer={
// 					<>
// 						<button className='rounded-xl border px-4 py-2' onClick={() => setOpen(false)}>
// 							Cancel
// 						</button>
// 						<button
// 							className='rounded-xl bg-indigo-600 px-4 py-2 text-white'
// 							onClick={() => {
// 								const entry = { code: code.trim().toUpperCase(), hostKey: hostKey.trim() };
// 								if (!entry.code || !entry.hostKey) return;
// 								saveHostRoom(entry);
// 								setOpen(false);
// 								onResume(entry);
// 							}}>
// 							Resume
// 						</button>
// 					</>
// 				}>
// 				<div className='space-y-3'>
// 					<div className='space-y-1'>
// 						<Label>Room code</Label>
// 						<TextInput
// 							maxLength={6}
// 							value={code}
// 							onChange={e => setCode(e.currentTarget.value.toUpperCase())}
// 						/>
// 						<Helper>6 characters (e.g., TK9TTP)</Helper>
// 					</div>
// 					<div className='space-y-1'>
// 						<Label>Host key</Label>
// 						<TextInput value={hostKey} onChange={e => setHostKey(e.currentTarget.value)} />
// 						<Helper>Secret shown only to the host on creation.</Helper>
// 					</div>
// 				</div>
// 			</Modal>
// 		</div>
// 	);
// }


// app/components/ResumeRoom.tsx
"use client";

import React, { useEffect, useState } from "react";

type HostRoom = { code: string; hostKey: string };
const LS_KEY = "bingo_host_rooms";

export default function ResumeRoom({
  onResume,
}: {
  onResume: (entry: HostRoom) => void;
}) {
  const [rooms, setRooms] = useState<HostRoom[]>([]);
  const [code, setCode] = useState("");
  const [hostKey, setHostKey] = useState("");

  useEffect(() => {
    try {
      const list: HostRoom[] = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
      setRooms(Array.isArray(list) ? list : []);
    } catch {
      setRooms([]);
    }
  }, []);

  const remove = (entry: HostRoom) => {
    const next = rooms.filter((r) => !(r.code === entry.code && r.hostKey === entry.hostKey));
    setRooms(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  };

  const addManual = () => {
    const c = code.trim().toUpperCase();
    const k = hostKey.trim();
    if (c.length !== 6 || k.length < 8) return;
    const exists = rooms.some((r) => r.code === c);
    const next = exists
      ? rooms.map((r) => (r.code === c ? { code: c, hostKey: k } : r))
      : [{ code: c, hostKey: k }, ...rooms];
    setRooms(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    setCode("");
    setHostKey("");
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-lg font-semibold">Resume existing room</div>
        {/* On phones this hint wraps under, on desktop it stays right-aligned */}
        <div className="text-xs text-slate-500 hidden sm:block">Enter code &amp; host key</div>
      </div>

      {/* Inputs: stack on mobile, align in a row on >=sm */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Room code (e.g., 2VZPA9)"
          className="w-full sm:max-w-[180px] border rounded-2xl px-3 py-2"
          inputMode="text"
          autoCapitalize="characters"
        />
        <input
          value={hostKey}
          onChange={(e) => setHostKey(e.target.value)}
          placeholder="Host key"
          className="w-full border rounded-2xl px-3 py-2"
          type="password"
        />
        <button
          onClick={addManual}
          className="w-full sm:w-auto rounded-2xl px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          disabled={code.trim().length !== 6 || hostKey.trim().length < 8}
        >
          Save
        </button>
      </div>

      {/* Saved rooms list */}
      {rooms.length === 0 ? (
        <div className="text-sm text-slate-500">No saved rooms yet.</div>
      ) : (
        <ul className="space-y-2">
          {rooms.map((r) => (
            <li
              key={r.code}
              className="rounded-2xl border bg-white p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold tracking-wider">{r.code}</div>
                <div className="text-[11px] text-slate-500 break-all">
                  hostKey: {r.hostKey}
                </div>
              </div>

              {/* Buttons: full width on mobile; inline on larger screens */}
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={() => onResume(r)}
                  className="w-full sm:w-auto rounded-2xl px-4 py-2 bg-white border hover:bg-slate-50"
                  title="Resume"
                >
                  Resume
                </button>
                <button
                  onClick={() => remove(r)}
                  className="w-full sm:w-auto rounded-2xl px-4 py-2 bg-white border hover:bg-slate-50"
                  title="Remove"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
