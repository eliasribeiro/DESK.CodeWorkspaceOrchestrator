const crypto = require('crypto');
const express = require('express');
const { fetch } = require('undici');

const DEFAULT_HOST = '127.0.0.1';

function normalizeBaseUrl(baseUrl = '') {
  const trimmed = String(baseUrl || '').trim().replace(/\/+$/, '');
  if (!trimmed) {
    return '';
  }

  if (trimmed.endsWith('/chat/completions')) {
    return trimmed.slice(0, -'/chat/completions'.length);
  }

  return trimmed;
}

function createAdapterKey(config = {}) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify({
      baseUrl: normalizeBaseUrl(config.baseUrl),
      apiKeyHash: config.apiKey ? crypto.createHash('sha256').update(config.apiKey).digest('hex') : '',
      model: config.model || '',
    }))
    .digest('hex');
}

function extractSystemText(system) {
  if (!system) {
    return '';
  }

  if (typeof system === 'string') {
    return system;
  }

  if (Array.isArray(system)) {
    return system
      .filter((block) => block?.type === 'text' && block?.text)
      .map((block) => block.text)
      .join('\n\n');
  }

  return '';
}

function stringifyToolResultContent(content) {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }
        if (item?.type === 'text' && item?.text) {
          return item.text;
        }
        return JSON.stringify(item);
      })
      .join('\n');
  }

  if (content && typeof content === 'object') {
    return JSON.stringify(content);
  }

  return '';
}

function convertAnthropicContentBlocks(role, blocks = []) {
  const openAiMessages = [];
  const textParts = [];
  const toolCalls = [];

  blocks.forEach((block, index) => {
    if (!block || typeof block !== 'object') {
      return;
    }

    if (block.type === 'text' && block.text) {
      textParts.push(block.text);
      return;
    }

    if (block.type === 'tool_result' && block.tool_use_id) {
      openAiMessages.push({
        role: 'tool',
        tool_call_id: block.tool_use_id,
        content: stringifyToolResultContent(block.content),
      });
      return;
    }

    if (role === 'assistant' && block.type === 'tool_use') {
      toolCalls.push({
        id: block.id || `toolu_${crypto.randomBytes(12).toString('hex')}`,
        type: 'function',
        function: {
          name: block.name,
          arguments: JSON.stringify(block.input || {}),
        },
      });
    }
  });

  if (role === 'assistant') {
    if (textParts.length > 0 || toolCalls.length > 0) {
      openAiMessages.unshift({
        role: 'assistant',
        content: textParts.length > 0 ? textParts.join('\n\n') : null,
        ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
      });
    }
    return openAiMessages;
  }

  if (textParts.length > 0) {
    openAiMessages.unshift({
      role,
      content: textParts.join('\n\n'),
    });
  }

  return openAiMessages;
}

function convertAnthropicRequestToOpenAI(requestBody, configuredModel) {
  const messages = [];
  const systemText = extractSystemText(requestBody.system);

  if (systemText) {
    messages.push({
      role: 'system',
      content: systemText,
    });
  }

  (requestBody.messages || []).forEach((message) => {
    if (!message || typeof message !== 'object') {
      return;
    }

    if (typeof message.content === 'string') {
      messages.push({
        role: message.role || 'user',
        content: message.content,
      });
      return;
    }

    messages.push(...convertAnthropicContentBlocks(message.role || 'user', Array.isArray(message.content) ? message.content : []));
  });

  const openAiBody = {
    model: configuredModel,
    messages,
    stream: Boolean(requestBody.stream),
    max_tokens: requestBody.max_tokens || 4096,
  };

  if (requestBody.temperature !== undefined) {
    openAiBody.temperature = requestBody.temperature;
  }
  if (requestBody.top_p !== undefined) {
    openAiBody.top_p = requestBody.top_p;
  }
  if (Array.isArray(requestBody.stop_sequences) && requestBody.stop_sequences.length > 0) {
    openAiBody.stop = requestBody.stop_sequences;
  }

  if (Array.isArray(requestBody.tools) && requestBody.tools.length > 0) {
    openAiBody.tools = requestBody.tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description || '',
        parameters: tool.input_schema || { type: 'object', properties: {} },
      },
    }));
  }

  if (requestBody.tool_choice) {
    if (requestBody.tool_choice === 'auto') {
      openAiBody.tool_choice = 'auto';
    } else if (requestBody.tool_choice === 'any') {
      openAiBody.tool_choice = 'required';
    } else if (requestBody.tool_choice === 'none') {
      openAiBody.tool_choice = 'none';
    } else if (requestBody.tool_choice?.type === 'tool' && requestBody.tool_choice?.name) {
      openAiBody.tool_choice = {
        type: 'function',
        function: {
          name: requestBody.tool_choice.name,
        },
      };
    }
  }

  return openAiBody;
}

