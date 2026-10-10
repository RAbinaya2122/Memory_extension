console.log("[AI Memory Content Script] Initialized on",window.location.hostname);let b=null,l=[],s="",r=null,i=null,x="";function u(){const e=["#prompt-textarea",'div[contenteditable="true"][data-placeholder]','div[contenteditable="true"]','textarea[tabindex="0"]',"textarea"],t=['rich-textarea div[contenteditable="true"]','.ql-editor[contenteditable="true"]',"textarea[aria-label]",'div[contenteditable="true"]'],n=[...e,...t];for(const o of n){const p=Array.from(document.querySelectorAll(o)).find(m=>m.offsetWidth>0&&m.offsetHeight>0);if(p)return p}return null}function f(e){return e instanceof HTMLTextAreaElement||e instanceof HTMLInputElement?e.value:e.innerText||e.textContent||""}function h(e,t){e instanceof HTMLTextAreaElement||e instanceof HTMLInputElement?(e.value=t,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0}))):(e.innerText=t,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("keyup",{bubbles:!0})))}function v(e,t){if(e===0){a();return}r||(r=document.createElement("div"),r.id="ai-memory-badge",r.className="ai-memory-badge-root",document.body.appendChild(r)),r.innerHTML=`
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
      <span style="color: #A1A1AA;">${e} saved ${e===1?"tool":"tools"} relevant</span>
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
  `;const n=r.querySelector("#ai-memory-badge-inner"),o=r.querySelector("#ai-memory-inject-btn");n&&n.addEventListener("click",d=>{d.target!==o&&c()}),o&&o.addEventListener("click",d=>{d.stopPropagation(),g()})}function a(){r&&(r.remove(),r=null)}function c(){var t,n;if(i){i.remove(),i=null;return}if(l.length===0)return;i=document.createElement("div"),i.id="ai-memory-modal",i.style.cssText=`
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
  `;let e=l.map(o=>`
    <div style="
      background: #0A0A0A;
      border: 1px solid #27272A;
      border-radius: 10px;
      padding: 10px;
      margin-bottom: 8px;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <span style="font-weight: 600; font-size: 13px; color: #A78BFA;">${o.tool.name}</span>
        <span style="font-size: 10px; padding: 2px 6px; border-radius: 9999px; background: rgba(139,92,246,0.15); color: #A78BFA; border: 1px solid rgba(139,92,246,0.3);">${o.tool.category}</span>
      </div>
      <p style="font-size: 11px; color: #A1A1AA; margin: 0 0 6px 0; line-height: 1.4;">${o.tool.description}</p>
      <a href="${o.tool.url}" target="_blank" style="font-size: 10px; color: #6366F1; text-decoration: none;">${o.tool.url} ↗</a>
    </div>
  `).join("");i.innerHTML=`
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #27272A; padding-bottom: 8px;">
      <span style="font-weight: 600; font-size: 13px; color: white;">Relevant Saved Tools (${l.length})</span>
      <button id="ai-memory-modal-close" style="background: none; border: none; color: #A1A1AA; cursor: pointer; font-size: 14px;">✕</button>
    </div>
    <div>${e}</div>
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
  `,document.body.appendChild(i),(t=i.querySelector("#ai-memory-modal-close"))==null||t.addEventListener("click",()=>{c()}),(n=i.querySelector("#ai-memory-modal-inject"))==null||n.addEventListener("click",()=>{g(),c()})}function g(){const e=u();if(!e||!s)return;const t=f(e);if(t.includes("<context>"))return;const n=`${s}

${t}`;h(e,n),a()}function A(e){if(e.trim()!==x){if(x=e.trim(),!e||e.trim().length<5||e.includes("<context>")){a();return}typeof chrome<"u"&&chrome.runtime&&chrome.runtime.sendMessage({type:"SEARCH_RELEVANT_TOOLS",query:e},t=>{if(chrome.runtime.lastError||!t||!t.success){a();return}const n=t.relevantResults||[];l=n,s=t.contextBlock||"",u()&&n.length>0?v(n.length):a()})}}function y(){const e=u();if(!e||e.dataset.aiMemoryBound)return;e.dataset.aiMemoryBound="true";const t=()=>{clearTimeout(b),b=setTimeout(()=>{const n=f(e);A(n)},400)};e.addEventListener("input",t),e.addEventListener("keyup",t)}const w=new MutationObserver(()=>{y()});w.observe(document.body,{childList:!0,subtree:!0});y();
