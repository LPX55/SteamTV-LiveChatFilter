# Quick Installation Guide

Choose one of the two JavaScript solutions:

## Option 1: Network-Level Filter (Recommended)

**File:** `steamtv-filter.js`

- Most efficient - filters messages before they load
- Requires Tampermonkey or browser console
- Prevents spam from loading entirely

**Installation:**

1. Install [Tampermonkey](https://www.tampermonkey.net/)
2. Create new userscript
3. Copy/paste content from `steamtv-filter.js`
4. Save and enable

## Option 2: DOM-Level Filter

**File:** `steamtv-filter-dom.js`

- More flexible - works with DOM after loading
- Requires Tampermonkey or browser console
- Good for when network filtering doesn't work

**Installation:**

1. Install [Tampermonkey](https://www.tampermonkey.net/)
2. Create new userscript
3. Copy/paste content from `steamtv-filter-dom.js`
4. Save and enable

## Console Installation (No Extension)

1. Open SteamTV in browser
2. Press `F12` to open Developer Tools
3. Go to Console tab
4. Copy/paste JavaScript code (without UserScript headers)
5. Press Enter

## Customization

Edit the `blockedPatterns` array in either file to filter additional text:

```javascript
const blockedPatterns = ['!drop', '!claim', 'your-pattern'];
```

## Important Notes

- **CSS alone cannot filter text content** - JavaScript is required
- Both solutions are JavaScript-based
- Works specifically with SteamTV's chat interface
- May break with future SteamTV updates
