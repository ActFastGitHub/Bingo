import Link from "next/link";

const balls = [
	{ letter: "B", number: 8, color: "#ef2b2d", className: "-rotate-6" },
	{ letter: "I", number: 22, color: "#f6b84b", className: "rotate-3" },
	{ letter: "N", number: 38, color: "#12b76a", className: "-rotate-2" },
	{ letter: "G", number: 53, color: "#2e90fa", className: "rotate-6" },
	{ letter: "O", number: 71, color: "#7a5af8", className: "-rotate-3" }
];

export default function Home() {
	return (
		<section className='grid min-h-[calc(100vh-9rem)] items-center gap-10 py-8 lg:grid-cols-[1.05fr_.95fr] lg:py-12'>
			<div className='max-w-2xl'>
				<div className='status-pill mb-6'>
					<span className='status-dot' aria-hidden />
					Real-time party bingo
				</div>
				<p className='eyebrow mb-3'>An ActFAST game</p>
				<h1 className='page-title text-[clamp(3.5rem,9vw,7.25rem)]'>
					Ready. Set. <span className='text-[#ef2b2d]'>Bingo.</span>
				</h1>
				<p className='page-copy mt-6 max-w-xl text-lg'>
					Create a room, invite your crew, and call numbers live from any device. No downloads—just a room code and a little luck.
				</p>

				<div className='mt-8 flex flex-col gap-3 sm:flex-row'>
					<Link href='/host' className='btn-primary min-h-14 px-7 text-lg'>
						Host a game <span aria-hidden>→</span>
					</Link>
					<Link href='/join' className='btn-secondary min-h-14 px-7 text-lg'>
						Join a game
					</Link>
				</div>

				<div className='mt-8 grid max-w-xl grid-cols-3 gap-3 border-t border-[#e8e4df] pt-6'>
					<div><div className='text-xl font-black'>01</div><div className='text-xs text-slate-500'>Create room</div></div>
					<div><div className='text-xl font-black'>02</div><div className='text-xs text-slate-500'>Share code</div></div>
					<div><div className='text-xl font-black'>03</div><div className='text-xs text-slate-500'>Play together</div></div>
				</div>
			</div>

			<div className='relative mx-auto w-full max-w-[520px]'>
				<div className='card relative overflow-hidden p-6 sm:p-9'>
					<div className='absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#ef2b2d]/10 blur-3xl' />
					<div className='relative'>
						<div className='mb-7 flex items-center justify-between'>
							<div><p className='metric-label'>Tonight&apos;s game</p><p className='mt-1 text-2xl font-black'>ActFAST Party</p></div>
							<span className='status-pill'><span className='status-dot' />Live</span>
						</div>
						<div className='grid grid-cols-5 gap-2 sm:gap-3' aria-label='Decorative bingo balls'>
							{balls.map(ball => (
								<div key={ball.letter} className={ball.className}>
									<div className='aspect-square rounded-full border-4 border-white p-1 shadow-[0_12px_22px_rgba(23,24,28,.16)]' style={{ background: ball.color }}>
										<div className='grid h-full place-items-center rounded-full bg-white/95 text-center'>
											<div><div className='text-[10px] font-black text-slate-400 sm:text-xs'>{ball.letter}</div><div className='text-lg font-black leading-none sm:text-2xl'>{ball.number}</div></div>
										</div>
									</div>
								</div>
							))}
						</div>
						<div className='mt-8 rounded-2xl bg-[#17181c] p-5 text-white'>
							<p className='text-xs font-bold uppercase tracking-[.16em] text-white/50'>Room code</p>
							<div className='mt-2 flex items-end justify-between gap-4'><span className='font-mono text-3xl font-black tracking-[.18em] sm:text-4xl'>PLAY24</span><span className='text-sm font-bold text-[#f6b84b]'>Waiting for players</span></div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
