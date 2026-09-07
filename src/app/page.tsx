import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { MarqueeGallery } from "@/components/marquee-gallery";

const steps = [
  {
    n: "01",
    title: "Pick your model",
    body: "Choose the model that fits your project. Each has its own strengths, so pick one and go.",
  },
  {
    n: "02",
    title: "Describe it",
    body: "Write what you want to see. A sentence is enough, and the model fills in the rest.",
  },
  {
    n: "03",
    title: "Download & use",
    body: "Your result is ready in seconds. Download it, post it, use it however you want.",
  },
];

const gallery = [
  { src: "/examples/a-portrait.jpg", caption: "Cinematic portrait, golden light, shallow depth of field" },
  { src: "/examples/a-city.jpg", caption: "Neon-lit street at night, rain reflections" },
  { src: "/examples/a-landscape.jpg", caption: "Mountain landscape at golden hour" },
  { src: "/examples/a-product.jpg", caption: "Studio product photo, soft light" },
];

export default async function Home() {
  const session = await getSession();
  const loggedIn = Boolean(session.userId);

  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-balance">
          Turn Ideas Into Reality
        </h1>
        <p className="mt-5 text-base sm:text-lg text-text-muted max-w-xl mx-auto">
          Create videos and visuals so captivating, your audience can&apos;t
          scroll past. One prompt is all it takes.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href={loggedIn ? "/generate/video" : "/auth/signup"}
            className="inline-flex items-center gap-2 bg-white text-black font-medium px-6 py-3 rounded-full hover:bg-white/90 transition-colors"
          >
            Get Started →
          </Link>
        </div>

        <div className="mt-14 relative rounded-2xl overflow-hidden border border-border max-w-3xl mx-auto">
          <Image
            src="/examples/a-city.jpg"
            alt="Example AzaisAi output: a neon-lit rainy city street"
            width={800}
            height={800}
            className="w-full h-auto"
            priority
          />
          <span className="absolute bottom-3 right-3 text-xs font-mono bg-black/50 backdrop-blur px-2 py-1 rounded text-white/80">
            Sana
          </span>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 border-t border-border">
        <div className="grid sm:grid-cols-3 gap-8 text-center">
          {steps.map((step) => (
            <div key={step.n}>
              <div className="text-5xl font-bold text-surface-2 [-webkit-text-stroke:1px_var(--border)]">
                {step.n}
              </div>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-text-muted max-w-[26ch] mx-auto">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 border-t border-border overflow-hidden">
        <MarqueeGallery />
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 border-t border-border">
        <p className="text-center text-xs font-mono uppercase tracking-wide text-accent mb-2">
          Gallery
        </p>
        <h2 className="text-center text-2xl sm:text-3xl font-semibold text-balance">
          See what&apos;s possible
        </h2>
        <p className="text-center text-sm text-text-muted mt-2">
          Every image below started as a single prompt, generated live for this rebuild, not stock photos.
        </p>
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {gallery.map((item) => (
            <div key={item.src} className="group relative rounded-xl overflow-hidden border border-border">
              <Image
                src={item.src}
                alt={item.caption}
                width={400}
                height={400}
                className="w-full h-auto aspect-square object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[11px] text-white/90 leading-snug">{item.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 border-t border-border">
        <div className="glass-card px-6 py-12 sm:px-16 text-center">
          <p className="text-xs font-mono text-text-muted mb-3">
            8 free credits · no card required
          </p>
          <h2 className="text-2xl sm:text-4xl font-semibold text-balance">
            Start Creating <span className="text-accent">Today.</span>
          </h2>
          <p className="mt-3 text-sm text-text-muted max-w-md mx-auto">
            One prompt. Cinematic videos and stunning visuals that stop the
            scroll, created in seconds, not hours.
          </p>
          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            <Link
              href={loggedIn ? "/generate/video" : "/auth/signup"}
              className="inline-flex items-center gap-2 bg-white text-black font-medium px-5 py-2.5 rounded-full hover:bg-white/90 transition-colors text-sm"
            >
              Get Started
            </Link>
            <Link
              href="/upgrade"
              className="inline-flex items-center gap-2 border border-border font-medium px-5 py-2.5 rounded-full hover:border-accent/50 transition-colors text-sm"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
