import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://airwise.ai";
  const now = new Date();

  const publicRoutes = [
    { url: `${baseUrl}`, lastModified: now, changeFrequency: "daily" as const, priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${baseUrl}/login`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${baseUrl}/register`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 },
  ];

  return publicRoutes;
}
