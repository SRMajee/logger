# @majee/logger

A modular, TypeScript-first logger for Node.js applications with:

- Pluggable transports (console, file, MongoDB, custom)
- Configurable formatters (JSON, pretty)
- Global and per-transport log level filtering
- Async context support (request-scoped metadata, `requestId`, `userId`, etc.)
- A clean split between:
  - `@majee/logger-core` – low-level primitives (transports, formatters, context)
  - `@majee/logger` – ergonomic API and public surface

Consumers only import from `@majee/logger`.  
The internal `@majee/logger-core` package is published separately for infrastructure / tooling reuse.

---

## Installation

```bash
npm install @majee/logger
# or
pnpm add @majee/logger
# or
yarn add @majee/logger
```
If you plan to use the MongoDB transport, also install the MongoDB driver:

```bash
npm install mongodb
```

---

## Quick Start

```ts
import {
  Logger,
  ConsoleTransport,
  JsonFormatter
} from "@majee/logger";

const logger = new Logger({
  level: "info",
  formatter: new JsonFormatter(),
  transports: [
    { transport: new ConsoleTransport() }
  ]
});

logger.info("Application started");
logger.debug("This will not be shown at level=info");
logger.error("Something went wrong");
```

---

## Concepts

### Logger

`Logger` is the main entry point. It:

* creates structured log entries (`ILogEntry`)
* applies formatter(s) to convert them to strings
* fans out to one or more transports

```ts
import { Logger, JsonFormatter } from "@majee/logger";

const logger = new Logger({
  level: "debug",                // global minimum log level
  formatter: new JsonFormatter(),// global default formatter
  transports: [ /* see below */ ]
});
```

### Transports

A transport is anything that receives a **string** and writes it somewhere:

* `ConsoleTransport` – writes to stdout
* `FileTransport` – appends to a file
* `MongoTransport` – inserts documents into MongoDB

```ts
import {
  Logger,
  ConsoleTransport,
  FileTransport,
  MongoTransport,
  JsonFormatter,
  PrettyFormatter
} from "@majee/logger";
import { MongoClient } from "mongodb";

async function main() {
  const client = new MongoClient("mongodb://localhost:27017");
  await client.connect();

  const logger = new Logger({
    level: "debug",
    formatter: new JsonFormatter(), // default for transports without custom formatter
    transports: [
      {
        transport: new ConsoleTransport(),
        formatter: new PrettyFormatter(), // console: pretty-colored single-line logs
        minLevel: "info"                  // console logs >= info
      },
      {
        transport: new FileTransport("logs/app.log"),
        // inherits global JsonFormatter
        minLevel: "debug"                 // file logs everything >= debug
      },
      {
        transport: new MongoTransport({
          client,
          dbName: "logs_db",
          collectionName: "app_logs"
        }),
        // inherits global JsonFormatter (Mongo expects JSON)
        minLevel: "warn"                  // Mongo logs >= warn
      }
    ]
  });

  logger.debug("Debug log (file only)");
  logger.info("Info log (console + file)");
  logger.warn("Warn log (console + file + Mongo)");
  logger.error("Error log (console + file + Mongo)");

  await client.close();
}

main().catch(err => {
  console.error("Failed to run logger demo", err);
});
```

---

### Formatters

Formatters convert structured log entries (`ILogEntry`) into strings.

Built-ins:

* `JsonFormatter` – log entries as JSON lines
* `PrettyFormatter` – human-readable, colored console output

```ts
import {
  JsonFormatter,
  PrettyFormatter
} from "@majee/logger";

// Global formatter:
const logger = new Logger({
  formatter: new JsonFormatter(),
  transports: [
    { transport: new ConsoleTransport() } // JSON to console
  ]
});

// Per-transport formatter:
const logger2 = new Logger({
  formatter: new JsonFormatter(), // default
  transports: [
    {
      transport: new ConsoleTransport(),
      formatter: new PrettyFormatter()
    },
    {
      transport: new FileTransport("logs/app.log") // uses JsonFormatter
    }
  ]
});
```

---

### Levels

Available log levels:

* `debug`
* `info`
* `warn`
* `error`

Global level is configured on `Logger`:

```ts
const logger = new Logger({ level: "info" }); // debug is filtered out
```

Each transport can also specify a `minLevel`:

```ts
const logger = new Logger({
  level: "debug",
  transports: [
    {
      transport: new ConsoleTransport(),
      formatter: new PrettyFormatter(),
      minLevel: "info"
    },
    {
      transport: new FileTransport("logs/app.log"),
      minLevel: "debug"
    }
  ]
});
```

---

## Context (request-scoped metadata)

The logger supports async context (via `AsyncLocalStorage`):

* Attach a context (e.g. `requestId`, `userId`) to an async flow.
* All logs in that flow will automatically carry that context into formatters/JSON.

```ts
import { Logger, JsonFormatter } from "@majee/logger";

const logger = new Logger({
  level: "info",
  formatter: new JsonFormatter(),
  transports: [{ transport: new ConsoleTransport() }]
});

// Wrap a request/operation in a context
logger.runWithContext({ requestId: "req-123", userId: "u-42" }, async () => {
  logger.info("Handling request");
  await doSomething();
  logger.error("Something failed");
});
```

Inside formatters, `entry.context` is available for inclusion in output (e.g. JSON or pretty formatting).

---

## API Overview

### `new Logger(options?: LoggerOptions)`

```ts
interface TransportConfig {
  transport: ITransport;
  formatter?: IFormatter;
  minLevel?: LogLevel;
}

interface LoggerOptions {
  level?: LogLevel;               // default "info"
  transports?: TransportConfig[]; // default: ConsoleTransport + JsonFormatter
  formatter?: IFormatter;         // default: JsonFormatter
  contextManager?: ContextManager;// optional custom context manager
}
```

### Logging methods

```ts
logger.debug(message: string): void;
logger.info(message: string): void;
logger.warn(message: string): void;
logger.error(message: string): void;
```

### Context methods

```ts
logger.runWithContext(ctx: Context, fn: () => any): any;
logger.mergeContext(partial: Context): void;
logger.getContext(): Context;
```

---

## Types and Low-Level APIs

For advanced usage:

```ts
import {
  Logger,
  ConsoleTransport,
  FileTransport,
  MongoTransport,
  JsonFormatter,
  PrettyFormatter,
  LogLevels,
  type LogLevel,
  type ILogEntry,
  type ITransport,
  type IFormatter,
  type Context,
  ContextManager
} from "@majee/logger";
```

You can use `ContextManager` directly if you need more control, or write your own transports/formatters.

---

