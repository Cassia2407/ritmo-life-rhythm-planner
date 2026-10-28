import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, Link2, Pencil, Plus, Target, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, PageHeader, ProgressBar } from "@/components/ritmo/ui-bits";
import { TaskItem } from "@/components/ritmo/task-item";
import { ConfirmDialog } from "@/components/ritmo/confirm-dialog";
import { Field, useTaskDialog } from "@/components/ritmo/task-dialog";
import {
  categoriesQuery,
  deleteGoal,
  goalsQuery,
  saveGoal,
  setTaskGoal,
  tasksQuery,
  useInvalidate,
} from "@/lib/data";
import {
  GOAL_STATUS_LABEL,
  formatDateShort,
  goalProgress,
  type Goal,
  type GoalStatus,
} from "@/lib/ritmo";
import { cn } from "@/lib/utils";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/_shell/metas")({
  head: () =>
    pageHead("Metas e projetos", "Acompanhe metas com progresso baseado nas suas tarefas."),
  component: Metas,
});

function Metas() {
  const { data: goals } = useSuspenseQuery(goalsQuery);
  const { data: tasks } = useSuspenseQuery(tasksQuery);
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { openForm } = useTaskDialog();
  const invalidate = useInvalidate();
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const [form, setForm] = useState<{ goal?: Goal } | null>(null);
  const [linking, setLinking] = useState<Goal | null>(null);
  const [toDelete, setToDelete] = useState<Goal | null>(null);

  return (
    <div>
      <PageHeader
        title="Metas e projetos"
        description="O progresso é calculado pelas tarefas vinculadas que você concluir."
        actions={
          <Button onClick={() => setForm({})}>
            <Plus /> Nova meta
          </Button>
        }
      />

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Nenhuma meta ainda"
          description="Crie uma meta pessoal, acadêmica ou profissional e vincule tarefas a ela."
          action={
            <Button onClick={() => setForm({})}>
              <Plus /> Criar meta
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {goals.map((g) => {
            const linked = tasks.filter((t) => t.goal_id === g.id);
            const progress = goalProgress(linked);
            return (
              <div key={g.id} className="flex flex-col rounded-xl border bg-card p-5 shadow-soft">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span
                      className={cn(
                        "mb-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                        g.status === "concluido" && "bg-sage-soft text-sage-foreground",
                        g.status === "em_andamento" && "bg-sky-soft text-primary",
                        g.status === "pausado" && "bg-muted text-muted-foreground",
                      )}
                    >
                      {GOAL_STATUS_LABEL[g.status as GoalStatus]}
                    </span>
                    <h2 className="font-semibold">{g.title}</h2>
                    {g.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{g.description}</p>
                    )}
                    {g.deadline && (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" /> Até {formatDateShort(g.deadline)}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      type="button"
                      aria-label={`Editar ${g.title}`}
                      onClick={() => setForm({ goal: g })}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Excluir ${g.title}`}
                      onClick={() => setToDelete(g)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  {progress === null ? (
                    <p className="text-xs text-muted-foreground">
                      Sem tarefas vinculadas — o progresso aparece quando houver.
                    </p>
                  ) : (
                    <>
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>
                          {linked.filter((t) => t.status === "concluida").length} de {linked.length}{" "}
                          tarefas
                        </span>
                        <span className="font-medium text-foreground">{progress}%</span>
                      </div>
                      <ProgressBar value={progress} />
                    </>
                  )}
                </div>

                {linked.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {linked.map((t) => (
                      <TaskItem key={t.id} task={t} category={catById.get(t.category_id ?? "")} />
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openForm({ defaults: { goal_id: g.id } })}
                  >
                    <Plus /> Nova tarefa
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setLinking(g)}
                    disabled={tasks.length === 0}
                  >
                    <Link2 /> Vincular tarefas
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {form && <GoalForm goal={form.goal} onClose={() => setForm(null)} />}
      {linking && <LinkTasksDialog goal={linking} onClose={() => setLinking(null)} />}
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Excluir meta?"
        description={
          toDelete
            ? `“${toDelete.title}” será excluída. As tarefas vinculadas continuam na sua lista.`
            : undefined
        }
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await deleteGoal(toDelete.id);
            await invalidate("goals", "tasks");
            toast.success("Meta excluída");
          } catch (e) {
            toast.error("Não foi possível excluir", { description: (e as Error).message });
          }
        }}
      />
    </div>
  );
}

function GoalForm({ goal, onClose }: { goal?: Goal | undefined; onClose: () => void }) {
  const invalidate = useInvalidate();
  const [title, setTitle] = useState(goal?.title ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [deadline, setDeadline] = useState(goal?.deadline ?? "");
  const [status, setStatus] = useState(goal?.status ?? "em_andamento");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("Informe um título.");
    setSaving(true);
    try {
      await saveGoal(
        {
          title: title.trim(),
          description: description.trim() || null,
          deadline: deadline || null,
          status,
        },
        goal?.id,
      );
      await invalidate("goals");
      toast.success(goal ? "Meta atualizada" : "Meta criada");
      onClose();
    } catch (err) {
      toast.error("Não foi possível salvar", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{goal ? "Editar meta" : "Nova meta"}</DialogTitle>
          <DialogDescription>
            Depois, vincule tarefas para acompanhar o progresso.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Título *" error={error} htmlFor="goal-title">
            <Input
              id="goal-title"
              autoFocus
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="Descrição" htmlFor="goal-desc">
            <Textarea
              id="goal-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data-limite" htmlFor="goal-deadline">
              <Input
                id="goal-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </Field>
            <Field label="Status">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="em_andamento">Em andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="pausado">Pausado</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LinkTasksDialog({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const { data: tasks } = useSuspenseQuery(tasksQuery);
  const { data: goals } = useSuspenseQuery(goalsQuery);
  const invalidate = useInvalidate();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(tasks.filter((t) => t.goal_id === goal.id).map((t) => t.id)),
  );
  const [saving, setSaving] = useState(false);
  const goalName = (id: string | null) => goals.find((g) => g.id === id)?.title;

  async function save() {
    setSaving(true);
    try {
      for (const t of tasks) {
        const want = selected.has(t.id);
        const has = t.goal_id === goal.id;
        if (want && !has) await setTaskGoal(t.id, goal.id);
        if (!want && has) await setTaskGoal(t.id, null);
      }
      await invalidate("tasks");
      toast.success("Tarefas vinculadas atualizadas");
      onClose();
    } catch (e) {
      toast.error("Não foi possível salvar", { description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vincular tarefas</DialogTitle>
          <DialogDescription>
            Escolha as tarefas que fazem parte de “{goal.title}”.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-80 space-y-1 overflow-y-auto">
          {tasks.map((t) => {
            const other = t.goal_id && t.goal_id !== goal.id ? goalName(t.goal_id) : null;
            return (
              <label
                key={t.id}
                className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-secondary"
              >
                <Checkbox
                  className="mt-0.5"
                  checked={selected.has(t.id)}
                  onCheckedChange={(c) => {
                    const next = new Set(selected);
                    if (c) next.add(t.id);
                    else next.delete(t.id);
                    setSelected(next);
                  }}
                />
                <span className="text-sm">
                  <span
                    className={cn(t.status === "concluida" && "text-muted-foreground line-through")}
                  >
                    {t.title}
                  </span>
                  {other && (
                    <span className="block text-xs text-muted-foreground">Hoje em: {other}</span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
