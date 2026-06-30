import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { readSonderData } from "@/lib/admin";
import { getArchiveImage } from "@/lib/data";

interface PageProps {
  params: Promise<{ cityId: string; imageId: string }>;
}

export default async function GalleryDetailPage({ params }: PageProps) {
  const { cityId, imageId } = await params;
  const data = await readSonderData();
  const image = getArchiveImage(data, cityId, imageId);

  if (!image) notFound();

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader widthClass="max-w-6xl" paddingClass="px-4">
        <Link
          href="/gallery"
          className="inline-flex items-center font-body text-charcoal/40 transition-colors hover:text-charcoal/70"
          aria-label="Back to gallery"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-charcoal/15 transition-colors hover:border-charcoal/30">
            ←
          </span>
        </Link>
      </SiteHeader>

      <main className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] md:gap-16">
          <div className="flex items-start justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.fullUrl}
              alt={image.title}
              className="max-h-[70vh] w-auto max-w-full border-0 object-contain outline-none"
            />
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="font-display text-2xl leading-snug text-charcoal md:text-3xl">
              {image.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <Link
                href={`/photographer/${image.photographerId}`}
                className="font-body text-sm text-charcoal/70 transition-colors hover:text-accent"
              >
                {image.photographerName}
              </Link>
              {image.year && (
                <span className="font-body text-sm text-charcoal/40">
                  {image.year}
                </span>
              )}
            </div>

            <p className="mt-1 font-body text-xs tracking-widest text-accent uppercase">
              {image.cityName}
            </p>

            <p className="mt-8 font-body text-sm leading-relaxed text-charcoal/75">
              {image.caption}
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href={`/photographer/${image.photographerId}`}
                className="rounded-full border border-charcoal/15 px-5 py-2 font-body text-xs tracking-wide text-charcoal/70 transition-colors hover:border-charcoal/30 hover:text-charcoal"
              >
                View photographer
              </Link>
              <a
                href={image.photographerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-charcoal/15 px-5 py-2 font-body text-xs tracking-wide text-charcoal/70 transition-colors hover:border-charcoal/30 hover:text-charcoal"
              >
                Website
              </a>
              {image.photographerInstagram && (
                <a
                  href={image.photographerInstagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-charcoal/15 px-5 py-2 font-body text-xs tracking-wide text-charcoal/70 transition-colors hover:border-charcoal/30 hover:text-charcoal"
                >
                  Instagram
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
