# SteamTV Live Stream Chat Spam Filter (`!drop`)

A lightweight solution to filter out repetitive `!drop` spam messages from SteamTV live chat during the Budapest Major 2025.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Solutions](#solutions)
  - [1. Network-Level JavaScript Filter (Recommended)](#1-network-level-javascript-filter-recommended)
  - [2. DOM-Level JavaScript Filter](#2-dom-level-javascript-filter)
- [Technical Explanation](#technical-explanation)
- [Installation](#installation)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Security & Privacy](#security--privacy)
- [Browser Compatibility](#browser-compatibility)
- [Development](#development)
- [License](#license)

## 🎯 Overview

During the Budapest Major 2025, SteamTV chat was flooded with users spamming `!drop` commands expecting some kind of response. This repository provides two JavaScript-based solutions to filter out these spam messages:

- **Network-Level JavaScript Filter**: Intercepts API calls and filters at the network level (most efficient)
- **DOM-Level JavaScript Filter**: Examines message content in the DOM after messages load

Both solutions are specifically designed for SteamTV's broadcast chat interface and may break with future UI updates.

## ✨ Features

- ✅ Filters `!drop` spam messages
- ✅ Two JavaScript implementation options (Network-level and DOM-level)
- ✅ Lightweight and fast
- ✅ No external dependencies
- ✅ Easy to customize and extend
- ✅ Works with Tampermonkey or browser console

## 🛠️ Solutions

### 1. Network-Level JavaScript Filter (Recommended)

This solution intercepts network requests and filters out spam messages before they reach the chat interface. It's more efficient and prevents spam messages from loading entirely.

#### How it works:
- Intercepts `fetch()` and `XMLHttpRequest` API calls
- Filters out messages containing blocked patterns
- Returns clean data to the chat interface
- Works at the network level for optimal performance

#### Code:
```javascript
// ==UserScript==
// @name         SteamTV Chat !drop Filter
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Filter !drop messages from SteamTV broadcast chat
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
```

### 2. DOM-Level JavaScript Filter

This solution uses JavaScript to filter messages at the DOM level after they have loaded. It's more flexible and works by examining message content directly in the DOM.

#### How it works:
- Uses JavaScript to examine message text content in the DOM
- Filters out messages containing blocked patterns
- Adds CSS classes to filtered elements for visual styling
- Combines JavaScript logic with CSS presentation
- Works with MutationObserver for dynamic content

#### Code:
```javascript
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
```

## 🔧 Technical Explanation

### Why JavaScript is Required

**CSS has fundamental limitations that prevent it from filtering text content:**

1. **No text content access**: CSS cannot read or examine the text inside elements
2. **No :contains() pseudo-class**: CSS does not have a `:contains()` selector to match text content
3. **No attribute-based content**: The message text is in element content, not attributes

**Even with modern CSS :has() selector, the `:contains()` pseudo-class does not exist in CSS.**

### Content-based text filtering requires JavaScript because:
- CSS has no way to read element text content
- CSS cannot perform string matching operations  
- CSS cannot conditionally hide elements based on their text content

This is not a limitation of our implementation - it's a fundamental constraint of CSS itself.

## 📦 Installation

### Both JavaScript Solutions

#### Option 1: Tampermonkey
1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Create a new userscript
3. Copy and paste either JavaScript code above
4. Save and enable the script
5. Visit SteamTV to see the filter in action

#### Option 2: Browser Console
1. Open SteamTV in your browser
2. Press `F12` to open Developer Tools
3. Go to the Console tab
4. Paste the JavaScript code (without the UserScript header)
5. Press Enter to execute

## 🎮 Usage

1. **Install either solution** following the instructions above
2. **Visit SteamTV** at `https://steam.tv/csgo` or any other game
3. **Enjoy spam-free chat** - `!drop` messages will be filtered out
4. **Customize patterns** by editing the `blockedPatterns` array

### Customizing Blocked Patterns

To block additional spam patterns, modify the `blockedPatterns` array in either JavaScript code:

```javascript
const blockedPatterns = [
    '!drop',
    '!claim',
    '!free',
    'your-custom-pattern'
];
```

## 🔧 Troubleshooting

### Messages Still Appear
- **Network-Level**: Check if the userscript is enabled and there are no console errors
- **DOM-Level**: Verify the script is running and SteamTV hasn't updated their class names
- Clear browser cache and refresh the page
- Try disabling other extensions that might interfere

### Performance Issues
- **Network-Level**: Check browser console for any errors or warnings
- **DOM-Level**: Monitor the setInterval frequency in the console
- Monitor memory usage in browser Task Manager

### SteamTV Updates
- SteamTV may update their interface and break these solutions
- Check the repository for updated versions
- Report issues in the GitHub issues section

### Extension Conflicts
- Disable other chat-related extensions
- Check Tampermonkey dashboard for conflicts
- Try incognito/private mode with only the necessary extension

## 🔒 Security & Privacy

### Network-Level JavaScript Filter
- **No data collection**: The script only filters local chat data
- **Network interception**: Reads chat API responses but doesn't send data elsewhere
- **Minimal permissions**: Requires only basic script execution permissions
- **Transparent**: All filtering logic is visible in the source code

### DOM-Level JavaScript Filter
- **No data collection**: The script only examines local DOM content
- **Client-side only**: No network requests made by the script
- **Minimal permissions**: Requires only basic script execution permissions
- **Transparent**: All filtering logic is visible in the source code

### General Considerations
- Use only trusted userscript managers (Tampermonkey, Violentmonkey)
- Review code before installing any scripts
- Keep extensions updated for security patches
- Consider the trade-off between convenience and privacy

## 🌐 Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Network-Level Filter | ✅ | ✅ | ⚠️ | ✅ |
| DOM-Level Filter | ✅ | ✅ | ✅ | ✅ |
| Tampermonkey | ✅ | ✅ | ⚠️ | ✅ |

**Legend**: ✅ Full Support | ⚠️ Limited Support | ❌ Not Supported

## 🛠️ Development

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Adding New Filters
To add support for other streaming platforms or spam patterns:

1. Modify the URL matching patterns in the UserScript header
2. Update the API endpoint detection logic (Network-Level) or DOM selectors (DOM-Level)
3. Test on the target platform
4. Update documentation

### Testing
- Test on multiple browsers
- Verify performance impact
- Check for console errors
- Validate against SteamTV updates

## 📄 License

This project is provided as-is for educational and personal use. Use at your own risk.

### Disclaimer
- Not affiliated with Valve Corporation or Steam
- May break with SteamTV updates
- No warranty or support provided
- Use responsibly and respect other users

---

**Created during Budapest Major 2025**
