import { AbortController, type AbortSignal } from "abort-controller/dist/abort-controller";
import { AbortError } from "./AbortError";
import { STATUS_CODES } from "./STATUS_CODES";
import { URL } from "./URL";
import { URLSearchParams } from "./URLSearchParams";

const viewClasses = [
  "[object Int8Array]",
  "[object Uint8Array]",
  "[object Uint8ClampedArray]",
  "[object Int16Array]",
  "[object Uint16Array]",
  "[object Int32Array]",
  "[object Uint32Array]",
  "[object Float32Array]",
  "[object Float64Array]",
];

function isDataView(obj: unknown): obj is DataView {
  return (obj && DataView.prototype.isPrototypeOf(obj)) as boolean;
}

const isArrayBufferView =
  ArrayBuffer.isView ||
  ((obj: unknown): obj is ArrayBuffer =>
    (obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1) as boolean);

const blobKeys = [
  "copyBlob",
  "getAs",
  "getBytes",
  "getContentType",
  "getDataAsString",
  "getName",
  "isGoogleType",
  "setBytes",
  "setContentType",
  "setContentTypeFromExtension",
  "setDataFromString",
  "setName",
] as const satisfies (keyof GoogleAppsScript.Base.Blob)[];
function isBlob(obj: unknown): obj is GoogleAppsScript.Base.Blob {
  return (
    typeof obj === "object" &&
    (obj as GoogleAppsScript.Base.Blob).toString() === "Blob" &&
    blobKeys.every((key) => typeof (obj as GoogleAppsScript.Base.Blob)[key] === "function")
  );
}

function arrayBufferToBlob(
  buffer: ArrayBuffer,
  contentType?: string | null,
  name?: string | null,
): GoogleAppsScript.Base.Blob {
  const uint8Array = new Uint8Array(buffer);
  const bytes = Array.from(uint8Array);

  return Utilities.newBlob(bytes, contentType as string, name as string);
}

function normalizeName(name: string) {
  if (typeof name !== "string") {
    name = String(name);
  }
  if (/[^a-z0-9\-#$%&'*+.^_`|~!]/i.test(name) || name === "") {
    throw new TypeError(`Invalid character in header field name: "${name}"`);
  }
  return name.toLowerCase();
}

function normalizeValue(value: string) {
  if (typeof value !== "string") {
    value = String(value);
  }
  return value;
}

type HeadersInit = Headers | string[][] | Record<string, string>;

/** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Headers) */
export class Headers {
  private _map: Record<string, string>;

  /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Headers/Headers) */
  constructor(headers?: HeadersInit) {
    this._map = Object.create(null);

    if (headers instanceof Headers) {
      headers.forEach(function (value, name) {
        this!.append(name, value);
      }, this);
    } else if (Array.isArray(headers)) {
      for (const header of headers) {
        if (header.length !== 2) {
          throw new TypeError(`Headers constructor: expected name/value pair to be length 2, found ${header.length}`);
        }
        this.append(header[0], header[1]);
      }
    } else if (headers) {
      for (const name of Object.getOwnPropertyNames(headers)) {
        this.append(name, headers[name]);
      }
    }
  }

  /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Headers/append) */
  append(name: string, value: string) {
    name = normalizeName(name);
    value = normalizeValue(value);
    const oldValue = this._map[name];
    this._map[name] = oldValue ? `${oldValue},${value}` : value;
  }

  /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Headers/delete) */
  delete(name: string) {
    delete this._map[normalizeName(name)];
  }

  /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Headers/get) */
  get(name: string) {
    name = normalizeName(name);
    return this.has(name) ? this._map[name] : null;
  }

  /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Headers/has) */
  has(name: string) {
    return this._map[normalizeName(name)] !== undefined;
  }

  /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Headers/set) */
  set(name: string, value: string) {
    this._map[normalizeName(name)] = normalizeValue(value);
  }

  /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Headers/forEach) */
  forEach<T = any>(
    callback: (this: T | undefined, value: string, name: string, headers: Headers) => void,
    thisArg?: T,
  ) {
    for (const name in this._map) {
      callback.call(thisArg, this._map[name], name, this);
    }
  }

  /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Headers/keys) */
  *keys() {
    for (const name in this._map) {
      yield name;
    }
  }

  /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Headers/values) */
  *values() {
    for (const name in this._map) {
      yield this._map[name];
    }
  }

  /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Headers/entries) */
  *entries() {
    for (const name in this._map) {
      yield [name, this._map[name]];
    }
  }

  [Symbol.iterator]() {
    return this.entries();
  }
}

function consumed(body: Body) {
  if (body._noBody) return;
  if (body._bodyUsed) {
    return Promise.reject(new TypeError("Already read"));
  }
  body._bodyUsed = true;
}
function readArrayBufferAsText(buf: ArrayBuffer) {
  const view = new Uint8Array(buf);
  const chars = new Array(view.length);

  for (let i = 0; i < view.length; i++) {
    chars[i] = String.fromCharCode(view[i]);
  }
  return chars.join("");
}

