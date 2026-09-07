"use client";

import { useState, type FormEvent } from "react";

const SUBJECTS = ["General question", "Billing", "Bug report", "Feature request", "Other"];

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }
      setStatus("sent");
    } catch {
      setError("Couldn't reach the server. Try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="glass-card p-6 text-sm">
        <p className="font-medium">Message saved.</p>
        <p className="text-text-muted mt-1">
          This is a demo build with no email service wired up, so nothing gets
          sent or auto-replied to — but your message really was written to
          the database, not discarded. For a real reply, email{" "}
          <a href="mailto:support@azaisai.com" className="text-accent hover:underline">
            support@azaisai.com
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your name"
            className="mt-1.5 w-full rounded-lg bg-surface-2 border border-border px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="your@email.com"
            className="mt-1.5 w-full rounded-lg bg-surface-2 border border-border px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Subject</label>
        <select
          required
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="mt-1.5 w-full rounded-lg bg-surface-2 border border-border px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        >
          <option value="" disabled>Select a subject</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Message</label>
        <textarea
          required
          rows={5}
          maxLength={2000}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Describe your question or issue..."
          className="mt-1.5 w-full rounded-lg bg-surface-2 border border-border px-3.5 py-2.5 text-sm outline-none focus:border-accent resize-none"
        />
        <p className="text-right text-[11px] text-text-muted mt-1">{form.message.length} / 2000</p>
      </div>
      {error && <p className="text-sm text-critical">{error}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-lg bg-accent hover:bg-accent-strong transition-colors text-white font-medium text-sm py-2.5 disabled:opacity-60"
      >
        {status === "loading" ? "Sending…" : "Send Message"}
      </button>
      <p className="text-center text-sm text-text-muted">
        Or email us directly at{" "}
        <a href="mailto:support@azaisai.com" className="text-accent hover:underline">
          support@azaisai.com
        </a>
      </p>
    </form>
  );
}
