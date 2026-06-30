import Link from "next/link";

const links = [
  { href: "/", label: "Globe" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
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
          className="font-body text-xs tracking-widest text-charcoal/50 uppercase transition-colors hover:text-charcoal"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
