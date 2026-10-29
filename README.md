# Ritmo Life Rhythm Planner

# PROMPT PARA LOVABLE — APLICATIVO DE ORGANIZAÇÃO PESSOAL

Crie um aplicativo web responsivo de organização pessoal chamado **Ritmo**, voltado para pessoas de todas as idades que desejam organizar seus estudos, trabalho, compromissos, hábitos, tarefas e objetivos.

O objetivo é ajudar os usuários a administrar melhor o tempo e as demandas do dia a dia por meio de uma interface simples, intuitiva, agradável e funcional.

**IMPORTANTE:** Desenvolva uma primeira versão funcional (MVP), priorizando simplicidade, boa experiência de uso e economia de créditos. Não implemente funcionalidades complexas ou desnecessárias. Não invente compromissos, tarefas, hábitos, metas ou dados do usuário.

## 1. Identidade visual e design

Crie uma interface moderna, minimalista e acolhedora, que transmita calma, foco, clareza e organização.

Paleta sugerida:
- Azul suave: #789FCB
- Verde sálvia: #A8C5B0
- Fundo principal: #F7F9F8
- Branco: #FFFFFF
- Texto principal: #283744
- Texto secundário: #75818A
- Detalhes em azul-claro e verde-pastel.

Utilize tipografia legível, como Inter ou outra fonte semelhante. Adote bordas arredondadas moderadas, sombras discretas, ícones simples e espaçamento consistente.

Evite excesso de cores, gradientes chamativos, animações desnecessárias e elementos decorativos que prejudiquem a leitura.

A interface deve ser responsiva, funcionando bem em computadores, tablets e celulares.

## 2. Estrutura e navegação

Crie uma navegação organizada, sem colocar todas as páginas na barra inferior ou no menu principal.

No desktop, utilize uma barra lateral compacta com:
- Início
- Calendário
- Tarefas
- Hábitos e rotinas
- Metas e projetos
- Relatórios e produtividade

Na parte inferior da barra lateral, inclua acesso a Configurações, Ajuda e Perfil.

Em dispositivos móveis, utilize uma barra inferior com apenas quatro opções:
- Início
- Calendário
- Tarefas
- Menu

O botão Menu deve abrir as demais seções, incluindo Hábitos e rotinas, Metas e projetos, Relatórios, Configurações e Ajuda.

Inclua um botão de ação visível para criar uma nova atividade. A navegação deve ser consistente e permitir retornar facilmente à página inicial.

## 3. Página Início — Visão geral do dia

Esta será a tela principal do aplicativo.

Exiba:
- Saudação simples e data atual.
- Resumo das tarefas pendentes e concluídas.
- Próximas atividades cadastradas pelo usuário.
- Visão resumida dos hábitos do dia.
- Progresso diário calculado a partir dos dados reais.
- Botão para adicionar uma atividade.
- Atalho para visualizar todas as tarefas.

Organize as informações em cartões discretos e fáceis de compreender.

Quando não houver dados cadastrados, mostre um estado vazio com uma mensagem como: “Seu dia começa aqui. Adicione sua primeira atividade para se organizar melhor.”

Não crie atividades fictícias para preencher a interface. Os estados vazios devem ser visualmente bem resolvidos.

## 4. Página Calendário

Crie um calendário funcional com visualizações mensal, semanal e diária, se possível sem bibliotecas complexas.

Permita:
- Navegar entre datas.
- Visualizar atividades cadastradas.
- Criar atividades para uma data específica.
- Consultar detalhes de cada compromisso.
- Editar ou excluir atividades.
- Identificar atividades por categoria ou cor.

As atividades devem aparecer somente nas datas e horários informados pelo usuário. Não invente eventos.

## 5. Página Tarefas

Permita organizar atividades que precisam ser realizadas, mesmo quando não possuem horário marcado.

Cada tarefa deve conter:
- Título obrigatório.
- Descrição opcional.
- Data de vencimento opcional.
- Horário opcional.
- Categoria opcional.
- Etiquetas opcionais.
- Prioridade: baixa, média ou alta.
- Status: pendente ou concluída.

Disponibilize filtros por status, prioridade, categoria e data, além de ordenação por prazo, prioridade e data de criação.

Permita adicionar, editar, concluir e excluir tarefas.

Diferencie visualmente as tarefas atrasadas, sem usar alertas excessivos.

## 6. Página Hábitos e rotinas

Permita cadastrar atividades recorrentes que o usuário deseja acompanhar, como estudar, ler, praticar exercícios ou outras atividades escolhidas por ele.

Cada hábito deve conter:
- Nome.
- Descrição opcional.
- Frequência: diária ou dias específicos da semana.
- Data de início.
- Registro de conclusão por dia.
- Histórico básico de consistência.

Exiba uma lista dos hábitos cadastrados e permita marcar cada um como concluído no dia atual.

Não cadastre hábitos automaticamente. Apresente sugestões apenas se estiverem claramente identificadas como exemplos opcionais que o usuário pode escolher.

## 7. Página Metas e projetos

Permita criar metas pessoais, acadêmicas ou profissionais e associar tarefas existentes a elas.

