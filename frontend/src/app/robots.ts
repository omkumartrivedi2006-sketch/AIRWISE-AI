import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://airwise.ai";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/contact", "/privacy", "/terms", "/login", "/register"],
        disallow: [
          "/admin",
          "/admin/*",
          "/dashboard",
          "/profile",
          "/settings",
          "/settings/*",
          "/notifications",
          "/assistant",
          "/api/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
