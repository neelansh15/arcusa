"use client";

const DIGITS = "0123456789".split("");

/** A price whose digits roll (slide vertically) to the new value instead of jumping. Non-digits stay put. */
export function RollingPrice({ value, className }: { value: string; className?: string }) {
  const chars = value.split("");
  return (
    <span className={`roll ${className ?? ""}`} aria-label={value} role="text">
      {chars.map((c, i) => {
        const key = chars.length - i; // keyed from the right so the cents column keeps its identity when a digit is added
        return /\d/.test(c) ? (
          <span className="roll-digit" key={key} aria-hidden="true">
            <span className="roll-strip" style={{ transform: `translateY(${-Number(c)}em)` }}>
              {DIGITS.map((d) => (<span key={d}>{d}</span>))}
            </span>
          </span>
        ) : (
          <span key={key} aria-hidden="true">{c}</span>
        );
      })}
    </span>
  );
}
