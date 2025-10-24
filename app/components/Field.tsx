"use client";
import { ComponentProps } from "react";

export function Label({ children }: { children: React.ReactNode }) {
	return <label className='text-sm font-medium text-slate-700'>{children}</label>;
}
export function TextInput(props: ComponentProps<"input">) {
	return (
		<input
			{...props}
			className={[
				"h-10 w-full rounded-xl border px-3 outline-none",
				"border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200",
				props.className ?? ""
			].join(" ")}
		/>
	);
}
export function Helper({ children }: { children: React.ReactNode }) {
	return <p className='text-xs text-slate-500'>{children}</p>;
}
