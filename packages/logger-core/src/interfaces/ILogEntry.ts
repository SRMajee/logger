export interface ILogEntry {
  level: string;
  message: string;
  timestamp: number;
  context?: Record<string, any>;
}
