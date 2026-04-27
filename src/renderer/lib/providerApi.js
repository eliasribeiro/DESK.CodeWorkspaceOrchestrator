import { normalizeProviderBaseUrl } from '@lib/opencodeGo';

export const PROVIDER_API_TYPES = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
};

export function normalizeProviderApiType(apiType) {
  return apiType === PROVIDER_API_TYPES.ANTHROPIC
    ? PROVIDER_API_TYPES.ANTHROPIC
    : PROVIDER_API_TYPES.OPENAI;
}

export function getProviderApiTypeLabel(apiType, language = 'en') {
  const normalizedType = normalizeProviderApiType(apiType);
  const labels = {
    en: {
      [PROVIDER_API_TYPES.OPENAI]: 'OpenAI-compatible',
      [PROVIDER_API_TYPES.ANTHROPIC]: 'Anthropic-compatible',
    },
    pt: {
      [PROVIDER_API_TYPES.OPENAI]: 'Compatível com OpenAI',
      [PROVIDER_API_TYPES.ANTHROPIC]: 'Compatível com Anthropic',
    },
    es: {
      [PROVIDER_API_TYPES.OPENAI]: 'Compatible con OpenAI',
      [PROVIDER_API_TYPES.ANTHROPIC]: 'Compatible con Anthropic',
    },
  };

  return labels[language]?.[normalizedType] || labels.en[normalizedType];
}

export function getProviderModelsEndpoint(provider = {}) {
  const normalizedBaseUrl = normalizeProviderBaseUrl(provider.baseUrl);
  if (!normalizedBaseUrl) {
    return '';
  }

  return `${normalizedBaseUrl}/models`;
}

export function getProviderRequestHeaders(provider = {}) {
  const apiKey = String(provider.apiKey || '').trim();
  const apiType = normalizeProviderApiType(provider.apiType);

  if (!apiKey) {
    return {};
  }

  if (apiType === PROVIDER_API_TYPES.ANTHROPIC) {
    return {
      'x-api-key': apiKey,
      Authorization: `Bearer ${apiKey}`,
      'anthropic-version': '2023-06-01',
    };
  }

  return {
    Authorization: `Bearer ${apiKey}`,
  };
}

export async function fetchModelsFromProvider(provider = {}) {
  const endpoint = getProviderModelsEndpoint(provider);
  const headers = getProviderRequestHeaders(provider);

  if (!endpoint || !Object.keys(headers).length) {
    throw new Error('Provider base URL and API token are required.');
  }

  const response = await fetch(endpoint, { headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error?.message || data?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (!Array.isArray(data?.data)) {
    throw new Error('Provider response did not include a valid model list.');
  }

  return data.data
    .map((model) => String(model?.id || '').trim())
    .filter(Boolean);
}

export function providerSupportsEditor(provider, editor) {
  if (editor === 'qwen-code' || editor === 'claude-code-native' || editor === 'gemini-cli' || editor === 'openclaude') {
    return true;
  }

  if (!provider || typeof provider !== 'object') {
    return editor !== 'claude-code' && editor !== 'opcode' && editor !== 'codex';
  }

  const apiType = normalizeProviderApiType(provider.apiType);

  if (editor === 'codex') {
    return apiType === PROVIDER_API_TYPES.OPENAI;
  }

  if (editor === 'claude-code') {
    return apiType === PROVIDER_API_TYPES.ANTHROPIC || apiType === PROVIDER_API_TYPES.OPENAI;
  }

  if (editor === 'opcode') {
    return apiType === PROVIDER_API_TYPES.OPENAI || apiType === PROVIDER_API_TYPES.ANTHROPIC;
  }

  return true;
}
