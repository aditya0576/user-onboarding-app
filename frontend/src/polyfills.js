// Polyfill for TextEncoder/TextDecoder in Node.js test environment
// Required for MSW (Mock Service Worker) which uses these APIs
const { TextEncoder, TextDecoder } = require('util');
const { TransformStream } = require('stream/web');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.TransformStream = TransformStream;
