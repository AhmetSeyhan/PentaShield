/**
 * Scanner ULTRA Browser Extension - Content Script
 *
 * Detects and analyzes media on web pages
 */

(function() {
  'use strict';

  // Track analyzed media to avoid duplicates
  const analyzedMedia = new Set();

  /**
   * Find all media elements on page
   */
  function findMediaElements() {
    const videos = Array.from(document.querySelectorAll('video'));
    const images = Array.from(document.querySelectorAll('img'));
    return { videos, images };
  }

  /**
   * Add Scanner overlay to media element
   */
  function addScannerOverlay(element, result) {
    const overlay = document.createElement('div');
    overlay.className = 'scanner-ultra-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 5px;
      right: 5px;
      padding: 4px 8px;
      background: ${getOverlayColor(result.verdict)};
      color: white;
      font-size: 12px;
      font-weight: bold;
      border-radius: 4px;
      z-index: 10000;
      cursor: pointer;
    `;
    overlay.textContent = `Scanner: ${result.verdict}`;
    overlay.title = `Trust Score: ${(result.trust_score * 100).toFixed(1)}%`;

    // Position relative to element
    if (element.parentElement) {
      if (element.parentElement.style.position === 'static') {
        element.parentElement.style.position = 'relative';
      }
      element.parentElement.appendChild(overlay);
    }

    // Click to show details
    overlay.addEventListener('click', () => showDetails(result));
  }

  /**
   * Get overlay color based on verdict
   */
  function getOverlayColor(verdict) {
    const colors = {
      'authentic': '#10b981',
      'likely_authentic': '#3b82f6',
      'uncertain': '#f59e0b',
      'likely_fake': '#ef4444',
      'fake': '#dc2626'
    };
    return colors[verdict] || '#6b7280';
  }

  /**
   * Show detailed results modal
   */
  function showDetails(result) {
    alert(`Scanner ULTRA Analysis\n\nVerdict: ${result.verdict}\nTrust Score: ${(result.trust_score * 100).toFixed(1)}%\nThreat Level: ${result.threat_level}`);
  }

  /**
   * Analyze media element
   */
  async function analyzeMedia(element, type) {
    const src = element.currentSrc || element.src;
    if (!src || analyzedMedia.has(src)) return;

    analyzedMedia.add(src);

    try {
      // Send to background script for analysis
      const response = await chrome.runtime.sendMessage({
        action: 'analyzeMedia',
        url: src,
        type: type
      });

      if (response && response.result) {
        addScannerOverlay(element, response.result);
      }
    } catch (error) {
      console.error('Scanner analysis failed:', error);
    }
  }

  /**
   * Observe DOM for new media
   */
  function observeDOM() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === 'VIDEO') {
            analyzeMedia(node, 'video');
          } else if (node.tagName === 'IMG') {
            analyzeMedia(node, 'image');
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Initialize extension
   */
  function init() {
    // Analyze existing media
    const { videos, images } = findMediaElements();
    videos.forEach(v => analyzeMedia(v, 'video'));
    images.forEach(img => analyzeMedia(img, 'image'));

    // Observe for new media
    observeDOM();

    console.log('Scanner ULTRA extension loaded');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
