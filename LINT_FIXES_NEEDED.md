# Lint Fixes Needed — Action Items

**Status:** Build compilation ✅ | Linting ❌ (40 errors)

## Quick Fix Summary

Run this after making fixes to verify:
```bash
npm run lint  # Should output: "0 errors, 0 warnings"
```

---

## Issues to Fix

### 1. Console.log → console.debug (7 fixes)

**Files:** `src/main.ts`, `src/modals/findReplaceModal.ts`

**Fix:** Replace all `console.log()` with `console.debug()` or `console.warn()`

```typescript
// ❌ Before
console.log(`[Update Plugins Paths] Scanned ${this.vaultScanner.getCount()} folders`);

// ✅ After
console.debug(`[Update Plugins Paths] Scanned ${this.vaultScanner.getCount()} folders`);
```

**Lines in main.ts:** 24, 43, 47
**Lines in findReplaceModal.ts:** 34

---

### 2. Remove Inline Styles (40+ fixes)

**Files:** `src/modals/findReplaceModal.ts`, `src/modals/previewModal.ts`

**Fix:** Remove all `element.style.*` assignments and add CSS classes instead

#### In findReplaceModal.ts:

**Lines with inline styles to remove:**
- Line 42-43: `fromInput.style.width`, `marginBottom`
- Line 55-56: `toInput.style.width`, `marginBottom`
- Lines 59-63: `suggestionsEl` styles (maxHeight, overflowY, border, etc.)
- Lines 71, 79, 85-87, 92: More suggestionsEl styles
- Lines 106-111: `pluginsList` styles
- Lines 115-118: `label` styles
- Lines 121: `checkbox` style
- Lines 140-141: `buttonGroup` styles

**What to do:**

1. **Add these CSS classes to `styles.css`:**
```css
.form-input {
  width: 100%;
  margin-bottom: 1rem;
  padding: 0.5rem;
  border: 1px solid var(--background-modifier-border);
  border-radius: 4px;
  background-color: var(--background-modifier-form-field);
}

.autocomplete-suggestions {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--background-modifier-border);
  border-radius: 4px;
  display: none;
}

.autocomplete-suggestions.active {
  display: block;
}

.suggestion-item {
  padding: 0.5rem;
  cursor: pointer;
  border-bottom: 1px solid var(--background-modifier-border);
}

.suggestion-item:hover {
  background-color: var(--background-modifier-hover);
}

.plugins-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--background-modifier-border);
  border-radius: 4px;
  padding: 0.5rem;
  margin-bottom: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  cursor: pointer;
}

.checkbox-label input {
  margin-right: 0.5rem;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}
```

2. **In TypeScript, use addClass instead:**

```typescript
// ❌ Before
fromInput.style.width = '100%';
fromInput.style.marginBottom = '1rem';

// ✅ After
fromInput.addClass('form-input');
```

Replace all inline style assignments with:
```typescript
// Example conversions
element.addClass('form-input');           // Replaces width/margin/padding styles
suggestionsEl.addClass('autocomplete-suggestions');  // Replaces max-height/overflow/border
label.addClass('checkbox-label');         // Replaces display/align-items/padding
buttonGroup.addClass('button-group');     // Replaces display/gap/margin
```

3. **For conditional styles (like show/hide):**

Instead of:
```typescript
suggestionsEl.style.display = suggestions.length > 0 ? 'block' : 'none';
```

Use classes:
```typescript
if (suggestions.length > 0) {
  suggestionsEl.addClass('active');
} else {
  suggestionsEl.removeClass('active');
}
```

Then in CSS:
```css
.autocomplete-suggestions {
  display: none;
}

.autocomplete-suggestions.active {
  display: block;
}
```

#### In previewModal.ts:

**Same issue:** Remove all inline styles from line 29+ section

Replace with CSS classes for:
- `.preview-container` — max-height, overflow, border, padding, margin, background
- `.preview-section` — margin-bottom
- `.preview-diff` — font-family, font-size, margin
- `.preview-before` / `.preview-after` — color values

