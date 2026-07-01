import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AddTransactionForm } from "./add-transaction-form";
import type { Transaction, Stock } from "@/lib/database.types";
import { formatCurrency, formatDate } from "@/lib/format";

export const metadata = { title: "Admin — Portfolio" };

export default async function AdminPortfolioPage() {
  const supabase = await createClient();

  const { data: stocks } = await supabase
    .from("stocks")
    .select("*")
    .eq("is_active", true)
    .order("ticker")
    .returns<Stock[]>();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .order("trade_date", { ascending: false })
    .limit(50)
    .returns<Transaction[]>();

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Portfolio</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Add Transaction */}
        <section>
          <h2 className="mb-4 text-xl font-semibold">Add Transaction</h2>
          <AddTransactionForm stocks={stocks ?? []} />
        </section>

        {/* Recent Transactions */}
        <section>
          <h2 className="mb-4 text-xl font-semibold">Recent Transactions</h2>
          {(!transactions || transactions.length === 0) && (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          )}
          <ul className="space-y-2">
            {(transactions ?? []).map((tx) => (
              <li key={tx.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/stocks/${tx.ticker.toLowerCase()}`}
                      className="font-semibold hover:underline"
                    >
                      {tx.ticker}
                    </Link>
                    <span
                      className={`badge ${
                        tx.type === "buy" || tx.type === "add"
                          ? "text-positive"
                          : "text-negative"
                      }`}
                    >
                      {tx.type.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(tx.trade_date)}
                  </span>
                </div>
                <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                  {tx.shares.toLocaleString()} × {formatCurrency(tx.price)}{" "}
                  = {formatCurrency(tx.shares * tx.price)}
                  {tx.fee > 0 && ` + ${formatCurrency(tx.fee)} fee`}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
