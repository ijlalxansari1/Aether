require('@testing-library/jest-dom');

const { TextDecoder } = require('util');
global.TextDecoder = TextDecoder;

// Custom TextEncoder polyfill to ensure returned Uint8Array matches the JSDOM context constructor check
class TextEncoderPolyfill {
  encode(str) {
    const buf = Buffer.from(str, 'utf-8');
    const u8 = new Uint8Array(buf.length);
    for (let i = 0; i < buf.length; i++) {
      u8[i] = buf[i];
    }
    return u8;
  }
}
global.TextEncoder = TextEncoderPolyfill;

if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (val) => JSON.parse(JSON.stringify(val));
}

// Polyfill web streams
const webStreams = require('stream/web');
global.ReadableStream = webStreams.ReadableStream;
global.WritableStream = webStreams.WritableStream;
global.TransformStream = webStreams.TransformStream;

// Custom minimal Headers polyfill
class HeadersPolyfill {
  constructor(init = {}) {
    this.map = new Map();
    if (init) {
      if (typeof init.forEach === 'function') {
        init.forEach((v, k) => this.map.set(k.toLowerCase(), v));
      } else if (typeof init === 'object') {
        for (const [k, v] of Object.entries(init)) {
          this.map.set(k.toLowerCase(), v);
        }
      }
    }
  }
  get(name) {
    return this.map.get(name.toLowerCase()) || null;
  }
  set(name, value) {
    this.map.set(name.toLowerCase(), value);
  }
  append(name, value) {
    this.map.set(name.toLowerCase(), value);
  }
  delete(name) {
    this.map.delete(name.toLowerCase());
  }
  has(name) {
    return this.map.has(name.toLowerCase());
  }
  forEach(callback) {
    this.map.forEach(callback);
  }
  entries() {
    return this.map.entries();
  }
}

class RequestPolyfill {
  constructor(input, init = {}) {
    this.url = input;
    this.method = init.method || 'GET';
    this.headers = new HeadersPolyfill(init.headers);
    this.body = init.body || '';
  }
  async text() {
    if (typeof this.body === 'string') return this.body;
    return String(this.body || '');
  }
  async json() {
    const txt = await this.text();
    return JSON.parse(txt);
  }
}

class ResponsePolyfill {
  constructor(body = '', init = {}) {
    this._body = body;
    this.status = init.status || 200;
    this.headers = new HeadersPolyfill(init.headers);
  }
  get body() {
    const text = typeof this._body === 'string' ? this._body : String(this._body || '');
    const uint8 = new TextEncoderPolyfill().encode(text);
    return new ReadableStream({
      start(controller) {
        controller.enqueue(uint8);
        controller.close();
      }
    });
  }
  async text() {
    if (typeof this._body === 'string') return this._body;
    if (this._body && typeof this._body.getReader === 'function') {
      let result = '';
      const reader = this._body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value);
      }
      return result;
    }
    if (this._body && this._body[Symbol.asyncIterator]) {
      let result = '';
      const decoder = new TextDecoder();
      for await (const chunk of this._body) {
        result += decoder.decode(chunk);
      }
      return result;
    }
    return String(this._body || '');
  }
  async json() {
    const txt = await this.text();
    return JSON.parse(txt);
  }
  get ok() {
    return this.status >= 200 && this.status < 300;
  }
  static json(body, init = {}) {
    const headers = new HeadersPolyfill(init.headers);
    headers.set('content-type', 'application/json');
    return new ResponsePolyfill(JSON.stringify(body), { ...init, headers });
  }
}

global.Headers = HeadersPolyfill;
global.Request = RequestPolyfill;
global.Response = ResponsePolyfill;
global.fetch = jest.fn().mockImplementation(() => Promise.resolve(new ResponsePolyfill('{"success":true}', { status: 200 })));
