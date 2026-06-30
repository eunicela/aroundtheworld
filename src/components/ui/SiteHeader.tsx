import { Nav } from "@/components/ui/Nav";

interface SiteHeaderProps {
  children?: React.ReactNode;
  className?: string;
  widthClass?: string;
  paddingClass?: string;
}

export function SiteHeader({
  children,
  className = "",
  widthClass = "max-w-[100rem]",
  paddingClass = "px-4 md:px-6",
}: SiteHeaderProps) {
  return (
    <header
      className={`mx-auto flex w-full items-start justify-between gap-4 pt-4 md:pt-5 ${paddingClass} ${widthClass} ${className}`}
    >
      {children ? (
        <div className="min-w-0 flex-1">{children}</div>
      ) : (
        <div className="flex-1" />
      )}
      <Nav className="shrink-0 pt-1" />
    </header>
  );
}
