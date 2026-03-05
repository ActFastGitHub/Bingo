"use client";
import { Howl } from "howler";

const KEY = "bingo_sfx_enabled";
let enabled = true;

if (typeof window !== "undefined") {
	const raw = localStorage.getItem(KEY);
	enabled = raw == null ? true : raw === "1";
}

// Lazy Howl cache so we don’t re-create between plays
const cache: Record<string, Howl | null> = {};

const files: Record<string, string> = {
	click: "/sfx/click.mp3",
	join: "/sfx/join.mp3",
	call: "/sfx/call.mp3",
	undo: "/sfx/undo.mp3",
	start: "/sfx/start.mp3",
	end: "/sfx/end.mp3",
	winner: "/sfx/winner.mp3",
	error: "/sfx/error.mp3"
};

function getHowl(name: string) {
	if (!cache[name]) {
		cache[name] = new Howl({ src: [files[name]], volume: 0.8, html5: false });
	}
	return cache[name]!;
}

export const sfx = {
	play(name: keyof typeof files) {
		if (!enabled) return;
		const file = files[name];
		if (!file) return;
		try {
			getHowl(name).play();
		} catch {}
	},
	setEnabled(v: boolean) {
		enabled = v;
		if (typeof window !== "undefined") localStorage.setItem(KEY, v ? "1" : "0");
	},
	isEnabled() {
		return enabled;
	}
};

// Confetti helper (winner, start, etc.)
import confetti from "canvas-confetti";

export function burstConfetti(power: number = 0.8) {
	try {
		const count = Math.round(120 * power);
		const defaults = { spread: 70, startVelocity: 32, ticks: 200, gravity: 0.9, scalar: 1 };
		confetti({ particleCount: Math.round(count * 0.5), angle: 60, origin: { x: 0 }, ...defaults });
		confetti({ particleCount: Math.round(count * 0.5), angle: 120, origin: { x: 1 }, ...defaults });
	} catch {}
}
