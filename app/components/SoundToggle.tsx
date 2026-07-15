"use client";

import { sfx } from "@/app/lib/sfx";
import { useEffect, useState } from "react";

export default function SoundToggle() {
	const [on, setOn] = useState(true);

	useEffect(() => {
		queueMicrotask(() => setOn(sfx.isEnabled()));
	}, []);

	return (
		<button
			type='button'
			aria-pressed={on}
			aria-label={on ? "Turn game sounds off" : "Turn game sounds on"}
			onClick={() => {
				const next = !on;
				sfx.setEnabled(next);
				setOn(next);
				if (next) sfx.play("click");
			}}
			className='inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#d8d3cd] bg-white/80 px-3 text-sm font-bold text-slate-700 shadow-sm hover:border-[#b9b2aa] hover:bg-white'>
			<span aria-hidden className='text-base'>{on ? "🔊" : "🔇"}</span>
			<span className='hidden sm:inline'>Sound</span>
			<span className={`h-2 w-2 rounded-full ${on ? "bg-emerald-500" : "bg-slate-300"}`} aria-hidden />
		</button>
	);
}
