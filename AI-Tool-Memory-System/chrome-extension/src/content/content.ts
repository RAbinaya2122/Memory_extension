import { RelevanceResult } from '../lib/types';

console.log('[AI Memory Content Script] Initialized on', window.location.hostname);

let activeDebounceTimer: any = null;
let currentMatchedResults: RelevanceResult[] = [];
let currentContextBlock: string = '';
let badgeElement: HTMLElement | null = null;
let modalElement: HTMLElement | null = null;
let lastAnalyzedQuery: string = '';

/**
 * Multi-selector query to find active chat input container across ChatGPT and Google Gemini.
 */
function findChatInputElement(): HTMLElement | null {
  // Selectors for ChatGPT
  const chatgptSelectors = [
    '#prompt-textarea',
    'div[contenteditable="true"][data-placeholder]',
    'div[contenteditable="true"]',
    'textarea[tabindex="0"]',
    'textarea'
  ];

  // Selectors for Google Gemini
  const geminiSelectors = [
    'rich-textarea div[contenteditable="true"]',
    '.ql-editor[contenteditable="true"]',
    'textarea[aria-label]',
    'div[contenteditable="true"]'
  ];

  const allSelectors = [...chatgptSelectors, ...geminiSelectors];

  for (const selector of allSelectors) {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
    // Pick first visible element
    const visible = elements.find(el => el.offsetWidth > 0 && el.offsetHeight > 0);
    if (visible) {
      return visible;
    }
  }

  return null;
}

/**
 * Reads user prompt text from input element.
 */
function getInputValue(inputEl: HTMLElement): string {
  if (inputEl instanceof HTMLTextAreaElement || inputEl instanceof HTMLInputElement) {
    return inputEl.value;
  }
  return inputEl.innerText || inputEl.textContent || '';
}

/**
 * Inserts formatted context string cleanly into input element.
 */
function setInputValue(inputEl: HTMLElement, newContent: string) {
  if (inputEl instanceof HTMLTextAreaElement || inputEl instanceof HTMLInputElement) {
    inputEl.value = newContent;
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    // contenteditable div
    inputEl.innerText = newContent;
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    inputEl.dispatchEvent(new Event('keyup', { bubbles: true }));
  }
}

/**
 * Creates or updates the sleek unobtrusive AI Memory Floating Badge.
 */
function renderBadge(count: number, containerAnchor: HTMLElement) {
  if (count === 0) {
    removeBadge();
    return;
  }

  if (!badgeElement) {
    badgeElement = document.createElement('div');
    badgeElement.id = 'ai-memory-badge';
    badgeElement.className = 'ai-memory-badge-root';
    document.body.appendChild(badgeElement);
  }

  badgeElement.innerHTML = `
    <div style="
      position: fixed;
      bottom: 84px;
      right: 24px;
      z-index: 999999;
      background: rgba(17, 17, 17, 0.95);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(139, 92, 246, 0.4);
      border-radius: 9999px;
      padding: 6px 14px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 16px rgba(139, 92, 246, 0.25);
      display: flex;
      items-center: center;
      gap: 8px;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 12px;
      color: #FAFAFA;
      cursor: pointer;
      transition: all 0.2s ease;
    " id="ai-memory-badge-inner">
      <span style="
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #8B5CF6;
        box-shadow: 0 0 8px #8B5CF6;
        display: inline-block;
      "></span>
      <span style="font-weight: 600; color: #A78BFA;">✦ AI Memory</span>
      <span style="color: #A1A1AA;">${count} saved ${count === 1 ? 'tool' : 'tools'} relevant</span>
      <button id="ai-memory-inject-btn" style="
        background: linear-gradient(135deg, #8B5CF6, #6366F1);
        border: none;
        color: white;
        font-weight: 500;
        font-size: 11px;
        padding: 3px 10px;
        border-radius: 9999px;
        cursor: pointer;
        margin-left: 4px;
        transition: opacity 0.2s ease;
      ">Use Context</button>
    </div>
  `;

  const inner = badgeElement.querySelector('#ai-memory-badge-inner');
  const injectBtn = badgeElement.querySelector('#ai-memory-inject-btn');

  if (inner) {
    inner.addEventListener('click', (e) => {
      if (e.target !== injectBtn) {
        toggleModal();
      }
    });
  }

  if (injectBtn) {
    injectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      applyContextToInput();
    });
  }
}

function removeBadge() {
  if (badgeElement) {
    badgeElement.remove();
    badgeElement = null;
  }
}

/**
 * Modal preview of matching relevant saved tools.
 */