function bufferClone(buf: ArrayBuffer) {
  if (buf.slice) {
    return buf.slice(0);
  } else {
    const view = new Uint8Array(buf.byteLength);
    view.set(new Uint8Array(buf));
    return view.buffer;
  }
}

type BodyInit = null | string | URLSearchParams | ArrayBuffer | ArrayBufferView | DataView | GoogleAppsScript.Base.Blob;

class Body {
  /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Response/body) */
  readonly body?: never;
  /** @internal */
  _bodyUsed: boolean;
  /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Response/bodyUsed) */
  get bodyUsed(): boolean {
    return this._bodyUsed;
  }
  /** @internal */
  _bodyInit?: string | GoogleAppsScript.Base.Blob;
  /** @internal */
  _noBody?: boolean;
  private _bodyText?: string;
  private _bodyBlob?: GoogleAppsScript.Base.Blob;
  private _bodyArrayBuffer?: ArrayBuffer;
  /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Response/headers) */
  readonly headers: Headers;

  /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Response/Response) */
  constructor(body: BodyInit | undefined, headersInit: HeadersInit | undefined) {
    this.headers = new Headers(headersInit);
    this._bodyUsed = false;

    if (!body) {
      this._noBody = true;
      this._bodyText = "";
      this._bodyInit = undefined;
    } else if (typeof body === "string") {
      this._bodyText = body;
      this._bodyInit = body;
    } else if (isBlob(body)) {
      this._bodyBlob = body;
      this._bodyInit = body;
    } else if (URLSearchParams.prototype.isPrototypeOf(body)) {
      this._bodyText = body.toString();
      this._bodyInit = this._bodyText;
    } else if (isDataView(body)) {
      this._bodyArrayBuffer = bufferClone(body.buffer);
      this._bodyInit = arrayBufferToBlob(this._bodyArrayBuffer, this.headers.get("content-type"));
    } else if (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body)) {
      this._bodyArrayBuffer = bufferClone(body as ArrayBuffer);
      this._bodyInit = arrayBufferToBlob(this._bodyArrayBuffer, this.headers.get("content-type"));
    } else {
      this._bodyText = body = Object.prototype.toString.call(body);
      this._bodyInit = body;
    }

    if (!this.headers.get("content-type")) {
      if (typeof body === "string") {
        this.headers.set("content-type", "text/plain;charset=UTF-8");
      } else if (URLSearchParams.prototype.isPrototypeOf(body!)) {
        this.headers.set("content-type", "application/x-www-form-urlencoded;charset=UTF-8");
      }
    }
  }

  /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Response/blob) */
  blob(): Promise<GoogleAppsScript.Base.Blob> {
    const rejected = consumed(this);
    if (rejected) {
      return rejected;
    }

    if (this._bodyBlob) {
      return Promise.resolve(this._bodyBlob);
    } else if (this._bodyArrayBuffer) {
      return Promise.resolve(arrayBufferToBlob(this._bodyArrayBuffer, this.headers.get("content-type")));
    } else {
      return Promise.resolve(Utilities.newBlob(this._bodyText || "", this.headers.get("content-type") as string));
    }
  }

  /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Response/arrayBuffer) */
  arrayBuffer(): Promise<ArrayBuffer> {
    if (this._bodyArrayBuffer) {
      const isConsumed = consumed(this);
      if (isConsumed) {
        return isConsumed;
      } else if (ArrayBuffer.isView(this._bodyArrayBuffer)) {
        return Promise.resolve(
          this._bodyArrayBuffer.buffer.slice(
            this._bodyArrayBuffer.byteOffset,
            this._bodyArrayBuffer.byteOffset + this._bodyArrayBuffer.byteLength,
          ),
        );
      } else {
        return Promise.resolve(this._bodyArrayBuffer);
      }
    } else if (this._bodyBlob) {
      return Promise.resolve(new Uint8Array(this._bodyBlob.getBytes()).buffer);
    } else {
      throw new Error("could not read as ArrayBuffer");
    }
  }

  /** @internal */
  _text() {
    if (this._bodyArrayBuffer) {
      return readArrayBufferAsText(this._bodyArrayBuffer);
    } else if (this._bodyBlob) {
      return this._bodyBlob.getDataAsString();
    } else {
      return this._bodyText || "";
    }
  }

  /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Response/text) */
  text(): Promise<string> {
    const rejected = consumed(this);
    if (rejected) {
      return rejected;
    }

    return Promise.resolve(this._text());
  }

  /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Response/json) */
  json<T = any>(): Promise<T> {
    return Promise.resolve(JSON.parse(this._text()));
  }
}

// HTTP methods whose capitalization should be normalized
const methods = ["connect", "delete", "get", "head", "options", "patch", "post", "put", "trace"];
type Method = GoogleAppsScript.URL_Fetch.HttpMethod | Uppercase<GoogleAppsScript.URL_Fetch.HttpMethod>;

function normalizeMethod(method: string): GoogleAppsScript.URL_Fetch.HttpMethod | string {
  const upcased = method.toLowerCase();
  return methods.indexOf(upcased) > -1 ? upcased : method;
}

