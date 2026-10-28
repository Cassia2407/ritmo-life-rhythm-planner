import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CategoryDot, PageHeader, Panel } from "@/components/ritmo/ui-bits";
import { ConfirmDialog } from "@/components/ritmo/confirm-dialog";
import { useSignOut } from "@/components/ritmo/app-shell";
import {
  categoriesQuery,
  deleteAllMyData,
  deleteCategory,
  profileQuery,
  saveCategory,
  tasksQuery,
  updateTagAcrossTasks,
  useInvalidate,
} from "@/lib/data";
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR, type Category } from "@/lib/ritmo";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/_shell/configuracoes")({
  head: () => pageHead("Configurações", "Aparência, categorias, etiquetas e seus dados."),
  loader: ({ context }) => context.queryClient.ensureQueryData(profileQuery),
  component: Configuracoes,
});

function Configuracoes() {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => setTheme(getStoredTheme()), []);
  const signOut = useSignOut();

  return (
    <div>
      <PageHeader title="Configurações" />
      <div className="space-y-4">
        <Panel title="Aparência">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme-switch" className="font-normal">
              Tema escuro
            </Label>
            <Switch
              id="theme-switch"
              checked={theme === "dark"}
              onCheckedChange={(c) => {
                const t: Theme = c ? "dark" : "light";
                setTheme(t);
                applyTheme(t);
              }}
            />
          </div>
        </Panel>
        <CategoriesPanel />
        <TagsPanel />
        <Panel title="Conta e dados">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={signOut}>
              <LogOut /> Sair da conta
            </Button>
            <DeleteDataButton />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Seus dados ficam salvos na sua conta e só você tem acesso a eles.
          </p>
        </Panel>
      </div>
    </div>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Cor">
      {CATEGORY_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={`Cor ${c}`}
          onClick={() => onChange(c)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full ring-offset-2 ring-offset-card",
            value === c && "ring-2 ring-ring",
          )}
          style={{ backgroundColor: c }}
        >
          {value === c && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
        </button>
      ))}
    </div>
  );
}

function CategoriesPanel() {
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const invalidate = useInvalidate();
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_CATEGORY_COLOR);
  const [editing, setEditing] = useState<Category | null>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) { toast.error("Dê um nome à categoria."); return; }
    if (categories.some((c) => c.name.toLowerCase() === n.toLowerCase() && c.id !== editing?.id))
      { toast.error("Já existe uma categoria com esse nome."); return; }
    try {
      await saveCategory({ name: n, color }, editing?.id);
      await invalidate("categories");
      toast.success(editing ? "Categoria atualizada" : "Categoria criada");
      setName("");
      setEditing(null);
      setColor(DEFAULT_CATEGORY_COLOR);
    } catch (err) {
      toast.error("Não foi possível salvar", { description: (err as Error).message });
    }
  }

  return (
    <Panel title="Categorias">
      {categories.length === 0 ? (
        <p className="mb-4 text-sm text-muted-foreground">
          Nenhuma categoria ainda. Crie as suas, como “Estudos” ou “Trabalho”.
        </p>
      ) : (
        <ul className="mb-4 divide-y">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-2">
              <CategoryDot color={c.color} className="h-3 w-3" />
              <span className="flex-1 text-sm">{c.name}</span>
              <button
                type="button"
                aria-label={`Editar ${c.name}`}
                onClick={() => {
                  setEditing(c);
                  setName(c.name);
                  setColor(c.color);
                }}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label={`Excluir ${c.name}`}
                onClick={() => setToDelete(c)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={submit} className="space-y-3 rounded-lg bg-muted/50 p-3">
        <p className="text-xs font-medium text-muted-foreground">
          {editing ? `Editando “${editing.name}”` : "Nova categoria"}
        </p>
        <Input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="Nome" aria-label="Nome da categoria" />
        <ColorPicker value={color} onChange={setColor} />
        <div className="flex gap-2">
          <Button type="submit" size="sm">
            {editing ? "Salvar" : (
              <>
                <Plus /> Adicionar
              </>
            )}
          </Button>
          {editing && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(null);
                setName("");
              }}
            >
              Cancelar
            </Button>
          )}
        </div>
      </form>
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Excluir categoria?"
        description="As atividades dessa categoria continuam salvas, apenas ficam sem categoria."
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await deleteCategory(toDelete.id);
            await invalidate("categories", "tasks");
            toast.success("Categoria excluída");
          } catch (e) {
            toast.error("Não foi possível excluir", { description: (e as Error).message });
          }
        }}
      />
    </Panel>
  );
}

