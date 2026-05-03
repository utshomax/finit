import type { FormEvent, ReactNode } from "react";

export function GridPage({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 xl:grid-cols-[380px_1fr]">{children}</div>;
}

export function Panel({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-2xl tracking-[-0.01em]">{title}</h2>
        {action ? <button type="button" onClick={onAction} className="text-xs text-black/50">{action}</button> : null}
      </div>
      {children}
    </section>
  );
}

export function FormPanel({ title, submit, onSubmit, children }: { title: string; submit: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void; children: ReactNode }) {
  return (
    <Panel title={title}>
      <form onSubmit={onSubmit} className="mt-5 grid gap-4">
        {children}
        <button className="rounded-lg bg-[#111] px-4 py-3 text-sm font-medium text-[#FAFAF7]">{submit}</button>
      </form>
    </Panel>
  );
}

export function Rows({ children, empty }: { children: ReactNode; empty: string }) {
  const list = Array.isArray(children) ? children.filter(Boolean) : children;
  return <div className="mt-3 divide-y divide-black/10">{Array.isArray(list) && list.length === 0 ? <EmptyState text={empty} /> : list}</div>;
}

export function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl bg-black/[0.04] p-4 text-sm text-black/55">{text}</div>;
}

export function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-auto rounded-xl bg-black/[0.04] p-4 text-[12px] text-black/70">
      <code>{children}</code>
    </pre>
  );
}
