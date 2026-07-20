import { Check } from "lucide-react";

export function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="sm-rise fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-[#0e0e15]/95 px-5 py-2.5 text-sm backdrop-blur-xl"
    >
      <span className="inline-flex items-center gap-2">
        <Check className="h-4 w-4 text-emerald-300" strokeWidth={1.75} /> {message}
      </span>
    </div>
  );
}
