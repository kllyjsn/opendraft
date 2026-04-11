const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

function getToken(): string | null {
  return localStorage.getItem("opendraft_token");
}

export function setToken(token: string) {
  localStorage.setItem("opendraft_token", token);
}

export function clearToken() {
  localStorage.removeItem("opendraft_token");
}

async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `API error: ${res.status}`);
  }

  return res.json();
}

// Query builder that mirrors Supabase's chaining API but routes through our REST API
class QueryBuilder<T = unknown> {
  private _table: string;
  private _op: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private _select = "*";
  private _filters: Array<{ type: string; column?: string; value?: unknown; values?: unknown[] }> = [];
  private _body: unknown = null;
  private _orderBy: Array<{ column: string; ascending: boolean }> = [];
  private _limitVal: number | null = null;
  private _single = false;
  private _maybeSingle = false;
  private _count: "exact" | null = null;

  constructor(table: string) {
    this._table = table;
  }

  select(columns = "*", opts?: { count?: "exact" }) {
    this._op = "select";
    this._select = columns;
    if (opts?.count) this._count = opts.count;
    return this;
  }

  insert(body: unknown) { this._op = "insert"; this._body = body; return this; }
  update(body: unknown) { this._op = "update"; this._body = body; return this; }
  delete() { this._op = "delete"; return this; }
  upsert(body: unknown) { this._op = "upsert"; this._body = body; return this; }

  eq(column: string, value: unknown) { this._filters.push({ type: "eq", column, value }); return this; }
  neq(column: string, value: unknown) { this._filters.push({ type: "neq", column, value }); return this; }
  gt(column: string, value: unknown) { this._filters.push({ type: "gt", column, value }); return this; }
  gte(column: string, value: unknown) { this._filters.push({ type: "gte", column, value }); return this; }
  lt(column: string, value: unknown) { this._filters.push({ type: "lt", column, value }); return this; }
  lte(column: string, value: unknown) { this._filters.push({ type: "lte", column, value }); return this; }
  like(column: string, value: unknown) { this._filters.push({ type: "like", column, value }); return this; }
  ilike(column: string, value: unknown) { this._filters.push({ type: "ilike", column, value }); return this; }
  is(column: string, value: unknown) { this._filters.push({ type: "is", column, value }); return this; }
  in(column: string, values: unknown[]) { this._filters.push({ type: "in", column, values }); return this; }
  contains(column: string, value: unknown) { this._filters.push({ type: "contains", column, value }); return this; }
  or(expr: string) { this._filters.push({ type: "or", value: expr }); return this; }
  not(column: string, op: string, value: unknown) { this._filters.push({ type: "not", column, value: { op, value } }); return this; }
  textSearch(column: string, query: string) { this._filters.push({ type: "textSearch", column, value: query }); return this; }

  order(column: string, opts?: { ascending?: boolean }) {
    this._orderBy.push({ column, ascending: opts?.ascending ?? true });
    return this;
  }

  limit(n: number) { this._limitVal = n; return this; }
  single() { this._single = true; return this; }
  maybeSingle() { this._maybeSingle = true; return this; }
  range(from: number, to: number) { this._filters.push({ type: "range", value: { from, to } }); return this; }

  async then<TResult1 = { data: T; error: null; count?: number }, TResult2 = never>(
    resolve?: ((value: { data: T; error: null; count?: number }) => TResult1 | PromiseLike<TResult1>) | null,
    reject?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    try {
      const result = await this._execute();
      return resolve ? resolve(result as TResult1 extends { data: T; error: null; count?: number } ? TResult1 : never) : result as unknown as TResult1;
    } catch (err) {
      if (reject) return reject(err);
      throw err;
    }
  }

  private async _execute(): Promise<{ data: T; error: null; count?: number }> {
    const payload = {
      table: this._table,
      operation: this._op,
      select: this._select,
      filters: this._filters,
      order: this._orderBy,
      limit: this._limitVal,
      single: this._single,
      maybeSingle: this._maybeSingle,
      body: this._body,
      count: this._count,
    };

    const res = await request<{ data: T; count?: number }>("/db/query", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return { data: (res as { data: T }).data ?? (res as unknown as T), error: null, count: (res as { count?: number }).count };
  }
}

export const api = {
  from: <T = unknown>(table: string) => new QueryBuilder<T>(table),
  get: <T = unknown>(path: string) => request<T>(path),
  post: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T = unknown>(path: string) => request<T>(path, { method: "DELETE" }),
};
