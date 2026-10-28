import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, CheckSquare, Repeat, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ritmo — organize seu dia com calma" },
      {
        name: "description",
        content:
          "Ritmo ajuda você a organizar estudos, trabalho, compromissos, hábitos e metas em uma interface simples.",
      },
      { property: "og:title", content: "Ritmo — organize seu dia com calma" },
      {
        property: "og:description",
        content: "Tarefas, calendário, hábitos e metas em um só lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: CheckSquare, title: "Tarefas", text: "Prioridades, prazos, categorias e etiquetas." },
  {
    icon: CalendarDays,
    title: "Calendário",
    text: "Visão mensal, semanal e diária dos compromissos.",
  },
  { icon: Repeat, title: "Hábitos", text: "Marque o que fez a cada dia e acompanhe a constância." },
  { icon: Target, title: "Metas", text: "Ligue tarefas às metas e veja o progresso real." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-soft">
            <span className="flex gap-0.5">
              <span className="h-3 w-1 rounded-full bg-sky" />
              <span className="h-4 w-1 rounded-full bg-sage" />
              <span className="h-2.5 w-1 rounded-full bg-sky" />
            </span>
          </span>
          Ritmo
        </span>
        <Button variant="ghost" asChild>
          <Link to="/auth">Entrar</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-20 pt-10 md:pt-20">
        <div className="max-w-2xl">
          <p className="mb-4 inline-flex rounded-full bg-sage-soft px-3 py-1 text-xs font-medium text-sage-foreground">
            Organização pessoal, sem pressa
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Encontre o ritmo do seu dia.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Estudos, trabalho, compromissos, hábitos e metas em um lugar calmo e fácil de usar — no
            computador ou no celular.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                Criar conta grátis
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth">Já tenho conta</Link>
            </Button>
          </div>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-5 shadow-soft">
              <f.icon className="h-5 w-5 text-primary" />
              <h2 className="mt-3 font-medium">{f.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
