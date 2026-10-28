import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BellOff, CalendarDays, Clock, Flag, Pencil, Tag, Target, Trash2, X } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "./confirm-dialog";
import { CategoryDot } from "./ui-bits";
import {
  categoriesQuery,
  deleteTask,
  goalsQuery,
  saveTask,
  setTaskStatus,
  tasksQuery,
  useInvalidate,
} from "@/lib/data";
import {
  PRIORITY_LABEL,
  formatDateShort,
  formatTime,
  isOverdue,
  isTimeRangeValid,
  type Priority,
  type Task,
} from "@/lib/ritmo";

type OpenFormArgs = { task?: Task; defaults?: { due_date?: string; goal_id?: string } };

type Ctx = {
  openForm: (args?: OpenFormArgs) => void;
  openDetails: (task: Task) => void;
  askDelete: (task: Task) => void;
  toggle: (task: Task) => Promise<void>;
};

const TaskDialogContext = createContext<Ctx | null>(null);

export function useTaskDialog() {
  const ctx = useContext(TaskDialogContext);
  if (!ctx) throw new Error("useTaskDialog must be used inside TaskDialogProvider");
  return ctx;
}

export function TaskDialogProvider({ children }: { children: ReactNode }) {
  const invalidate = useInvalidate();
  const [form, setForm] = useState<OpenFormArgs | null>(null);
  const [details, setDetails] = useState<Task | null>(null);
  const [toDelete, setToDelete] = useState<Task | null>(null);

  const ctx = useMemo<Ctx>(
    () => ({
      openForm: (args) => setForm(args ?? {}),
      openDetails: (task) => setDetails(task),
      askDelete: (task) => setToDelete(task),
      toggle: async (task) => {
        try {
          const done = task.status !== "concluida";
          await setTaskStatus(task.id, done);
          await invalidate("tasks");
          toast.success(done ? "Concluída. Bom trabalho!" : "Marcada como pendente");
        } catch (e) {
          toast.error("Não foi possível atualizar", { description: (e as Error).message });
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <TaskDialogContext.Provider value={ctx}>
      {children}
      {form && (
        <TaskFormDialog
          args={form}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            setDetails(null);
          }}
        />
      )}
      {details && (
        <TaskDetailsDialog
          taskId={details.id}
          onClose={() => setDetails(null)}
          onEdit={(t) => setForm({ task: t })}
          onDelete={(t) => setToDelete(t)}
          onToggle={ctx.toggle}
        />
      )}
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Excluir atividade?"
        description={toDelete ? `“${toDelete.title}” será excluída permanentemente.` : undefined}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await deleteTask(toDelete.id);
            await invalidate("tasks");
            setDetails(null);
            toast.success("Atividade excluída");
          } catch (e) {
            toast.error("Não foi possível excluir", { description: (e as Error).message });
          }
        }}
      />
    </TaskDialogContext.Provider>
  );
}

function TaskDetailsDialog({
  taskId,
  onClose,
  onEdit,
  onDelete,
  onToggle,
}: {
  taskId: string;
  onClose: () => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onToggle: (t: Task) => Promise<void>;
}) {
  const { data: tasks = [] } = useQuery(tasksQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);
  const { data: goals = [] } = useQuery(goalsQuery);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;
  const category = categories.find((c) => c.id === task.category_id);
  const goal = goals.find((g) => g.id === task.goal_id);
  const overdue = isOverdue(task);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="pr-6">{task.title}</DialogTitle>
          <DialogDescription>
            {task.status === "concluida" ? "Concluída" : overdue ? "Pendente · atrasada" : "Pendente"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          {task.description && (
            <p className="whitespace-pre-wrap text-muted-foreground">{task.description}</p>
          )}
          <dl className="grid gap-2">
            <Row icon={CalendarDays} label="Data">
              {task.due_date ? formatDateShort(task.due_date) : "Sem data"}
            </Row>
            {(task.start_time || task.end_time) && (
              <Row icon={Clock} label="Horário">
                {formatTime(task.start_time)}
                {task.end_time ? ` – ${formatTime(task.end_time)}` : ""}
              </Row>
            )}
            <Row icon={Flag} label="Prioridade">
              {PRIORITY_LABEL[task.priority as Priority]}
            </Row>
            {category && (
              <Row icon={Tag} label="Categoria">
                <span className="inline-flex items-center gap-2">
                  <CategoryDot color={category.color} />
                  {category.name}
                </span>
              </Row>
            )}
            {task.tags.length > 0 && (
              <Row icon={Tag} label="Etiquetas">
                {task.tags.map((t) => `#${t}`).join("  ")}
              </Row>
            )}
            {goal && (
              <Row icon={Target} label="Meta">
                {goal.title}
              </Row>
            )}
          </dl>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" className="text-destructive" onClick={() => onDelete(task)}>
            <Trash2 /> Excluir
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onEdit(task)}>
              <Pencil /> Editar
            </Button>
            <Button onClick={() => onToggle(task)}>
              {task.status === "concluida" ? "Reabrir" : "Concluir"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Clock;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  );
}

