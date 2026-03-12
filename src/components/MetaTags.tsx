import { useEffect } from "react";

interface MetaTagsProps {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
}

/**
 * Dynamic meta tags for SPA pages.
 * Sets document title, meta description, canonical, OG tags, and Twitter cards.
 */
export function MetaTags({
  title,
  description,
  path,
  ogImage = "https://opendraft.co/og-image.png",
  ogType = "website",
  noIndex = false,
}: MetaTagsProps) {
  useEffect(() => {
    const url = `https://opendraft.co${path}`;

    // Title
    document.title = title;

    // Helper to set/create meta tags
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
      return el;
    };

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);

    // Standard meta
    const descEl = setMeta("name", "description", description);
    const robotsEl = noIndex
      ? setMeta("name", "robots", "noindex, nofollow")
      : setMeta("name", "robots", "index, follow, max-snippet:-1, max-image-preview:large");

    // Open Graph
    const ogTitleEl = setMeta("property", "og:title", title);
    const ogDescEl = setMeta("property", "og:description", description);
    const ogUrlEl = setMeta("property", "og:url", url);
    const ogImageEl = setMeta("property", "og:image", ogImage);
    const ogTypeEl = setMeta("property", "og:type", ogType);

    // Twitter
    const twTitleEl = setMeta("name", "twitter:title", title);
    const twDescEl = setMeta("name", "twitter:description", description);
    const twImageEl = setMeta("name", "twitter:image", ogImage);

    return () => {
      canonical.remove();
      // Restore defaults on unmount
      document.title = "Buy Ready-Made Apps & Templates — SaaS, AI, Landing Pages | OpenDraft";
      [descEl, robotsEl, ogTitleEl, ogDescEl, ogUrlEl, ogImageEl, ogTypeEl, twTitleEl, twDescEl, twImageEl].forEach(el => {
        // Only remove dynamically created ones — leave originals from index.html
      });
    };
  }, [title, description, path, ogImage, ogType, noIndex]);

  return null;
}
