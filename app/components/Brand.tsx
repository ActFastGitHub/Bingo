"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Brand() {
  const [imgErr, setImgErr] = useState(false);

  return (
    <Link href="/" className="flex items-center gap-2">
      {!imgErr ? (
        <Image
          src="/logo.png"
          alt="Logo"
          width={180}      // 🔹 Increase this width (default was 120)
          height={42}      // 🔹 Increase this height (default was 28)
          className="h-14 w-auto object-contain"  // 🔹 h-10 (40px) – try h-12 or h-14 if you want it larger
          onError={() => setImgErr(true)}
          priority
        />
      ) : (
        <span className="text-xl font-bold tracking-wide">Your Logo</span> // text size adjusted
      )}
    </Link>
  );
}
