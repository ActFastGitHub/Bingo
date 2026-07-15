import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Brand from "@/app/components/Brand";
import SoundToggle from "@/app/components/SoundToggle";

export const metadata: Metadata = {
	title: { default: "ActFAST Bingo", template: "%s | ActFAST Bingo" },
	description: "A fast, friendly real-time bingo game by ActFAST Restoration."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang='en'>
			<body>
				<div className='site-shell'>
					<header className='site-header'>
						<div className='site-header-inner'>
							<Brand />
							<nav className='flex items-center gap-2' aria-label='Main navigation'>
								<Link className='hidden sm:inline-flex rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-white hover:text-slate-950' href='/'>
									Home
								</Link>
								<SoundToggle />
							</nav>
						</div>
					</header>
					<main className='site-main'>{children}</main>
				</div>
				<Toaster
					position='top-center'
					toastOptions={{
						duration: 2400,
						style: { borderRadius: "14px", border: "1px solid #e8e4df", color: "#17181c" }
					}}
				/>
			</body>
		</html>
	);
}
