import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, Panel } from "@/components/ritmo/ui-bits";
import { useSignOut } from "@/components/ritmo/app-shell";
import { profileQuery, updateDisplayName, useInvalidate } from "@/lib/data";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/_shell/perfil")({
  head: () => pageHead("Perfil", "Seu nome e dados de acesso."),
  loader: ({ context }) => context.queryClient.ensureQueryData(profileQuery),
  component: Perfil,
});

function Perfil() {
  const { data: profile } = useSuspenseQuery(profileQuery);
  const invalidate = useInvalidate();
  const signOut = useSignOut();
  const [name, setName] = useState(profile.displayName);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Informe seu nome."); return; }
    setSaving(true);
    try {
      await updateDisplayName(profile.id, name.trim());
      await invalidate("profile");
      toast.success("Nome atualizado");
    } catch (err) {
      toast.error("Não foi possível salvar", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Perfil" />
      <div className="space-y-4">
        <Panel title="Seus dados">
          <form onSubmit={save} className="max-w-md space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Nome</Label>
              <Input id="profile-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-email">E-mail</Label>
              <Input id="profile-email" value={profile.email} disabled />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando…" : "Salvar"}
            </Button>
          </form>
        </Panel>
        <Panel title="Sessão">
          <Button variant="outline" onClick={signOut}>
            <LogOut /> Sair da conta
          </Button>
        </Panel>
      </div>
    </div>
  );
}
