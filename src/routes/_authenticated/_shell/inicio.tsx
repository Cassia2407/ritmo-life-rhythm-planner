import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarCheck, Plus, Repeat, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, Panel, ProgressBar } from "@/components/ritmo/ui-bits";
import { TaskItem } from "@/components/ritmo/task-item";
import { HabitCheck } from "@/components/ritmo/habit-check";
import { useTaskDialog } from "@/components/ritmo/task-dialog";
import { categoriesQuery, habitLogsQuery, habitsQuery, profileQuery, tasksQuery } from "@/lib/data";
import { formatDateLong, isHabitScheduled, isOverdue, sortByTime, toISODate } from "@/lib/ritmo";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/_shell/inicio")({
  head: () => pageHead("Início", "Visão geral do seu dia no Ritmo."),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(profileQuery),
      context.queryClient.ensureQueryData(habitsQuery),
      context.queryClient.ensureQueryData(habitLogsQuery),
    ]),
  component: Inicio,
});

function greeting(h: number) {
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function Inicio() {
  const { data: profile } = useSuspenseQuery(profileQuery);
  const { data: tasks } = useSuspenseQuery(tasksQuery);
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { data: habits } = useSuspenseQuery(habitsQuery);
  const { data: logs } = useSuspenseQuery(habitLogsQuery);
  const { openForm } = useTaskDialog();

  const now = new Date();
  const today = toISODate(now);
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const pending = tasks.filter((t) => t.status === "pendente");
  const doneToday = tasks.filter(
    (t) => t.completed_at && toISODate(new Date(t.completed_at)) === today,
  );
  const overdue = pending.filter((t) => isOverdue(t, now));
  const dueToday = tasks.filter((t) => t.due_date === today);
  const upcoming = pending
    .filter((t) => t.due_date && t.due_date >= today)
    .sort((a, b) =>
      a.due_date! === b.due_date! ? sortByTime(a, b) : a.due_date!.localeCompare(b.due_date!),
    )
    .slice(0, 5);

  const todaysHabits = habits.filter((h) => isHabitScheduled(h, now));
  const loggedToday = new Set(logs.filter((l) => l.log_date === today).map((l) => l.habit_id));
  const habitsDone = todaysHabits.filter((h) => loggedToday.has(h.id)).length;

  const totalToday = dueToday.length + todaysHabits.length;
  const doneTodayCount = dueToday.filter((t) => t.status === "concluida").length + habitsDone;
  const progress = totalToday > 0 ? Math.round((doneTodayCount / totalToday) * 100) : null;

  const firstName = profile.displayName.split(" ")[0];
  const isEmpty = tasks.length === 0 && habits.length === 0;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground first-letter:uppercase">{formatDateLong(now)}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
            {greeting(now.getHours())}
            {firstName ? `, ${firstName}` : ""}.
          </h1>
        </div>
        <Button onClick={() => openForm({ defaults: { due_date: today } })}>
          <Plus /> Adicionar atividade
        </Button>
      </div>

      {isEmpty ? (
        <EmptyState
          icon={Sparkles}
          title="Seu dia começa aqui."
          description="Adicione sua primeira atividade para se organizar melhor."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => openForm({ defaults: { due_date: today } })}>
                <Plus /> Primeira atividade
              </Button>
              <Button variant="outline" asChild>
                <Link to="/habitos">Criar um hábito</Link>
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="grid grid-cols-2 gap-4 lg:col-span-3 lg:grid-cols-3">
            <Stat
              label="Tarefas pendentes"
              value={pending.length}
              hint={overdue.length ? `${overdue.length} atrasada(s)` : undefined}
            />
            <Stat label="Concluídas hoje" value={doneToday.length} />
            <div className="col-span-2 rounded-xl border bg-card p-5 shadow-soft lg:col-span-1">
              <p className="text-sm text-muted-foreground">Progresso de hoje</p>
              {progress === null ? (
                <p className="mt-2 text-sm">Nada programado para hoje.</p>
              ) : (
                <>
                  <p className="mt-1 text-2xl font-semibold">{progress}%</p>
                  <ProgressBar value={progress} className="mt-2" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {doneTodayCount} de {totalToday} itens de hoje (tarefas e hábitos)
                  </p>
                </>
              )}
            </div>
          </div>

          <Panel
            className="lg:col-span-2"
            title="Próximas atividades"
            action={
              <Link
                to="/tarefas"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Ver todas as tarefas <ArrowRight className="h-3 w-3" />
              </Link>
            }
          >
            {upcoming.length === 0 ? (
              <EmptyState
                compact
                icon={CalendarCheck}
                title="Nenhuma atividade agendada"
                description={
                  overdue.length
                    ? "Há tarefas atrasadas na sua lista."
                    : "Adicione uma atividade com data para vê-la aqui."
                }
              />
            ) : (
              <div className="space-y-2">
                {upcoming.map((t) => (
                  <TaskItem key={t.id} task={t} category={catById.get(t.category_id ?? "")} />
                ))}
              </div>
            )}
          </Panel>

          <Panel
            title="Hábitos de hoje"
            action={
              <Link to="/habitos" className="text-xs text-primary hover:underline">
                Gerenciar
              </Link>
            }
          >
            {todaysHabits.length === 0 ? (
              <EmptyState
                compact
                icon={Repeat}
                title={habits.length ? "Nenhum hábito para hoje" : "Sem hábitos ainda"}
                description={habits.length ? undefined : "Crie hábitos para acompanhá-los aqui."}
              />
            ) : (
              <ul className="space-y-2.5">
                {todaysHabits.map((h) => (
                  <li key={h.id} className="flex items-center gap-3">
                    <HabitCheck
                      habitId={h.id}
                      date={today}
                      done={loggedToday.has(h.id)}
                      label={`Marcar ${h.name} como feito hoje`}
                    />
                    <span className="text-sm">{h.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string | undefined }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-soft">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-warning">{hint}</p>}
    </div>
  );
}
