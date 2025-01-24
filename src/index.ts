import {
  AbortController as _AbortController,
  AbortError as _AbortError  ,
  AbortSignal as _AbortSignal,
  Headers as _Headers,
  Request as _Request,
  Response as _Response,
  URL as _URL,
  URLSearchParams as _URLSearchParams,
  fetch,
} from "./ponyfill";

{
  const g = globalThis;
  g.fetch ||= fetch;
  g.Response ||= _Response;
  g.Request ||= _Request;
  g.Headers ||= _Headers;
  g.URL ||= _URL;
  g.URLSearchParams ||= _URLSearchParams;
  g.AbortError ||= _AbortError;
  g.AbortSignal ||= _AbortSignal;
  g.AbortController ||= _AbortController;
}

declare global {
  // biome-ignore lint/suspicious/noRedeclare: This is a polyfill
  var fetch: typeof import("./fetch").fetch;
  // biome-ignore lint/suspicious/noRedeclare: This is a polyfill
  var Response: typeof _Response;
  interface Response extends _Response {}
  
  // biome-ignore lint/suspicious/noRedeclare: This is a polyfill
  var Request: typeof _Request;
  interface Request extends _Request {}
  
  // biome-ignore lint/suspicious/noRedeclare: This is a polyfill
  var Headers: typeof _Headers;
  interface Headers extends _Headers {}

  // biome-ignore lint/suspicious/noRedeclare: This is a polyfill
  var URL: typeof _URL;
  interface URL extends _URL {}
  
  // biome-ignore lint/suspicious/noRedeclare: This is a polyfill
  var URLSearchParams: typeof _URLSearchParams;
  interface URLSearchParams extends _URLSearchParams {}
  
  // biome-ignore lint/suspicious/noRedeclare: This is a polyfill
  var AbortError: typeof _AbortError;
  interface AbortError extends _AbortError {}
  
  // biome-ignore lint/suspicious/noRedeclare: This is a polyfill
  var AbortSignal: typeof _AbortSignal;
  interface AbortSignal extends _AbortSignal {}
  
  // biome-ignore lint/suspicious/noRedeclare: This is a polyfill
  var AbortController: typeof _AbortController;
  interface AbortController extends _AbortController {}
}
