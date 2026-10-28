import { Check, Clock, Pencil, Trash2 } from "lucide-react";
import { useTaskDialog } from "./task-dialog";
import { CategoryDot } from "./ui-bits";
import { cn } from "@/lib/utils";
import { formatDateShort, formatTime, isOverdue, type Category, type Task } from "@/lib/ritmo";

export function TaskItem({
  task,
  category,
  showDate = true,
}: {
  task: Task;
  category?: Category | undefined;
  showDate?: boolean;
}) {
  const { toggle, openDetails, openForm, askDelete } = useTaskDialog();
  const done = task.status === "concluida";
  const overdue = isOverdue(task);

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:bg-secondary/40",
        overdue && "border-warning/40 bg-warning-soft/40",
      )}
    >
      <button
        type="button"
        onClick={() => toggle(task)}
        aria-label={done ? `Reabrir ${task.title}` : `Concluir ${task.title}`}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          done ? "border-sage bg-sage text-sage-foreground" : "border-input hover:border-primary",
        )}
      >
        {done && <Check className="h-3 w-3" strokeWidth={3} />}
      </button>
      <button type="button" onClick={() => openDetails(task)} className="min-w-0 flex-1 text-left">
        <p className={cn("truncate text-sm font-medium", done && "text-muted-foreground line-through")}>
          {task.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {showDate && task.due_date && (
            <span className={cn(overdue && "font-medium text-warning")}>
              {formatDateShort(task.due_date)}
            </span>
          )}
          {task.start_time && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(task.start_time)}
              {task.end_time && `–${formatTime(task.end_time)}`}
            </span>
          )}
          {category && (
            <span className="inline-flex items-center gap-1.5">
              <CategoryDot color={category.color} className="h-2 w-2" />
              {category.name}
            </span>
          )}
          {task.priority === "alta" && <span className="font-medium text-primary">Alta</span>}
          {task.priority === "baixa" && <span>Baixa</span>}
          {task.tags.slice(0, 3).map((t) => (
            <span key={t}>#{t}</span>
          ))}
          {overdue && <span className="font-medium text-warning">Atrasada</span>}
        </div>
      </button>
      <div className="flex shrink-0 gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
        <button
          type="button"
          onClick={() => openForm({ task })}
          aria-label={`Editar ${task.title}`}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => askDelete(task)}
          aria-label={`Excluir ${task.title}`}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
