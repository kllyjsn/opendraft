import { useEffect } from "react";

interface MetaTagsProps {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
  ogImageWidth?: string;
  ogImageHeight?: string;
  keywords?: string;
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
  ogImageWidth = "1200",
  ogImageHeight = "630",
  keywords,
}: MetaTagsProps) {
  useEffect(() => {
    const url = `https://opendraft.co${path}`;

    // Title
    document.title = title;

    // Helper to set/create meta tags
    const created: HTMLElement[] = [];
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
        created.push(el);
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
    setMeta("name", "description", description);
    noIndex
      ? setMeta("name", "robots", "noindex, nofollow")
      : setMeta("name", "robots", "index, follow, max-snippet:-1, max-image-preview:large");

    if (keywords) {
      setMeta("name", "keywords", keywords);
    }

    // Open Graph
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", url);
    setMeta("property", "og:image", ogImage);
    setMeta("property", "og:type", ogType);
    setMeta("property", "og:image:width", ogImageWidth);
    setMeta("property", "og:image:height", ogImageHeight);
    setMeta("property", "og:image:alt", title);

    // Twitter
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", ogImage);
    setMeta("name", "twitter:image:alt", title);

    return () => {
      canonical.setAttribute("href", "https://opendraft.co/");
      document.title = "Improve Your Company, Get Promoted | OpenDraft";
      created.forEach(el => el.remove());
    };
  }, [title, description, path, ogImage, ogType, noIndex, ogImageWidth, ogImageHeight, keywords]);

  return null;
}
