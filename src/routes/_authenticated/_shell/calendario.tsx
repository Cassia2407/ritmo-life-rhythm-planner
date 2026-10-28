import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryDot, EmptyState } from "@/components/ritmo/ui-bits";
import { TaskItem } from "@/components/ritmo/task-item";
import { useTaskDialog } from "@/components/ritmo/task-dialog";
import { categoriesQuery, tasksQuery } from "@/lib/data";
import { WEEKDAYS_SHORT, formatTime, sortByTime, toISODate, type Task } from "@/lib/ritmo";
import { cn } from "@/lib/utils";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/_shell/calendario")({
  head: () => pageHead("Calendário", "Seus compromissos por mês, semana ou dia."),
  component: Calendario,
});

type View = "mes" | "semana" | "dia";

function Calendario() {
  const { data: tasks } = useSuspenseQuery(tasksQuery);
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { openForm, openDetails } = useTaskDialog();
  const [view, setView] = useState<View>("mes");
  const [cursor, setCursor] = useState(() => new Date());
  const today = toISODate(new Date());

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const byDate = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.due_date) continue;
      const list = m.get(t.due_date) ?? [];
      list.push(t);
      m.set(t.due_date, list);
    }
    for (const list of m.values()) list.sort(sortByTime);
    return m;
  }, [tasks]);

  function move(dir: 1 | -1) {
    if (view === "mes") setCursor((c) => addMonths(c, dir));
    else if (view === "semana") setCursor((c) => addWeeks(c, dir));
    else setCursor((c) => addDays(c, dir));
  }

  const title =
    view === "mes"
      ? format(cursor, "MMMM 'de' yyyy", { locale: ptBR })
      : view === "semana"
        ? `${format(startOfWeek(cursor), "d MMM", { locale: ptBR })} – ${format(endOfWeek(cursor), "d MMM yyyy", { locale: ptBR })}`
        : format(cursor, "EEEE, d 'de' MMMM", { locale: ptBR });

  function openDay(d: Date) {
    setCursor(d);
    setView("dia");
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Calendário</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as View)}>
            <TabsList>
              <TabsTrigger value="mes">Mês</TabsTrigger>
              <TabsTrigger value="semana">Semana</TabsTrigger>
              <TabsTrigger value="dia">Dia</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => openForm({ defaults: { due_date: toISODate(cursor) } })}>
            <Plus /> Nova
          </Button>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border bg-card px-3 py-2 shadow-soft">
        <Button variant="ghost" size="icon" onClick={() => move(-1)} aria-label="Anterior">
          <ChevronLeft />
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium capitalize">{title}</span>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
            Hoje
          </Button>
        </div>
        <Button variant="ghost" size="icon" onClick={() => move(1)} aria-label="Próximo">
          <ChevronRight />
        </Button>
      </div>

      {categories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {categories.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1.5">
              <CategoryDot color={c.color} /> {c.name}
            </span>
          ))}
        </div>
      )}

      {view === "mes" && (
        <div className="overflow-hidden rounded-xl border bg-card shadow-soft">
          <div className="grid grid-cols-7 border-b text-center text-xs font-medium text-muted-foreground">
            {WEEKDAYS_SHORT.map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {eachDayOfInterval({
              start: startOfWeek(startOfMonth(cursor)),
              end: endOfWeek(endOfMonth(cursor)),
            }).map((d) => {
              const key = toISODate(d);
              const items = byDate.get(key) ?? [];
              return (
                <div
                  key={key}
                  className={cn(
                    "min-h-20 border-b border-r p-1 md:min-h-28 md:p-1.5 [&:nth-child(7n)]:border-r-0",
                    !isSameMonth(d, cursor) && "bg-muted/40",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => openDay(d)}
                    className={cn(
                      "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs hover:bg-secondary",
                      key === today && "bg-primary text-primary-foreground hover:bg-primary",
                      !isSameMonth(d, cursor) && key !== today && "text-muted-foreground",
                    )}
                    aria-label={`Ver ${format(d, "d 'de' MMMM", { locale: ptBR })}`}
                  >
                    {format(d, "d")}
                  </button>
                  <div className="space-y-0.5">
                    {items.slice(0, 3).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => openDetails(t)}
                        className={cn(
                          "flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[11px] hover:bg-secondary",
                          t.status === "concluida" && "text-muted-foreground line-through",
                        )}
                      >
                        <CategoryDot
                          color={catById.get(t.category_id ?? "")?.color}
                          className="h-1.5 w-1.5"
                        />
                        <span className="hidden truncate sm:inline">
                          {t.start_time && `${formatTime(t.start_time)} `}
                          {t.title}
                        </span>
                      </button>
                    ))}
                    {items.length > 3 && (
                      <button
                        type="button"
                        onClick={() => openDay(d)}
                        className="px-1 text-[11px] text-muted-foreground hover:underline"
                      >
                        +{items.length - 3}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "semana" && (
        <div className="grid gap-3 md:grid-cols-7">
          {eachDayOfInterval({ start: startOfWeek(cursor), end: endOfWeek(cursor) }).map((d) => {
            const key = toISODate(d);
            const items = byDate.get(key) ?? [];
            return (
              <div
                key={key}
                className={cn(
                  "rounded-xl border bg-card p-2 shadow-soft",
                  key === today && "border-primary/50",
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => openDay(d)}
                    className="text-left text-xs hover:underline"
                  >
                    <span className="block text-muted-foreground">
                      {WEEKDAYS_SHORT[d.getDay()]}
                    </span>
                    <span className="text-sm font-semibold">{format(d, "d")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openForm({ defaults: { due_date: key } })}
                    aria-label={`Adicionar em ${format(d, "d 'de' MMMM", { locale: ptBR })}`}
                    className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-1">
                  {items.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => openDetails(t)}
                      className={cn(
                        "w-full rounded-md border-l-[3px] bg-secondary/50 px-2 py-1 text-left text-xs hover:bg-secondary",
                        t.status === "concluida" && "text-muted-foreground line-through",
                      )}
                      style={{
                        borderLeftColor: catById.get(t.category_id ?? "")?.color ?? "var(--sky)",
                      }}
                    >
                      {t.start_time && (
                        <span className="block text-[10px] text-muted-foreground">
                          {formatTime(t.start_time)}
                          {t.end_time && `–${formatTime(t.end_time)}`}
                        </span>
                      )}
                      <span className="line-clamp-2">{t.title}</span>
                    </button>
                  ))}
                  {items.length === 0 && (
                    <p className="px-1 text-[11px] text-muted-foreground">—</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "dia" && (
        <DayView
          items={byDate.get(toISODate(cursor)) ?? []}
          onAdd={() => openForm({ defaults: { due_date: toISODate(cursor) } })}
          catById={catById}
        />
      )}
    </div>
  );
}

function DayView({
  items,
  onAdd,
  catById,
}: {
  items: Task[];
  onAdd: () => void;
  catById: Map<string, import("@/lib/ritmo").Category>;
}) {
  if (items.length === 0)
    return (
      <EmptyState
        icon={CalendarDays}
        title="Nada marcado neste dia"
        action={
          <Button onClick={onAdd}>
            <Plus /> Adicionar neste dia
          </Button>
        }
      />
    );
  const untimed = items.filter((t) => !t.start_time);
  const timed = items.filter((t) => t.start_time);
  return (
    <div className="space-y-5">
      {timed.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Com horário
          </h2>
          {timed.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              category={catById.get(t.category_id ?? "")}
              showDate={false}
            />
          ))}
        </div>
      )}
      {untimed.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Sem horário
          </h2>
          {untimed.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              category={catById.get(t.category_id ?? "")}
              showDate={false}
            />
          ))}
        </div>
      )}
      <Button variant="outline" onClick={onAdd}>
        <Plus /> Adicionar neste dia
      </Button>
    </div>
  );
}
