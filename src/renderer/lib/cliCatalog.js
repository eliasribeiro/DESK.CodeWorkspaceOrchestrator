export const SUPPORTED_CLI_EDITORS = [
  { value: 'claude-code', label: 'Claude Code', command: 'claude' },
  { value: 'codex', label: 'Codex', command: 'codex' },
  { value: 'gemini-cli', label: 'Gemini CLI', command: 'gemini' },
  { value: 'qwen-code', label: 'Qwen Code', command: 'qwen' },
  { value: 'opcode', label: 'OpenCode', command: 'opencode' },
];

export const DEFAULT_ENABLED_CLI_EDITORS = SUPPORTED_CLI_EDITORS.map((editor) => editor.value);

export function normalizeEnabledCliEditors(value) {
  if (!Array.isArray(value)) {
    return [...DEFAULT_ENABLED_CLI_EDITORS];
  }

  const supportedEditorIds = new Set(DEFAULT_ENABLED_CLI_EDITORS);
  const normalized = value.filter((editorId, index) => (
    supportedEditorIds.has(editorId) && value.indexOf(editorId) === index
  ));

  return normalized;
}

export function getEnabledCliOptions(enabledCliEditors) {
  const enabledSet = new Set(normalizeEnabledCliEditors(enabledCliEditors));
  return SUPPORTED_CLI_EDITORS.filter((editor) => enabledSet.has(editor.value));
}

export function findCliOption(editorId) {
  return SUPPORTED_CLI_EDITORS.find((editor) => editor.value === editorId) || null;
}
