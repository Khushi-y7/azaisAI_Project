export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16 prose-sm">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-text-muted mb-10">
        Last updated 2026-09-07. This is a demo build made as a take-home
        exercise, not a real company. Treat this page as a placeholder for
        what a real policy would cover, not legal advice.
      </p>
      <div className="space-y-6 text-sm text-text-muted leading-relaxed">
        <section>
          <h2 className="text-text font-semibold mb-2">What we store</h2>
          <p>
            Your email, a hashed one-time login code, your credit balance and
            transaction history, and the prompts/results of anything you
            generate. That&apos;s stored in a plain SQLite/Postgres database
            for this project, and nothing is sold or shared with third parties.
          </p>
        </section>
        <section>
          <h2 className="text-text font-semibold mb-2">Generation providers</h2>
          <p>
            Prompts you submit are sent to Pollinations (image generation) or
            Pixazo (video generation) to produce your result. Their own
            privacy terms apply to how they handle that request.
          </p>
        </section>
        <section>
          <h2 className="text-text font-semibold mb-2">Contact messages</h2>
          <p>
            Messages sent through the Contact page are saved to the database
            so the feature is genuinely functional, even though no email
            notification or auto-reply is configured behind it.
          </p>
        </section>
        <section>
          <h2 className="text-text font-semibold mb-2">Deleting your data</h2>
          <p>
            Email support@azaisai.com and mention this is about the rebuild
            project. Since there&apos;s no real support team, this is really
            just &quot;ask the person who built it.&quot;
          </p>
        </section>
      </div>
    </div>
  );
}
