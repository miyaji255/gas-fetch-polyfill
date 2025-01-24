# gas-fetch-polyfill

This is a polyfill for the `fetch` API on Google Apps Script. This polyfill is forked from [github/fetch](https://github.com/github/fetch) and modified to work on Google Apps Script.

The compitability of  [fetch-google-apps-script-ponyfill](https://github.com/balena-io-modules/fetch-google-apps-script-ponyfill) is not good enough for me, so I created this polyfill.

## Installation

```bash
npm install gas-fetch-polyfill
```

## Usage

```javascript
import 'gas-fetch-polyfill';

await fetch('https://example.com');
```

You can also use this as a ponyfill.

```javascript
import { fetch } from 'gas-fetch-polyfill/ponyfill';

await fetch('https://example.com');
```

## Example

This polyfill makes it possible to use [Hono Client](https://hono.dev/docs/guides/rpc#client) on Google Apps Script.

```typescript
import 'gas-fetch-polyfill';
import { hc } from 'hono/client';
import type { AppType } from './server';

export const client = hc<AppType>(
  'https://example.com',
  { fetch }
);

```

## Why `gas-fetch-polyfill` is bundled?

Most libraries are not bundled with their dependencies, but `gas-fetch-polyfill` is bundled with its dependencies. This is because the dependencies of `gas-fetch-polyfill` (`abort-controller` and `event-target-shim`) are not supported `exports` and `module` fields in `package.json`.

I bundled this so that there is no need to do any special configuration.

## Compatibilities

**Request**
|                                         | Status             | Remarks                                                                            |
| --------------------------------------- | ------------------ | ---------------------------------------------------------------------------------- |
| `Request()` constructor                 | :white_check_mark: |                                                                                    |
| `Request.prototype.body`                | :x:                | `ReadableStream` is not supported on GAS                                           |
| `Request.prototype.bodyUsed`            | :white_check_mark: |                                                                                    |
| `Request.prototype.cache`               | :x:                |                                                                                    |
| `Request.prototype.credentials`         | :x:                |                                                                                    |
| `Request.prototype.destination`         | :x:                |                                                                                    |
| `Request.prototype.headers`             | :white_check_mark: |                                                                                    |
| `Request.prototype.integrity`           | :x:                |                                                                                    |
| `Request.prototype.isHistoryNavigation` | :x:                |                                                                                    |
| `Request.prototype.keepalive`           | :x:                |                                                                                    |
| `Request.prototype.method`              | :white_check_mark: | Normalize to lowercase                                                             |
| `Request.prototype.mode`                | :x:                |                                                                                    |
| `Request.prototype.redirect`            | :x:                |                                                                                    |
| `Request.prototype.referrer`            | :x:                |                                                                                    |
| `Request.prototype.referrerPolicy`      | :x:                |                                                                                    |
| `Request.prototype.signal`              | :white_check_mark: |                                                                                    |
| `Request.prototype.url`                 | :white_check_mark: |                                                                                    |
| `Request.prototype.arrayBuffer()`       | :white_check_mark: |                                                                                    |
| `Request.prototype.blob()`              | :warning:          | Retuning [GAS Blob](https://developers.google.com/apps-script/reference/base/blob) |
| `Request.prototype.bytes()`             | :x:                |                                                                                    |
| `Request.prototype.clone()`             | :white_check_mark: |                                                                                    |
| `Request.prototype.formData()`          | :x:                |                                                                                    |
| `Request.prototype.json()`              | :white_check_mark: |                                                                                    |
| `Request.prototype.text()`              | :white_check_mark: |                                                                                    |

**Response**
|                                    | Status             | Remarks                                                                            |
| ---------------------------------- | ------------------ | ---------------------------------------------------------------------------------- |
| `Response()` constructor           | :white_check_mark: |                                                                                    |
| `Response.error()`                 | :white_check_mark: | `type` is `"error"`                                                                |
| `Response.json()`                  | :x:                |                                                                                    |
| `Response.redirect()`              | :white_check_mark: |                                                                                    |
| `Response.prototype.body`          | :x:                | `ReadableStream` is not supported on GAS                                           |
| `Response.prototype.bodyUsed`      | :white_check_mark: |                                                                                    |
| `Response.prototype.headers`       | :white_check_mark: |                                                                                    |
| `Reponse.prototype.ok`             | :white_check_mark: |                                                                                    |
| `Response.prototype.redirected`    | :white_check_mark: |                                                                                    |
| `Response.prototype.status`        | :white_check_mark: |                                                                                    |
| `Response.prototype.statusText`    | :white_check_mark: |                                                                                    |
| `Response.prototype.type`          | :warning:          | Always  be `"default"`                                                             |
| `Response.prototype.url`           | :white_check_mark: |                                                                                    |
| `Response.prototype.arrayBuffer()` | :white_check_mark: |                                                                                    |
| `Response.prototype.blob()`        | :warning:          | Retuning [GAS Blob](https://developers.google.com/apps-script/reference/base/blob) |
| `Response.prototype.bytes()`       | :x:                |                                                                                    |
| `Response.prototype.clone()`       | :white_check_mark: |                                                                                    |
| `Response.prototype.formData()`    | :x:                |                                                                                    |
| `Response.prototype.json()`        | :white_check_mark: |                                                                                    |
| `Response.prototype.text()`        | :white_check_mark: |                                                                                    |



## License

MIT

[src/fetch.ts](./src/fetch.ts) is based on [github/fetch](https://github.com/github/fetch) and is licensed under MIT.

The bundled code includes [abort-controller](https://github.com/mysticatea/abort-controller) and [event-target-shim](https://github.com/mysticatea/event-target-shim). They are licensed under MIT.
