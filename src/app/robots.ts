import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: "https://fusioncandlestick.dev/sitemap.xml",
  };
}

export const dynamic = "force-static";
