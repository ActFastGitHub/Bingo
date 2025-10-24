"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSocket } from "@/app/lib/socket";
import BingoCard from "@/app/components/BingoCard";
import LottoBall from "@/app/components/LottoBall";
import toast from "react-hot-toast";

export default function PlayerPage() {
  const params = useParams<{ code: string }>();
  const code = (params.code || "").toString().toUpperCase();

  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [card, setCard] = useState<any>(null);
  const [history, setHistory] = useState<number[]>([]);
  const calledSet = useMemo(() => new Set(history), [history]);

  useEffect(() => {
    const socket = getSocket();

    const onStarted = () => {
      setHistory([]);
      toast("New round!", { icon: "🎬" });
    };
    const onCalled = ({ n, history }: { n: number; history: number[] }) => {
      setHistory(history);
      toast(`Called: ${n}`, { icon: "🔔", duration: 1000 });
    };
    const onUndo = ({ history }: { history: number[] }) => {
      setHistory(history);
      toast("Host undid last call", { icon: "↩️", duration: 1000 });
    };
    const onWinner = (w: any) => {
      toast.success(`🎉 ${w.name} has BINGO!`);
    };

    socket.on("game:started", onStarted);
    socket.on("game:called", onCalled);
    socket.on("game:undo", onUndo);
    socket.on("game:winner", onWinner);

    return () => {
      socket.off("game:started", onStarted);
      socket.off("game:called", onCalled);
      socket.off("game:undo", onUndo);
      socket.off("game:winner", onWinner);
    };
  }, []);

  const join = () => {
    if (!name.trim()) return toast.error("Enter your name");
    getSocket().emit("player:join", { code, name: name.trim() }, (res: any) => {
      if (!res || !res.ok) return toast.error(res?.msg || "Join failed");
      // Log what the server sent for debugging
      try {
        // eslint-disable-next-line no-console
        console.log("[JOIN] received card:", res.card);
      } catch {}
      setCard(res.card);
      setJoined(true);
      toast.success("You joined the game");
    });
  };

  const claim = () => {
    getSocket().emit("player:claim_bingo", code, (res: any) => {
      if (!res?.ok) return toast.error(res?.msg || "Not valid yet");
      toast("Claim sent!", { icon: "📣" });
    });
  };

  return (
    <section className="space-y-5">
      <div className="card p-4 text-center">
        <div className="text-xs uppercase tracking-widest text-slate-500">Room</div>
        <div className="text-2xl font-bold tracking-widest">{code}</div>
      </div>

      {!joined ? (
        <div className="card p-5 space-y-3 max-w-md mx-auto">
          <input
            className="w-full border rounded-2xl p-3"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            className="w-full rounded-2xl px-5 py-3 text-lg text-white bg-gradient-to-br from-indigo-500 to-indigo-700 hover:opacity-95 shadow-sm"
            onClick={join}
          >
            Join Game
          </button>
        </div>
      ) : (
        <>
          <div className="card p-4">
            <BingoCard card={card} calledSet={calledSet} />
            <button
              className="w-full mt-4 rounded-2xl px-5 py-3 text-lg text-white bg-gradient-to-br from-emerald-500 to-emerald-700 hover:opacity-95 shadow-sm"
              onClick={claim}
            >
              Claim BINGO!
            </button>
          </div>

          <div className="card p-4">
            <div className="text-slate-600 text-sm mb-2">Called numbers ({history.length})</div>
            <div className="flex flex-wrap gap-3">
              {history.slice(-50).map((n, i) => (
                <LottoBall key={`${n}-${i}`} value={n} size="lg" />
              ))}
            </div>
          </div>

          {/* Dev-only debug: see the raw card shape the server sent */}
          {process.env.NODE_ENV !== "production" && (
            <details className="card p-4">
              <summary className="cursor-pointer text-sm font-medium">Debug: raw card payload</summary>
              <pre className="mt-3 text-xs whitespace-pre-wrap break-all">
                {(() => {
                  try {
                    return JSON.stringify(card, null, 2);
                  } catch {
                    return String(card);
                  }
                })()}
              </pre>
            </details>
          )}
        </>
      )}
    </section>
  );
}
