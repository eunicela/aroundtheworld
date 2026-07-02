import Link from "next/link";
import { bodyCopyClass } from "@/lib/typography";

const links = [
  { href: "/", label: "Globe" },
  { href: "/gallery", label: "Gallery" },
] as const;

interface NavProps {
  className?: string;
}

export function Nav({ className = "" }: NavProps) {
  return (
    <nav className={`flex gap-4 ${className}`.trim()}>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`site-nav-link ${bodyCopyClass} text-charcoal/50 transition-colors hover:text-charcoal`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
