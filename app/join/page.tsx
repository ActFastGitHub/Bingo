// app/join/page.tsx

// "use client";

// import { useRouter } from "next/navigation";
// import { useState } from "react";
// import toast from "react-hot-toast";

// export default function JoinPage() {
//   const [code, setCode] = useState("");
//   const router = useRouter();

//   const go = () => {
//     const c = code.trim().toUpperCase();
//     if (c.length !== 6) return toast.error("Enter the 6-character room code");
//     router.push(`/play/${c}`);
//   };

//   return (
//     <section className="grid place-items-center min-h-[60vh]">
//       <div className="card p-6 w-full max-w-sm space-y-4">
//         <h2 className="text-2xl font-bold text-center">Join a Room</h2>
//         <input
//           className="w-full border rounded-2xl p-3"
//           placeholder="Enter 6-char code (e.g., ABC123)"
//           value={code}
//           onChange={(e) => setCode(e.target.value)}
//         />
//         <button className="w-full rounded-2xl px-5 py-3 text-lg text-white bg-gradient-to-br from-slate-900 to-slate-800 hover:opacity-95 shadow-sm" onClick={go}>
//           Continue
//         </button>
//       </div>
//     </section>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { getSocket, waitForConnected } from "@/app/lib/socket";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function JoinPage() {
	const [rooms, setRooms] = useState<any[] | null>(null);
	const [code, setCode] = useState("");
	const router = useRouter();

	useEffect(() => {
		(async () => {
			await waitForConnected(getSocket());
			refresh();
		})();
	}, []);

	const refresh = () => {
		getSocket().emit("room:list", (res: any) => {
			if (res?.ok) setRooms(res.rooms || []);
			else toast.error("Could not fetch rooms");
		});
	};

	const tryJoin = () => {
		const c = code.trim().toUpperCase();
		if (c.length !== 6) return;
		getSocket().emit("room:exists", c, (r: any) => {
			if (!r?.ok) return toast.error("Room not found or deleted");
			router.push(`/play/${c}`);
		});
	};

	return (
		<section className='space-y-5'>
			<div className='card p-5'>
				<div className='flex items-center justify-between'>
					<div className='text-2xl font-bold'>Join a Room</div>
					<Link href='/' className='text-sm text-slate-600 hover:text-slate-900'>
						Home
					</Link>
				</div>
			</div>

			<div className='card p-5 space-y-3 max-w-xl'>
				<div className='text-sm font-semibold'>Enter a code</div>
				<div className='flex flex-col sm:flex-row gap-2'>
					<input
						className='w-full sm:max-w-[220px] border rounded-2xl px-3 py-2'
						placeholder='e.g., 2VZPA9'
						value={code}
						onChange={e => setCode(e.target.value.toUpperCase())}
					/>
					<button
						onClick={tryJoin}
						disabled={code.trim().length !== 6}
						className='w-full sm:w-auto rounded-2xl px-4 py-2 bg-indigo-600 text-white disabled:opacity-50'>
						Join
					</button>
					<button
						onClick={refresh}
						className='w-full sm:w-auto rounded-2xl px-4 py-2 bg-white border hover:bg-slate-50'>
						Refresh rooms
					</button>
				</div>
			</div>

			<div className='card p-5'>
				<div className='text-sm font-semibold mb-3'>Available rooms</div>
				{!rooms ? (
					<div className='text-sm text-slate-500'>No data yet. Try Refresh.</div>
				) : rooms.length === 0 ? (
					<div className='text-sm text-slate-500'>No active rooms.</div>
				) : (
					<ul className='space-y-2'>
						{rooms.map((r: any) => (
							<li key={r.code} className='rounded-xl border p-3 bg-white'>
								<div className='flex items-center justify-between gap-2 flex-wrap'>
									<div>
										<div className='font-mono font-semibold'>{r.code}</div>
										<div className='text-xs text-slate-500'>
											{r.players?.length ?? 0} player(s) •{" "}
											{r.started ? (r.paused ? "Paused" : "Started") : "Waiting"} •{" "}
											{r.locked ? "Locked" : "Open"}
										</div>
									</div>
									<button
										onClick={() => {
											getSocket().emit("room:exists", r.code, (res: any) => {
												if (!res?.ok) return toast.error("Room not found (maybe deleted)");
												window.location.href = `/play/${r.code}`;
											});
										}}
										className='rounded-2xl px-3 py-1 bg-indigo-600 text-white'>
										Join
									</button>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>
		</section>
	);
}
