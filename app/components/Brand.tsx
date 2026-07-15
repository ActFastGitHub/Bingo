"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Brand() {
	const [imgErr, setImgErr] = useState(false);

	return (
		<Link href='/' className='group flex items-center gap-3 rounded-xl' aria-label='ActFAST Bingo home'>
			{!imgErr ? (
				<span className='overflow-hidden rounded-lg bg-[#ef2b2d] shadow-sm ring-1 ring-black/5'>
					<Image
						src='/logo.png'
						alt='ActFAST Restoration'
						width={180}
						height={42}
						className='h-11 w-auto object-contain sm:h-12'
						onError={() => setImgErr(true)}
						priority
					/>
				</span>
			) : (
				<span className='rounded-lg bg-[#ef2b2d] px-4 py-2 font-black text-white'>ActFAST</span>
			)}
			<span className='hidden border-l border-[#d8d3cd] pl-3 text-sm font-black tracking-tight text-[#17181c] sm:block'>
				BINGO
			</span>
		</Link>
	);
}
