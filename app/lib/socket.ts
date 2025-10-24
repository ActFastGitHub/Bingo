import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
    socket = io(url, { transports: ["websocket"], autoConnect: true });
  }
  return socket;
}

export async function waitForConnected(sock: Socket): Promise<void> {
  if (sock.connected) return;
  await new Promise<void>((resolve) => {
    const onConnect = () => { sock.off("connect", onConnect); resolve(); };
    sock.on("connect", onConnect);
    // Defensive timeout fallback
    setTimeout(() => resolve(), 2000);
  });
}