Cada meta ou projeto deve conter:
- Título.
- Descrição opcional.
- Data-limite opcional.
- Status: em andamento, concluído ou pausado.
- Lista de tarefas associadas.
- Progresso calculado com base nas tarefas concluídas, quando existirem tarefas vinculadas.

Não invente metas nem preencha percentuais sem dados reais.

## 8. Página Relatórios e produtividade

Crie relatórios simples com base nas informações efetivamente registradas pelo usuário.

Apresente:
- Quantidade de tarefas concluídas.
- Quantidade de tarefas pendentes.
- Hábitos realizados no período.
- Progresso das metas.
- Resumo de produtividade semanal.

Se possível, permita filtrar os resultados por semana ou mês.

Não apresente estatísticas fictícias, estimativas sem fundamento ou gráficos preenchidos com dados demonstrativos como se fossem reais. Quando não houver registros suficientes, explique que os relatórios serão gerados conforme o usuário utilizar o aplicativo.

## 9. Criação de atividades

Implemente um formulário reutilizável para cadastrar atividades e compromissos.

Campos:
- Título obrigatório.
- Descrição opcional.
- Data.
- Horário inicial e final opcionais.
- Categoria.
- Etiquetas.
- Prioridade.
- Recorrência opcional, caso seja simples de implementar.
- Lembrete opcional.

Permita salvar, editar e cancelar o cadastro.

Valide os campos obrigatórios e impeça horários finais anteriores aos horários iniciais.

Não prometa notificações automáticas em segundo plano se a infraestrutura não oferecer esse recurso. Se lembretes reais não puderem ser implementados nesta versão, mantenha o campo claramente identificado como recurso ainda não disponível.

## 10. Categorias, etiquetas, filtros e histórico

Crie uma seção simples para gerenciar categorias e etiquetas personalizadas.

Permita:
- Criar e editar categorias.
- Escolher uma cor para cada categoria.
- Adicionar etiquetas às atividades.
- Filtrar atividades por categoria e etiqueta.
- Consultar atividades concluídas e registros anteriores.

Não crie categorias personalizadas em nome do usuário sem sua autorização.

## 11. Cadastro, login e privacidade

Implemente uma tela de cadastro e login com:
- Nome.
- E-mail.
- Senha.
- Opção de sair da conta.
- Recuperação de senha, se suportada pela autenticação escolhida.

Se o projeto utilizar Supabase, configure autenticação por e-mail e senha e banco de dados com políticas de segurança RLS para que cada usuário só possa acessar seus próprios registros.

Associe todas as tarefas, atividades, categorias, hábitos e metas ao usuário autenticado.

Não armazene senhas em texto puro nem exponha chaves privadas no frontend.

Se não houver backend configurado, deixe explícito que a autenticação e a sincronização entre dispositivos dependem dessa configuração. Não simule um sistema seguro de login usando apenas dados locais.

## 12. Configurações, perfil e suporte

Crie uma página de configurações com:
- Nome do usuário.
- Preferências visuais básicas.
- Alternância entre tema claro e escuro, se for simples de implementar.
- Opção de sair da conta.
- Opção de excluir dados pessoais, com confirmação explícita.

Crie uma seção de Ajuda com orientações curtas sobre como cadastrar tarefas, organizar o calendário e acompanhar hábitos.

Disponibilize um canal de suporte apenas se houver um destino real configurado. Não invente e-mails, números de telefone ou links de atendimento.

## 13. Requisitos técnicos e de funcionamento

Utilize React, TypeScript e Tailwind CSS, aproveitando os recursos e as bibliotecas já disponíveis no ambiente Lovable.

Priorize componentes reutilizáveis, código organizado e uma estrutura simples de manter.

Utilize um backend como Supabase somente se for necessário e se puder ser configurado no projeto. Não crie integrações externas desnecessárias.

Todos os botões e formulários apresentados devem funcionar. Implemente validação de dados, mensagens de sucesso e erro, confirmação antes de exclusões e estados vazios.

Os dados devem permanecer salvos após atualizar a página. Se não houver backend configurado, utilize armazenamento local como solução provisória, deixando claro que os dados ficam naquele navegador e podem não ser sincronizados entre dispositivos.

Não implemente pagamentos, assinaturas, inteligência artificial, gamificação complexa ou integrações com serviços externos nesta primeira versão.

## 14. Critérios de conclusão

Considere a primeira versão concluída quando:
- A navegação entre todas as páginas funcionar.
- O usuário conseguir cadastrar, editar, concluir e excluir tarefas.
- As atividades aparecerem nas datas corretas do calendário.
- Os hábitos permitirem registrar conclusões por dia.
- As metas calcularem o progresso a partir dos dados reais.
- Os relatórios refletirem os registros existentes.
- Os dados persistirem conforme a solução de armazenamento configurada.
- A interface funcionar em desktop e celular.
- Não existirem eventos, tarefas, estatísticas ou informações fictícias apresentados como dados reais.

**Prioridade máxima:** entregar uma primeira versão simples, consistente e realmente utilizável. Se algum recurso for complexo demais para esta etapa, implemente uma alternativa funcional mais simples em vez de criar uma interface que aparenta funcionar, mas não executa a ação.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ritmo-life-rhythm-planner.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a6108610-b258-475a-b337-69a137f96d3c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