function parseToolArguments(argumentsText = '') {
  const trimmed = String(argumentsText || '').trim();
  if (!trimmed) {
    return {};
  }

  try {
    return JSON.parse(trimmed);
  } catch (_error) {
    return { raw: trimmed };
  }
}

function mapFinishReasonToStopReason(finishReason, hasToolCalls) {
  if (hasToolCalls || finishReason === 'tool_calls') {
    return 'tool_use';
  }
  if (finishReason === 'length') {
    return 'max_tokens';
  }
  return 'end_turn';
}

function convertOpenAIResponseToAnthropic(responseBody, configuredModel) {
  const choice = responseBody?.choices?.[0] || {};
  const message = choice?.message || {};
  const toolCalls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
  const content = [];

  if (typeof message.content === 'string' && message.content.length > 0) {
    content.push({
      type: 'text',
      text: message.content,
    });
  }

  toolCalls.forEach((toolCall) => {
    content.push({
      type: 'tool_use',
      id: toolCall.id || `toolu_${crypto.randomBytes(12).toString('hex')}`,
      name: toolCall?.function?.name || 'tool',
      input: parseToolArguments(toolCall?.function?.arguments),
    });
  });

  return {
    id: `msg_${crypto.randomBytes(16).toString('hex')}`,
    type: 'message',
    role: 'assistant',
    model: configuredModel,
    content: content.length > 0 ? content : [{ type: 'text', text: '' }],
    stop_reason: mapFinishReasonToStopReason(choice.finish_reason, toolCalls.length > 0),
    stop_sequence: null,
    usage: {
      input_tokens: responseBody?.usage?.prompt_tokens || 0,
      output_tokens: responseBody?.usage?.completion_tokens || 0,
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0,
    },
  };
}

function estimateInputTokens(requestBody = {}) {
  const raw = JSON.stringify({
    system: requestBody.system || '',
    messages: requestBody.messages || [],
    tools: requestBody.tools || [],
  });

  return Math.max(1, Math.ceil(raw.length / 4));
}

function writeAnthropicSse(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function pipeOpenAIStreamToAnthropic(res, upstreamResponse, configuredModel) {
  const messageId = `msg_${crypto.randomBytes(16).toString('hex')}`;
  let textStarted = false;
  let textIndex = 0;
  let outputTokens = 0;
  let stopReason = 'end_turn';
  const toolCalls = new Map();

  writeAnthropicSse(res, 'message_start', {
    type: 'message_start',
    message: {
      id: messageId,
      type: 'message',
      role: 'assistant',
      model: configuredModel,
      content: [],
      stop_reason: null,
      stop_sequence: null,
      usage: {
        input_tokens: 0,
        output_tokens: 0,
      },
    },
  });

  let pending = '';
  for await (const chunk of upstreamResponse.body) {
    pending += chunk.toString();

    while (pending.includes('\n\n')) {
      const separatorIndex = pending.indexOf('\n\n');
      const rawEvent = pending.slice(0, separatorIndex);
      pending = pending.slice(separatorIndex + 2);

      const dataLine = rawEvent
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())
        .join('\n');

      if (!dataLine || dataLine === '[DONE]') {
        continue;
      }

      let payload = null;
      try {
        payload = JSON.parse(dataLine);
      } catch (_error) {
        continue;
      }

      const choice = payload?.choices?.[0];
      const delta = choice?.delta || {};

      if (typeof delta.content === 'string' && delta.content.length > 0) {
        if (!textStarted) {
          textStarted = true;
          writeAnthropicSse(res, 'content_block_start', {
            type: 'content_block_start',
            index: textIndex,
            content_block: {
              type: 'text',
              text: '',
            },
          });
        }

        outputTokens += Math.max(1, Math.ceil(delta.content.length / 4));
        writeAnthropicSse(res, 'content_block_delta', {
          type: 'content_block_delta',
          index: textIndex,
          delta: {
            type: 'text_delta',
            text: delta.content,
          },
        });
      }

      if (Array.isArray(delta.tool_calls)) {
        delta.tool_calls.forEach((toolCallDelta) => {
          const key = String(toolCallDelta.index ?? toolCalls.size);
          const current = toolCalls.get(key) || {
            id: toolCallDelta.id || `toolu_${crypto.randomBytes(12).toString('hex')}`,
            name: '',
            arguments: '',
          };

          if (toolCallDelta.id) {
            current.id = toolCallDelta.id;
          }
          if (toolCallDelta?.function?.name) {
            current.name += toolCallDelta.function.name;
          }
          if (toolCallDelta?.function?.arguments) {
            current.arguments += toolCallDelta.function.arguments;
          }

          toolCalls.set(key, current);
        });
      }

      if (choice?.finish_reason) {
        stopReason = mapFinishReasonToStopReason(choice.finish_reason, toolCalls.size > 0);
      }
    }
  }

  if (textStarted) {
    writeAnthropicSse(res, 'content_block_stop', {
      type: 'content_block_stop',
      index: textIndex,
    });
  }

  let contentIndex = textStarted ? 1 : 0;
  Array.from(toolCalls.values()).forEach((toolCall) => {
    outputTokens += Math.max(4, Math.ceil(toolCall.arguments.length / 4));
    writeAnthropicSse(res, 'content_block_start', {
      type: 'content_block_start',
      index: contentIndex,
      content_block: {
        type: 'tool_use',
        id: toolCall.id,
        name: toolCall.name || 'tool',
        input: parseToolArguments(toolCall.arguments),
      },
    });
    writeAnthropicSse(res, 'content_block_stop', {
      type: 'content_block_stop',
      index: contentIndex,
    });
    contentIndex += 1;
  });

  writeAnthropicSse(res, 'message_delta', {
    type: 'message_delta',
    delta: {
      stop_reason: stopReason,
      stop_sequence: null,
    },
    usage: {
      output_tokens: outputTokens,
    },
  });
  writeAnthropicSse(res, 'message_stop', {
    type: 'message_stop',
  });

  res.end();
}

