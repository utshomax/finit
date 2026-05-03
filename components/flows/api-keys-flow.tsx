import { useState, type FormEvent } from "react";
import { RotateCw, Trash2 } from "lucide-react";
import { api } from "../../lib/utils";
import { apiScopes } from "../../lib/constants";
import { FloatingField } from "../ui/forms";
import { EmptyState, CodeBlock } from "../ui/layout";
import type { ApiKey, Runner } from "../../lib/types";

export function ApiKeysFlow({ apiKeys, rawKey, setRawKey, refresh, run }: { apiKeys: ApiKey[]; rawKey: string; setRawKey: (key: string) => void; refresh: () => Promise<void>; run: Runner }) {
  const [scopes, setScopes] = useState<string[]>(["accounts:read", "categories:read", "transactions:read", "dashboard:read"]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run(async () => {
      const result = await api<{ apiKey: ApiKey; rawKey: string }>("/api/v1/api-keys", {
        method: "POST",
        body: JSON.stringify({ label: form.get("label"), scopes }),
      });
      setRawKey(result.rawKey);
      await refresh();
    }, "API key created");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <section>
        <h2 className="font-serif text-[22px] tracking-[-0.01em]">New API key</h2>
        <form onSubmit={submit} className="mt-4 rounded-[20px] border border-black/10 bg-white p-5">
          <FloatingField name="label" label="Label" defaultValue="iOS Shortcuts" />
          
          <div className="mt-5">
            <div className="mb-2 px-1 text-[10px] uppercase tracking-[0.08em] text-black/45">Scopes</div>
            <div className="grid gap-0">
              {apiScopes.map((scope) => (
                <label key={scope} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-black/[0.03]">
                  <div className={`grid h-4 w-4 place-items-center rounded-[4px] border ${scopes.includes(scope) ? "border-[#111] bg-[#111]" : "border-black/20"}`}>
                    {scopes.includes(scope) && <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 14 14" fill="none"><path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <input type="checkbox" className="sr-only" checked={scopes.includes(scope)} onChange={(event) => setScopes((prev) => event.target.checked ? [...prev, scope] : prev.filter((item) => item !== scope))} />
                  <span className="text-[13px] text-black/70">{scope}</span>
                </label>
              ))}
            </div>
          </div>
          <button className="mt-6 w-full rounded-[14px] bg-[#111] px-4 py-3.5 text-[14px] font-medium text-[#FAFAF7]">Create key</button>
          {rawKey ? <div className="mt-4"><CodeBlock>{rawKey}</CodeBlock></div> : null}
        </form>
      </section>

      <section>
        <h2 className="font-serif text-[22px] tracking-[-0.01em]">API keys</h2>
        <div className="mt-4 rounded-[20px] border border-black/10 bg-white p-5">
          {apiKeys.length === 0 ? <EmptyState text="No API keys yet." /> : (
            <div className="divide-y divide-black/10">
              {apiKeys.map((key) => (
                <div key={key.id} className="grid grid-cols-[1fr_auto] items-center gap-4 py-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[14px] font-medium">{key.label}</span>
                      {key.revokedAt && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">Revoked</span>}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-mono text-[11px] text-black/50">{key.prefix}...</span>
                      <span className="text-black/20">•</span>
                      <span className="text-[11px] text-black/40">{key.scopes.length} scopes</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => run(async () => { const result = await api<{ rawKey: string }>(`/api/v1/api-keys/${key.id}/rotate`, { method: "POST" }); setRawKey(result.rawKey); await refresh(); }, "Key rotated")} className="rounded-lg p-2 text-black/40 hover:bg-black/[0.06] hover:text-[#111]" aria-label="Rotate">
                      <RotateCw className="h-4 w-4" />
                    </button>
                    {!key.revokedAt && (
                      <button onClick={() => run(async () => { await api(`/api/v1/api-keys/${key.id}/revoke`, { method: "POST" }); await refresh(); }, "Key revoked")} className="rounded-lg p-2 text-black/40 hover:bg-red-50 hover:text-red-600" aria-label="Revoke">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
