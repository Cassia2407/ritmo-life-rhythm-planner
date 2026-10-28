import { describe, expect, it } from "vitest";
import {
  goalProgress,
  habitStats,
  habitStreak,
  isHabitScheduled,
  isOverdue,
  isTimeRangeValid,
} from "@/lib/ritmo";

const now = new Date(2026, 9, 28, 14, 0); // 28 Oct 2026, 14:00 local

describe("tarefas atrasadas", () => {
  it("pending task dated yesterday is overdue", () => {
    expect(
      isOverdue(
        { status: "pendente", due_date: "2026-10-27", start_time: null, end_time: null },
        now,
      ),
    ).toBe(true);
  });
  it("completed task is never overdue", () => {
    expect(
      isOverdue(
        { status: "concluida", due_date: "2026-10-01", start_time: null, end_time: null },
        now,
      ),
    ).toBe(false);
  });
  it("task today whose end time passed is overdue, untimed task today is not", () => {
    expect(
      isOverdue(
        { status: "pendente", due_date: "2026-10-28", start_time: "09:00", end_time: "10:00" },
        now,
      ),
    ).toBe(true);
    expect(
      isOverdue(
        { status: "pendente", due_date: "2026-10-28", start_time: null, end_time: null },
        now,
      ),
    ).toBe(false);
  });
});

describe("horários", () => {
  it("rejects end time before or equal to start time", () => {
    expect(isTimeRangeValid("10:00", "09:30")).toBe(false);
    expect(isTimeRangeValid("10:00", "10:00")).toBe(false);
    expect(isTimeRangeValid("10:00", "11:00")).toBe(true);
    expect(isTimeRangeValid("10:00", null)).toBe(true);
  });
});

describe("progresso das metas", () => {
  it("has no percentage without linked tasks", () => {
    expect(goalProgress([])).toBeNull();
  });
  it("is the share of completed linked tasks", () => {
    expect(
      goalProgress([
        { status: "concluida" },
        { status: "pendente" },
        { status: "pendente" },
        { status: "concluida" },
      ]),
    ).toBe(50);
  });
});

describe("hábitos", () => {
  const weekdays = { frequency: "dias_especificos", week_days: [1, 3], start_date: "2026-10-01" };
  it("only schedules on chosen weekdays after the start date", () => {
    expect(isHabitScheduled(weekdays, new Date(2026, 9, 26))).toBe(true); // Monday
    expect(isHabitScheduled(weekdays, new Date(2026, 9, 27))).toBe(false); // Tuesday
    expect(isHabitScheduled(weekdays, new Date(2026, 8, 28))).toBe(false); // before start
  });
  it("counts scheduled and done days", () => {
    const daily = { frequency: "diaria", week_days: [], start_date: "2026-10-26" };
    const logs = new Set(["2026-10-26", "2026-10-28"]);
    expect(habitStats(daily, logs, new Date(2026, 9, 26), new Date(2026, 9, 28))).toEqual({
      scheduled: 3,
      done: 2,
    });
  });
  it("streak counts back from today and tolerates today still open", () => {
    const daily = { frequency: "diaria", week_days: [], start_date: "2026-10-01" };
    expect(habitStreak(daily, new Set(["2026-10-26", "2026-10-27"]), now)).toBe(2);
    expect(habitStreak(daily, new Set(["2026-10-25", "2026-10-27", "2026-10-28"]), now)).toBe(2);
  });
});
