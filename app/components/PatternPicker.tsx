"use client";
type PatternType = "line" | "x" | "plus" | "blackout" | "corners" | "t" | "l";

const labels: Record<PatternType, string> = {
	line: "Straight Line",
	x: "X",
	plus: "+",
	blackout: "Blackout",
	corners: "Four Corners",
	t: "T",
	l: "L"
};

export default function PatternPicker({ value, onChange }: { value: PatternType; onChange: (p: PatternType) => void }) {
	const items = Object.keys(labels) as PatternType[];
	return (
		<div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
			{items.map(p => (
				<button
					key={p}
					onClick={() => onChange(p)}
					className={[
						"rounded-xl border px-3 py-2 text-sm",
						value === p ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-300 bg-white"
					].join(" ")}>
					{labels[p]}
				</button>
			))}
		</div>
	);
}
