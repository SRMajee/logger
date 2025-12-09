import fs from "fs";
import path from "path";
import type { ITransport } from "../interfaces/ITransport";

export class FileTransport implements ITransport {
  private stream: fs.WriteStream;

  constructor(filePath: string) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.stream = fs.createWriteStream(filePath, { flags: "a" });
  }

  log(payload: string): void {
    this.stream.write(payload + "\n");
  }
}