Use CSS variables:
```css
.preview-before {
  color: var(--text-error);      /* Red */
}

.preview-after {
  color: var(--text-success);    /* Green */
}
```

---

### 3. Sentence Case for UI Text (5 fixes)

**Files:** `src/main.ts`, `src/modals/findReplaceModal.ts`

Change all Title Case text to Sentence case:

```typescript
// ❌ Before
.setName('Update Plugin Paths')
.setText('APPLY CHANGES')
contentEl.createEl('h2', { text: 'Update Plugin Paths' })

// ✅ After
.setName('Update plugin paths')
.setText('Apply changes')
contentEl.createEl('h2', { text: 'Update plugin paths' })
```

**Lines in main.ts:**
- Line 27: "Update Plugins Paths" → "Update plugin paths"
- Line 34: "Update Plugin Paths" → "Update plugin paths"

**Lines in findReplaceModal.ts:**
- Line 24: "Update Plugin Paths" → "Update plugin paths"
- Line 37: "FROM (current path):" → "FROM (current path):" (already correct)
- Line 49: "TO (new path):" → "TO (new path):" (already correct)

---

### 4. Command ID (1 fix)

**File:** `src/main.ts` line 33

```typescript
// ❌ Before
id: 'update-plugins-paths',  // Repeats plugin ID

// ✅ After
id: 'open-find-replace',     // Just the action
```

Obsidian automatically makes it: `update-plugins-paths:open-find-replace`

---

### 5. Unused Imports (4 fixes)

**File:** `src/main.ts` line 1

```typescript
// ❌ Before
import { App, Modal, Notice, Plugin } from 'obsidian';

// ✅ After
import { Plugin } from 'obsidian';
```

**File:** `src/modals/findReplaceModal.ts` line 1

```typescript
// ❌ Before
import { App, Modal, Notice, Setting } from 'obsidian';

// ✅ After
import { App, Modal, Notice } from 'obsidian';
```

Remove the unused `Setting` import (already using Obsidian API for settings).

---

## Fix Order (Easiest to Hardest)

1. **Unused imports** (5 min) — Just delete unused symbols
2. **Sentence case** (5 min) — Find/replace Title Case with sentence case
3. **Command ID** (2 min) — Change ID to not repeat plugin name
4. **Console.log** (3 min) — Replace console.log with console.debug
5. **Inline styles** (20 min) — Move to CSS classes

**Total time:** ~35 minutes to fix all 40+ errors

---

## Reference

See **`.claude/rules/OBSIDIAN_PLUGIN_ESLINT_VIOLATIONS.md`** for:
- Detailed explanations of each rule
- More code examples
- Why each rule matters

See **`.claude/rules/OBSIDIAN_MODAL_STRUCTURE.md`** for:
- Complete CSS structure template
- Modal patterns
- CSS variable reference

---

## Verification Steps

After making fixes:

```bash
# 1. Check lint passes
npm run lint

# Expected output:
# > eslint .
# (no errors or warnings should appear)

# 2. Build should succeed
npm run build

# 3. Then can test in Obsidian
# (See TESTING_GUIDE.md)
```

---

## Files to Edit

- [ ] `src/main.ts` — Remove console.log, fix sentence case, fix command ID, remove unused imports
- [ ] `src/modals/findReplaceModal.ts` — Remove inline styles, fix console.log, remove unused imports
- [ ] `src/modals/previewModal.ts` — Remove inline styles
- [ ] `styles.css` — Add all CSS classes (see section 2 above)
- [ ] `src/settings.ts` — No changes needed (already follows patterns)
- [ ] `src/pluginRegistry.ts` — No changes needed
- [ ] `src/vaultScanner.ts` — No changes needed
- [ ] `src/pluginDataScanner.ts` — No changes needed
- [ ] `src/pathAutocomplete.ts` — No changes needed

---

**When done:** `npm run lint` should show **0 errors, 0 warnings** ✅
