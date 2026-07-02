import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { PhotoDescription } from "@/components/ui/PhotoDescription";
import { readSonderData } from "@/lib/admin";
import { findImageInData, getArchiveImage } from "@/lib/data";

interface PageProps {
  params: Promise<{ cityId: string; imageId: string }>;
}

export default async function GalleryDetailPage({ params }: PageProps) {
  const { cityId, imageId } = await params;
  const data = await readSonderData();
  const image = getArchiveImage(data, cityId, imageId);

  if (!image) notFound();

  const rawImage = findImageInData(data, cityId, imageId);
  const editorialCaption = rawImage?.caption;

  const photographerLink =
    image.photographerInstagram ?? image.photographerUrl;

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr] bg-paper">
      <SiteHeader paddingClass="px-4 md:px-6">
        <Link
          href="/gallery"
          className="inline-flex items-center font-body text-charcoal/40 transition-colors hover:text-charcoal/70"
          aria-label="Back to gallery"
        >
          ←
        </Link>
      </SiteHeader>

      <main className="flex items-center justify-center px-4 pb-16 md:px-6">
        <div className="flex w-full max-w-5xl flex-col items-center gap-10 md:flex-row md:items-center md:justify-center md:gap-12 lg:gap-16">
          <div className="flex shrink-0 items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.fullUrl}
              alt={image.title}
              className="max-h-[70vh] w-auto max-w-full border-0 object-contain outline-none"
            />
          </div>

          <div className="flex w-full max-w-sm flex-col justify-center md:w-auto md:min-w-[16rem] md:max-w-xs lg:max-w-sm">
            <h1 className="font-display text-2xl leading-snug text-charcoal md:text-3xl">
              {image.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <a
                href={photographerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-sm text-charcoal/70 transition-colors hover:text-accent"
              >
                {image.photographerName}
              </a>
              {image.year && (
                <span className="font-body text-sm text-charcoal/40">
                  {image.year}
                </span>
              )}
            </div>

            <p className="mt-1 font-body text-xs tracking-widest text-[#969696] uppercase">
              {image.cityName}
            </p>

            <div className="mt-8">
              <PhotoDescription
                cityId={cityId}
                imageId={imageId}
                editorialCaption={editorialCaption}
                fallbackText={editorialCaption ? undefined : image.caption}
              />
            </div>

            <div className="mt-10">
              <a
                href={photographerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-full border border-charcoal/15 px-5 py-2 font-body text-xs tracking-wide text-charcoal/70 transition-colors hover:border-charcoal/30 hover:text-charcoal"
              >
                View photographer
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
