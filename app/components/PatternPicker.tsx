"use client";

type PatternType = "line" | "x" | "plus" | "blackout" | "corners" | "t" | "l";

const labels: Record<PatternType, { title: string; mark: string }> = {
	line: { title: "Straight line", mark: "—" },
	x: { title: "Diagonal X", mark: "×" },
	plus: { title: "Plus", mark: "+" },
	blackout: { title: "Blackout", mark: "■" },
	corners: { title: "Four corners", mark: "⌗" },
	t: { title: "T pattern", mark: "T" },
	l: { title: "L pattern", mark: "L" }
};

export default function PatternPicker({ value, onChange, disabled }: { value: PatternType; onChange: (p: PatternType) => void; disabled?: boolean }) {
	return (
		<div className='grid grid-cols-2 gap-2 sm:grid-cols-4' role='group' aria-label='Win pattern'>
			{(Object.keys(labels) as PatternType[]).map(pattern => {
				const active = value === pattern;
				return (
					<button
						type='button'
						key={pattern}
						disabled={disabled}
						aria-pressed={active}
						onClick={() => onChange(pattern)}
						className={`min-h-[72px] rounded-2xl border p-3 text-left ${active ? "border-[#ef2b2d] bg-red-50 text-[#b42318] shadow-sm" : "border-[#e8e4df] bg-white text-slate-700 hover:border-[#b9b2aa]"} disabled:cursor-not-allowed disabled:opacity-50`}>
						<span className='block text-xl font-black leading-none'>{labels[pattern].mark}</span>
						<span className='mt-2 block text-xs font-bold'>{labels[pattern].title}</span>
					</button>
				);
			})}
		</div>
	);
}
