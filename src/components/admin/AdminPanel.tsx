"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { decodePlusCode, formatCoords } from "@/lib/pluscode";

const STORAGE_KEY = "sonder-admin-password";
const SCAN_CACHE_KEY = "sonder-import-scan";

interface ImportPhotoOption {
  id: string;
  title: string;
  year: string;
  yearRaw: string;
  imageUrl: string;
}

interface GalleryScanResult {
  type: "squarespace-gallery";
  sourceUrl: string;
  pageTitle: string;
  suggestedCity?: string;
  suggestedCaption?: string;
  photographer?: {
    name: string;
    url: string;
    instagram?: string;
  };
  photos: ImportPhotoOption[];
  warnings: string[];
}

interface CatalogCity {
  id: string;
  name: string;
  lat: number;
  lon: number;
  photographers: {
    id: string;
    name: string;
    imageCount: number;
  }[];
}

interface AdminPanelProps {
  enabled: boolean;
}

function readCachedScan(): GalleryScanResult | null {
  if (typeof window === "undefined") return null;

  try {
    const cached = sessionStorage.getItem(SCAN_CACHE_KEY);
    if (!cached) return null;

    const parsed = JSON.parse(cached) as GalleryScanResult;
    return parsed.photos?.length ? parsed : null;
  } catch {
    return null;
  }
}

