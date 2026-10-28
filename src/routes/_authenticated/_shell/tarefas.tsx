import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { endOfWeek, startOfWeek } from "date-fns";
import { CheckSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, PageHeader } from "@/components/ritmo/ui-bits";
import { TaskItem } from "@/components/ritmo/task-item";
import { useTaskDialog } from "@/components/ritmo/task-dialog";
import { categoriesQuery, tasksQuery } from "@/lib/data";
import { PRIORITY_WEIGHT, isOverdue, isWithin, toISODate, type Priority, type Task } from "@/lib/ritmo";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/_shell/tarefas")({
  head: () => pageHead("Tarefas", "Organize, filtre e conclua suas tarefas."),
  component: Tarefas,
});

type SortKey = "prazo" | "prioridade" | "criacao";

function Tarefas() {
  const { data: tasks } = useSuspenseQuery(tasksQuery);
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { openForm } = useTaskDialog();
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const allTags = useMemo(() => Array.from(new Set(tasks.flatMap((t) => t.tags))).sort(), [tasks]);

  const [status, setStatus] = useState("pendente");
  const [priority, setPriority] = useState("todas");
  const [category, setCategory] = useState("todas");
  const [tag, setTag] = useState("todas");
  const [date, setDate] = useState("todas");
  const [sort, setSort] = useState<SortKey>("prazo");

  const filtered = useMemo(() => {
    const now = new Date();
    const today = toISODate(now);
    const wFrom = startOfWeek(now, { weekStartsOn: 0 });
    const wTo = endOfWeek(now, { weekStartsOn: 0 });
    const list = tasks.filter((t) => {
      if (status !== "todas" && t.status !== status) return false;
      if (priority !== "todas" && t.priority !== priority) return false;
      if (category === "sem" ? t.category_id : category !== "todas" && t.category_id !== category) return false;
      if (tag !== "todas" && !t.tags.includes(tag)) return false;
      if (date === "hoje" && t.due_date !== today) return false;
      if (date === "semana" && !(t.due_date && isWithin(t.due_date, wFrom, wTo))) return false;
      if (date === "atrasadas" && !isOverdue(t, now)) return false;
      if (date === "sem" && t.due_date) return false;
      return true;
    });
    const byDue = (a: Task, b: Task) =>
      (a.due_date ?? "9999") + (a.start_time ?? "99") < (b.due_date ?? "9999") + (b.start_time ?? "99") ? -1 : 1;
    return list.sort((a, b) => {
      if (sort === "prioridade")
        return PRIORITY_WEIGHT[b.priority as Priority] - PRIORITY_WEIGHT[a.priority as Priority] || byDue(a, b);
      if (sort === "criacao") return b.created_at.localeCompare(a.created_at);
      return byDue(a, b);
    });
  }, [tasks, status, priority, category, tag, date, sort]);

  const hasFilters = priority !== "todas" || category !== "todas" || tag !== "todas" || date !== "todas";

  return (
    <div>
      <PageHeader
        title="Tarefas"
        description={`${tasks.filter((t) => t.status === "pendente").length} pendentes · ${tasks.filter((t) => t.status === "concluida").length} concluídas`}
        actions={
          <Button onClick={() => openForm()}>
            <Plus /> Nova tarefa
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Filter label="Status" value={status} onChange={setStatus} options={[["todas", "Todas"], ["pendente", "Pendentes"], ["concluida", "Concluídas"]]} />
        <Filter label="Prioridade" value={priority} onChange={setPriority} options={[["todas", "Todas"], ["alta", "Alta"], ["media", "Média"], ["baixa", "Baixa"]]} />
        <Filter
          label="Categoria"
          value={category}
          onChange={setCategory}
          options={[["todas", "Todas"], ["sem", "Sem categoria"], ...categories.map((c) => [c.id, c.name] as [string, string])]}
        />
        <Filter label="Etiqueta" value={tag} onChange={setTag} options={[["todas", "Todas"], ...allTags.map((t) => [t, `#${t}`] as [string, string])]} />
        <Filter
          label="Data"
          value={date}
          onChange={setDate}
          options={[["todas", "Qualquer"], ["hoje", "Hoje"], ["semana", "Esta semana"], ["atrasadas", "Atrasadas"], ["sem", "Sem data"]]}
        />
        <Filter label="Ordenar por" value={sort} onChange={(v) => setSort(v as SortKey)} options={[["prazo", "Prazo"], ["prioridade", "Prioridade"], ["criacao", "Data de criação"]]} />
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Nenhuma tarefa ainda"
          description="Cadastre o que precisa fazer — com ou sem data e horário."
          action={
            <Button onClick={() => openForm()}>
              <Plus /> Criar tarefa
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          compact
          icon={CheckSquare}
          title="Nada encontrado com esses filtros"
          action={
            hasFilters || status !== "todas" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatus("todas");
                  setPriority("todas");
                  setCategory("todas");
                  setTag("todas");
                  setDate("todas");
                }}
              >
                Limpar filtros
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <TaskItem key={t.id} task={t} category={catById.get(t.category_id ?? "")} />
          ))}
        </div>
      )}
    </div>
  );
}

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 bg-card" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
