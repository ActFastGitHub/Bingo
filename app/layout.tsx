import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Brand from "@/app/components/Brand";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"]
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"]
});

export const metadata: Metadata = {
	title: "Bingo Party",
	description: "Realtime phone-based bingo for your party"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang='en'>
			<body className='min-h-screen antialiased bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-800'>
				<header className='sticky top-0 z-40 backdrop-blur bg-white/70 border-b'>
					<div className='max-w-5xl mx-auto px-4 py-3 flex items-center justify-between'>
						<Brand />
						<nav className='text-sm text-slate-600'>
							<a className='hover:text-slate-900' href='/'>
								Home
							</a>
						</nav>
					</div>
				</header>

				<main className='max-w-5xl mx-auto px-4 pb-24 pt-6'>{children}</main>

				<Toaster position='top-center' toastOptions={{ duration: 2000 }} />
			</body>
		</html>
	);
}
