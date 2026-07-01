export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-8 text-3xl font-bold">About</h1>

      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">Investment Philosophy</h2>
        <p className="leading-relaxed text-muted-foreground">
          I invest in a small number of high-quality businesses that I
          understand, with the intention of holding for the long term. The goal
          is to compound capital alongside great companies, not to trade
          frequently.
        </p>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Every decision is documented with its reasoning, conviction level, and
          expected outcome — so I can review and learn from both wins and
          mistakes over time.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">Circle of Competence</h2>
        <p className="leading-relaxed text-muted-foreground">
          Edit this in the Admin → About editor. Describe the sectors and
          industries where you have an edge.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">Portfolio Rules</h2>
        <ul className="list-inside list-disc leading-relaxed text-muted-foreground">
          <li>Concentrate in best ideas, but cap single position risk</li>
          <li>Require a written thesis before any purchase</li>
          <li>Review every position quarterly</li>
          <li>Sell only when thesis breaks, not when price falls</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">Reading List</h2>
        <p className="text-muted-foreground">Manage from Admin → Reading List.</p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Favorite Quotes</h2>
        <blockquote className="border-l-2 border-border pl-4 italic text-muted-foreground">
          &ldquo;The big money is not in the buying and selling, but in the
          waiting.&rdquo; — Charlie Munger
        </blockquote>
      </section>
    </div>
  );
}
