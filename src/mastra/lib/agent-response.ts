const LEAKED_FUNCTION_CALL_PATTERN =
  /<function=[^>]+>\s*[\s\S]*?<\/function>/gi;

export const DEFAULT_AGENT_MAX_STEPS = 5;

export function sanitizeAgentText(text: unknown): string {
  if (typeof text !== 'string') {
    return '';
  }

  return text
    .replace(LEAKED_FUNCTION_CALL_PATTERN, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function getAgentReply(agentResult: { text?: unknown }): string {
  return sanitizeAgentText(agentResult?.text);
}
