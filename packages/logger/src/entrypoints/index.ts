export * from "../core/Logger";

export {
  ConsoleTransport,
  FileTransport,
  MongoTransport,
  JsonFormatter,
  PrettyFormatter,
  LogLevels,
  defaultContextManager
} from "@majee/logger-core";

export type {
  LogLevel,
  ILogEntry,
  ITransport,
  IFormatter,
  Context,
  ContextManager
} from "@majee/logger-core";
