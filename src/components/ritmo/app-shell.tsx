import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  HelpCircle,
  Home,
  LogOut,
  Menu,
  Plus,
  Repeat,
  Settings,
  Target,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useTaskDialog } from "./task-dialog";
import { cn } from "@/lib/utils";
import logoAsset from "@/assets/ritmo-logo.png.asset.json";

type NavItem = { to: string; label: string; icon: LucideIcon };

const MAIN: NavItem[] = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/calendario", label: "Calendário", icon: CalendarDays },
  { to: "/tarefas", label: "Tarefas", icon: CheckSquare },
  { to: "/habitos", label: "Hábitos e rotinas", icon: Repeat },
  { to: "/metas", label: "Metas e projetos", icon: Target },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
];

const FOOTER: NavItem[] = [
  { to: "/configuracoes", label: "Configurações", icon: Settings },
  { to: "/ajuda", label: "Ajuda", icon: HelpCircle },
  { to: "/perfil", label: "Perfil", icon: UserRound },
];

export function useSignOut() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}

function Logo() {
  return (
    <Link to="/inicio" className="flex items-center" aria-label="Ritmo — início">
      <img src={logoAsset.url} alt="Ritmo" className="h-9 w-auto" />
    </Link>
  );
}

function NavLink({
  item,
  onClick,
  compact,
}: {
  item: NavItem;
  onClick?: () => void;
  compact?: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
        compact ? "py-1.5" : "py-2",
      )}
      activeProps={{ className: "bg-sidebar-accent !text-foreground font-medium" }}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { openForm } = useTaskDialog();
  const [menuOpen, setMenuOpen] = useState(false);
  const signOut = useSignOut();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-sidebar px-3 py-5 md:flex">
        <div className="px-2">
          <Logo />
        </div>
        <Button className="mx-1 mt-6" onClick={() => openForm()}>
          <Plus /> Nova atividade
        </Button>
        <nav className="mt-6 flex flex-col gap-0.5" aria-label="Principal">
          {MAIN.map((item) => (
            <NavLink key={item.to} item={item} />
          ))}
        </nav>
        <nav className="mt-auto flex flex-col gap-0.5 border-t pt-3" aria-label="Conta">
          {FOOTER.map((item) => (
            <NavLink key={item.to} item={item} compact />
          ))}
        </nav>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur md:hidden">
        <Logo />
        <Button size="sm" onClick={() => openForm()} aria-label="Nova atividade">
          <Plus /> Nova
        </Button>
      </header>

      <main className="px-4 pb-28 pt-6 md:ml-60 md:px-10 md:pb-12 md:pt-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Navegação inferior"
      >
        {MAIN.slice(0, 3).map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground"
            activeProps={{ className: "!text-primary font-medium" }}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground"
        >
          <Menu className="h-5 w-5" />
          Menu
        </button>
      </nav>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className="mt-2 flex flex-col gap-0.5 px-2">
            {[...MAIN.slice(3), ...FOOTER].map((item) => (
              <NavLink key={item.to} item={item} onClick={() => setMenuOpen(false)} />
            ))}
            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <LogOut className="h-4 w-4" /> Sair da conta
            </button>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
