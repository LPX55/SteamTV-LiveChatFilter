// ==UserScript==
// @name         SteamTV Livestream Chat Spam Filter
// @namespace    https://borderless.ml
// @version      1.4
// @description  Filter !drop messages and other unwanted repetitive spam from SteamTV broadcast chats
// @match        https://steam.tv/*
// @match        https://steamcommunity.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    
    // Customizable blocked patterns
    const blockedPatterns = ['!drop'];
    
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const response = await originalFetch(...args);
        
        // Check if this is a chat API request
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
        if (url && (url.includes('broadcastchat') || url.includes('chat'))) {
            try {
                const clonedResponse = response.clone();
                const data = await clonedResponse.json();
                
                // Filter out messages containing blocked patterns
                if (Array.isArray(data)) {
                    const filtered = data.filter(msg => {
                        if (!msg.msg) return true;
                        return !blockedPatterns.some(pattern => 
                            msg.msg.toLowerCase().includes(pattern.toLowerCase())
                        );
                    });
                    
                    return new Response(JSON.stringify(filtered), {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers
                    });
                }
            } catch (e) {
                console.warn('Chat filter: Error parsing response', e);
            }
        }
        
        return response;
    };
    
    // Also intercept XMLHttpRequest for older API calls
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        this._url = url;
        return originalOpen.call(this, method, url, ...rest);
    };
    
    XMLHttpRequest.prototype.send = function(...args) {
        if (this._url && (this._url.includes('broadcastchat') || this._url.includes('chat'))) {
            this.addEventListener('load', function() {
                try {
                    const data = JSON.parse(this.responseText);
                    if (Array.isArray(data)) {
                        const filtered = data.filter(msg => {
                            if (!msg.msg) return true;
                            return !blockedPatterns.some(pattern => 
                                msg.msg.toLowerCase().includes(pattern.toLowerCase())
                            );
                        });
                        
                        Object.defineProperty(this, 'responseText', {
                            writable: true,
                            value: JSON.stringify(filtered)
                        });
                    }
                } catch (e) {
                    console.warn('Chat filter: Error parsing XHR response', e);
                }
            });
        }
        return originalSend.call(this, ...args);
    };
})();