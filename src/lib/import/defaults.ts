import "server-only";

import type { GalleryScanResult } from "./types";

const FAN_HO_HOSTS = ["fanho-forgetmenot.com", "www.fanho-forgetmenot.com"];

export function applySiteDefaults(
  scan: GalleryScanResult,
  sourceUrl: string
): GalleryScanResult {
  const hostname = new URL(sourceUrl).hostname.toLowerCase();

  if (!FAN_HO_HOSTS.includes(hostname)) {
    return scan;
  }

  return {
    ...scan,
    suggestedCity: "Hong Kong",
    suggestedCaption: scan.pageTitle ? `From ${scan.pageTitle}` : undefined,
    photographer: {
      name: "Fan Ho",
      url: "https://fanho-forgetmenot.com",
      instagram: "https://instagram.com/fanhophotography",
    },
    warnings: [
      ...scan.warnings,
      "Fan Ho Trust and Estate owns copyright — confirm licensing before publishing",
    ],
  };
}
