import { ContactForm } from "@/components/contact-form";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-lg px-4 sm:px-6 py-16">
      <p className="text-xs font-mono uppercase tracking-wide text-accent mb-2">Contact</p>
      <h1 className="text-3xl font-bold text-balance">
        We&apos;re here to <span className="text-accent italic">help.</span>
      </h1>
      <p className="text-sm text-text-muted mt-3 mb-8">
        Have a question, issue, or idea? Send a message below, or check the{" "}
        <a href="/faq" className="text-accent hover:underline">FAQ page</a> — it answers
        most common questions instantly.
      </p>
      <ContactForm />
    </div>
  );
}
