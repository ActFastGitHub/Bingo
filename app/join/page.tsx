// app/join/page.tsx

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function JoinPage() {
  const [code, setCode] = useState("");
  const router = useRouter();

  const go = () => {
    const c = code.trim().toUpperCase();
    if (c.length !== 6) return toast.error("Enter the 6-character room code");
    router.push(`/play/${c}`);
  };

  return (
    <section className="grid place-items-center min-h-[60vh]">
      <div className="card p-6 w-full max-w-sm space-y-4">
        <h2 className="text-2xl font-bold text-center">Join a Room</h2>
        <input
          className="w-full border rounded-2xl p-3"
          placeholder="Enter 6-char code (e.g., ABC123)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button className="w-full rounded-2xl px-5 py-3 text-lg text-white bg-gradient-to-br from-slate-900 to-slate-800 hover:opacity-95 shadow-sm" onClick={go}>
          Continue
        </button>
      </div>
    </section>
  );
}
