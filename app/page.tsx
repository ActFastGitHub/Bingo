import Link from "next/link";

export default function Home() {
  return (
    <section className="min-h-[70vh] grid place-items-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Bingo Party</h1>
        <p className="text-slate-600 max-w-xl mx-auto">
          Host draws on their phone. Everyone joins on theirs. Simple, fast, and fun.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/host" className="inline-flex items-center justify-center font-semibold rounded-2xl px-5 py-3 text-lg text-white bg-gradient-to-br from-indigo-500 to-indigo-700 hover:opacity-95 shadow-sm">
            Host a Game
          </Link>
          <Link href="/join" className="inline-flex items-center justify-center font-semibold rounded-2xl px-5 py-3 text-lg text-white bg-gradient-to-br from-amber-400 to-orange-600 hover:opacity-95 shadow-sm">
            Join a Game
          </Link>
        </div>
      </div>
    </section>
  );
}
