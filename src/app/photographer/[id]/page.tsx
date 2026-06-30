import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { readSonderData } from "@/lib/admin";
import {
  getPhotographerFromData,
  getPhotographerCitiesFromData,
} from "@/lib/data";
import { getImageUrl } from "@/lib/images";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PhotographerPage({ params }: PageProps) {
  const { id } = await params;
  const data = await readSonderData();
  const photographer = getPhotographerFromData(data, id);

  if (!photographer) notFound();

  const cities = getPhotographerCitiesFromData(data, id);
  const cityNames = cities.map((c) => c.name).join(", ");

  const uniqueImages = photographer.images.map((img) => {
    const city = cities.find((c) =>
      c.photographers.some(
        (p) =>
          p.id === id &&
          p.images.some((i) => i.cloudinaryId === img.cloudinaryId)
      )
    );
    return { ...img, cityName: city?.name ?? cities[0]?.name ?? "" };
  });

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader widthClass="max-w-2xl" paddingClass="px-4">
        <h1 className="font-display text-2xl text-charcoal md:text-3xl">
          {photographer.name}
        </h1>
      </SiteHeader>

      <main className="mx-auto max-w-2xl px-4 pb-24">
        <Link
          href="/"
          className="font-body text-xs tracking-widest text-charcoal/40 uppercase transition-colors hover:text-charcoal/70"
        >
          ← Globe
        </Link>

        <p className="mt-3 font-body text-sm tracking-widest text-accent uppercase">
          {cityNames}
        </p>

        <p className="mt-10 font-body text-base leading-relaxed text-charcoal/80">
          {photographer.bio}
        </p>

        <div className="mt-8 flex gap-6">
          <a
            href={photographer.instagram ?? photographer.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-sm text-charcoal/60 underline-offset-2 transition-colors hover:text-charcoal hover:underline"
          >
            Instagram
          </a>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-3">
          {uniqueImages.map((img) => (
            <figure key={img.cloudinaryId} className="group">
              <div className="overflow-hidden bg-polaroid p-2 pb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getImageUrl(
                    img.cloudinaryId,
                    400,
                    img.orientation === "portrait" ? 500 : 300,
                    img.format
                  )}
                  alt={`${photographer.name} — ${img.cityName}`}
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  style={{
                    aspectRatio:
                      img.orientation === "portrait" ? "4/5" : "5/4",
                  }}
                />
              </div>
              <figcaption className="mt-2 font-body text-xs text-charcoal/50">
                {img.cityName}
                {img.year && ` · ${img.year}`}
              </figcaption>
            </figure>
          ))}
        </div>
      </main>
    </div>
  );
}
