# System Design baseada no Layout

## 1. Visão Geral (Overview)
O layout analisado apresenta um ambiente de desenvolvimento integrado (IDE) ou ferramenta de IA visualmente moderna, estruturado com um esquema de cores escuro (Dark Mode) tipo macOS-style, e design minimalista utilizando bordas finas com cantos arredondados. A interface baseia-se em pelo menos três colunas principais e uma área inferior (terminal), desenhada para maximizar o contexto e fluxo de dados contínuos.

## 2. Estrutura Geral da Interface (Macro Layout)
A arquitetura visual primária é dividida em painéis resimensionáveis e consistentes:
1. **Left Sidebar (Painel de Navegação):** Gestor de repositórios, workspaces globais, branches e configurações gerais.
2. **Main / Central Panel (Chat & AI Interaction):** O cérebro do sistema, contendo o chat de IA contextual, logs de processos internos (tools/sub-panels expansíveis) e o input do usuário.
3. **Right Sub-Panel (Code Review & File Tree):** Área de revisão de versão de código (diff) focada em visualizar mudanças em arquivos antes de "Merge".
4. **Bottom Right (Terminal / Runner):** Console isolado para monitorar outputs raw (builds, git branches, errors).

## 3. Componentes Principais

### A. Left Sidebar
*   **Header / App Controls:** Botões tipo "pílula" de janela do sistema operacional e link superior principal para "Home".
*   **Workspace List (Tree View):** Navegação entre projetos agrupados. Cada repositório contém branches/workspaces que dispõem de:
    *   Nomes legíveis do workspace.
    *   Linha de status secundária (nome da branch local "kampala-v3").
    *   Pills indicativos de metadados: tags flutuantes como "Ready to merge", contadores "+312 -332", ou indicativo de conflito.
    *   Botão interno contextual "+ New workspace" por repositório.
*   **Global Footer Actions:** Menu ancorado na parte inferior revelando ícones utilitários ("Add repository", chat, configurações).

### B. Painel Central (Agent / Chat Area)
*   **Context Header:** Indica em qual local o chat em andamento está agindo (ex: repositório + ambiente). Dispões de abas horizontais sublinhadas que atuam como sessões independentes.
*   **Message List (Feed):**
    *   Logs da IA exibidos como texto em blocos Markdown e Syntax Highlighting.
    *   **Collapse/Expand Accordions:** Elemento comum usado para comprimir grandes volumes de dados (logs descritivos de ações, ou "13 tool calls, 7 messages") melhorando escaneabilidade.
*   **Composer / Input Box:**
    *   Campo flutuante e ancorado inferior com fundo distinto para destaque.
    *   Inclui utilitários internos: atalhos dinâmicos escritos (ex: `⌘ L to focus`), seletores de modelo LLM, e ícones anexos contextualizados.

### C. Right Panel
*   **Top Sub-Panel (Code Status):**
    *   Cabeçalho de PR/Review indicando tag "Ready to merge" atrelada a botão Call-to-Action proeminente "Merge".
    *   Navegação por tabulações "Changes", "All files", ao lado de filtros e buscas.
    *   Visão de arquivos listada ("src/App.tsx") que destaca indicadores granulares laterais (+1, -5 adicções e deleções).
*   **Bottom Sub-Panel (Terminal Area):**
    *   Separação horizontal por divisor e estrutura em abas "Terminal", "Run". Controle de execução "Run ⌘ R".
    *   Saída visual simples imitando console, com `➔` prompts para dar clareza de estado CLI local.

## 4. Fluxos de Interação do Usuário
*   O fluxo dominante flui da Esquerda para o Centro. Uma workspace selecionada à esquerda alimenta e delimita a sessão ativa do agente no Centro.
*   **Flow de Interação de IA:** O dev inicia digitando no Composer -> IA processa mostrando as ações ocultas por meio dos Expanders (Tool Calls) -> Exibe uma resposta de log Markdown detalhado -> Interfere no código do "Painel da Direita" de forma reativa.
*   **Feedback/Sync Loop:** Quaisquer resultados ou modificações no código da seção Direita podem ter build/test acionados, exibindo mensagens de êxito ou erro no Console Inferior. O usuário analisa a interdependência. 

## 5. Responsabilidades
*   **Sidebar:** Root controller para navegação; atua como ponto de partida da macro arquitetura da aplicação. 
*   **Central Panel:** É o Canvas da criatividade da IA. Responsável por traduzir o input humano num registro cronológico e limpo em texto e ações, mantendo os logs secundários minimizáveis.
*   **Right Panel:** The "Source of Truth" visual do Dev. Responsável por prover um preview seguro do código prestes a subir (commits/merge), sendo uma réplica read-only ou de review de diff altamente visual.

## 6. Organização de Estados e Navegação
*   O estado de roteamento Global reside no painel esquerdo.
*   Os estados transitórios e memoriais da AI ficam mantidos em memória no "Central Panel" mapeados no sistema de abas "Sessões".
*   Os painéis interagem por contexto. Mudar o repositório reseta ou cria novas abas de sessões na tela central e esvazia o visualizador de código (Painel Direito).
