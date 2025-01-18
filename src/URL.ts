export class URL {
  readonly href: string;
  readonly protocol: string;
  readonly hostname: string;
  readonly port: string;
  readonly pathname: string;
  readonly search: string;
  readonly hash: string;

  constructor(url: string | URL, base?: string) {
    if (base) {
      url = this._resolveRelativeURL(url, base);
    }
    const href = url.toString();
    const match = href.match(/^(https?:)\/\/([^/:?#]+)(:\d+)?(\/[^?#]*)?(\?[^#]*)?(#.*)?$/);
    if (!match) {
      throw new TypeError(`Invalid URL: ${href}`);
    }

    this.href = href;
    this.protocol = match[1];
    this.hostname = match[2];
    this.port = match[3] ? match[3].substring(1) : "";
    this.pathname = match[4] || "/";
    this.search = match[5] || "";
    this.hash = match[6] || "";
  }

  private _resolveRelativeURL(url: string | URL, base: string): string {
    try {
      const baseUrl = new URL(base); // Base URL must be valid
      const urlStr = url.toString();
      if (urlStr.startsWith("/")) {
        // Root-relative path
        return `${baseUrl.origin}${urlStr}`;
      }
      const basePath = baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf("/") + 1);
      const fullPath = basePath + url;
      return this._normalizePath(`${baseUrl.origin}${fullPath}`);
    } catch (e) {
      throw new TypeError(`Invalid base URL: ${base}`);
    }
  }

  private _normalizePath(path: string): string {
    const parts = path.split("/").reduce<string[]>((acc, part) => {
      if (part === "..") {
        acc.pop();
      } else if (part !== "." && part !== "") {
        acc.push(part);
      }
      return acc;
    }, []);
    const protocolMatch = path.match(/^(https?:\/\/)/);
    return `${protocolMatch ? protocolMatch[1] : ""}${parts.join("/")}`;
  }

  get origin(): string {
    return `${this.protocol}//${this.hostname}${this.port ? `:${this.port}` : ""}`;
  }

  toString(): string {
    return this.href;
  }
}
