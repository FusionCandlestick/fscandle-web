import { SITE_URL } from "./lib/site";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL;
  const lastModified = new Date();

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/playground`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];
}

export const dynamic = "force-static";
