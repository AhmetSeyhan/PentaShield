/**
 * Scanner ULTRA Browser Extension - Background Service Worker
 */

const SCANNER_API_URL = 'http://localhost:8000';
let apiKey = '';

// Load API key from storage
chrome.storage.sync.get(['apiKey'], (result) => {
  apiKey = result.apiKey || '';
});

/**
 * Handle messages from content script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeMedia') {
    analyzeMediaURL(request.url, request.type)
      .then(result => sendResponse({ result }))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep channel open for async response
  }
});

/**
 * Analyze media URL
 */
async function analyzeMediaURL(url, type) {
  if (!apiKey) {
    throw new Error('API key not configured');
  }

  try {
    // Fetch media
    const response = await fetch(url);
    const blob = await response.blob();

    // Send to Scanner API
    const formData = new FormData();
    formData.append('file', blob, 'media.' + getExtension(type));
    formData.append('media_type', type);

    const scanResponse = await fetch(`${SCANNER_API_URL}/v1/scan`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey
      },
      body: formData
    });

    if (!scanResponse.ok) {
      throw new Error(`API error: ${scanResponse.status}`);
    }

    return await scanResponse.json();
  } catch (error) {
    console.error('Analysis failed:', error);
    throw error;
  }
}

/**
 * Get file extension for media type
 */
function getExtension(type) {
  const extensions = {
    'video': 'mp4',
    'image': 'jpg',
    'audio': 'mp3'
  };
  return extensions[type] || 'bin';
}

/**
 * Create context menu
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'scannerAnalyze',
    title: 'Analyze with Scanner ULTRA',
    contexts: ['image', 'video']
  });
});

/**
 * Handle context menu clicks
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'scannerAnalyze') {
    const url = info.srcUrl;
    const type = info.mediaType === 'video' ? 'video' : 'image';

    analyzeMediaURL(url, type)
      .then(result => {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Scanner ULTRA',
          message: `Verdict: ${result.verdict}\nTrust: ${(result.trust_score * 100).toFixed(1)}%`
        });
      })
      .catch(error => {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Scanner ULTRA Error',
          message: error.message
        });
      });
  }
});

console.log('Scanner ULTRA background worker loaded');
