export const LogLevels = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
} as const;

export type LogLevel = keyof typeof LogLevels;
