import Link from "next/link";
import { SiteHeader } from "@/components/ui/SiteHeader";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader widthClass="max-w-xl" paddingClass="px-4">
        <h1 className="font-display text-2xl text-charcoal md:text-3xl">
          Photos Around the World
        </h1>
      </SiteHeader>

      <main className="mx-auto max-w-xl px-4 pb-24">
        <Link
          href="/"
          className="font-body text-xs tracking-widest text-charcoal/40 uppercase transition-colors hover:text-charcoal/70"
        >
          ← Globe
        </Link>

        <div className="mt-8 space-y-6 font-body text-base leading-relaxed text-charcoal/80">
          <p>
            Street photography from cities around the world — organized by place,
            explored through a globe.
          </p>

          <p>
            I built this because I keep having the same experience: I&apos;ll
            see a photograph of a stranger on a street I&apos;ve never walked,
            and something in my chest loosens. Not nostalgia — recognition. The
            feeling that someone else noticed what I would have noticed, if I&apos;d
            been there.
          </p>

          <p>
            Street photography is the art form closest to that feeling. It
            doesn&apos;t ask you to travel somewhere spectacular. It insists that
            the spectacular is already here — in the commuter&apos;s downward
            glance, the vendor&apos;s arrangement of fruit, the way light falls
            through a laundry line.
          </p>

          <p>
            I chose photographers whose work I admire and whose permissions I
            am working to secure. Every image here is credited. If you are a
            photographer who would like your work included or removed, please{" "}
            <a
              href="mailto:hello@photosaroundtheworld.com"
              className="text-accent underline-offset-2 hover:underline"
            >
              reach out
            </a>
            .
          </p>

          <p className="text-charcoal/50">
            Spin the globe. Pick a city. Spend five minutes with strangers.
          </p>
        </div>
      </main>
    </div>
  );
}
