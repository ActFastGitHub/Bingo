// "use client";

// import { useParams } from "next/navigation";
// import { useEffect, useMemo, useRef, useState } from "react";
// import { getSocket, waitForConnected } from "@/app/lib/socket";
// import { getClientId } from "@/app/lib/clientId";
// import BingoCard from "@/app/components/BingoCard";
// import LottoBall from "@/app/components/LottoBall";
// import toast from "react-hot-toast";

// export default function PlayerPage() {
//   const params = useParams<{ code: string }>();
//   const code = (params.code || "").toString().toUpperCase();
//   const clientId = getClientId();

//   const [name, setName] = useState("");
//   const [joined, setJoined] = useState(false);
//   const [stickyName, setStickyName] = useState<string>(""); // server-sticky
//   const [cards, setCards] = useState<number[][][]>([]);
//   const [activeCard, setActiveCard] = useState(0);
//   const [history, setHistory] = useState<number[]>([]);
//   const [allowAutoMark, setAllowAutoMark] = useState(true);
//   const [autoMark, setAutoMark] = useState(true);
//   const [marks, setMarks] = useState<[number, number][][]>([]);
//   const [desiredCards, setDesiredCards] = useState(1);
//   const [locked, setLocked] = useState(false);
//   const [waitingMsg, setWaitingMsg] = useState<string>("");

//   const calledSet = useMemo(() => new Set(history), [history]);
//   const retryRef = useRef<number>(0);

//   // keep marks size synced
//   useEffect(() => {
//     setMarks((prev) => {
//       if (prev.length === cards.length) return prev;
//       return cards.map((_, i) => prev[i] ?? []);
//     });
//   }, [cards.length]);

//   useEffect(() => {
//     const socket = getSocket();

//     const policyAllow = (v: boolean) => {
//       setAllowAutoMark(v);
//       if (!v) setAutoMark(false);
//     };
//     const policyLocked = (v: boolean) => setLocked(v);

//     const onRoomUpdated = (summary: any) => {
//       if (typeof summary.allowAutoMark === "boolean") policyAllow(summary.allowAutoMark);
//       if (typeof summary.locked === "boolean") policyLocked(summary.locked);
//     };
//     const onStarted = () => {
//       setHistory([]);
//       setMarks((m) => m.map(() => []));
//       toast("New round!", { icon: "🎬" });
//     };
//     const onCalled = ({ n, history }: { n: number; history: number[] }) => {
//       setHistory(history);
//       toast(`Called: ${n}`, { icon: "🔔", duration: 900 });
//     };
//     const onUndo = ({ history }: { history: number[] }) => {
//       setHistory(history);
//       toast("Host undid last call", { icon: "↩️", duration: 900 });
//     };
//     const onWinner = (w: any) => {
//       toast.success(`🎉 ${w.name} has BINGO! (${w.pattern})`);
//     };
//     const onActiveCard = (idx: number) => setActiveCard(idx);
//     const onMarksCorrected = (payload: { cardIndex: number; marks: [number, number][] }) => {
//       setMarks((prev) => {
//         const next = prev.slice();
//         next[payload.cardIndex] = payload.marks;
//         return next;
//       });
//       toast("Incorrect marks cleared on this card", { icon: "🧹", duration: 1500 });
//     };

//     socket.on("room:updated", onRoomUpdated);
//     socket.on("policy:allow_automark", policyAllow);
//     socket.on("policy:locked", policyLocked);
//     socket.on("game:started", onStarted);
//     socket.on("game:called", onCalled);
//     socket.on("game:undo", onUndo);
//     socket.on("game:winner", onWinner);
//     socket.on("player:active_card", onActiveCard);
//     socket.on("player:marks_corrected", onMarksCorrected);

//     return () => {
//       socket.off("room:updated", onRoomUpdated);
//       socket.off("policy:allow_automark", policyAllow);
//       socket.off("policy:locked", policyLocked);
//       socket.off("game:started", onStarted);
//       socket.off("game:called", onCalled);
//       socket.off("game:undo", onUndo);
//       socket.off("game:winner", onWinner);
//       socket.off("player:active_card", onActiveCard);
//       socket.off("player:marks_corrected", onMarksCorrected);
//     };
//   }, []);

//   // Pre-join: wait for socket, watch room with retry backoff
//   useEffect(() => {
//     (async () => {
//       const socket = getSocket();
//       await waitForConnected(socket);

