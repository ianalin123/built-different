"use client";

import { useState } from "react";

export function CopyField({ value, display }: { value: string; display?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-md border border-line bg-cream px-3 py-2 font-mono text-xs text-ink-2">
      <span className="truncate">{display ?? value}</span>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="ml-auto shrink-0 font-sans font-medium text-ink-3 hover:text-ink-2"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export function PrintButton({ className }: { className: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      Download / Print
    </button>
  );
}