function TaskFormDialog({
  args,
  onClose,
  onSaved,
}: {
  args: OpenFormArgs;
  onClose: () => void;
  onSaved: () => void;
}) {
  const invalidate = useInvalidate();
  const { data: categories = [] } = useQuery(categoriesQuery);
  const { data: goals = [] } = useQuery(goalsQuery);
  const { data: tasks = [] } = useQuery(tasksQuery);
  const t = args.task;

  const [title, setTitle] = useState(t?.title ?? "");
  const [description, setDescription] = useState(t?.description ?? "");
  const [dueDate, setDueDate] = useState(t?.due_date ?? args.defaults?.due_date ?? "");
  const [start, setStart] = useState(formatTime(t?.start_time));
  const [end, setEnd] = useState(formatTime(t?.end_time));
  const [categoryId, setCategoryId] = useState(t?.category_id ?? "none");
  const [goalId, setGoalId] = useState(t?.goal_id ?? args.defaults?.goal_id ?? "none");
  const [priority, setPriority] = useState<Priority>((t?.priority as Priority) ?? "media");
  const [tags, setTags] = useState<string[]>(t?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const knownTags = useMemo(
    () => Array.from(new Set(tasks.flatMap((x) => x.tags))).filter((x) => !tags.includes(x)).sort(),
    [tasks, tags],
  );

  function addTag(raw: string) {
    const v = raw.trim().replace(/^#/, "").toLowerCase().slice(0, 30);
    if (v && !tags.includes(v)) setTags([...tags, v]);
    setTagInput("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Informe um título.";
    if (title.length > 200) errs.title = "Use até 200 caracteres.";
    if ((start || end) && !dueDate) errs.dueDate = "Escolha uma data para usar horários.";
    if (end && !start) errs.end = "Informe também o horário inicial.";
    if (!isTimeRangeValid(start, end)) errs.end = "O horário final deve ser depois do inicial.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const pendingTag = tagInput.trim().replace(/^#/, "").toLowerCase();
      const finalTags = pendingTag && !tags.includes(pendingTag) ? [...tags, pendingTag] : tags;
      await saveTask(
        {
          title: title.trim(),
          description: description.trim() || null,
          due_date: dueDate || null,
          start_time: start || null,
          end_time: end || null,
          category_id: categoryId === "none" ? null : categoryId,
          goal_id: goalId === "none" ? null : goalId,
          priority,
          tags: finalTags,
        },
        t?.id,
      );
      await invalidate("tasks");
      toast.success(t ? "Atividade atualizada" : "Atividade criada");
      onSaved();
    } catch (err) {
      toast.error("Não foi possível salvar", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t ? "Editar atividade" : "Nova atividade"}</DialogTitle>
          <DialogDescription>
            Tarefas sem data ficam na lista de tarefas; com data, aparecem também no calendário.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Título *" error={errors.title} htmlFor="task-title">
            <Input
              id="task-title"
              autoFocus
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Revisar capítulo 3"
            />
          </Field>
          <Field label="Descrição" htmlFor="task-desc">
            <Textarea
              id="task-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Data" error={errors.dueDate} htmlFor="task-date">
              <Input id="task-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
            <Field label="Início" htmlFor="task-start">
              <Input id="task-start" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </Field>
            <Field label="Fim" error={errors.end} htmlFor="task-end">
              <Input id="task-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Prioridade">
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Categoria">
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="inline-flex items-center gap-2">
                        <CategoryDot color={c.color} />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categories.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Crie categorias em Configurações.
                </p>
              )}
            </Field>
          </div>
          {goals.length > 0 && (
            <Field label="Meta ou projeto">
              <Select value={goalId} onValueChange={setGoalId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {goals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          <Field label="Etiquetas" htmlFor="task-tags">
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs"
                >
                  #{tag}
                  <button
                    type="button"
                    aria-label={`Remover etiqueta ${tag}`}
                    onClick={() => setTags(tags.filter((x) => x !== tag))}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <Input
              id="task-tags"
              className="mt-1.5"
              value={tagInput}
              placeholder="Digite e pressione Enter"
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
            />
            {knownTags.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {knownTags.slice(0, 8).map((k) => (
                  <button
                    type="button"
                    key={k}
                    onClick={() => addTag(k)}
                    className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground hover:bg-secondary"
                  >
                    + #{k}
                  </button>
                ))}
              </div>
            )}
          </Field>
          <div className="flex items-center justify-between rounded-lg border border-dashed px-3 py-2.5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BellOff className="h-4 w-4" />
              <span>Lembrete — ainda não disponível nesta versão</span>
            </div>
            <Switch disabled aria-label="Lembrete (indisponível)" />
          </div>
          <p className="text-xs text-muted-foreground">
            Para algo que se repete, use <strong>Hábitos e rotinas</strong>.
          </p>
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

export function Field({
  label,
  error,
  htmlFor,
  children,
}: {
  label: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
