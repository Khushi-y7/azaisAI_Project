"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const baseLinks = [
  { href: "/generate/video", label: "Video Generation" },
  { href: "/generate/image", label: "Image Generation" },
];

const historyLink = { href: "/history", label: "History" };
const faqLink = { href: "/faq", label: "FAQ" };

export function NavLinks({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  const links = loggedIn
    ? [...baseLinks, historyLink, faqLink]
    : [...baseLinks, faqLink];

  return (
    <nav className="hidden md:flex items-center gap-1">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-surface-2 text-text"
                : "text-text-muted hover:text-text"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