function createAdapterApp(config) {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.use((_req, res, next) => {
    res.setHeader('anthropic-version', '2023-06-01');
    next();
  });

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      provider: config.providerName || 'OpenAI-compatible',
      model: config.model,
      baseUrl: config.baseUrl,
    });
  });

  app.get('/v1/models', (_req, res) => {
    res.json({
      object: 'list',
      data: [{
        id: config.model,
        object: 'model',
        created: 0,
        owned_by: config.providerName || 'openai-compatible',
      }],
    });
  });

  app.post('/v1/messages/count_tokens', (req, res) => {
    res.json({
      input_tokens: estimateInputTokens(req.body),
    });
  });

  app.post('/v1/messages', async (req, res) => {
    const requestBody = req.body || {};
    const openAiBody = convertAnthropicRequestToOpenAI(requestBody, config.model);

    try {
      const upstreamResponse = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(openAiBody),
      });

      if (!upstreamResponse.ok) {
        const errorBody = await upstreamResponse.text();
        res.status(upstreamResponse.status).json({
          type: 'error',
          error: {
            type: 'api_error',
            message: errorBody || `OpenAI-compatible upstream returned ${upstreamResponse.status}`,
          },
        });
        return;
      }

      if (requestBody.stream) {
        res.setHeader('content-type', 'text/event-stream; charset=utf-8');
        res.setHeader('cache-control', 'no-cache, no-transform');
        res.setHeader('connection', 'keep-alive');
        await pipeOpenAIStreamToAnthropic(res, upstreamResponse, config.model);
        return;
      }

      const responseBody = await upstreamResponse.json();
      res.json(convertOpenAIResponseToAnthropic(responseBody, config.model));
    } catch (error) {
      res.status(500).json({
        type: 'error',
        error: {
          type: 'api_error',
          message: error.message || 'Erro ao encaminhar requisicao ao provedor OpenAI-compatible',
        },
      });
    }
  });

  return app;
}

class OpenAIToAnthropicAdapterRegistry {
  constructor() {
    this.instances = new Map();
  }

  async ensureServer(config) {
    const normalizedConfig = {
      baseUrl: normalizeBaseUrl(config.baseUrl),
      apiKey: config.apiKey,
      model: config.model,
      providerName: config.providerName || 'OpenAI-compatible',
    };
    const key = createAdapterKey(normalizedConfig);

    const existing = this.instances.get(key);
    if (existing) {
      return existing;
    }

    const app = createAdapterApp(normalizedConfig);
    const server = await new Promise((resolve, reject) => {
      const instance = app.listen(0, DEFAULT_HOST, () => resolve(instance));
      instance.on('error', reject);
    });

    const adapterInfo = {
      key,
      host: DEFAULT_HOST,
      port: server.address().port,
      close: () => new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      }),
    };

    this.instances.set(key, adapterInfo);
    return adapterInfo;
  }

  async stopAll() {
    const closeOperations = Array.from(this.instances.values()).map(async (instance) => {
      try {
        await instance.close();
      } catch (_error) {
      }
    });

    await Promise.all(closeOperations);
    this.instances.clear();
  }
}

module.exports = {
  OpenAIToAnthropicAdapterRegistry,
};
