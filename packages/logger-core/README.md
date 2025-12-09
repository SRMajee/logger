# @majee/logger-core

Low-level primitives for the `@majee/logger` ecosystem.

This package is intended for:

- infrastructure libraries (HTTP adapters, tracing, metrics)
- custom transports and formatters
- frameworks that need deep integration with logging and context

Most application code should depend on **`@majee/logger`** instead.  
Use `@majee/logger-core` only if you explicitly need the primitives.

---

## Installation

```bash
npm install @majee/logger-core
# or
pnpm add @majee/logger-core
# or
yarn add @majee/logger-core
```

---

## Core Concepts

### Log Levels

```ts
import { LogLevels, type LogLevel } from "@majee/logger-core";

LogLevels.debug; // 10
LogLevels.info;  // 20
LogLevels.warn;  // 30
LogLevels.error; // 40

const level: LogLevel = "info";
```

---

### Log Entry

Structured log entry shape used throughout the core:

```ts
import type { ILogEntry } from "@majee/logger-core";

interface ILogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: Record<string, any>;
}
```

---

### Transports

Transports receive **formatted strings** and send them somewhere:

```ts
import type { ITransport } from "@majee/logger-core";

interface ITransport {
  log(payload: string): void | Promise<void>;
}
```

Built-in transports:

* `ConsoleTransport` – writes to stdout
* `FileTransport` – appends to a file
* `MongoTransport` – inserts into a MongoDB collection

Example:

```ts
import {
  ConsoleTransport,
  FileTransport,
  MongoTransport
} from "@majee/logger-core";
import { MongoClient } from "mongodb";

const consoleTransport = new ConsoleTransport();
const fileTransport = new FileTransport("logs/app.log");

const client = new MongoClient("mongodb://localhost:27017");
await client.connect();

const mongoTransport = new MongoTransport({
  client,
  dbName: "logs_db",
  collectionName: "app_logs"
});
```

You can implement your own:

```ts
class HttpTransport implements ITransport {
  async log(payload: string) {
    await fetch("https://log-endpoint.example.com", {
      method: "POST",
      body: payload,
      headers: { "content-type": "application/json" }
    });
  }
}
```

---

### Formatters

Formatters turn structured entries into strings:

```ts
import type { IFormatter, ILogEntry } from "@majee/logger-core";

interface IFormatter {
  format(entry: ILogEntry): string;
}
```

Built-in formatters:

* `JsonFormatter` – JSON lines
* `PrettyFormatter` – human-friendly, colored text

Example:

```ts
import {
  JsonFormatter,
  PrettyFormatter,
  type ILogEntry
} from "@majee/logger-core";

const jsonFormatter = new JsonFormatter();
const prettyFormatter = new PrettyFormatter();

const entry: ILogEntry = {
  level: "info",
  message: "hello",
  timestamp: Date.now(),
  context: { requestId: "req-1" }
};

const jsonLine = jsonFormatter.format(entry);
const prettyLine = prettyFormatter.format(entry);
```

---

### Context Manager (Async Context)

`ContextManager` wraps `AsyncLocalStorage` and provides:

* `runWithContext` – run a function with a given context
* `mergeContext` – enrich context in the current async chain
* `getContext` – read current context

```ts
import {
  ContextManager,
  defaultContextManager,
  type Context
} from "@majee/logger-core";

const cm = new ContextManager();

cm.runWithContext({ requestId: "req-123" }, async () => {
  // inside this async chain
  cm.mergeContext({ userId: "u-1" });

  const ctx: Context = cm.getContext(); // { requestId: "req-123", userId: "u-1" }
});
```

`defaultContextManager` is a shared instance used by `@majee/logger` by default.
Libraries should usually prefer their **own** `ContextManager` instance for isolation.

---

### Utilities

* `now()` – returns current timestamp in milliseconds.

```ts
import { now } from "@majee/logger-core";

const entry: ILogEntry = {
  level: "info",
  message: "hello",
  timestamp: now()
};
```

---

## Typical Use Cases

* Implementing framework adapters (Express, Fastify, NestJS) that wrap logging and context.
* Implementing additional transports (Kafka, HTTP, S3, etc.).
* Writing custom formatters with domain-specific fields.
* Building higher-level logging APIs on top of these primitives.

For standard application logging, prefer:

```ts
import { Logger } from "@majee/logger";
```
