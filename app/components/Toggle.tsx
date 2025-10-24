"use client";
import { ComponentProps } from "react";

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
} & Omit<ComponentProps<"button">, "onChange">;

export default function Toggle({ checked, onChange, label, disabled, ...rest }: Props) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => !disabled && onChange(!checked)}
      className={[
        "group inline-flex items-center gap-3 select-none",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
      ].join(" ")}
      {...rest}
    >
      <span
        className={[
          "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-indigo-600" : "bg-slate-300"
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          ].join(" ")}
        />
      </span>
      {label && <span className="text-sm text-slate-700">{label}</span>}
    </button>
  );
}