function TagsPanel() {
  const { data: tasks } = useSuspenseQuery(tasksQuery);
  const invalidate = useInvalidate();
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of tasks) for (const tag of t.tags) m.set(tag, (m.get(tag) ?? 0) + 1);
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [tasks]);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [toDelete, setToDelete] = useState<string | null>(null);

  async function rename(tag: string) {
    const v = newName.trim().replace(/^#/, "").toLowerCase();
    if (!v || v === tag) return setRenaming(null);
    try {
      await updateTagAcrossTasks(tag, v);
      await invalidate("tasks");
      toast.success("Etiqueta renomeada");
      setRenaming(null);
    } catch (e) {
      toast.error("Não foi possível renomear", { description: (e as Error).message });
    }
  }

  return (
    <Panel title="Etiquetas">
      {counts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          As etiquetas aparecem aqui quando você as adiciona às atividades.
        </p>
      ) : (
        <ul className="divide-y">
          {counts.map(([tag, n]) => (
            <li key={tag} className="flex items-center gap-3 py-2">
              {renaming === tag ? (
                <form
                  className="flex flex-1 gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    rename(tag);
                  }}
                >
                  <Input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} className="h-8" aria-label="Novo nome da etiqueta" />
                  <Button size="sm" type="submit">Salvar</Button>
                  <Button size="sm" type="button" variant="ghost" onClick={() => setRenaming(null)}>
                    Cancelar
                  </Button>
                </form>
              ) : (
                <>
                  <span className="flex-1 text-sm">#{tag}</span>
                  <span className="text-xs text-muted-foreground">{n} atividade(s)</span>
                  <button type="button" aria-label={`Renomear ${tag}`} onClick={() => { setRenaming(tag); setNewName(tag); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" aria-label={`Remover ${tag}`} onClick={() => setToDelete(tag)} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Remover etiqueta?"
        description={toDelete ? `#${toDelete} será removida de todas as atividades.` : undefined}
        confirmLabel="Remover"
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await updateTagAcrossTasks(toDelete, null);
            await invalidate("tasks");
            toast.success("Etiqueta removida");
          } catch (e) {
            toast.error("Não foi possível remover", { description: (e as Error).message });
          }
        }}
      />
    </Panel>
  );
}

function DeleteDataButton() {
  const { data: profile } = useSuspenseQuery(profileQuery);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  return (
    <>
      <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setOpen(true)}>
        <Trash2 /> Excluir meus dados
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setConfirmText("");
        }}
        title="Excluir todos os seus dados?"
        description="Tarefas, atividades, hábitos e histórico, metas e categorias serão apagados permanentemente. Sua conta continua existindo."
        confirmLabel="Excluir tudo"
        confirmDisabled={confirmText !== "EXCLUIR"}
        onConfirm={async () => {
          try {
            await deleteAllMyData(profile.id);
            await qc.invalidateQueries();
            toast.success("Seus dados foram excluídos");
          } catch (e) {
            toast.error("Não foi possível excluir", { description: (e as Error).message });
          }
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="confirm-delete" className="text-sm font-normal">
            Digite <strong>EXCLUIR</strong> para confirmar
          </Label>
          <Input id="confirm-delete" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
        </div>
      </ConfirmDialog>
    </>
  );
}