function toggleModal() {
  if (modalElement) {
    modalElement.remove();
    modalElement = null;
    return;
  }

  if (currentMatchedResults.length === 0) return;

  modalElement = document.createElement('div');
  modalElement.id = 'ai-memory-modal';
  modalElement.style.cssText = `
    position: fixed;
    bottom: 130px;
    right: 24px;
    z-index: 999999;
    width: 340px;
    max-height: 400px;
    background: #111111;
    border: 1px solid #27272A;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 20px rgba(139,92,246,0.2);
    font-family: 'Inter', system-ui, sans-serif;
    color: #FAFAFA;
    overflow-y: auto;
  `;

  let itemsHtml = currentMatchedResults.map(res => `
    <div style="
      background: #0A0A0A;
      border: 1px solid #27272A;
      border-radius: 10px;
      padding: 10px;
      margin-bottom: 8px;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <span style="font-weight: 600; font-size: 13px; color: #A78BFA;">${res.tool.name}</span>
        <span style="font-size: 10px; padding: 2px 6px; border-radius: 9999px; background: rgba(139,92,246,0.15); color: #A78BFA; border: 1px solid rgba(139,92,246,0.3);">${res.tool.category}</span>
      </div>
      <p style="font-size: 11px; color: #A1A1AA; margin: 0 0 6px 0; line-height: 1.4;">${res.tool.description}</p>
      <a href="${res.tool.url}" target="_blank" style="font-size: 10px; color: #6366F1; text-decoration: none;">${res.tool.url} ↗</a>
    </div>
  `).join('');

  modalElement.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #27272A; padding-bottom: 8px;">
      <span style="font-weight: 600; font-size: 13px; color: white;">Relevant Saved Tools (${currentMatchedResults.length})</span>
      <button id="ai-memory-modal-close" style="background: none; border: none; color: #A1A1AA; cursor: pointer; font-size: 14px;">✕</button>
    </div>
    <div>${itemsHtml}</div>
    <button id="ai-memory-modal-inject" style="
      width: 100%;
      margin-top: 8px;
      padding: 8px;
      background: linear-gradient(135deg, #8B5CF6, #6366F1);
      border: none;
      border-radius: 10px;
      color: white;
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
    ">✦ Add Context to Prompt</button>
  `;

  document.body.appendChild(modalElement);

  modalElement.querySelector('#ai-memory-modal-close')?.addEventListener('click', () => {
    toggleModal();
  });

  modalElement.querySelector('#ai-memory-modal-inject')?.addEventListener('click', () => {
    applyContextToInput();
    toggleModal();
  });
}

/**
 * Appends the formatted context block into the user's prompt input area.
 */
function applyContextToInput() {
  const inputEl = findChatInputElement();
  if (!inputEl || !currentContextBlock) return;

  const currentVal = getInputValue(inputEl);
  
  // Guard against inserting context multiple times
  if (currentVal.includes('<context>')) {
    return;
  }

  const combinedPrompt = `${currentContextBlock}\n\n${currentVal}`;
  setInputValue(inputEl, combinedPrompt);
  removeBadge();
}

/**
 * Analyzes the user's input prompt and requests relevance matching from background service worker.
 */
function analyzeInputText(text: string) {
  if (text.trim() === lastAnalyzedQuery) return;
  lastAnalyzedQuery = text.trim();

  if (!text || text.trim().length < 5 || text.includes('<context>')) {
    removeBadge();
    return;
  }

  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage(
      { type: 'SEARCH_RELEVANT_TOOLS', query: text },
      (response) => {
        if (chrome.runtime.lastError || !response || !response.success) {
          removeBadge();
          return;
        }

        const matches = response.relevantResults || [];
        currentMatchedResults = matches;
        currentContextBlock = response.contextBlock || '';

        const inputEl = findChatInputElement();
        if (inputEl && matches.length > 0) {
          renderBadge(matches.length, inputEl);
        } else {
          removeBadge();
        }
      }
    );
  }
}

/**
 * Binds input change listeners on detected prompt element.
 */
function bindInputListeners() {
  const inputEl = findChatInputElement();
  if (!inputEl) return;

  if (inputEl.dataset.aiMemoryBound) return;
  inputEl.dataset.aiMemoryBound = 'true';

  const handler = () => {
    clearTimeout(activeDebounceTimer);
    activeDebounceTimer = setTimeout(() => {
      const val = getInputValue(inputEl);
      analyzeInputText(val);
    }, 400);
  };

  inputEl.addEventListener('input', handler);
  inputEl.addEventListener('keyup', handler);
}

// Observe DOM mutations to bind dynamic input elements (ChatGPT & Gemini)
const observer = new MutationObserver(() => {
  bindInputListeners();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Initial bind check
bindInputListeners();
