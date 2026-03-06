/**
 * Tweet text templates for different post types
 */

const SITE_URL = "https://opendraft.co";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function newListingTweet(listing: any): string {
  const price = listing.price === 0 ? "FREE" : `$${(listing.price / 100).toFixed(0)}`;
  const badge = listing.completeness_badge === "production_ready" ? "Production-ready" :
    listing.completeness_badge === "mvp" ? "MVP" : "Prototype";
  const url = `${SITE_URL}/listing/${listing.id}`;

  const templates = [
    `New drop on OpenDraft 🏪\n\n"${listing.title}"\n${badge} · ${price}\n\nOwn the source. Deploy today.\n\n${url}`,
    `Just listed → ${listing.title}\n\n${badge} · Ready to fork and ship.\n\n${url}`,
    `Fresh on the marketplace:\n\n${listing.title} (${price})\n\nFork it. Ship it. Support included.\n\n${url}`,
  ];
  return pick(templates);
}

export function saleMilestoneTweet(listing: any, milestone: number): string {
  const url = `${SITE_URL}/listing/${listing.id}`;
  const templates = [
    `${milestone} builders chose "${listing.title}" on OpenDraft.\n\nSee what they're shipping 👇\n${url}`,
    `"${listing.title}" just crossed ${milestone} sales 🎉\n\nJoin them → ${url}`,
    `${milestone}x sold.\n\n"${listing.title}" is one of the most popular projects on OpenDraft.\n\n${url}`,
  ];
  return pick(templates);
}

export function trendingDigestTweet(listings: any[]): string {
  const top3 = listings.slice(0, 3);
  const lines = top3.map((l: any, i: number) => {
    const price = l.price === 0 ? "FREE" : `$${(l.price / 100).toFixed(0)}`;
    return `${i + 1}. ${l.title} (${price})`;
  });
  return `Trending on OpenDraft today 🔥\n\n${lines.join("\n")}\n\nBrowse → ${SITE_URL}`;
}

export function weeklyStatsTweet(stats: { listings: number; sales: number; builders: number }): string {
  return `This week on OpenDraft:\n\n🏪 ${stats.listings} new apps listed\n💰 ${stats.sales} sales completed\n👷 ${stats.builders} builders joined\n\nThe app store for AI agents.\n\n${SITE_URL}`;
}
