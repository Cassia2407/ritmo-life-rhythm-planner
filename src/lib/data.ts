import { queryOptions, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => {
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData.user) throw new Error("Sessão expirada");
    const user = userData.user;
    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    return {
      id: user.id,
      email: user.email ?? "",
      displayName: data?.display_name ?? (user.user_metadata?.["display_name"] as string | undefined) ?? "",
    };
  },
});

export const tasksQuery = queryOptions({
  queryKey: ["tasks"],
  queryFn: async () =>
    unwrap(await supabase.from("tasks").select("*").order("created_at", { ascending: false })),
});

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => unwrap(await supabase.from("categories").select("*").order("name")),
});

export const goalsQuery = queryOptions({
  queryKey: ["goals"],
  queryFn: async () =>
    unwrap(await supabase.from("goals").select("*").order("created_at", { ascending: false })),
});

export const habitsQuery = queryOptions({
  queryKey: ["habits"],
  queryFn: async () =>
    unwrap(await supabase.from("habits").select("*").order("created_at", { ascending: true })),
});

export const habitLogsQuery = queryOptions({
  queryKey: ["habit_logs"],
  queryFn: async () => unwrap(await supabase.from("habit_logs").select("*")),
});

export function useInvalidate() {
  const qc = useQueryClient();
  return (...keys: string[]) =>
    Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: [k] })));
}

// ---------- Mutations ----------

export async function saveTask(input: TablesInsert<"tasks">, id?: string) {
  if (id) {
    unwrap(await supabase.from("tasks").update(input as TablesUpdate<"tasks">).eq("id", id));
  } else {
    unwrap(await supabase.from("tasks").insert(input));
  }
}

export async function setTaskStatus(id: string, done: boolean) {
  unwrap(
    await supabase
      .from("tasks")
      .update({
        status: done ? "concluida" : "pendente",
        completed_at: done ? new Date().toISOString() : null,
      })
      .eq("id", id),
  );
}

export async function deleteTask(id: string) {
  unwrap(await supabase.from("tasks").delete().eq("id", id));
}

export async function setTaskGoal(taskId: string, goalId: string | null) {
  unwrap(await supabase.from("tasks").update({ goal_id: goalId }).eq("id", taskId));
}

export async function saveCategory(input: { name: string; color: string }, id?: string) {
  if (id) unwrap(await supabase.from("categories").update(input).eq("id", id));
  else unwrap(await supabase.from("categories").insert(input));
}

export async function deleteCategory(id: string) {
  unwrap(await supabase.from("categories").delete().eq("id", id));
}

export async function saveGoal(input: TablesInsert<"goals">, id?: string) {
  if (id) unwrap(await supabase.from("goals").update(input as TablesUpdate<"goals">).eq("id", id));
  else unwrap(await supabase.from("goals").insert(input));
}

export async function deleteGoal(id: string) {
  unwrap(await supabase.from("goals").delete().eq("id", id));
}

export async function saveHabit(input: TablesInsert<"habits">, id?: string) {
  if (id) unwrap(await supabase.from("habits").update(input as TablesUpdate<"habits">).eq("id", id));
  else unwrap(await supabase.from("habits").insert(input));
}

export async function deleteHabit(id: string) {
  unwrap(await supabase.from("habits").delete().eq("id", id));
}

export async function toggleHabitLog(habitId: string, date: string, done: boolean) {
  if (done) {
    unwrap(
      await supabase
        .from("habit_logs")
        .upsert({ habit_id: habitId, log_date: date }, { onConflict: "habit_id,log_date" }),
    );
  } else {
    unwrap(await supabase.from("habit_logs").delete().eq("habit_id", habitId).eq("log_date", date));
  }
}

export async function updateTagAcrossTasks(tag: string, replacement: string | null) {
  const { data, error } = await supabase.from("tasks").select("id, tags").contains("tags", [tag]);
  if (error) throw new Error(error.message);
  for (const row of data ?? []) {
    const next = row.tags.filter((t) => t !== tag);
    if (replacement && !next.includes(replacement)) next.push(replacement);
    unwrap(await supabase.from("tasks").update({ tags: next }).eq("id", row.id));
  }
}

export async function updateDisplayName(id: string, name: string) {
  unwrap(await supabase.from("profiles").upsert({ id, display_name: name }));
}

export async function deleteAllMyData(userId: string) {
  // RLS restricts every delete to the signed-in user's rows.
  unwrap(await supabase.from("habit_logs").delete().eq("user_id", userId));
  unwrap(await supabase.from("habits").delete().eq("user_id", userId));
  unwrap(await supabase.from("tasks").delete().eq("user_id", userId));
  unwrap(await supabase.from("goals").delete().eq("user_id", userId));
  unwrap(await supabase.from("categories").delete().eq("user_id", userId));
}
