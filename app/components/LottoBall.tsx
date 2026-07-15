"use client";

import { motion, useReducedMotion } from "framer-motion";

type Size = "sm" | "md" | "lg" | "xl";
const sizes: Record<Size, string> = {
	sm: "h-8 w-8 text-xs",
	md: "h-10 w-10 text-sm",
	lg: "h-12 w-12 text-base",
	xl: "h-24 w-24 text-3xl"
};

function styleForNumber(number: number) {
	if (number <= 15) return { base: "#2e90fa", dark: "#175cd3", letter: "B" };
	if (number <= 30) return { base: "#f6b84b", dark: "#dc6803", letter: "I" };
	if (number <= 45) return { base: "#12b76a", dark: "#087443", letter: "N" };
	if (number <= 60) return { base: "#7a5af8", dark: "#5925dc", letter: "G" };
	return { base: "#ef2b2d", dark: "#c91521", letter: "O" };
}

export default function LottoBall({ value, size = "md", glow = false }: { value: number | string; size?: Size; glow?: boolean }) {
	const reducedMotion = useReducedMotion();
	const colored = typeof value === "number";
	const style = colored ? styleForNumber(value) : { base: "#f2f0ec", dark: "#d8d3cd", letter: "" };

	return (
		<motion.div
			initial={reducedMotion ? false : { scale: .82, opacity: 0, y: 5 }}
			animate={{ scale: 1, opacity: 1, y: 0 }}
			transition={{ type: "spring", stiffness: 420, damping: 24 }}
			className={`relative grid shrink-0 select-none place-items-center rounded-full border-2 font-black text-white ${sizes[size]}`}
			style={{
				backgroundImage: `radial-gradient(circle at 32% 24%, rgba(255,255,255,.42), transparent 23%), linear-gradient(145deg, ${style.base}, ${style.dark})`,
				borderColor: colored ? "rgba(255,255,255,.9)" : style.dark,
				color: colored ? "white" : "#667085",
				boxShadow: glow ? `0 14px 28px ${style.base}55, inset 0 1px 0 rgba(255,255,255,.7)` : "0 5px 12px rgba(23,24,28,.13), inset 0 1px 0 rgba(255,255,255,.55)"
			}}>
			{colored && size === "xl" && <span className='absolute top-3 text-[10px] font-black tracking-[.18em] text-white/70'>{style.letter}</span>}
			<span className={colored && size === "xl" ? "mt-2" : ""}>{value}</span>
		</motion.div>
	);
}
