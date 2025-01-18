import {
  AbortController,
  AbortError,
  AbortSignal,
  Headers,
  Request,
  Response,
  URL,
  URLSearchParams,
  fetch,
} from "./ponyfill";

{
  const g = globalThis;
  g.fetch ||= fetch;
  g.Response ||= Response;
  g.Request ||= Request;
  g.Headers ||= Headers;
  g.URL ||= URL;
  g.URLSearchParams ||= URLSearchParams;
  g.AbortError ||= AbortError;
  g.AbortSignal ||= AbortSignal;
  g.AbortController ||= AbortController;
}

declare global {
  // biome-ignore lint/suspicious/noRedeclare: This is a polyfill
  var fetch: typeof import("./fetch").fetch;
  // biome-ignore lint/suspicious/noRedeclare: This is a polyfill
  var Response: typeof import("./fetch").Response;
  // biome-ignore lint/suspicious/noRedeclare: This is a polyfill
  var Request: typeof import("./fetch").Request;
  // biome-ignore lint/suspicious/noRedeclare: This is a polyfill
  var Headers: typeof import("./fetch").Headers;
  // biome-ignore lint/suspicious/noRedeclare: This is a polyfill
  var URL: typeof import("./URL").URL;
  // biome-ignore lint/suspicious/noRedeclare: This is a polyfill
  var URLSearchParams: typeof import("./URLSearchParams").URLSearchParams;
  // biome-ignore lint/suspicious/noRedeclare: This is a polyfill
  var AbortError: typeof import("./AbortError").AbortError;
  // biome-ignore lint/suspicious/noRedeclare: This is a polyfill
  var AbortSignal: typeof import("abort-controller").AbortSignal;
  // biome-ignore lint/suspicious/noRedeclare: This is a polyfill
  var AbortController: typeof import("abort-controller").AbortController;
}
