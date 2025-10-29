// // app/components/ResumeRoom.tsx
// "use client";

// import React, { useEffect, useState } from "react";

// type HostRoom = { code: string; hostKey: string };
// const LS_KEY = "bingo_host_rooms";

// export default function ResumeRoom({
//   onResume,
// }: {
//   onResume: (entry: HostRoom) => void;
// }) {
//   const [rooms, setRooms] = useState<HostRoom[]>([]);
//   const [code, setCode] = useState("");
//   const [hostKey, setHostKey] = useState("");

//   useEffect(() => {
//     try {
//       const list: HostRoom[] = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
//       setRooms(Array.isArray(list) ? list : []);
//     } catch {
//       setRooms([]);
//     }
//   }, []);

//   const remove = (entry: HostRoom) => {
//     const next = rooms.filter((r) => !(r.code === entry.code && r.hostKey === entry.hostKey));
//     setRooms(next);
//     localStorage.setItem(LS_KEY, JSON.stringify(next));
//   };

//   const addManual = () => {
//     const c = code.trim().toUpperCase();
//     const k = hostKey.trim();
//     if (c.length !== 6 || k.length < 8) return;
//     const exists = rooms.some((r) => r.code === c);
//     const next = exists
//       ? rooms.map((r) => (r.code === c ? { code: c, hostKey: k } : r))
//       : [{ code: c, hostKey: k }, ...rooms];
//     setRooms(next);
//     localStorage.setItem(LS_KEY, JSON.stringify(next));
//     setCode("");
//     setHostKey("");
//   };

//   return (
//     <div className="card p-5 space-y-4">
//       <div className="flex items-center justify-between gap-2">
//         <div className="text-lg font-semibold">Resume existing room</div>
//         {/* On phones this hint wraps under, on desktop it stays right-aligned */}
//         <div className="text-xs text-slate-500 hidden sm:block">Enter code &amp; host key</div>
//       </div>

//       {/* Inputs: stack on mobile, align in a row on >=sm */}
//       <div className="flex flex-col sm:flex-row gap-2">
//         <input
//           value={code}
//           onChange={(e) => setCode(e.target.value.toUpperCase())}
//           placeholder="Room code (e.g., 2VZPA9)"
//           className="w-full sm:max-w-[180px] border rounded-2xl px-3 py-2"
//           inputMode="text"
//           autoCapitalize="characters"
//         />
//         <input
//           value={hostKey}
//           onChange={(e) => setHostKey(e.target.value)}
//           placeholder="Host key"
//           className="w-full border rounded-2xl px-3 py-2"
//           type="password"
//         />
//         <button
//           onClick={addManual}
//           className="w-full sm:w-auto rounded-2xl px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
//           disabled={code.trim().length !== 6 || hostKey.trim().length < 8}
//         >
//           Save
//         </button>
//       </div>

//       {/* Saved rooms list */}
//       {rooms.length === 0 ? (
//         <div className="text-sm text-slate-500">No saved rooms yet.</div>
//       ) : (
//         <ul className="space-y-2">
//           {rooms.map((r) => (
//             <li
//               key={r.code}
//               className="rounded-2xl border bg-white p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
//             >
//               <div className="min-w-0">
//                 <div className="text-sm font-semibold tracking-wider">{r.code}</div>
//                 <div className="text-[11px] text-slate-500 break-all">
//                   hostKey: {r.hostKey}
//                 </div>
//               </div>

//               {/* Buttons: full width on mobile; inline on larger screens */}
//               <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
//                 <button
//                   onClick={() => onResume(r)}
//                   className="w-full sm:w-auto rounded-2xl px-4 py-2 bg-white border hover:bg-slate-50"
//                   title="Resume"
//                 >
//                   Resume
//                 </button>
//                 <button
//                   onClick={() => remove(r)}
//                   className="w-full sm:w-auto rounded-2xl px-4 py-2 bg-white border hover:bg-slate-50"
//                   title="Remove"
//                 >
//                   Remove
//                 </button>
//               </div>
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// }

// app/components/ResumeRoom.tsx
"use client";

import React, { useEffect, useState } from "react";
import { getSocket } from "@/app/lib/socket";
import toast from "react-hot-toast";

type HostRoom = { code: string; hostKey: string };
const LS_KEY = "bingo_host_rooms";

export default function ResumeRoom({ onResume }: { onResume: (entry: HostRoom) => void }) {
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

	const saveRooms = (next: HostRoom[]) => {
		setRooms(next);
		localStorage.setItem(LS_KEY, JSON.stringify(next));
	};

	const removeLocal = (entry: HostRoom) => {
		const next = rooms.filter(r => !(r.code === entry.code));
		saveRooms(next);
	};

	const deleteOnServer = async (entry: HostRoom) => {
		if (!confirm(`Delete room ${entry.code} on server?`)) return;
		getSocket().emit("host:delete_room", { code: entry.code, hostKey: entry.hostKey }, (r: any) => {
			if (r?.ok) {
				toast.success("Room deleted on server");
				removeLocal(entry);
			} else {
				toast.error("Delete failed. Check host key and server status.");
			}
		});
	};

	const addManual = () => {
		const c = code.trim().toUpperCase();
		const k = hostKey.trim();
		if (c.length !== 6 || k.length < 8) return;
		const exists = rooms.some(r => r.code === c);
		const next = exists
			? rooms.map(r => (r.code === c ? { code: c, hostKey: k } : r))
			: [{ code: c, hostKey: k }, ...rooms];
		saveRooms(next);
		setCode("");
		setHostKey("");
	};

	return (
		<div className='card p-5 space-y-4'>
			<div className='flex items-center justify-between gap-2'>
				<div className='text-lg font-semibold'>Resume existing room</div>
				<div className='text-xs text-slate-500 hidden sm:block'>Enter code &amp; host key</div>
			</div>

			<div className='flex flex-col sm:flex-row gap-2'>
				<input
					className='w-full sm:max-w-[180px] border rounded-2xl px-3 py-2'
					placeholder='Room code (e.g., 2VZPA9)'
					value={code}
					onChange={e => setCode(e.target.value.toUpperCase())}
				/>
				<input
					className='w-full border rounded-2xl px-3 py-2'
					placeholder='Host key'
					type='password'
					value={hostKey}
					onChange={e => setHostKey(e.target.value)}
				/>
				<button
					className='w-full sm:w-auto rounded-2xl px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
					onClick={addManual}
					disabled={code.trim().length !== 6 || hostKey.trim().length < 8}>
					Save
				</button>
			</div>

			{rooms.length === 0 ? (
				<div className='text-sm text-slate-500'>No saved rooms yet.</div>
			) : (
				<ul className='space-y-2'>
					{rooms.map(r => (
						<li
							key={r.code}
							className='rounded-2xl border bg-white p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
							<div className='min-w-0'>
								<div className='text-sm font-semibold tracking-wider'>{r.code}</div>
								<div className='text-[11px] text-slate-500 break-all'>hostKey: {r.hostKey}</div>
							</div>
							<div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
								<button
									onClick={() => onResume(r)}
									className='w-full sm:w-auto rounded-2xl px-4 py-2 bg-white border hover:bg-slate-50'>
									Resume
								</button>
								<button
									onClick={() => deleteOnServer(r)}
									className='w-full sm:w-auto rounded-2xl px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'>
									Delete on server
								</button>
								<button
									onClick={() => removeLocal(r)}
									className='w-full sm:w-auto rounded-2xl px-4 py-2 bg-white border hover:bg-slate-50'>
									Remove local
								</button>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
