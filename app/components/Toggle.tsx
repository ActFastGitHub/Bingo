"use client";

import { ComponentProps } from "react";

type Props = {
	checked: boolean;
	onChange: (next: boolean) => void;
	label?: string;
	disabled?: boolean;
} & Omit<ComponentProps<"button">, "onChange">;

export default function Toggle({ checked, onChange, label, disabled, ...rest }: Props) {
	return (
		<button
			type='button'
			aria-pressed={checked}
			disabled={disabled}
			onClick={() => onChange(!checked)}
			className={`group inline-flex min-h-11 items-center gap-3 rounded-xl text-left ${disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer"}`}
			{...rest}>
			<span className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border transition-colors ${checked ? "border-[#c91521] bg-[#ef2b2d]" : "border-slate-300 bg-slate-200"}`}>
				<span className={`absolute left-1 top-1 h-[18px] w-[18px] rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
			</span>
			{label && <span className='text-sm font-semibold leading-snug text-slate-700'>{label}</span>}
		</button>
	);
}
