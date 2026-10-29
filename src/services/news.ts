export interface NewsItem {
  title: string;
  link: string;
  summary: string;
  image?: string;
  source: string;
  publishedAt: Date | null;
}

interface NewsFeed {
  source: string;
  url: string;
}

// The feed sends `Access-Control-Allow-Origin: *`, so the browser can read it directly.
const FEEDS: NewsFeed[] = [
  { source: "CNN Indonesia", url: "https://www.cnnindonesia.com/nasional/rss" },
];

// The feeds cover every topic, so only disaster-related items are kept.
const DISASTER_PATTERN =
  /\b(bencana|banjir|gempa|longsor|kebakaran|karhutla|erupsi|tsunami|puting beliung|kekeringan|abrasi|likuefaksi)\b/i;

const FEED_TIMEOUT_MS = 8000;
const CACHE_MS = 10 * 60 * 1000;
const SUMMARY_LENGTH = 140;

let cache: { at: number; limit: number; items: NewsItem[] } | null = null;

// Only plain web links are used, never `javascript:` and similar.
function safeUrl(value: string | null | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}

function plainText(html: string) {
  const text =
    new DOMParser().parseFromString(html, "text/html").body.textContent ?? "";
  return text.replace(/\s+/g, " ").trim();
}

function truncate(text: string) {
  return text.length > SUMMARY_LENGTH
    ? `${text.slice(0, SUMMARY_LENGTH).trimEnd()}...`
    : text;
}

function parseFeed(xml: string, source: string): NewsItem[] {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const items: NewsItem[] = [];

  for (const node of Array.from(doc.querySelectorAll("item"))) {
    const text = (tag: string) =>
      node.querySelector(tag)?.textContent?.trim() ?? "";
    const link = safeUrl(text("link") || text("guid"));
    const title = plainText(text("title"));
    if (!link || !title) continue;

    const date = new Date(text("pubDate"));
    items.push({
      title,
      link,
      summary: truncate(plainText(text("description"))),
      image: safeUrl(node.querySelector("enclosure")?.getAttribute("url")),
      source,
      publishedAt: Number.isNaN(date.getTime()) ? null : date,
    });
  }

  return items;
}

async function fetchFeed(feed: NewsFeed) {
  const response = await fetch(feed.url, {
    signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Feed ${feed.source}: ${response.status}`);
  return parseFeed(await response.text(), feed.source);
}

const isDisaster = (item: NewsItem) =>
  DISASTER_PATTERN.test(`${item.title} ${item.summary}`);

// Feeds are tried in order; a later one would only fill what is still missing.
export async function fetchDisasterNews(limit = 6): Promise<NewsItem[]> {
  if (cache && cache.limit === limit && Date.now() - cache.at < CACHE_MS) {
    return cache.items;
  }

  const found: NewsItem[] = [];
  let failures = 0;

  for (const feed of FEEDS) {
    if (found.length >= limit) break;
    try {
      const matches = (await fetchFeed(feed)).filter(isDisaster);
      for (const item of matches) {
        if (!found.some((existing) => existing.link === item.link)) {
          found.push(item);
        }
      }
    } catch {
      failures += 1;
    }
  }

  if (failures === FEEDS.length) {
    throw new Error("Gagal memuat berita bencana.");
  }

  const items = found
    .sort(
      (a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0),
    )
    .slice(0, limit);
  cache = { at: Date.now(), limit, items };
  return items;
}
