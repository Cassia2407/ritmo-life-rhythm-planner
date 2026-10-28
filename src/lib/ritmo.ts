import {
  addDays,
  differenceInCalendarDays,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

export type Task = Tables<"tasks">;
export type Category = Tables<"categories">;
export type Goal = Tables<"goals">;
export type Habit = Tables<"habits">;
export type HabitLog = Tables<"habit_logs">;

export type Priority = "baixa" | "media" | "alta";
export type TaskStatus = "pendente" | "concluida";
export type GoalStatus = "em_andamento" | "concluido" | "pausado";

export const PRIORITY_LABEL: Record<Priority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};
export const PRIORITY_WEIGHT: Record<Priority, number> = { alta: 3, media: 2, baixa: 1 };

export const GOAL_STATUS_LABEL: Record<GoalStatus, string> = {
  em_andamento: "Em andamento",
  concluido: "Concluído",
  pausado: "Pausado",
};

export const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const CATEGORY_COLORS = [
  "#789FCB",
  "#A8C5B0",
  "#E5B57A",
  "#D9938B",
  "#B39DCB",
  "#7FB8B8",
  "#C9B87A",
  "#9AA5AE",
];

/** Local calendar date as yyyy-MM-dd. */
export function toISODate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function fromISODate(s: string): Date {
  return parseISO(s);
}

export function formatDateLong(d: Date): string {
  return format(d, "EEEE, d 'de' MMMM", { locale: ptBR });
}

export function formatDateShort(s: string): string {
  return format(parseISO(s), "d MMM", { locale: ptBR });
}

export function formatTime(t: string | null | undefined): string {
  return t ? t.slice(0, 5) : "";
}

/** End time must be strictly after start time when both are informed. */
export function isTimeRangeValid(start?: string | null, end?: string | null): boolean {
  if (!start || !end) return true;
  return end.slice(0, 5) > start.slice(0, 5);
}

/**
 * A pending task is overdue when its date is before today, or when it is due today
 * and its (end or start) time has already passed.
 */
export function isOverdue(
  task: Pick<Task, "status" | "due_date" | "start_time" | "end_time">,
  now: Date = new Date(),
): boolean {
  if (task.status !== "pendente" || !task.due_date) return false;
  const today = toISODate(now);
  if (task.due_date < today) return true;
  if (task.due_date > today) return false;
  const t = task.end_time ?? task.start_time;
  if (!t) return false;
  return t.slice(0, 5) < format(now, "HH:mm");
}

/** Percentage of linked tasks completed, or null when the goal has no linked tasks. */
export function goalProgress(tasks: Pick<Task, "status">[]): number | null {
  if (tasks.length === 0) return null;
  const done = tasks.filter((t) => t.status === "concluida").length;
  return Math.round((done / tasks.length) * 100);
}

export function isHabitScheduled(
  habit: Pick<Habit, "frequency" | "week_days" | "start_date">,
  date: Date,
): boolean {
  if (toISODate(date) < habit.start_date) return false;
  if (habit.frequency === "diaria") return true;
  return habit.week_days.includes(date.getDay());
}

/** Scheduled days and completed scheduled days between two dates (inclusive). */
export function habitStats(
  habit: Pick<Habit, "frequency" | "week_days" | "start_date">,
  logDates: Set<string>,
  from: Date,
  to: Date,
): { scheduled: number; done: number } {
  let scheduled = 0;
  let done = 0;
  const days = differenceInCalendarDays(to, from);
  for (let i = 0; i <= days; i++) {
    const d = addDays(startOfDay(from), i);
    if (!isHabitScheduled(habit, d)) continue;
    scheduled++;
    if (logDates.has(toISODate(d))) done++;
  }
  return { scheduled, done };
}

/** Consecutive scheduled days completed, counting back from today (today may still be open). */
export function habitStreak(
  habit: Pick<Habit, "frequency" | "week_days" | "start_date">,
  logDates: Set<string>,
  today: Date = new Date(),
): number {
  let streak = 0;
  let d = startOfDay(today);
  const start = parseISO(habit.start_date);
  for (let i = 0; i < 400 && !isBefore(d, start); i++) {
    if (isHabitScheduled(habit, d)) {
      const key = toISODate(d);
      if (logDates.has(key)) streak++;
      else if (i !== 0) break;
    }
    d = addDays(d, -1);
  }
  return streak;
}

export function isWithin(dateIso: string, from: Date, to: Date): boolean {
  const d = parseISO(dateIso);
  return !isBefore(d, startOfDay(from)) && !isAfter(d, to);
}

export function sortByTime(a: Task, b: Task): number {
  const ta = a.start_time ?? "99";
  const tb = b.start_time ?? "99";
  return ta.localeCompare(tb);
}
