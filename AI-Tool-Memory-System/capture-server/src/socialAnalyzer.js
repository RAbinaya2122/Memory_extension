import * as cheerio from 'cheerio';

/**
 * Basic pipeline to fetch publicly available metadata from a social URL or generic page.
 * Returns whatever text/metadata it can find so Gemini can infer the AI tool context.
 */
export async function fetchPageMetadata(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!response.ok) {
      return {
        url,
        status: response.status,
        error: `Failed to fetch URL. HTTP Status: ${response.status}`
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const title = $('title').text() || $('meta[property="og:title"]').attr('content') || '';
    const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
    
    // Attempt to grab any main heading or body text snippet just in case
    const h1 = $('h1').text();
    
    return {
      url,
      success: true,
      title: title.trim(),
      description: description.trim(),
      h1: h1.trim(),
      platform: detectPlatform(url)
    };
  } catch (err) {
    return {
      url,
      success: false,
      error: err.message,
      platform: detectPlatform(url)
    };
  }
}

export function detectPlatform(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('instagram.com')) return 'instagram';
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) return 'youtube';
    if (u.hostname.includes('twitter.com') || u.hostname.includes('x.com')) return 'twitter';
    return 'website';
  } catch {
    return 'unknown';
  }
}
