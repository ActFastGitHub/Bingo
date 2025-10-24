"use client";
import { ReactNode } from "react";

export default function Modal({
	open,
	title,
	onClose,
	children,
	footer
}: {
	open: boolean;
	title: string;
	onClose: () => void;
	children: ReactNode;
	footer?: ReactNode;
}) {
	if (!open) return null;
	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
			<div className='absolute inset-0 bg-black/40' onClick={onClose} />
			<div className='relative w-full max-w-lg rounded-2xl bg-white shadow-xl'>
				<div className='flex items-center justify-between border-b px-5 py-3'>
					<h3 className='text-lg font-semibold'>{title}</h3>
					<button onClick={onClose} className='rounded-xl px-2 py-1 text-slate-500 hover:bg-slate-100'>
						✕
					</button>
				</div>
				<div className='px-5 py-4'>{children}</div>
				{footer && <div className='border-t px-5 py-3 flex justify-end gap-2'>{footer}</div>}
			</div>
		</div>
	);
}
