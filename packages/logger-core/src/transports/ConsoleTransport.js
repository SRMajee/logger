"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleTransport = void 0;
class ConsoleTransport {
    log(entry) {
        console.log(`[${entry.level}] ${new Date(entry.timestamp).toISOString()} - ${entry.message}`);
    }
}
exports.ConsoleTransport = ConsoleTransport;
