"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleTransport = exports.now = void 0;
var now_1 = require("./utils/now");
Object.defineProperty(exports, "now", { enumerable: true, get: function () { return now_1.now; } });
var ConsoleTransport_1 = require("./transports/ConsoleTransport");
Object.defineProperty(exports, "ConsoleTransport", { enumerable: true, get: function () { return ConsoleTransport_1.ConsoleTransport; } });
