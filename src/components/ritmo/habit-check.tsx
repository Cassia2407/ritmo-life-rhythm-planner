import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { toggleHabitLog, useInvalidate } from "@/lib/data";
import { cn } from "@/lib/utils";

export function HabitCheck({
  habitId,
  date,
  done,
  label,
  size = "md",
}: {
  habitId: string;
  date: string;
  done: boolean;
  label: string;
  size?: "sm" | "md";
}) {
  const invalidate = useInvalidate();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      aria-pressed={done}
      aria-label={label}
      title={label}
      onClick={async () => {
        setBusy(true);
        try {
          await toggleHabitLog(habitId, date, !done);
          await invalidate("habit_logs");
        } catch (e) {
          toast.error("Não foi possível registrar", { description: (e as Error).message });
        } finally {
          setBusy(false);
        }
      }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-2 transition-colors disabled:opacity-60",
        size === "md" ? "h-7 w-7" : "h-6 w-6",
        done ? "border-sage bg-sage text-sage-foreground" : "border-input hover:border-sage",
      )}
    >
      {done && <Check className={size === "md" ? "h-4 w-4" : "h-3 w-3"} strokeWidth={3} />}
    </button>
  );
}