export function AdminPanel({ enabled }: AdminPanelProps) {
  const [password, setPassword] = useState("");
  const [storedPassword, setStoredPassword] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<CatalogCity[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [cityId, setCityId] = useState("");
  const [isNewCity, setIsNewCity] = useState(true);
  const [cityName, setCityName] = useState("");
  const [photographerId, setPhotographerId] = useState("");
  const [isNewPhotographer, setIsNewPhotographer] = useState(true);
  const [photographerName, setPhotographerName] = useState("");
  const [photographerBio, setPhotographerBio] = useState("");
  const [photographerUrl, setPhotographerUrl] = useState("");
  const [photographerInstagram, setPhotographerInstagram] = useState("");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [year, setYear] = useState("");
  const [plusCode, setPlusCode] = useState("");
  const [plusCodeError, setPlusCodeError] = useState<string | null>(null);
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [importUrl, setImportUrl] = useState(
    () => readCachedScan()?.sourceUrl ?? ""
  );
  const [scanLoading, setScanLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [scanResult, setScanResult] = useState<GalleryScanResult | null>(
    () => readCachedScan()
  );
  const [selectedPhotoId, setSelectedPhotoId] = useState("");
  const [importWarnings, setImportWarnings] = useState<string[]>(
    () => readCachedScan()?.warnings ?? []
  );
  const [yearWarning, setYearWarning] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) setStoredPassword(saved);
  }, []);

  const selectedCity = useMemo(
    () => catalog.find((city) => city.id === cityId),
    [catalog, cityId]
  );

  useEffect(() => {
    if (isNewCity || !selectedCity) return;
    setLat(String(selectedCity.lat));
    setLon(String(selectedCity.lon));
  }, [selectedCity, isNewCity]);

  useEffect(() => {
    if (catalog.length === 0) {
      setIsNewCity(true);
      return;
    }
    if (!cityId && catalog[0]) {
      setCityId(catalog[0].id);
      setIsNewCity(false);
    }
  }, [catalog, cityId]);

  function applyPlusCode(value: string) {
    setPlusCode(value);
    setPlusCodeError(null);

    if (!value.trim()) return;

    const latNum = lat ? Number(lat) : undefined;
    const lonNum = lon ? Number(lon) : undefined;
    const reference =
      latNum !== undefined &&
      lonNum !== undefined &&
      !Number.isNaN(latNum) &&
      !Number.isNaN(lonNum)
        ? { lat: latNum, lon: lonNum }
        : selectedCity
          ? { lat: selectedCity.lat, lon: selectedCity.lon }
          : undefined;

    if (!reference) {
      setPlusCodeError("Enter coordinates or select a city first");
      return;
    }

    const decoded = decodePlusCode(value, reference);

    if (!decoded) {
      setPlusCodeError("Could not decode plus code");
      return;
    }

    setLat(String(decoded.lat));
    setLon(String(decoded.lon));
  }

  useEffect(() => {
    if (!storedPassword || !enabled) return;

    fetch("/api/admin/catalog", {
      headers: { "x-admin-password": storedPassword },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.cities) {
          setCatalog(data.cities);
        }
      })
      .catch(() => setError("Could not load catalog"));
  }, [storedPassword, enabled]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      setError("Invalid password");
      return;
    }

    sessionStorage.setItem(STORAGE_KEY, password);
    setStoredPassword(password);
    setPassword("");
  }

  function handleLogout() {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SCAN_CACHE_KEY);
    setStoredPassword(null);
    setCatalog([]);
    setScanResult(null);
    setSelectedPhotoId("");
    setImportWarnings([]);
    setYearWarning(null);
  }

  function applyCatalogDefaults(
    suggestedCity?: string,
    photographer?: GalleryScanResult["photographer"]
  ) {
    if (suggestedCity) {
      const matchedCity = catalog.find(
        (city) => city.name.toLowerCase() === suggestedCity.toLowerCase()
      );

      if (matchedCity) {
        setIsNewCity(false);
        setCityId(matchedCity.id);
        setCityName("");
        setLat(String(matchedCity.lat));
        setLon(String(matchedCity.lon));

        if (photographer) {
          const matchedPhotographer = matchedCity.photographers.find(
            (entry) =>
              entry.name.toLowerCase() === photographer.name.toLowerCase()
          );

          if (matchedPhotographer) {
            setIsNewPhotographer(false);
            setPhotographerId(matchedPhotographer.id);
            setPhotographerName("");
            setPhotographerBio("");
            setPhotographerUrl("");
            setPhotographerInstagram("");
            return;
          }
        }
      } else {
        setIsNewCity(true);
        setCityId("");
        setCityName(suggestedCity);
      }
    }

    if (photographer) {
      setIsNewPhotographer(true);
      setPhotographerId("");
      setPhotographerName(photographer.name);
      setPhotographerUrl(photographer.url);
      setPhotographerInstagram(photographer.instagram ?? "");
    }
  }

  function base64ToFile(base64: string, filename: string, mimeType: string) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new File([bytes], filename, { type: mimeType });
  }

  async function handleScan() {
    if (!storedPassword || !importUrl.trim()) return;

    setScanLoading(true);
    setError(null);
    setMessage(null);
    setYearWarning(null);
    setSelectedPhotoId("");

    try {
      const res = await fetch("/api/admin/import/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": storedPassword,
        },
        body: JSON.stringify({ url: importUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not scan gallery");

      setScanResult(data);
      setImportWarnings(data.warnings ?? []);
      sessionStorage.setItem(SCAN_CACHE_KEY, JSON.stringify(data));
    } catch (err) {
      setScanResult(null);
      setImportWarnings([]);
      setError(err instanceof Error ? err.message : "Could not scan gallery");
    } finally {
      setScanLoading(false);
    }
  }

  async function handlePhotoSelect(photoId: string) {
    setSelectedPhotoId(photoId);
    if (!storedPassword || !scanResult || !photoId) return;

    const photo = scanResult.photos.find((entry) => entry.id === photoId);
    if (!photo) return;

    setImportLoading(true);
    setError(null);
    setMessage(null);
    setYearWarning(null);

    try {
      const res = await fetch("/api/admin/import/photo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": storedPassword,
        },
        body: JSON.stringify({
          imageUrl: photo.imageUrl,
          title: photo.title,
          yearRaw: photo.yearRaw,
          sourceUrl: scanResult.sourceUrl,
          suggestedCaption: scanResult.suggestedCaption,
          photographer: scanResult.photographer,
          suggestedCity: scanResult.suggestedCity,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not import photo");

      const importedFile = base64ToFile(
        data.image.base64,
        data.image.filename,
        data.image.mimeType
      );

      setFile(importedFile);
      setTitle(data.title ?? "");
      setYear(data.year ?? "");
      setCaption(data.caption ?? "");
      setOrientation(data.orientation ?? "portrait");
      setYearWarning(data.yearWarning ?? null);
      applyCatalogDefaults(data.suggestedCity, data.photographer);
      setMessage(`Imported “${data.title}”. Add location, then upload.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not import photo");
    } finally {
      setImportLoading(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!storedPassword || !file) return;
    if (!isNewCity && !cityId) return;
    if (isNewCity && !cityName.trim()) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("isNewCity", String(isNewCity));
    if (isNewCity) {
      formData.append("cityName", cityName.trim());
    } else {
      formData.append("cityId", cityId);
    }
    formData.append("orientation", orientation);
    formData.append("isNewPhotographer", String(isNewPhotographer));

    if (title) formData.append("title", title);
    if (caption) formData.append("caption", caption);
    if (year) formData.append("year", year);
    if (plusCode) formData.append("plusCode", plusCode);
    if (lat) formData.append("lat", lat);
    if (lon) formData.append("lon", lon);

    if (isNewPhotographer) {
      formData.append("photographerName", photographerName);
      formData.append("photographerBio", photographerBio);
      formData.append("photographerUrl", photographerUrl);
      if (photographerInstagram) {
        formData.append("photographerInstagram", photographerInstagram);
      }
    } else {
      formData.append("photographerId", photographerId);
    }

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "x-admin-password": storedPassword },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      setMessage(`Uploaded ${data.imageId}.`);
      setFile(null);
      setTitle("");
      setCaption("");
      setYear("");
      if (data.cityId) {
        setCityId(data.cityId);
        setIsNewCity(false);
        setCityName("");
      }

      const catalogRes = await fetch("/api/admin/catalog", {
        headers: { "x-admin-password": storedPassword },
      });
      const catalogData = await catalogRes.json();
      if (catalogData.cities) setCatalog(catalogData.cities);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  if (!enabled) {
    return (
      <div className="rounded-sm border border-charcoal/10 bg-polaroid p-6">
        <h2 className="font-display text-xl text-charcoal">Admin not configured</h2>
        <p className="mt-3 font-body text-sm leading-relaxed text-charcoal/70">
          Create a <code className="text-charcoal">.env.local</code> file in the
          project root and add:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-sm bg-charcoal/5 p-4 font-mono text-xs text-charcoal/80">
          ADMIN_PASSWORD=your-secret-password
        </pre>
        <p className="mt-4 font-body text-sm text-charcoal/60">
          Restart the dev server after saving the file.
        </p>
      </div>
    );
  }

  if (!storedPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-6">
        <form onSubmit={handleLogin} className="w-full max-w-xs text-center">
          <label className="font-body text-sm text-charcoal">password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-3 w-full border-b border-charcoal/20 bg-transparent py-2 text-center font-body text-sm text-charcoal outline-none focus:border-charcoal/50"
            autoFocus
          />
          {error && (
            <p className="mt-3 font-body text-sm text-red-700">{error}</p>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-charcoal/10 px-6 py-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <h1 className="font-display text-2xl text-charcoal">Admin</h1>
          <button
            onClick={handleLogout}
            className="font-body text-xs tracking-widest text-charcoal/40 uppercase transition-colors hover:text-charcoal/70"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
      <form onSubmit={handleUpload} className="space-y-8">
        <section className="space-y-4">
          <h2 className="font-display text-lg text-charcoal">Import from link</h2>
          <p className="font-body text-xs leading-relaxed text-charcoal/50">
            Paste a gallery page URL, scan it, then pick one photo to prefill
            the form below.
          </p>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://fanho-forgetmenot.com/a-hong-kong-memoir-1"
              className={inputClass}
            />
            <button
              type="button"
              onClick={handleScan}
              disabled={scanLoading || !importUrl.trim()}
              className="shrink-0 rounded-full border border-charcoal/15 px-5 py-2.5 font-body text-xs tracking-wide text-charcoal transition-colors hover:border-charcoal/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {scanLoading ? "Scanning..." : "Scan gallery"}
            </button>
          </div>

          {scanResult && (
            <div className="space-y-3 rounded-sm border border-charcoal/10 bg-polaroid p-4">
              <p className="font-body text-sm text-charcoal">
                {scanResult.pageTitle}
                <span className="text-charcoal/50">
                  {" "}
                  · {scanResult.photos.length} photos
                </span>
              </p>

              <Field label="Select photo">
                <select
                  value={selectedPhotoId}
                  onChange={(e) => handlePhotoSelect(e.target.value)}
                  disabled={importLoading}
                  className={inputClass}
                >
                  <option value="">Choose a photo</option>
                  {scanResult.photos.map((photo) => (
                    <option key={photo.id} value={photo.id}>
                      {photo.title}
                      {photo.year ? ` (${photo.year})` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              {importLoading && (
                <p className="font-body text-xs text-charcoal/50">
                  Downloading image...
                </p>
              )}

              {importWarnings.map((warning) => (
                <p key={warning} className="font-body text-xs text-charcoal/55">
                  {warning}
                </p>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-lg text-charcoal">Image</h2>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-charcoal/20 bg-polaroid px-6 py-10 transition-colors hover:border-charcoal/35">
            <span className="font-body text-sm text-charcoal/60">
              {file ? file.name : "Drop an image or click to browse"}
            </span>
            <span className="font-body text-xs text-charcoal/40">
              JPG, PNG, or WebP
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          {preview && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={preview}
              alt="Preview"
              className="max-h-64 w-auto rounded-sm object-contain"
            />
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-lg text-charcoal">City</h2>
            {catalog.length > 0 && (
              <button
                type="button"
                onClick={() => setIsNewCity((value) => !value)}
                className="font-body text-xs tracking-wide text-accent transition-colors hover:text-charcoal"
              >
                {isNewCity ? "Use existing" : "Add new"}
              </button>
            )}
          </div>

          {isNewCity ? (
            <Field label="City name">
              <input
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                placeholder="e.g. Hong Kong"
                className={inputClass}
                required
              />
            </Field>
          ) : (
            <Field label="City">
              <select
                value={cityId}
                onChange={(e) => {
                  setCityId(e.target.value);
                  setPhotographerId("");
                }}
                className={inputClass}
                required
              >
                {catalog.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Field label="Orientation">
            <select
              value={orientation}
              onChange={(e) =>
                setOrientation(e.target.value as "portrait" | "landscape")
              }
              className={inputClass}
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </Field>

          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Optional"
              className={inputClass}
            />
          </Field>

          <Field label="Year">
            <input
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setYearWarning(null);
              }}
              placeholder="e.g. 1964"
              className={inputClass}
            />
          </Field>

          {yearWarning && (
            <p className="font-body text-xs text-charcoal/55">{yearWarning}</p>
          )}

          <Field label="Plus code">
            <input
              value={plusCode}
              onChange={(e) => {
                setPlusCode(e.target.value);
                setPlusCodeError(null);
              }}
              onBlur={(e) => applyPlusCode(e.target.value)}
              placeholder="e.g. 7PJP75J5+2X or 75J5+2X"
              className={inputClass}
            />
          </Field>

          {plusCodeError && (
            <p className="font-body text-sm text-red-700">{plusCodeError}</p>
          )}

          {lat && lon && plusCode && !plusCodeError && (
            <p className="font-body text-xs text-charcoal/50">
              Resolved to {formatCoords(Number(lat), Number(lon))}
            </p>
          )}

          <Field label="Latitude">
            <input
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="e.g. 22.3"
              className={inputClass}
              required
            />
          </Field>

          <Field label="Longitude">
            <input
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              placeholder="e.g. 114.2"
              className={inputClass}
              required
            />
          </Field>
        </section>

        <p className="font-body text-xs text-charcoal/45">
          Paste a Google Plus Code to auto-fill coordinates. Short codes
          (like 75J5+2X) use the entered coordinates or selected city as
          reference. Full codes work anywhere. You can also enter latitude and
          longitude manually.
        </p>

        <Field label="Caption">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional — shown on the detail page"
            rows={3}
            className={inputClass}
          />
        </Field>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-lg text-charcoal">Photographer</h2>
            <button
              type="button"
              onClick={() => setIsNewPhotographer((v) => !v)}
              className="font-body text-xs tracking-wide text-accent transition-colors hover:text-charcoal"
            >
              {isNewPhotographer ? "Use existing" : "Add new"}
            </button>
          </div>

          {isNewPhotographer ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name">
                <input
                  value={photographerName}
                  onChange={(e) => setPhotographerName(e.target.value)}
                  required
                  className={inputClass}
                />
              </Field>
              <Field label="Website">
                <input
                  value={photographerUrl}
                  onChange={(e) => setPhotographerUrl(e.target.value)}
                  required
                  className={inputClass}
                />
              </Field>
              <Field label="Instagram">
                <input
                  value={photographerInstagram}
                  onChange={(e) => setPhotographerInstagram(e.target.value)}
                  placeholder="Optional"
                  className={inputClass}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Bio">
                  <textarea
                    value={photographerBio}
                    onChange={(e) => setPhotographerBio(e.target.value)}
                    required
                    rows={4}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          ) : (
            <Field label="Photographer">
              <select
                value={photographerId}
                onChange={(e) => setPhotographerId(e.target.value)}
                className={inputClass}
                required
              >
                <option value="">Select photographer</option>
                {selectedCity?.photographers.map((photographer) => (
                  <option key={photographer.id} value={photographer.id}>
                    {photographer.name} ({photographer.imageCount} images)
                  </option>
                ))}
              </select>
            </Field>
          )}
        </section>

        {error && <p className="font-body text-sm text-red-700">{error}</p>}
        {message && (
          <p className="font-body text-sm text-charcoal/70">
            {message}{" "}
            <Link href="/gallery" className="text-accent hover:underline">
              Open gallery
            </Link>
          </p>
        )}

        <button
          type="submit"
          disabled={
            loading ||
            importLoading ||
            !file ||
            (isNewCity ? !cityName.trim() : !cityId) ||
            !lat ||
            !lon ||
            (!isNewPhotographer && !photographerId) ||
            (isNewPhotographer &&
              (!photographerName || !photographerBio || !photographerUrl))
          }
          className="rounded-full border border-charcoal/15 px-6 py-2.5 font-body text-xs tracking-wide text-charcoal transition-colors hover:border-charcoal/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Uploading..." : "Upload image"}
        </button>
      </form>
      </main>
    </div>
  );
}

const inputClass =
  "w-full border-b border-charcoal/20 bg-transparent py-2 font-body text-sm text-charcoal outline-none focus:border-charcoal/50";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-body text-xs tracking-widest text-charcoal/50 uppercase">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