//       const tryWatch = () => {
//         socket.emit("room:watch", code, (res: any) => {
//           if (res?.ok && res.summary) {
//             setWaitingMsg("");
//             if (typeof res.summary.allowAutoMark === "boolean") {
//               setAllowAutoMark(res.summary.allowAutoMark);
//               if (!res.summary.allowAutoMark) setAutoMark(false);
//             }
//             if (typeof res.summary.locked === "boolean") setLocked(res.summary.locked);
//             retryRef.current = 0;
//             return;
//           }
//           // Not found yet -> retry with backoff up to ~5s
//           const attempt = ++retryRef.current;
//           const delay = Math.min(500 * 2 ** (attempt - 1), 5000);
//           setWaitingMsg("Waiting for host to create the room…");
//           setTimeout(tryWatch, delay);
//         });
//       };

//       // Also confirm existence quickly
//       socket.emit("room:exists", code, (res: any) => {
//         if (!res?.ok) setWaitingMsg("Waiting for host to create the room…");
//         tryWatch();
//       });
//     })();
//   }, [code]);

//   // Push marks for the active card in manual mode
//   useEffect(() => {
//     if (!joined || autoMark) return;
//     getSocket().emit("player:update_marks", code, clientId, activeCard, marks[activeCard] ?? []);
//   }, [joined, autoMark, marks, activeCard, code, clientId]);

//   const join = () => {
//     if (!name.trim() && !stickyName) return toast.error("Enter your name");

//     getSocket().emit(
//       "player:join",
//       {
//         code,
//         name: stickyName || name.trim(), // send prior sticky name if we have it
//         clientId,
//         cardCount: desiredCards,
//         autoMark,
//         manual: !autoMark,
//         marks,
//       },
//       (res: any) => {
//         if (!res?.ok) return toast.error(res?.msg || "Join failed");
//         setCards(res.cards || []);
//         setJoined(true);
//         if (res.name) { setStickyName(res.name); setName(res.name); } // server-sticky
//         if (typeof res.allowAutoMark === "boolean") {
//           setAllowAutoMark(res.allowAutoMark);
//           if (!res.allowAutoMark) setAutoMark(false);
//         }
//         if (typeof res.activeCard === "number") setActiveCard(res.activeCard);
//         toast.success("You joined the game");
//       }
//     );
//   };

//   const claim = () => {
//     getSocket().emit("player:claim_bingo", code, clientId, activeCard, (res: any) => {
//       if (!res?.ok) return toast.error(res?.msg || "Not valid yet");
//       toast("Claim sent!", { icon: "📣" });
//     });
//   };

//   const toggleCell = (r: number, c: number) => {
//     if (autoMark) return;
//     setMarks((prev) => {
//       const next = prev.map((x) => x.slice());
//       const arr = next[activeCard] ?? [];
//       const i = arr.findIndex(([rr, cc]) => rr === r && cc === c);
//       if (i >= 0) arr.splice(i, 1);
//       else if (arr.length < 25) arr.push([r, c]);
//       next[activeCard] = arr;
//       return next;
//     });
//   };

//   return (
//     <section className="space-y-5">
//       <div className="card p-4 text-center">
//         <div className="text-xs uppercase tracking-widest text-slate-500">Room</div>
//         <div className="text-2xl font-bold tracking-widest">{code}</div>
//         {!!waitingMsg && !joined && <div className="text-xs text-slate-500 mt-2">{waitingMsg}</div>}
//       </div>

//       {!joined ? (
//         <div className="card p-5 space-y-4 max-w-md mx-auto">
//           <input
//             className="w-full border rounded-2xl p-3"
//             placeholder="Your name"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             disabled={!!stickyName}           // prevent renaming if already known
//           />
//           {stickyName && (
//             <div className="text-xs text-slate-500">
//               Name is locked for this room as <span className="font-semibold">{stickyName}</span>.
//             </div>
//           )}

//           <div className="flex items-center gap-2">
//             <label className="text-sm text-slate-600">Number of cards</label>
//             <select
//               className="border rounded-xl p-2"
//               value={desiredCards}
//               onChange={(e) => setDesiredCards(Math.max(1, Math.min(4, Number(e.target.value))))}
//               disabled={stickyName !== ""}    // if returning player, keep prior count/cards
//             >
//               {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
//             </select>
//           </div>

//           {locked && (
//             <div className="text-xs px-2 py-1 rounded-full bg-rose-100 text-rose-700 inline-block">
//               Lobby locked — please wait for next round
//             </div>
//           )}

