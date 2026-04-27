# Plano de Implementação: Suporte ao CLI OpenClaude

## Resumo
- Objetivo: adicionar suporte completo ao `openclaude` no fluxo de execução de terminais embutidos, mantendo o comportamento atual dos demais CLIs.
- Escopo definido: execução **nativa simples** (sem injeção de provider/model), bloqueio de execução quando o CLI não estiver detectado e atualização dos três READMEs.
- Resultado esperado: `openclaude` aparece em Configurações (detecção/ativação), no seletor de editor do workspace e inicia sessões via `terminal:launchSession`.

## Análise do Estado Atual
- Catálogo de CLIs no renderer: `src/renderer/lib/cliCatalog.js` lista `claude-code`, `codex`, `gemini-cli`, `qwen-code` e `opcode`.
- Detecção de CLIs no main process: `src/main/main.cjs` define `SUPPORTED_CLI_EDITORS` e endpoint `cli:listSupported`.
- Execução de sessão embutida: `src/main/main.cjs` resolve comando em `resolveLaunchConfiguration(...)` e cria sessão via `createEmbeddedTerminalSession(...)`.
- UI do workspace:
  - `src/renderer/components/WorkspaceToolbar.jsx` controla exigência de provider/model por editor e label do botão Run.
  - `src/renderer/components/WorkspaceChatArea.jsx` define título por editor e valida compatibilidade/provider default.
- Documentação: `README.md`, `README.en.md`, `README.es.md` citam os CLIs atuais sem OpenClaude.

## Mudanças Propostas

### 1) Catálogo de CLI no Renderer
- Arquivo: `src/renderer/lib/cliCatalog.js`
- O que mudar:
  - Adicionar item `{ value: 'openclaude', label: 'OpenClaude', command: 'openclaude' }`.
- Por que:
  - Faz o editor aparecer em configurações e no dropdown operacional automaticamente.
- Como:
  - Inserir o novo item na lista `SUPPORTED_CLI_EDITORS`, preservando estrutura atual.

### 2) Detecção de Instalação no Main Process
- Arquivo: `src/main/main.cjs`
- O que mudar:
  - Adicionar item `openclaude` em `SUPPORTED_CLI_EDITORS`, com `versionArgsList` alinhada ao padrão atual (`--version`, `version`, `-v`).
- Por que:
  - Permite que `cli:listSupported` detecte instalação, versão e diretório no PATH.
- Como:
  - Incluir objeto `{ id: 'openclaude', label: 'OpenClaude', command: 'openclaude', versionArgsList: [...] }`.

### 3) Resolução de Comando de Execução
- Arquivo: `src/main/main.cjs`
- O que mudar:
  - Em `resolveLaunchConfiguration(...)`, adicionar branch para `editor === 'openclaude'` retornando:
    - `command: 'openclaude'`
    - `envOverrides: {}`
- Por que:
  - Implementa o modo escolhido: execução nativa simples, sem provider/model injetados.
- Como:
  - Inserir bloco dedicado próximo aos outros editores de execução direta (`gemini-cli` / `qwen-code`), mantendo padrão de retorno.

### 4) Regras de UI no Workspace (Provider/Model e Rotulagem)
- Arquivos:
  - `src/renderer/components/WorkspaceToolbar.jsx`
  - `src/renderer/components/WorkspaceChatArea.jsx`
- O que mudar:
  - Tratar `openclaude` como editor que **não exige provider/model** (como Gemini/Qwen).
  - Incluir label do botão (`Run OpenClaude`).
  - Incluir nome/título da sessão (`OpenClaude`) no mapeamento visual das abas.
- Por que:
  - Evita validações indevidas de provider/model e mantém UX consistente ao abrir sessão.
- Como:
  - Atualizar condicionais de `requiresProvider`, labels e mapas de título existentes.

### 5) Compatibilidade de Provider (Guard Rails)
- Arquivo: `src/renderer/lib/providerApi.js`
- O que mudar:
  - Ajustar `providerSupportsEditor(...)` para considerar `openclaude` como editor sem dependência de provider.
- Por que:
  - Evita caminhos de incompatibilidade indevidos quando o editor selecionado for OpenClaude.
- Como:
  - Incluir `openclaude` nos casos que retornam `true` sem validação de provider.

### 6) Documentação
- Arquivos:
  - `README.md`
  - `README.en.md`
  - `README.es.md`
- O que mudar:
  - Atualizar seções que listam CLIs suportados para incluir OpenClaude.
  - Adicionar orientação curta de instalação/uso (`npm i -g @gitlawb/openclaude` e comando `openclaude`).
- Por que:
  - Mantém docs coerentes com o produto entregue.
- Como:
  - Ajustar o texto de introdução e, se necessário, incluir um bullet curto na seção de recursos.

## Assunções e Decisões
- Decisão confirmada: OpenClaude em modo nativo simples (sem provider/model enviados pelo app).
- Decisão confirmada: execução bloqueada quando OpenClaude não for detectado no PATH.
- Decisão confirmada: atualizar documentação multilíngue (`README.md`, `README.en.md`, `README.es.md`).
- Assunção operacional: o comando executável é `openclaude` no PATH do sistema.
- Fora de escopo nesta entrega:
  - Fluxo avançado de `/provider` automatizado via UI.
  - Configuração de perfis específicos do OpenClaude.
  - Modo híbrido com injeção de env OpenAI para OpenClaude.

## Verificação
1. Verificar detecção:
   - Abrir Configurações > CLIs suportados e confirmar card `OpenClaude` com status de detecção coerente.
2. Verificar habilitação:
   - Alternar visibilidade do OpenClaude nas configurações e confirmar presença/ausência no dropdown do workspace.
3. Verificar execução:
   - Selecionar OpenClaude no workspace e abrir sessão.
   - Confirmar que abre sem exigir provider/model.
   - Confirmar título da aba/sessão como OpenClaude.
4. Verificar bloqueio sem instalação:
   - Simular estado não detectado (ou ambiente sem binário) e validar botão Run desabilitado com mensagem adequada.
5. Verificar regressão dos demais CLIs:
   - Validar rapidamente seleção/execução de Claude, Codex, Gemini, Qwen e OpenCode.
6. Verificar documentação:
   - Confirmar OpenClaude refletido nos 3 READMEs.
