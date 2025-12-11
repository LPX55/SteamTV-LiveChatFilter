// ==UserScript==
// @name         SteamTV Chat !drop Filter (DOM Level)
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Filter !drop messages from SteamTV broadcast chat using DOM-level filtering
// @match        https://steam.tv/*
// @match        https://steamcommunity.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    
    // Customizable blocked patterns
    const blockedPatterns = ['!drop'];
    
    // Create and inject CSS for hiding filtered messages
    function injectFilterCSS() {
        const css = `
            .steamtv-filtered-message {
                display: none !important;
            }
            .steamtv-filtered-container {
                opacity: 0.3 !important;
                max-height: 50px !important;
                overflow: hidden !important;
            }
            .steamtv-filtered-container:hover {
                opacity: 1 !important;
                max-height: 200px !important;
            }
        `;
        
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }
    
    // Mark DOM elements as filtered for CSS to handle
    function markFilteredElements() {
        const messageSelectors = [
            '[class*="broadcastchat_MessageContents"]',
            '[class*="broadcastchat_MessageChat"]',
            '[class*="MessageContents"]',
            '[class*="MessageChat"]',
            '[class*="ChatMessage"]'
        ];
        
        messageSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const text = element.textContent.toLowerCase();
                if (blockedPatterns.some(pattern => text.includes(pattern.toLowerCase()))) {
                    element.classList.add('steamtv-filtered-message');
                    
                    // Also mark parent containers for visual effects
                    let parent = element.parentElement;
                    while (parent && !parent.classList.contains('steamtv-filtered-container')) {
                        if (parent.classList.contains('broadcastchat') || 
                            parent.classList.contains('ChatContainer') ||
                            parent.tagName === 'LI' || 
                            parent.tagName === 'DIV') {
                            parent.classList.add('steamtv-filtered-container');
                            break;
                        }
                        parent = parent.parentElement;
                    }
                }
            });
        });
    }
    
    // DOM observation for dynamic content
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            injectFilterCSS();
            setInterval(markFilteredElements, 1000); // Check every second
        });
    } else {
        injectFilterCSS();
        setInterval(markFilteredElements, 1000);
    }
    
    // Also run on dynamic content changes
    const observer = new MutationObserver(markFilteredElements);
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();