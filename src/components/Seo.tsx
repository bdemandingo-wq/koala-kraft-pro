import { useEffect } from "react";

// Production domain for canonical URLs
const PRODUCTION_DOMAIN = "https://www.jointidywise.com";

type SeoProps = {
  title: string;
  description?: string;
  canonicalPath?: string;
  noIndex?: boolean;
};

export function Seo({ title, description, canonicalPath, noIndex }: SeoProps) {
  useEffect(() => {
    document.title = title;

    if (description) {
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
      }
      meta.content = description;
    }

    if (canonicalPath) {
      // Always use production domain for canonical URLs
      const href = `${PRODUCTION_DOMAIN}${canonicalPath}`;
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = href;
    }

    // Handle noindex for pages that shouldn't be indexed
    if (noIndex !== undefined) {
      let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
      if (!robotsMeta) {
        robotsMeta = document.createElement("meta");
        robotsMeta.name = "robots";
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.content = noIndex ? "noindex, nofollow" : "index, follow";
    }
  }, [title, description, canonicalPath, noIndex]);

  return null;
}
