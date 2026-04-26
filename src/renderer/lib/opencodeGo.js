export const OPENCODE_GO_BASE_URL = 'https://opencode.ai/zen/go/v1';
export const OPENCODE_GO_CHAT_COMPLETIONS_URL = `${OPENCODE_GO_BASE_URL}/chat/completions`;

const CHAT_COMPLETIONS_SUFFIX = '/chat/completions';

// Ordered to favor cost-effective defaults first in the UI.
export const OPENCODE_GO_MODELS = [
  { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', editors: ['opcode', 'codex', 'claude-code'] },
  { id: 'qwen3.6-plus', name: 'Qwen3.6 Plus', editors: ['opcode', 'codex', 'claude-code'] },
  { id: 'kimi-k2.6', name: 'Kimi K2.6', editors: ['opcode', 'codex', 'claude-code'] },
  { id: 'minimax-m2.5', name: 'MiniMax M2.5', editors: ['opcode', 'codex'] },
  { id: 'qwen3.5-plus', name: 'Qwen3.5 Plus', editors: ['opcode', 'codex'] },
  { id: 'glm-5', name: 'GLM-5', editors: ['opcode', 'codex', 'claude-code'] },
  { id: 'glm-5.1', name: 'GLM-5.1', editors: ['opcode', 'codex', 'claude-code'] },
  { id: 'kimi-k2.5', name: 'Kimi K2.5', editors: ['opcode', 'codex', 'claude-code'] },
  { id: 'mimo-v2-pro', name: 'MiMo-V2-Pro', editors: ['opcode', 'codex'] },
  { id: 'mimo-v2-omni', name: 'MiMo-V2-Omni', editors: ['opcode', 'codex'] },
  { id: 'mimo-v2.5-pro', name: 'MiMo-V2.5-Pro', editors: ['opcode', 'codex'] },
  { id: 'mimo-v2.5', name: 'MiMo-V2.5', editors: ['opcode', 'codex'] },
  { id: 'minimax-m2.7', name: 'MiniMax M2.7', editors: ['opcode', 'codex'] },
  { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', editors: ['opcode', 'codex', 'claude-code'] },
];

export function normalizeProviderBaseUrl(baseUrl = '') {
  const trimmed = String(baseUrl || '').trim().replace(/\/+$/, '');
  if (!trimmed) {
    return '';
  }

  if (trimmed.endsWith(CHAT_COMPLETIONS_SUFFIX)) {
    return trimmed.slice(0, -CHAT_COMPLETIONS_SUFFIX.length);
  }

  return trimmed;
}

export function isOpenCodeGoBaseUrl(baseUrl = '') {
  return normalizeProviderBaseUrl(baseUrl) === OPENCODE_GO_BASE_URL;
}

export function isOpenCodeGoProvider(provider = {}) {
  return isOpenCodeGoBaseUrl(provider.baseUrl);
}

export function getOpenCodeGoModelIds() {
  return OPENCODE_GO_MODELS.map((model) => model.id);
}

export function createOpenCodeGoPresetProvider() {
  return {
    name: 'OpenCode Go',
    apiType: 'openai',
    baseUrl: OPENCODE_GO_BASE_URL,
    models: getOpenCodeGoModelIds().join(','),
  };
}
