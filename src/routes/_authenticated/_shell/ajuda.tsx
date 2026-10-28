import { createFileRoute } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageHeader } from "@/components/ritmo/ui-bits";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/_shell/ajuda")({
  head: () => pageHead("Ajuda", "Como usar o Ritmo para organizar tarefas, calendário e hábitos."),
  component: Ajuda,
});

const TOPICS = [
  {
    q: "Como cadastrar uma tarefa ou atividade?",
    a: "Toque em “Nova atividade”. Só o título é obrigatório. Adicione uma data para que ela apareça no calendário e horários se for um compromisso. Prioridade, categoria e etiquetas ajudam a filtrar depois.",
  },
  {
    q: "Qual a diferença entre tarefa e compromisso?",
    a: "No Ritmo é o mesmo cadastro: sem data, fica apenas na lista de Tarefas; com data (e horário, se quiser), aparece também no Calendário.",
  },
  {
    q: "Como organizar o calendário?",
    a: "Use as visões Mês, Semana e Dia. Toque em um dia para ver tudo o que está marcado nele, ou no “+” para criar algo naquela data. Toque em uma atividade para ver detalhes, editar ou excluir. As cores vêm das suas categorias.",
  },
  {
    q: "Como acompanhar hábitos?",
    a: "Em Hábitos e rotinas, crie um hábito diário ou para dias específicos. Toque no círculo para marcar o dia como feito — também dá para registrar os últimos 7 dias. A constância mostra quantos dias programados você cumpriu nos últimos 30 dias.",
  },
  {
    q: "Como funcionam as metas?",
    a: "Crie uma meta e vincule tarefas a ela. O progresso é a porcentagem de tarefas vinculadas concluídas. Sem tarefas vinculadas, não mostramos porcentagem.",
  },
  {
    q: "Onde crio categorias e etiquetas?",
    a: "Categorias (com cor) ficam em Configurações. Etiquetas são criadas direto no formulário da atividade e podem ser renomeadas ou removidas em Configurações.",
  },
  {
    q: "O Ritmo envia lembretes?",
    a: "Ainda não. Lembretes estão previstos para uma próxima versão.",
  },
  {
    q: "Meus dados ficam salvos?",
    a: "Sim. Tudo fica salvo na sua conta, protegido para que só você acesse, e aparece em qualquer dispositivo em que você entrar.",
  },
];

function Ajuda() {
  return (
    <div>
      <PageHeader title="Ajuda" description="Orientações rápidas para aproveitar o Ritmo." />
      <div className="rounded-xl border bg-card px-5 shadow-soft">
        <Accordion type="single" collapsible>
          {TOPICS.map((t) => (
            <AccordionItem key={t.q} value={t.q}>
              <AccordionTrigger className="text-left">{t.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{t.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