//           {allowAutoMark ? (
//             <label className="flex items-center gap-2 text-sm">
//               <input
//                 type="checkbox"
//                 checked={autoMark}
//                 onChange={(e) => setAutoMark(e.target.checked)}
//               />
//               Auto-mark tiles when numbers are called
//             </label>
//           ) : (
//             <div className="text-sm text-slate-500">Host requires manual marking</div>
//           )}

//           <button
//             className="w-full rounded-2xl px-5 py-3 text-lg text-white bg-gradient-to-br from-indigo-500 to-indigo-700 hover:opacity-95 shadow-sm disabled:opacity-50"
//             onClick={join}
//             disabled={locked && !stickyName}
//           >
//             Join Game
//           </button>
//         </div>
//       ) : (
//         <>
//           {/* Card switcher */}
//           {cards.length > 1 && (
//             <div className="card p-3 flex gap-2 flex-wrap">
//               {cards.map((_, i) => (
//                 <button
//                   key={i}
//                   className={`px-3 py-1 rounded-2xl border ${i===activeCard ? "bg-indigo-600 text-white border-indigo-700" : "bg-white"}`}
//                   onClick={() => {
//                     setActiveCard(i);
//                     getSocket().emit("player:switch_card", code, clientId, i);
//                   }}
//                 >
//                   Card {i+1}
//                 </button>
//               ))}
//             </div>
//           )}

//           <div className="card p-4">
//             <BingoCard
//               card={cards[activeCard]}
//               calledSet={calledSet}
//               manual={!autoMark}
//               marks={marks[activeCard] ?? []}
//               onToggle={toggleCell}
//             />
//             <div className="flex justify-between items-center gap-2 mt-4">
//               <label className="flex items-center gap-2 text-sm">
//                 <input
//                   type="checkbox"
//                   checked={autoMark}
//                   disabled={!allowAutoMark}
//                   onChange={(e) => setAutoMark(e.target.checked)}
//                 />
//                 Auto-mark
//               </label>
//               <button
//                 className="rounded-2xl px-5 py-3 text-lg text-white bg-gradient-to-br from-emerald-500 to-emerald-700 hover:opacity-95 shadow-sm"
//                 onClick={claim}
//               >
//                 Claim BINGO!
//               </button>
//             </div>
//           </div>

//           <div className="card p-4">
//             <div className="text-slate-600 text-sm mb-2">Called numbers ({history.length})</div>
//             <div className="flex flex-wrap gap-3">
//               {history.slice(-50).map((n, i) => (
//                 <LottoBall key={`${n}-${i}`} value={n} size="lg" />
//               ))}
//             </div>
//           </div>
//         </>
//       )}
//     </section>
//   );
// }

"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getSocket, waitForConnected } from "@/app/lib/socket";
import { getClientId } from "@/app/lib/clientId";
import BingoCard from "@/app/components/BingoCard";
import LottoBall from "@/app/components/LottoBall";
import Toggle from "@/app/components/Toggle";
import toast from "react-hot-toast";

function colorFromId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return `hsl(${h} 85% 45%)`;
}
function shortId(id: string) {
  return id.slice(-4).toUpperCase();
}

