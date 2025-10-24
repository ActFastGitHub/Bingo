// lib/socket.ts

"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!url) throw new Error("Missing NEXT_PUBLIC_SOCKET_URL");
    socket = io(url, { transports: ["websocket"] });
  }
  return socket;
}
