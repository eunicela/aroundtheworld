# Photos Around the World

Street photography from cities around the world, organized by place.

Spin the wireframe globe. Click a city. Photographs float up in polaroid cards. Click through to the photographer.

## Stack

- **Next.js** (App Router) + TypeScript
- **Three.js** via React Three Fiber — globe, city markers, 3D photo cards
- **Tailwind CSS** — 2D UI (lightbox, nav, pages)
- **Framer Motion** — lightbox transitions
- **Cloudinary** — image CDN (optional; falls back to placeholder images)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Cloudinary (optional)

Copy `.env.local.example` to `.env.local` and set your cloud name. Upload images following the folder structure:

```
/sonder/hong-kong/fan-ho-01.jpg
/sonder/tokyo/rinko-kawauchi-01.jpg
```

Without Cloudinary configured, the app uses seeded placeholder images from picsum.photos for development.

## Data

Content lives in `src/data/sonder.json`. Migrate to Sanity CMS when the collection grows.

## Deploy

Deploy to [Vercel](https://vercel.com) with zero config.

## Image Rights

Contact photographers directly before using any work. Keep a permissions log. See the PRD for licensing notes (e.g. Fan Ho / Blue Lotus Gallery).
