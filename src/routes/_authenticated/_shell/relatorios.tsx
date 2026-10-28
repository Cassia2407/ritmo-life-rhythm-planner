import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  min,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, PageHeader, Panel, ProgressBar } from "@/components/ritmo/ui-bits";
import { goalsQuery, habitLogsQuery, habitsQuery, tasksQuery } from "@/lib/data";
import {
  GOAL_STATUS_LABEL,
  goalProgress,
  habitStats,
  isOverdue,
  isWithin,
  toISODate,
  type GoalStatus,
} from "@/lib/ritmo";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/_shell/relatorios")({
  head: () => pageHead("Relatórios", "Resumo da sua produtividade com base nos seus registros."),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(habitsQuery),
      context.queryClient.ensureQueryData(habitLogsQuery),
    ]),
  component: Relatorios,
});

type Period = "semana" | "mes";

function Relatorios() {
  const { data: tasks } = useSuspenseQuery(tasksQuery);
  const { data: goals } = useSuspenseQuery(goalsQuery);
  const { data: habits } = useSuspenseQuery(habitsQuery);
  const { data: logs } = useSuspenseQuery(habitLogsQuery);
  const [period, setPeriod] = useState<Period>("semana");
  const [cursor, setCursor] = useState(() => new Date());

  const now = new Date();
  const from = period === "semana" ? startOfWeek(cursor) : startOfMonth(cursor);
  const to = period === "semana" ? endOfWeek(cursor) : endOfMonth(cursor);
  const isFuture = isAfter(from, now);
  const effectiveTo = min([to, now]);

  const data = useMemo(() => {
    const completed = tasks.filter((t) => t.completed_at && isWithin(toISODate(new Date(t.completed_at)), from, to));
    const pending = tasks.filter((t) => t.status === "pendente");
    const overdue = pending.filter((t) => isOverdue(t, now));
    const logsInPeriod = logs.filter((l) => isWithin(l.log_date, from, to));
    let scheduled = 0;
    let done = 0;
    if (!isFuture) {
      for (const h of habits) {
        const set = new Set(logs.filter((l) => l.habit_id === h.id).map((l) => l.log_date));
        const s = habitStats(h, set, from, effectiveTo);
        scheduled += s.scheduled;
        done += s.done;
      }
    }
    const days = eachDayOfInterval({ start: from, end: to }).map((d) => {
      const key = toISODate(d);
      return {
        key,
        label: period === "semana" ? format(d, "EEE", { locale: ptBR }) : format(d, "d"),
        tasks: completed.filter((t) => toISODate(new Date(t.completed_at!)) === key).length,
        habits: logsInPeriod.filter((l) => l.log_date === key).length,
      };
    });
    return { completed, pending, overdue, logsInPeriod, scheduled, done, days };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, logs, habits, from.getTime(), to.getTime()]);

  const maxDay = Math.max(1, ...data.days.map((d) => d.tasks + d.habits));
  const hasAnything = tasks.length > 0 || habits.length > 0 || goals.length > 0;
  const periodHasActivity = data.completed.length > 0 || data.logsInPeriod.length > 0;

  const label =
    period === "semana"
      ? `${format(from, "d MMM", { locale: ptBR })} – ${format(to, "d MMM yyyy", { locale: ptBR })}`
      : format(from, "MMMM 'de' yyyy", { locale: ptBR });

  if (!hasAnything) {
    return (
      <div>
        <PageHeader title="Relatórios e produtividade" />
        <EmptyState
          icon={BarChart3}
          title="Ainda não há registros"
          description="Os relatórios serão gerados conforme você usar o aplicativo — cadastrando e concluindo tarefas, registrando hábitos e criando metas."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Relatórios e produtividade" description="Tudo aqui vem dos seus registros reais." />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList>
            <TabsTrigger value="semana">Semana</TabsTrigger>
            <TabsTrigger value="mes">Mês</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Período anterior" onClick={() => setCursor((c) => (period === "semana" ? addWeeks(c, -1) : addMonths(c, -1)))}>
            <ChevronLeft />
          </Button>
          <span className="min-w-40 text-center text-sm font-medium capitalize">{label}</span>
          <Button variant="ghost" size="icon" aria-label="Próximo período" onClick={() => setCursor((c) => (period === "semana" ? addWeeks(c, 1) : addMonths(c, 1)))}>
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Concluídas no período" value={String(data.completed.length)} />
        <Stat label="Pendentes agora" value={String(data.pending.length)} hint={data.overdue.length ? `${data.overdue.length} atrasada(s)` : undefined} />
        <Stat label="Hábitos realizados" value={String(data.logsInPeriod.length)} />
        <Stat
          label="Constância dos hábitos"
          value={data.scheduled ? `${Math.round((data.done / data.scheduled) * 100)}%` : "—"}
          hint={data.scheduled ? `${data.done} de ${data.scheduled} dias programados` : "Sem hábitos programados no período"}
        />
      </div>

      <Panel title="Resumo de produtividade" className="mt-4">
        {!periodHasActivity ? (
          <p className="text-sm text-muted-foreground">Nenhuma tarefa concluída ou hábito registrado neste período.</p>
        ) : (
          <>
            <div className="flex h-40 items-end gap-1">
              {data.days.map((d) => (
                <div key={d.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <div className="flex w-full max-w-8 flex-col justify-end overflow-hidden rounded-t" style={{ height: `${((d.tasks + d.habits) / maxDay) * 100}%` }}>
                    <div className="bg-sky" style={{ flexGrow: d.tasks }} title={`${d.tasks} tarefa(s)`} />
                    <div className="bg-sage" style={{ flexGrow: d.habits }} title={`${d.habits} hábito(s)`} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-1 flex gap-1">
              {data.days.map((d) => (
                <span key={d.key} className="flex-1 truncate text-center text-[10px] capitalize text-muted-foreground">
                  {period === "mes" && Number(d.label) % 5 !== 1 ? "" : d.label}
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-sky" /> Tarefas concluídas</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-sage" /> Hábitos realizados</span>
            </div>
          </>
        )}
      </Panel>

      <Panel title="Progresso das metas" className="mt-4">
        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Você ainda não criou metas.</p>
        ) : (
          <ul className="space-y-4">
            {goals.map((g) => {
              const linked = tasks.filter((t) => t.goal_id === g.id);
              const p = goalProgress(linked);
              return (
                <li key={g.id}>
                  <div className="mb-1 flex justify-between gap-2 text-sm">
                    <span className="truncate">{g.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {GOAL_STATUS_LABEL[g.status as GoalStatus]} · {p === null ? "sem tarefas vinculadas" : `${p}%`}
                    </span>
                  </div>
                  {p !== null && <ProgressBar value={p} />}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-soft">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
