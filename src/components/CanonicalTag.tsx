import { useEffect } from "react";

export function CanonicalTag({ path }: { path: string }) {
  useEffect(() => {
    const url = `https://opendraft.co${path}`;
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", url);
    return () => {
      link.remove();
    };
  }, [path]);

  return null;
}
