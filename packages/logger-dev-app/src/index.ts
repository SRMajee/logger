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
import { SchemaValidator, defaultValidator, defaultSampler } from '@majee/logger-core';

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
    validator: defaultValidator,
    sampler: defaultSampler,
    // validator: new SchemaValidator({
    // maxContextSizeBytes: 32 * 1024,
    // schemaVersion: 2,
    // onError: () => {
    //   // custom reporting
    // },
    // }),
    transports: [
      {
        transport: new ConsoleTransport(),
        formatter: new PrettyFormatter(),
        minLevel: "debug",
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
        minLevel: "debug",
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

  // await logger.runWithContext(
  //   { requestId: "req-123", userId: "u-42" },
  //   async () => {
  //     logger.info("Handling request");
  //     logger.debug("Some debug detail");
  //     logger.error("An error occurred");
  //   }
  // );
  await logger.runWithContext({ userId: "u1", password: "secret" }, async () =>
    logger.info("hello")
  );
  logger.mergeContext({ big: "x".repeat(100_000) });
  // logger.mergeContext({ traceId: "abc", spanId: "def" });
  // console.log("---- COMPOSITE SAMPLER TEST ----");

  for (let i = 0; i < 20; i++) {
    logger.error("Composite failure" );
  }

  for (let i = 0; i < 50; i++) {
    logger.debug("Debug noise");
  }

  await logger.flush();

  await logger.flush();
  await client.close();
}

main().catch((err) => {
  console.error("Dev app failed", err);
});
