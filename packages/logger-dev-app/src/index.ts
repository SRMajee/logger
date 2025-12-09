import {
  Logger,
  ConsoleTransport,
  FileTransport,
  MongoTransport,
  JsonFormatter,
  PrettyFormatter,
  defaultContextManager
} from "@majee/logger";
import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGO_URL || "mongodb://localhost:27017/logger";
const DB_NAME = "logs_db";
const COLLECTION = "app_logs";

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();

  const logger = new Logger({
    level: "debug",
    formatter: new JsonFormatter(), // global default (used by Mongo & file)
    contextManager: defaultContextManager,
    transports: [
      {
        transport: new ConsoleTransport(),
        formatter: new PrettyFormatter(),
        minLevel: "info"
      },
      {
        transport: new FileTransport("logs/app.log"),
        minLevel: "debug"
      },
      {
        transport: new MongoTransport({
          client,
          dbName: DB_NAME,
          collectionName: COLLECTION
        }),
        minLevel: "info"
      }
    ]
  });

  // Example of context usage: request-level context
  await logger.runWithContext({ requestId: "req-123", userId: "u-42" }, async () => {
    logger.info("Handling request");
    logger.debug("Some debug detail");
    logger.error("An error occurred");
  });

  await client.close();
}

main().catch(err => {
  console.error("Dev app failed", err);
});
