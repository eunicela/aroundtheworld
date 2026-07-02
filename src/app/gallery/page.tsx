import Link from "next/link";
import { SiteHeader, SiteHeaderTitle } from "@/components/ui/SiteHeader";
import { readSonderData } from "@/lib/admin";
import { getAllArchiveImages } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gallery — Photos Around the World",
  description: "All photographs in the Photos Around the World collection.",
};

export default async function GalleryPage() {
  const data = await readSonderData();
  const images = getAllArchiveImages(data);

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader className="mb-8">
        <div>
          <SiteHeaderTitle />
          <p className="mt-3 max-w-md font-body text-sm text-charcoal/50">
            {images.length === 0
              ? "No photographs yet"
              : `${images.length} photograph${images.length === 1 ? "" : "s"}${data.cities.length > 0 ? ` across ${data.cities.length} ${data.cities.length === 1 ? "city" : "cities"}` : ""}`}
          </p>
        </div>
      </SiteHeader>

      <main className="mx-auto max-w-[100rem] px-4 pb-24 md:px-6">
        <div className="columns-2 gap-x-8 gap-y-10 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 md:gap-x-10 md:gap-y-12">
          {images.map((image) => (
            <Link
              key={`${image.cityId}-${image.id}`}
              href={`/gallery/${image.cityId}/${image.id}`}
              className="group mb-10 block break-inside-avoid md:mb-12"
            >
              <div className="overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.thumbnailUrl}
                  alt={image.title}
                  className="block h-auto w-full border-0 outline-none transition-transform duration-500 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>
              <div className="mt-2.5 flex items-baseline justify-between gap-2 px-0.5">
                <p className="font-body text-[10px] text-charcoal/70 transition-colors group-hover:text-charcoal">
                  {image.photographerName}
                </p>
                <p className="shrink-0 font-body text-[10px] text-charcoal/40">
                  {image.cityName}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
