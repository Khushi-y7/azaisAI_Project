import { FaqAccordion } from "@/components/faq-accordion";

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16">
      <p className="text-xs font-mono uppercase tracking-wide text-accent mb-2">Support</p>
      <h1 className="text-3xl sm:text-4xl font-bold text-balance">
        Frequently <span className="text-accent">Asked</span>{" "}
        <span className="italic text-text-muted">Questions</span>
      </h1>
      <p className="text-sm text-text-muted mt-3 mb-10">
        Everything you need to know about this rebuild.
      </p>
      <FaqAccordion />
    </div>
  );
}
