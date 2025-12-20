import {
  Logger,
  ConsoleTransport,
  FileTransport,
  MongoTransport,
  JsonFormatter,
  PrettyFormatter,
  defaultContextManager,
} from "@majee/logger";
import { MongoClient } from "mongodb";

const MONGO_URI =
  process.env.MONGO_URL ||
  "mongodb://admin:password@localhost:27017?authSource=admin";
const DB_NAME = "logs_db";
const COLLECTION = "app_logs";

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();

  const logger = new Logger({
    level: "debug",
    formatter: new JsonFormatter(),
    contextManager: defaultContextManager,
    transports: [
      {
        transport: new ConsoleTransport(),
        formatter: new PrettyFormatter(),
        minLevel: "info",
        concurrency: 1,
      },
      {
        transport: new FileTransport("logs/app.log"),
        minLevel: "debug",
        concurrency: 1,
        maxPending: 5000,
      },
      {
        transport: new MongoTransport({
          client,
          dbName: DB_NAME,
          collectionName: COLLECTION,
        }),
        minLevel: "info",
        concurrency: 2,
        maxPending: 10_000,
        retry: {
          retries: 3,
          initialDelayMs: 100,
          maxDelayMs: 1000,
        },
      },
    ],
  });

  await logger.runWithContext(
    { requestId: "req-123", userId: "u-42" },
    async () => {
      logger.info("Handling request");
      logger.debug("Some debug detail");
      logger.error("An error occurred");
    }
  );
  await logger.runWithContext({ userId: "u1", password: "secret" }, async () =>
    logger.info("hello")
  );
logger.mergeContext({ big: "x".repeat(100_000) });
logger.mergeContext({ traceId: "abc", spanId: "def" });

  await logger.flush();
  await client.close();
}

main().catch((err) => {
  console.error("Dev app failed", err);
});
