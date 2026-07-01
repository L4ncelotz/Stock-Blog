"use client";

import { useActionState } from "react";

export function AddTransactionForm({ stocks }: { stocks: { ticker: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(
    async (_state: unknown, formData: FormData) => {
      const { addTransaction } = await import("./actions");
      return addTransaction(formData);
    },
    null,
  );

  const error = state && typeof state === "object" && "error" in state
    ? (state as { error: string }).error
    : null;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-4">
      {/* Ticker */}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Ticker</span>
        <input
          name="ticker"
          list="tickers"
          required
          placeholder="META"
          className="rounded-md border border-border bg-card px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
        />
        <datalist id="tickers">
          {stocks.map((s) => (
            <option key={s.ticker} value={s.ticker}>
              {s.name}
            </option>
          ))}
        </datalist>
      </label>

      {/* Type */}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Type</span>
        <select
          name="type"
          required
          className="rounded-md border border-border bg-card px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="buy">Buy</option>
          <option value="add">Add</option>
          <option value="reduce">Reduce</option>
          <option value="sell">Sell</option>
        </select>
      </label>

      {/* Shares + Price row */}
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Shares</span>
          <input
            name="shares"
            type="number"
            step="any"
            min="0.000001"
            required
            placeholder="10"
            className="rounded-md border border-border bg-card px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Price ($)</span>
          <input
            name="price"
            type="number"
            step="any"
            min="0.01"
            required
            placeholder="350.00"
            className="rounded-md border border-border bg-card px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
      </div>

      {/* Date */}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Trade Date</span>
        <input
          name="trade_date"
          type="date"
          required
          defaultValue={today}
          className="rounded-md border border-border bg-card px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      {/* Optional fields */}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Fee ($)</span>
        <input
          name="fee"
          type="number"
          step="any"
          min="0"
          defaultValue="0"
          className="rounded-md border border-border bg-card px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Thesis / Reason</span>
        <textarea
          name="thesis_snapshot"
          rows={2}
          placeholder="Why this decision?"
          className="rounded-md border border-border bg-card px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Confidence (1-10)</span>
        <input
          name="confidence"
          type="number"
          min="1"
          max="10"
          defaultValue="5"
          className="rounded-md border border-border bg-card px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      {error && <p className="text-sm text-negative">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Adding..." : "Add Transaction"}
      </button>
    </form>
  );
}
