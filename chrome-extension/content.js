// This script runs on the LeetCode page to extract problem data (title + description)
console.log('[LeetCode AI Hints] content script loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getProblem') {
    try {
      // Give React time to render content dynamically
      setTimeout(() => {
        // ✅ Based on your provided output
        // Title container examples:
        // <div class="text-title-large font-semibold text-text-primary dark:text-text-primary">
        // or <div class="flex items-start gap-2">
        const titleElement =
          document.querySelector('div.text-title-large.font-semibold.text-text-primary') ||
          document.querySelector('div.flex.items-start.gap-2') ||
          document.querySelector('div.flex.items-start.justify-between.gap-4');

        // ✅ Description container examples:
        // <div class="flex w-full flex-1 flex-col gap-4 overflow-y-auto px-4 py-5">
        // or <div class="flex flex-col"> containing the problem statement text
        const descriptionElement =
          document.querySelector('div.flex.w-full.flex-1.flex-col.gap-4.overflow-y-auto.px-4.py-5') ||
          document.querySelector('div.flex.flex-col') ||
          document.querySelector('div.elfjS');

        if (titleElement && descriptionElement) {
          console.log('[LeetCode AI Hints] ✅ Found title and description');
          sendResponse({
            title: titleElement.innerText.trim(),
            desc: descriptionElement.innerText.trim(),
          });
        } else {
          console.warn('[LeetCode AI Hints] ❌ Could not locate elements');
          sendResponse({
            error: 'Could not find the problem title or description. Please ensure the Description tab is open.',
          });
        }
      }, 1200); // wait for React render

      return true; // keep async channel open
    } catch (e) {
      console.error('[LeetCode AI Hints] Error:', e);
      sendResponse({ error: 'Script crashed while reading the page.' });
      return true;
    }
  }
});
