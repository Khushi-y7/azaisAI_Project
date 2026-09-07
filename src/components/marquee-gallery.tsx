import Image from "next/image";

interface GalleryItem {
  src: string;
  caption: string;
}

const ROW_1: GalleryItem[] = [
  { src: "/examples/gallery-boat.jpg", caption: "Lone boat on a calm lake at sunset" },
  { src: "/examples/gallery-mythic.jpg", caption: "Mythological warrior leaping through clouds" },
  { src: "/examples/gallery-gears.jpg", caption: "Macro: vintage film reels and brass gears" },
  { src: "/examples/gallery-iceberg.jpg", caption: "Split-level iceberg photography" },
  { src: "/examples/gallery-neon-portrait.jpg", caption: "Moody portrait, red neon corridor" },
  { src: "/examples/a-portrait.jpg", caption: "Cinematic portrait, golden light" },
];

const ROW_2: GalleryItem[] = [
  { src: "/examples/gallery-galaxy.jpg", caption: "Spiral galaxy and nebula, deep space" },
  { src: "/examples/gallery-dragon-eye.jpg", caption: "Macro: iridescent dragon eye" },
  { src: "/examples/gallery-dusk-house.jpg", caption: "Lone house at dusk, purple sky" },
  { src: "/examples/gallery-desert.jpg", caption: "Golden sand dunes at sunrise" },
  { src: "/examples/gallery-cyber-rider.jpg", caption: "Cyberpunk rider, neon city street" },
  { src: "/examples/a-city.jpg", caption: "Neon-lit street at night, rain reflections" },
];

function Row({ items, direction }: { items: GalleryItem[]; direction: "left" | "right" }) {
  // Doubled so the track can scroll exactly -50% and loop with no visible seam.
  const doubled = [...items, ...items];
  return (
    <div className="marquee-row">
      <div className={`marquee-track ${direction}`}>
        {doubled.map((item, i) => (
          <div
            key={`${item.src}-${i}`}
            className="relative shrink-0 w-[280px] aspect-[4/3] mx-1.5 rounded-xl overflow-hidden border border-border group"
          >
            <Image
              src={item.src}
              alt={item.caption}
              width={560}
              height={420}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[11px] text-white/90 leading-snug">{item.caption}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MarqueeGallery() {
  return (
    <div>
      <p className="text-center text-xs font-mono uppercase tracking-[0.2em] text-text-muted mb-8">
        Production grade outputs
      </p>
      <div className="space-y-3">
        <Row items={ROW_1} direction="left" />
        <Row items={ROW_2} direction="right" />
      </div>
    </div>
  );
}
