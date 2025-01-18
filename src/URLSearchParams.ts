/**
 * Polyfill for URLSearchParams.
 * Provides a way to parse and manipulate URL query strings in environments
 * where URLSearchParams is not natively supported.
 */
export class URLSearchParams {
  private _entries: Map<string, string[]>;

  /**
   * Creates an instance of URLSearchParamsPolyfill.
   * @param init - The initial query string, object, array, or another instance to populate the parameters.
   */
  constructor(init?: string | Record<string, string> | [string, string][] | URLSearchParams) {
    this._entries = new Map<string, string[]>();

    if (typeof init === "string") {
      this._parseFromString(init);
    } else if (init && typeof init === "object" && !Array.isArray(init) && !(init instanceof URLSearchParams)) {
      for (const key of Object.keys(init)) {
        this.append(key, init[key]);
      }
    } else if (Array.isArray(init)) {
      for (const [key, value] of init) {
        this.append(key, value);
      }
    } else if (init instanceof URLSearchParams) {
      for (const [key, values] of init._entries) {
        for (const value of values) {
          this.append(key, value);
        }
      }
    }
  }

  /**
   * Appends a new value to an existing key or creates a new key if it does not exist.
   * @param name - The name of the parameter.
   * @param value - The value to add.
   */
  public append(name: string, value: string): void {
    const values = this._entries.get(name) || [];
    values.push(value);
    this._entries.set(name, values);
  }

  /**
   * Deletes a key and all its associated values.
   * @param name - The name of the parameter to delete.
   */
  public delete(name: string): void {
    this._entries.delete(name);
  }

  /**
   * Retrieves the first value associated with the given key.
   * @param name - The name of the parameter.
   * @returns The first value or null if the key does not exist.
   */
  public get(name: string): string | null {
    const values = this._entries.get(name);
    return values && values.length > 0 ? values[0] : null;
  }

  /**
   * Retrieves all values associated with the given key.
   * @param name - The name of the parameter.
   * @returns An array of values or an empty array if the key does not exist.
   */
  public getAll(name: string): string[] {
    const values = this._entries.get(name);
    return values ? [...values] : [];
  }

  /**
   * Checks if a key exists in the parameter list.
   * @param name - The name of the parameter.
   * @returns True if the key exists, otherwise false.
   */
  public has(name: string): boolean {
    return this._entries.has(name);
  }

  /**
   * Sets a key to a single value, replacing any existing values.
   * @param name - The name of the parameter.
   * @param value - The value to set.
   */
  public set(name: string, value: string): void {
    this._entries.set(name, [value]);
  }

  /**
   * Serializes the parameters into a query string.
   * @returns A URL-encoded query string representation of the parameters.
   */
  public toString(): string {
    const pairs: string[] = [];

    for (const [key, values] of this._entries) {
      for (const value of values) {
        pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    }

    return pairs.join("&");
  }

  /**
   * Parses a query string and populates the parameters.
   * @param query - The query string to parse.
   */
  private _parseFromString(query: string): void {
    if (query.startsWith("?")) {
      query = query.slice(1);
    }
    if (!query) return;

    const pairs = query.split("&");
    for (const pair of pairs) {
      const [rawKey, rawValue] = pair.split("=", 2);
      const key = decodeURIComponent(rawKey.replace(/\+/g, " "));
      const value = rawValue ? decodeURIComponent(rawValue.replace(/\+/g, " ")) : "";
      this.append(key, value);
    }
  }

  /**
   * Returns an iterator over the keys of the URLSearchParams.
   * @returns An iterator over the keys.
   */
  public *keys(): IterableIterator<string> {
    for (const key of this._entries.keys()) {
      yield key;
    }
  }

  /**
   * Returns an iterator over the values of the URLSearchParams.
   * @returns An iterator over the values.
   */
  public *values(): IterableIterator<string> {
    for (const values of this._entries.values()) {
      for (const value of values) {
        yield value;
      }
    }
  }

  /**
   * Returns an iterator over the key-value pairs of the URLSearchParams.
   * @returns An iterator over [key, value] pairs.
   */
  public *entries(): IterableIterator<[string, string]> {
    for (const [key, values] of this._entries) {
      for (const value of values) {
        yield [key, value];
      }
    }
  }

  /**
   * Executes a provided function once for each key-value pair in the URLSearchParams.
   * @param callback - A function to execute for each entry.
   * @param thisArg - Value to use as `this` when executing the callback.
   */
  public forEach(callback: (value: string, key: string, searchParams: this) => void, thisArg?: any): void {
    for (const [key, values] of this._entries) {
      for (const value of values) {
        callback.call(thisArg, value, key, this);
      }
    }
  }

  /**
   * Default iterator for URLSearchParams, returns [key, value] pairs.
   */
  public [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries();
  }

  /**
   * Sorts all key-value pairs in place by their keys.
   */
  public sort(): void {
    const sortedEntries = Array.from(this._entries).sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
    this._entries = new Map<string, string[]>(sortedEntries);
  }
}
