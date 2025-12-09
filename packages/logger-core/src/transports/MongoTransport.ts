import type { ITransport } from "../interfaces/ITransport";
import type { ILogEntry } from "../interfaces/ILogEntry";
import type { Collection, MongoClient } from "mongodb";

export interface MongoTransportOptions {
  client: MongoClient;
  dbName: string;
  collectionName: string;
}

export class MongoTransport implements ITransport {
  private readonly collection: Collection<ILogEntry>;

  constructor(options: MongoTransportOptions) {
    const db = options.client.db(options.dbName);
    this.collection = db.collection<ILogEntry>(options.collectionName);
  }

  async log(payload: string): Promise<void> {
    try {
      const entry = JSON.parse(payload) as ILogEntry;
      await this.collection.insertOne(entry);
    } catch {
      await this.collection.insertOne({
        level: "error",
        message: payload,
        timestamp: Date.now()
      } as ILogEntry);
    }
  }
}
