"use client";
import { sfx } from "@/app/lib/sfx";
import { useEffect, useState } from "react";

export default function SoundToggle() {
	const [on, setOn] = useState(true);
	useEffect(() => setOn(sfx.isEnabled()), []);
	return (
		<button
			onClick={() => {
				sfx.setEnabled(!on);
				setOn(!on);
				sfx.play("click");
			}}
			className={`rounded-xl border px-3 py-1 text-sm ${on ? "bg-white" : "bg-slate-100"}`}
			title={on ? "Sound: ON" : "Sound: OFF"}>
			{on ? "🔊 Sound" : "🔇 Sound"}
		</button>
	);
}
