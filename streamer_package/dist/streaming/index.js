"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.WebSocketStreamingServer = exports.TextStreamingComponent = void 0;
// Streaming system exports
var TextStreamingComponent_1 = require("./TextStreamingComponent");
Object.defineProperty(exports, "TextStreamingComponent", { enumerable: true, get: function () { return TextStreamingComponent_1.TextStreamingComponent; } });
var WebSocketStreamingServer_1 = require("./WebSocketStreamingServer");
Object.defineProperty(exports, "WebSocketStreamingServer", { enumerable: true, get: function () { return WebSocketStreamingServer_1.WebSocketStreamingServer; } });
__exportStar(require("./types"), exports);
// Default export for easy importing
var TextStreamingComponent_2 = require("./TextStreamingComponent");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return TextStreamingComponent_2.TextStreamingComponent; } });
//# sourceMappingURL=index.js.map