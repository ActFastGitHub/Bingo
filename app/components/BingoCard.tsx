"use client";

type Props = {
	card: number[][] | number[] | null | undefined;
	calledSet: Set<number>;
	manual?: boolean;
	marks?: [number, number][];
	onToggle?: (r: number, c: number) => void;
};

const headers = ["B", "I", "N", "G", "O"];
const headerColors = ["#ef2b2d", "#f6b84b", "#12b76a", "#2e90fa", "#7a5af8"];

function normalize(card: Props["card"]): number[][] | null {
	if (!card) return null;
	if (Array.isArray(card) && Array.isArray(card[0]) && card.length === 5 && (card[0] as number[]).length === 5) {
		const grid = (card as number[][]).map(row => row.slice());
		grid[2][2] = 0;
		return grid;
	}
	if (Array.isArray(card) && card.length === 25 && !Array.isArray(card[0])) {
		const flat = (card as (number | string)[]).map(value => typeof value === "number" ? value : parseInt(String(value), 10) || 0);
		const grid: number[][] = [];
		for (let i = 0; i < 25; i += 5) grid.push(flat.slice(i, i + 5));
		grid[2][2] = 0;
		return grid;
	}
	return null;
}

export default function BingoCard({ card, calledSet, manual, marks, onToggle }: Props) {
	const grid = normalize(card);

	if (!grid) return <div className='empty-state mx-auto w-full max-w-sm'>Waiting for your bingo card…</div>;

	const markSet = new Set((marks ?? []).map(([r, c]) => `${r}-${c}`));
	const isMarked = (r: number, c: number, value: number) => value === 0 || (manual ? markSet.has(`${r}-${c}`) : calledSet.has(value));

	return (
		<div className='mx-auto w-full max-w-md'>
			<div className='rounded-[1.5rem] border border-[#d8d3cd] bg-white p-2.5 shadow-[0_18px_45px_rgba(23,24,28,.1)] sm:p-4'>
				<div className='mb-2 grid grid-cols-5 gap-1 text-center sm:gap-2'>
					{headers.map((header, index) => <div key={header} className='py-1 text-2xl font-black sm:text-3xl' style={{ color: headerColors[index] }}>{header}</div>)}
				</div>
				<div className='grid grid-cols-5 gap-1 sm:gap-2'>
					{grid.map((row, r) => row.map((value, c) => {
						const free = value === 0;
						const marked = isMarked(r, c, value);
						return (
							<button
								type='button'
								key={`${r}-${c}`}
								aria-label={free ? "Free space" : `${headers[c]} ${value}${marked ? ", marked" : ""}`}
								aria-pressed={marked}
								onClick={() => onToggle?.(r, c)}
								className={`grid aspect-square min-h-0 place-items-center rounded-lg border text-base font-black select-none sm:rounded-xl sm:text-xl ${marked ? "border-[#c91521] bg-gradient-to-br from-[#f04446] to-[#c91521] text-white shadow-[0_5px_12px_rgba(201,21,33,.22)]" : "border-[#e8e4df] bg-[#fbfaf8] text-[#17181c] hover:border-[#b9b2aa] hover:bg-white"}`}>
								<span>{free ? <span className='text-[9px] tracking-wide sm:text-xs'>FREE</span> : value}</span>
							</button>
						);
					}))}
				</div>
			</div>
		</div>
	);
}
