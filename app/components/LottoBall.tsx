// components/LottoBall.tsx

"use client";

type Size = "sm" | "md" | "lg" | "xl";
const sizes: Record<Size, string> = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10",
  lg: "h-12 w-12 text-lg",
  xl: "h-20 w-20 text-3xl",
};

function colorForNumber(n: number) {
  const hue = (n * 37) % 360;
  return {
    base: `hsl(${hue} 85% 48%)`,
    dark: `hsl(${hue} 85% 36%)`,
  };
}

export default function LottoBall({
  value, size = "md", glow = false,
}: { value: number | string; size?: Size; glow?: boolean }) {
  const colored = typeof value === "number";
  const { base, dark } = colored ? colorForNumber(value as number) : { base: "hsl(210 20% 95%)", dark: "hsl(210 20% 75%)" };

  return (
    <div
      className={`rounded-full border flex items-center justify-center font-black select-none shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_4px_10px_rgba(0,0,0,0.12)] text-white ${sizes[size]}`}
      style={{
        backgroundImage: `linear-gradient(135deg, ${base}, ${dark})`,
        borderColor: dark,
        filter: glow ? "drop-shadow(0 8px 16px rgba(0,0,0,.18))" : undefined,
      }}
    >
      {value}
    </div>
  );
}

// asdasd

