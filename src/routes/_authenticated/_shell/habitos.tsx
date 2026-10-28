import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { addDays, format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Flame, Pencil, Plus, Repeat, Trash2 } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { EmptyState, PageHeader } from "@/components/ritmo/ui-bits";
import { HabitCheck } from "@/components/ritmo/habit-check";
import { ConfirmDialog } from "@/components/ritmo/confirm-dialog";
import { Field } from "@/components/ritmo/task-dialog";
import { deleteHabit, habitLogsQuery, habitsQuery, saveHabit, useInvalidate } from "@/lib/data";
import {
  WEEKDAYS_SHORT,
  habitStats,
  habitStreak,
  isHabitScheduled,
  toISODate,
  type Habit,
} from "@/lib/ritmo";
import { cn } from "@/lib/utils";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/_shell/habitos")({
  head: () => pageHead("Hábitos e rotinas", "Acompanhe seus hábitos dia a dia."),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(habitsQuery),
      context.queryClient.ensureQueryData(habitLogsQuery),
    ]),
  component: Habitos,
});

const EXAMPLES = ["Estudar", "Ler", "Praticar exercícios", "Beber água", "Meditar"];

function Habitos() {
  const { data: habits } = useSuspenseQuery(habitsQuery);
  const { data: logs } = useSuspenseQuery(habitLogsQuery);
  const invalidate = useInvalidate();
  const [form, setForm] = useState<{ habit?: Habit; name?: string } | null>(null);
  const [toDelete, setToDelete] = useState<Habit | null>(null);

  const logsByHabit = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const l of logs) {
      const s = m.get(l.habit_id) ?? new Set();
      s.add(l.log_date);
      m.set(l.habit_id, s);
    }
    return m;
  }, [logs]);

  const now = new Date();
  const last7 = Array.from({ length: 7 }, (_, i) => subDays(now, 6 - i));

  return (
    <div>
      <PageHeader
        title="Hábitos e rotinas"
        description="Marque o que fez a cada dia. Toque nos círculos para registrar."
        actions={
          <Button onClick={() => setForm({})}>
            <Plus /> Novo hábito
          </Button>
        }
      />

      <div className="mb-6 rounded-xl border border-dashed bg-card/60 p-4">
        <p className="text-xs text-muted-foreground">
          Exemplos opcionais — toque para começar um hábito com esse nome (nada é criado sem você salvar):
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setForm({ name: ex })}
              className="rounded-full border bg-card px-3 py-1 text-xs hover:bg-secondary"
            >
              + {ex}
            </button>
          ))}
        </div>
      </div>

      {habits.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="Nenhum hábito cadastrado"
          description="Crie um hábito para acompanhar sua constância ao longo dos dias."
          action={
            <Button onClick={() => setForm({})}>
              <Plus /> Criar hábito
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {habits.map((h) => {
            const set = logsByHabit.get(h.id) ?? new Set<string>();
            const from = subDays(now, 29);
            const stats = habitStats(h, set, from, now);
            const rate = stats.scheduled ? Math.round((stats.done / stats.scheduled) * 100) : null;
            const streak = habitStreak(h, set, now);
            const todayKey = toISODate(now);
            const scheduledToday = isHabitScheduled(h, now);
            return (
              <div key={h.id} className="rounded-xl border bg-card p-4 shadow-soft">
                <div className="flex items-start gap-3">
                  {scheduledToday ? (
                    <HabitCheck habitId={h.id} date={todayKey} done={set.has(todayKey)} label={`Marcar ${h.name} como feito hoje`} />
                  ) : (
                    <span className="mt-1 h-7 w-7 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{h.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {h.frequency === "diaria"
                        ? "Todos os dias"
                        : h.week_days
                            .slice()
                            .sort()
                            .map((d) => WEEKDAYS_SHORT[d])
                            .join(", ")}
                      {!scheduledToday && " · não programado para hoje"}
                    </p>
                    {h.description && <p className="mt-1 text-sm text-muted-foreground">{h.description}</p>}
                  </div>
                  <div className="flex gap-0.5">
                    <button type="button" aria-label={`Editar ${h.name}`} onClick={() => setForm({ habit: h })} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" aria-label={`Excluir ${h.name}`} onClick={() => setToDelete(h)} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                  <div className="flex gap-2">
                    {last7.map((d) => {
                      const key = toISODate(d);
                      const sched = isHabitScheduled(h, d);
                      return (
                        <div key={key} className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">{WEEKDAYS_SHORT[d.getDay()].slice(0, 1)}</span>
                          {sched ? (
                            <HabitCheck
                              size="sm"
                              habitId={h.id}
                              date={key}
                              done={set.has(key)}
                              label={`${h.name} em ${format(d, "d 'de' MMMM", { locale: ptBR })}`}
                            />
                          ) : (
                            <span className="flex h-6 w-6 items-center justify-center text-xs text-muted-foreground/50">·</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-5 text-xs text-muted-foreground">
                    <span>
                      <span className="block text-base font-semibold text-foreground">{rate === null ? "—" : `${rate}%`}</span>
                      constância (30 dias)
                    </span>
                    <span>
                      <span className="flex items-center gap-1 text-base font-semibold text-foreground">
                        <Flame className={cn("h-4 w-4", streak > 0 ? "text-warning" : "text-muted-foreground")} />
                        {streak}
                      </span>
                      sequência atual
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {form && <HabitForm initial={form} onClose={() => setForm(null)} />}
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Excluir hábito?"
        description={toDelete ? `“${toDelete.name}” e todo o seu histórico serão excluídos.` : undefined}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await deleteHabit(toDelete.id);
            await invalidate("habits", "habit_logs");
            toast.success("Hábito excluído");
          } catch (e) {
            toast.error("Não foi possível excluir", { description: (e as Error).message });
          }
        }}
      />
    </div>
  );
}

function HabitForm({ initial, onClose }: { initial: { habit?: Habit; name?: string }; onClose: () => void }) {
  const invalidate = useInvalidate();
  const h = initial.habit;
  const [name, setName] = useState(h?.name ?? initial.name ?? "");
  const [description, setDescription] = useState(h?.description ?? "");
  const [frequency, setFrequency] = useState(h?.frequency ?? "diaria");
  const [days, setDays] = useState<number[]>(h?.week_days ?? []);
  const [startDate, setStartDate] = useState(h?.start_date ?? toISODate(new Date()));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Informe um nome.";
    if (frequency === "dias_especificos" && days.length === 0) errs.days = "Escolha pelo menos um dia.";
    if (!startDate) errs.start = "Informe a data de início.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await saveHabit(
        {
          name: name.trim(),
          description: description.trim() || null,
          frequency,
          week_days: frequency === "diaria" ? [] : days,
          start_date: startDate,
        },
        h?.id,
      );
      await invalidate("habits");
      toast.success(h ? "Hábito atualizado" : "Hábito criado");
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
          <DialogTitle>{h ? "Editar hábito" : "Novo hábito"}</DialogTitle>
          <DialogDescription>Defina com que frequência você quer praticar.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Nome *" error={errors.name} htmlFor="habit-name">
            <Input id="habit-name" autoFocus value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Descrição" htmlFor="habit-desc">
            <Textarea id="habit-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="Frequência" error={errors.days}>
            <RadioGroup value={frequency} onValueChange={setFrequency} className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="diaria" /> Diária
              </label>
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="dias_especificos" /> Dias específicos
              </label>
            </RadioGroup>
            {frequency === "dias_especificos" && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {WEEKDAYS_SHORT.map((d, i) => {
                  const on = days.includes(i);
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setDays(on ? days.filter((x) => x !== i) : [...days, i])}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs transition-colors",
                        on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-secondary",
                      )}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            )}
          </Field>
          <div className="space-y-1.5">
            <Label htmlFor="habit-start">Data de início</Label>
            <Input id="habit-start" type="date" value={startDate} max={toISODate(addDays(new Date(), 365))} onChange={(e) => setStartDate(e.target.value)} />
            {errors.start && <p className="text-xs text-destructive">{errors.start}</p>}
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