export default function PlayerPage() {
  const params = useParams<{ code: string }>();
  const code = (params.code || "").toString().toUpperCase();
  const clientId = getClientId();

  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [stickyName, setStickyName] = useState<string>(""); // server-sticky
  const [cards, setCards] = useState<number[][][]>([]);
  const [activeCard, setActiveCard] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [allowAutoMark, setAllowAutoMark] = useState(true);
  const [autoMark, setAutoMark] = useState(true);
  const [marks, setMarks] = useState<[number, number][][]>([]);
  const [desiredCards, setDesiredCards] = useState(1);
  const [locked, setLocked] = useState(false);
  const [waitingMsg, setWaitingMsg] = useState<string>("");

  const calledSet = useMemo(() => new Set(history), [history]);
  const retryRef = useRef<number>(0);

  // keep marks size synced
  useEffect(() => {
    setMarks((prev) => {
      if (prev.length === cards.length) return prev;
      return cards.map((_, i) => prev[i] ?? []);
    });
  }, [cards.length]);

  useEffect(() => {
    const socket = getSocket();

    const policyAllow = (v: boolean) => {
      setAllowAutoMark(v);
      if (!v) setAutoMark(false);
    };
    const policyLocked = (v: boolean) => setLocked(v);

    const onRoomUpdated = (summary: any) => {
      if (typeof summary.allowAutoMark === "boolean") policyAllow(summary.allowAutoMark);
      if (typeof summary.locked === "boolean") policyLocked(summary.locked);
    };
    const onStarted = () => {
      setHistory([]);
      setMarks((m) => m.map(() => []));
      toast("New round!", { icon: "🎬" });
    };
    const onCalled = ({ n, history }: { n: number; history: number[] }) => {
      setHistory(history);
      toast(`Called: ${n}`, { icon: "🔔", duration: 900 });
    };
    const onUndo = ({ history }: { history: number[] }) => {
      setHistory(history);
      toast("Host undid last call", { icon: "↩️", duration: 900 });
    };
    const onWinner = (w: any) => {
      toast.success(`🎉 ${w.name} has BINGO! (${w.pattern})`);
    };
    const onActiveCard = (idx: number) => setActiveCard(idx);
    const onMarksCorrected = (payload: { cardIndex: number; marks: [number, number][] }) => {
      setMarks((prev) => {
        const next = prev.slice();
        next[payload.cardIndex] = payload.marks;
        return next;
      });
      toast("Incorrect marks cleared on this card", { icon: "🧹", duration: 1500 });
    };

    socket.on("room:updated", onRoomUpdated);
    socket.on("policy:allow_automark", policyAllow);
    socket.on("policy:locked", policyLocked);
    socket.on("game:started", onStarted);
    socket.on("game:called", onCalled);
    socket.on("game:undo", onUndo);
    socket.on("game:winner", onWinner);
    socket.on("player:active_card", onActiveCard);
    socket.on("player:marks_corrected", onMarksCorrected);

    return () => {
      socket.off("room:updated", onRoomUpdated);
      socket.off("policy:allow_automark", policyAllow);
      socket.off("policy:locked", policyLocked);
      socket.off("game:started", onStarted);
      socket.off("game:called", onCalled);
      socket.off("game:undo", onUndo);
      socket.off("game:winner", onWinner);
      socket.off("player:active_card", onActiveCard);
      socket.off("player:marks_corrected", onMarksCorrected);
    };
  }, []);

  // Pre-join: wait for socket, watch room with retry backoff
  useEffect(() => {
    (async () => {
      const socket = getSocket();
      await waitForConnected(socket);

      const tryWatch = () => {
        socket.emit("room:watch", code, (res: any) => {
          if (res?.ok && res.summary) {
            setWaitingMsg("");
            if (typeof res.summary.allowAutoMark === "boolean") {
              setAllowAutoMark(res.summary.allowAutoMark);
              if (!res.summary.allowAutoMark) setAutoMark(false);
            }
            if (typeof res.summary.locked === "boolean") setLocked(res.summary.locked);
            retryRef.current = 0;
            return;
          }
          // Not found yet -> retry with backoff up to ~5s
          const attempt = ++retryRef.current;
          const delay = Math.min(500 * 2 ** (attempt - 1), 5000);
          setWaitingMsg("Waiting for host to create the room…");
          setTimeout(tryWatch, delay);
        });
      };

      socket.emit("room:exists", code, (res: any) => {
        if (!res?.ok) setWaitingMsg("Waiting for host to create the room…");
        tryWatch();
      });
    })();
  }, [code]);

  // Push marks for the active card in manual mode
  useEffect(() => {
    if (!joined || autoMark) return;
    getSocket().emit("player:update_marks", code, clientId, activeCard, marks[activeCard] ?? []);
  }, [joined, autoMark, marks, activeCard, code, clientId]);

  const join = () => {
    if (!name.trim() && !stickyName) return toast.error("Enter your name");

    getSocket().emit(
      "player:join",
      {
        code,
        name: stickyName || name.trim(),
        clientId,
        cardCount: desiredCards,
        autoMark,
        manual: !autoMark,
        marks,
      },
      (res: any) => {
        if (!res?.ok) return toast.error(res?.msg || "Join failed");
        setCards(res.cards || []);
        setJoined(true);
        if (res.name) {
          setStickyName(res.name);
          setName(res.name);
        }
        if (typeof res.allowAutoMark === "boolean") {
          setAllowAutoMark(res.allowAutoMark);
          if (!res.allowAutoMark) setAutoMark(false);
        }
        if (typeof res.activeCard === "number") setActiveCard(res.activeCard);
        toast.success("You joined the game");
      }
    );
  };

  const claim = () => {
    getSocket().emit("player:claim_bingo", code, clientId, activeCard, (res: any) => {
      if (!res?.ok) return toast.error(res?.msg || "Not valid yet");
      toast("Claim sent!", { icon: "📣" });
    });
  };

  const toggleCell = (r: number, c: number) => {
    if (autoMark) return;
    setMarks((prev) => {
      const next = prev.map((x) => x.slice());
      const arr = next[activeCard] ?? [];
      const i = arr.findIndex(([rr, cc]) => rr === r && cc === c);
      if (i >= 0) arr.splice(i, 1);
      else if (arr.length < 25) arr.push([r, c]);
      next[activeCard] = arr;
      return next;
    });
  };

  const last = history.length ? history[history.length - 1] : null;

  return (
    <section className="space-y-5">
      {/* Top: room + identity pill (shows name after join) */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="card p-4 text-center">
          <div className="text-xs uppercase tracking-widest text-slate-500">Room</div>
          <div className="text-2xl font-bold tracking-widest">{code}</div>
          {!!waitingMsg && !joined && <div className="text-xs text-slate-500 mt-2">{waitingMsg}</div>}
        </div>

        <div className="card p-4 grid place-items-center">
          <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">Last Number</div>
          <LottoBall value={last ?? "—"} size="lg" />
        </div>
      </div>

      {!joined ? (
        <div className="card p-5 space-y-4 max-w-md mx-auto">
          <input
            className="w-full border rounded-2xl p-3"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!!stickyName}
          />
          {stickyName && (
            <div className="text-xs text-slate-500">
              Name is locked for this room as <span className="font-semibold">{stickyName}</span>.
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <label className="text-sm text-slate-600">Number of cards</label>
            <select
              className="border rounded-xl p-2"
              value={desiredCards}
              onChange={(e) => setDesiredCards(Math.max(1, Math.min(4, Number(e.target.value))))}
              disabled={stickyName !== ""}
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {locked && (
            <div className="text-xs px-2 py-1 rounded-full bg-rose-100 text-rose-700 inline-block">
              Lobby locked — please wait for next round
            </div>
          )}

          {/* Proper left-right toggle for Auto-mark */}
          <Toggle
            checked={autoMark}
            onChange={(v) => setAutoMark(v)}
            disabled={!allowAutoMark}
            label="Auto-mark tiles when numbers are called"
          />

          <button
            className="w-full rounded-2xl px-5 py-3 text-lg text-white bg-gradient-to-br from-indigo-500 to-indigo-700 hover:opacity-95 shadow-sm disabled:opacity-50"
            onClick={join}
            disabled={locked && !stickyName}
          >
            Join Game
          </button>
        </div>
      ) : (
        <>
          {/* Identity pill */}
          <div className="card p-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: colorFromId(clientId) }}
              />
              <div className="text-sm">
                You are <span className="font-semibold">{name}</span>{" "}
                <span className="text-xs text-slate-500 font-mono">#{shortId(clientId)}</span>
              </div>
            </div>
            <div className="text-xs text-slate-500">Cards: {cards.length}</div>
          </div>

          {/* Card switcher */}
          {cards.length > 1 && (
            <div className="card p-3 flex gap-2 flex-wrap">
              {cards.map((_, i) => (
                <button
                  key={i}
                  className={`px-3 py-1 rounded-2xl border ${
                    i === activeCard ? "bg-indigo-600 text-white border-indigo-700" : "bg-white"
                  }`}
                  onClick={() => {
                    setActiveCard(i);
                    getSocket().emit("player:switch_card", code, clientId, i);
                  }}
                >
                  Card {i + 1}
                </button>
              ))}
            </div>
          )}

          {/* Card + Controls */}
          <div className="grid gap-5 lg:grid-cols-[minmax(260px,420px),1fr]">
            <div className="card p-4">
              <BingoCard
                card={cards[activeCard]}
                calledSet={calledSet}
                manual={!autoMark}
                marks={marks[activeCard] ?? []}
                onToggle={toggleCell}
              />
              <div className="flex justify-between items-center gap-2 mt-4">
                <Toggle
                  checked={autoMark}
                  onChange={(v) => setAutoMark(v)}
                  disabled={!allowAutoMark}
                  label="Auto-mark"
                />
                <button
                  className="rounded-2xl px-5 py-3 text-lg text-white bg-gradient-to-br from-emerald-500 to-emerald-700 hover:opacity-95 shadow-sm"
                  onClick={claim}
                >
                  Claim BINGO!
                </button>
              </div>
            </div>

            <div className="card p-4">
              <div className="text-slate-600 text-sm mb-2">Called numbers ({history.length})</div>
              <div className="flex flex-wrap gap-3">
                {history.slice(-60).reverse().map((n, i) => (
                  <LottoBall key={`${n}-${i}`} value={n} size="lg" />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
