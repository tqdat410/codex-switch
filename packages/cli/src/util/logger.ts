import pino from 'pino';

export const logger = pino({
  level: process.env.CODEX_SWITCH_LOG_LEVEL ?? 'info',
  redact: {
    paths: [
      '*.tokens',
      '*.tokens.id_token',
      '*.tokens.access_token',
      '*.tokens.refresh_token',
      '*.OPENAI_API_KEY',
    ],
    censor: '[redacted]',
  },
});