interface RequestInit {
  method?: Method | string;
  body?: BodyInit;
  headers?: HeadersInit | Headers;
  signal?: AbortSignal;
  credentials?: never;
  referrer?: never;
  referrerPolicy?: never;
  keepalive?: never;
  cache?: never;
}

/** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Request) */
export class Request extends Body {
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Request/method) */
  readonly method: GoogleAppsScript.URL_Fetch.HttpMethod | string;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Request/url) */
  readonly url: URL;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Request/signal) */
  readonly signal: AbortSignal;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Request/referrer) */
  readonly referrer: null;

  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Request/Request) */
  constructor(input: string | URL | Request, options?: RequestInit) {
    options = options || {};
    let body = options.body;
    let url;
    let method = options.method;
    let signal = options.signal;
    let headersInit = options.headers;

    if (input instanceof Request) {
      if (input._bodyUsed) {
        throw new TypeError("Already read");
      }
      url = input.url;
      if (headersInit) {
        headersInit = input.headers;
      }
      method = input.method;
      signal = input.signal;
      if (!body && input._bodyInit != null) {
        body = input._bodyInit;
        input._bodyUsed = true;
      }
    } else {
      url = new URL(input);
    }

    method = normalizeMethod(method || "get");

    if ((method === "get" || (method as string) === "head") && body) {
      throw new TypeError("Body not allowed for GET or HEAD requests");
    }

    super(body, headersInit);

    this.url = url;
    this.method = method;
    this.signal = signal || new AbortController().signal;
    this.referrer = null;
  }

  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Request/clone) */
  clone() {
    return new Request(this, {
      body: this._bodyInit,
    });
  }
}

const ResponseUrlSymbol = Symbol();
type ResponseUrlSymbol = typeof ResponseUrlSymbol;

interface ResponseInit {
  status?: number;
  statusText?: string;
  headers?: HeadersInit;
  /** @internal */
  [ResponseUrlSymbol]?: string;
}

const redirectStatuses = [301, 302, 303, 307, 308];

type ResponseType = "default" | "error";

/** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Response) */
export class Response extends Body {
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/ok) */
  readonly ok: boolean;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/status) */
  readonly status: number;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/statusText) */
  readonly statusText: string;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/type) */
  readonly type: ResponseType;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/url) */
  readonly url: string;

  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/Response) */
  constructor(bodyInit?: BodyInit, options?: ResponseInit) {
    options = options || {};
    super(bodyInit, options.headers);

    this.type = "default";
    this.status = options.status === undefined ? 200 : options.status;
    if (this.status < 200 || this.status > 599) {
      throw new RangeError("Failed to construct 'Response': The status provided (0) is outside the range [200, 599].");
    }
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = options.statusText === undefined ? "" : `${options.statusText}`;
    this.url = options[ResponseUrlSymbol] || "";
  }

  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/clone) */
  clone() {
    return new Response(typeof this._bodyInit === "object" ? this._bodyInit.copyBlob() : this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      [ResponseUrlSymbol]: this.url,
    });
  }

  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/error) */
  static error() {
    const response = new Response(null, {
      status: 200,
      statusText: "",
    });
    (response as { ok: boolean }).ok = false;
    (response as { status: number }).status = 0;
    (response as { type: string }).type = "error";
    return response;
  }

  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/redirect) */
  static redirect(url: string, status: number) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError("Invalid status code");
    }

    return new Response(null, {
      status: status,
      headers: {
        location: url,
      },
    });
  }
}

/**
 * The polyfill of browser fetch API for Google Apps Script.
 * @param {string | URL | Request} input A target URL or a Request object.
 * @param {RequestInit} init An options object containing any custom settings that you want to apply to the request.
 * @returns {Promise<Response>}
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Window/fetch)
 */
export function fetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  return new Promise(function fetchCore(resolve, reject) {
    const request = new Request(input, init);

    if (request.signal?.aborted) {
      return reject(new AbortError("Aborted"));
    }

    const response = UrlFetchApp.fetch(request.url.href, {
      method: request.method.toLowerCase() as GoogleAppsScript.URL_Fetch.HttpMethod,
      headers: Object.fromEntries(request.headers.entries()),
      contentType: request.headers.get("content-type") || undefined,
      payload: request._bodyInit,
      muteHttpExceptions: false,
    });

    const rawHeaders = response.getAllHeaders() as Record<string, string | string[]>;
    const headers = new Headers();
    for (const key in rawHeaders) {
      if (!rawHeaders.hasOwnProperty(key)) continue;
      const value = rawHeaders[key];
      if (Array.isArray(value)) {
        for (const v of value) headers.append(key, v);
      } else {
        headers.append(key, value);
      }
    }

    return resolve(
      new Response(response.getBlob(), {
        headers,
        status: response.getResponseCode(),
        statusText: STATUS_CODES[response.getResponseCode() as keyof typeof STATUS_CODES] || "",
        [ResponseUrlSymbol]: request.url.href,
      }),
    );
  });
}

fetch.polyfill = true as const;
