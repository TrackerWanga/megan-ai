// ══════════════════════════════════════════════════════════
// Search Providers (DuckDuckGo, GNews)
// ══════════════════════════════════════════════════════════

import { AIRequest, AIResponse, Provider } from '../types';

export const duckduckgoSearch: Provider = {
  name: 'duckduckgo-search',
  fn: async (params: AIRequest): Promise<AIResponse> => {
    const q = encodeURIComponent(params.prompt);
    const country = params.country || 'KE';

    const res = await fetch(
      `https://lite.duckduckgo.com/lite/?q=${q}&kl=${country.toLowerCase()}-en`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
        },
      }
    );

    const html = await res.text();
    const results: any[] = [];

    const rows = html.match(/<tr>[\s\S]*?<\/tr>/g) || [];
    for (const row of rows) {
      const linkMatch = row.match(
        /<a[^>]*class='result-link'[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/
      );
      const snippetMatch = row.match(
        /class='result-snippet'>([\s\S]*?)<\/td>/
      );
      const urlMatch = row.match(/class='link-text'>([^<]*)</);

      if (linkMatch) {
        results.push({
          title: linkMatch[2].replace(/<[^>]*>/g, '').trim(),
          url: linkMatch[1],
          snippet: snippetMatch
            ? snippetMatch[1].replace(/<[^>]*>/g, '').trim()
            : '',
          displayUrl: urlMatch ? urlMatch[1].trim() : '',
        });
      }
    }

    return {
      success: true,
      text: JSON.stringify(results.slice(0, 10)),
      provider: 'duckduckgo',
      model: 'lite-search',
    };
  },
  tier: 1,
  type: 'search',
};

export const gnewsSearch: Provider = {
  name: 'gnews-search',
  fn: async (params: AIRequest, env?: any): Promise<AIResponse> => {
    const q = encodeURIComponent(params.prompt);
    const country = params.country || 'KE';
    const key = env?.GNEWS_API_KEY || '';

    const res = await fetch(
      `https://gnews.io/api/v4/search?q=${q}&country=${country.toLowerCase()}&max=10&apikey=${key}`
    );

    if (!res.ok) throw new Error(`GNews error ${res.status}`);

    const data = await res.json() as any;

    const articles = (data.articles || []).map((a: any) => ({
      title: a.title,
      url: a.url,
      snippet: a.description,
      source: a.source?.name,
      publishedAt: a.publishedAt,
      imageUrl: a.image,
    }));

    return {
      success: true,
      text: JSON.stringify(articles),
      provider: 'gnews',
      model: 'news-api',
    };
  },
  tier: 2,
  type: 'search',
};
