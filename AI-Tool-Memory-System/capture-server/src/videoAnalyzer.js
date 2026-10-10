import { YoutubeTranscript } from 'youtube-transcript';
import { fetchPageMetadata, detectPlatform } from './socialAnalyzer.js';

/**
 * Validates the URL to ensure it only targets permitted public social domains.
 * Prevents SSRF by rejecting local IPs, localhost, and internal networks.
 */
function isSafeUrl(urlString) {
  try {
    const u = new URL(urlString);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    
    const hostname = u.hostname.toLowerCase();
    
    // Prevent SSRF targeting local/internal ranges
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    const isPrivateIP = /^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\.|^192\.168\./.test(hostname);
    if (isLocalhost || isPrivateIP) return false;

    // Only allow youtube and instagram for this specific video analysis endpoint
    const isYoutube = hostname.includes('youtube.com') || hostname === 'youtu.be';
    const isInstagram = hostname.includes('instagram.com');

    return isYoutube || isInstagram;
  } catch (err) {
    return false;
  }
}

/**
 * Extracts the YouTube Video ID from standard or shorts URLs.
 */
function extractYoutubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') {
      return u.pathname.substring(1);
    }
    if (u.pathname.startsWith('/shorts/')) {
      return u.pathname.split('/')[2];
    }
    return u.searchParams.get('v');
  } catch (e) {
    return null;
  }
}

/**
 * Fetches transcript from YouTube if available.
 */
async function fetchYoutubeTranscript(videoId) {
  try {
    const transcriptList = await YoutubeTranscript.fetchTranscript(videoId);
    if (!transcriptList || transcriptList.length === 0) return null;
    
    // Combine the transcript parts into a readable string
    return transcriptList.map(t => t.text).join(' ');
  } catch (err) {
    console.warn(`[VideoAnalyzer] Transcript unavailable for ${videoId}:`, err.message);
    return null;
  }
}

/**
 * Extracts public content from a YouTube or Instagram video URL.
 * Falls back to additionalText if automated extraction fails.
 */
export async function extractVideoContent(url, additionalText = '') {
  if (!url || typeof url !== 'string' || !isSafeUrl(url)) {
    throw new Error('Invalid or unsupported URL. Please provide a valid public YouTube or Instagram URL.');
  }

  const platform = detectPlatform(url);
  if (platform !== 'youtube' && platform !== 'instagram') {
    throw new Error('This feature only supports YouTube and Instagram URLs.');
  }

  let extractedContent = {
    platform,
    title: null,
    description: null,
    transcript: null,
    sources: [],
    error: null
  };

  try {
    // 1. Fetch public Open Graph metadata (Title, Description)
    const metadata = await fetchPageMetadata(url);
    if (metadata.success) {
      if (metadata.title) {
        extractedContent.title = metadata.title;
        extractedContent.sources.push('title');
      }
      if (metadata.description) {
        extractedContent.description = metadata.description;
        extractedContent.sources.push('description');
      }
    } else {
      console.warn(`[VideoAnalyzer] Failed to fetch metadata for ${url}`);
    }

    // 2. Fetch transcript for YouTube
    if (platform === 'youtube') {
      const videoId = extractYoutubeId(url);
      if (videoId) {
        const transcriptText = await fetchYoutubeTranscript(videoId);
        if (transcriptText) {
          extractedContent.transcript = transcriptText;
          extractedContent.sources.push('transcript');
        }
      }
    }
    
    // For Instagram, we primarily rely on Open Graph description (caption) and manual fallback.
    // Instagram actively blocks automated scraping, so we gracefully handle missing data.

  } catch (err) {
    console.error('[VideoAnalyzer] Extraction error:', err.message);
    extractedContent.error = 'Failed to extract content automatically.';
  }

  // 3. Merge with manual text
  if (additionalText && additionalText.trim().length > 0) {
    extractedContent.transcript = (extractedContent.transcript ? extractedContent.transcript + '\n\n' : '') + 'MANUAL INPUT:\n' + additionalText.trim();
    if (!extractedContent.sources.includes('manual_input')) {
      extractedContent.sources.push('manual_input');
    }
  }

  // 4. Validate sufficient content
  if (extractedContent.sources.length === 0) {
    throw new Error('Unable to access enough video content automatically. Paste the caption or transcript to continue.');
  }

  return extractedContent;
}
