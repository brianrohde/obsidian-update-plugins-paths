# OBSIDIAN_PLUGIN_ESLINT_VIOLATIONS

## Rule ID
`OPE-001` — Obsidian Plugin ESLint Compliance

## Severity
**HIGH** — Causes build failures and plugin rejection

## Description

Obsidian plugins have strict ESLint rules enforced by `eslint-plugin-obsidianmd`. Violations prevent builds and plugin acceptance into the community registry.

## Common Violations & Fixes

### 1. Direct Style Assignment (CRITICAL)

**Error:** `Avoid setting styles directly via element.style.*`

**Bad:**
```typescript
const el = document.createElement('div');
el.style.width = '100%';
el.style.marginBottom = '1rem';
el.style.display = 'flex';
```

**Good:**
```typescript
// Define in styles.css
const el = document.createElement('div');
el.addClass('modal-container');

// styles.css
.modal-container {
  width: 100%;
  margin-bottom: 1rem;
  display: flex;
}
```

**Alternative (dynamic props):**
```typescript
import { setIcon, setCssProps } from 'obsidian';

el.setCssProps({
  '--my-width': '100%',
  '--my-margin': '1rem'
});
```

### 2. Console Statements (CRITICAL)

**Error:** `Unexpected console statement. Only console.warn, console.error, console.debug allowed`

**Bad:**
```typescript
console.log(`Scanned ${count} folders`);  // ❌ console.log not allowed
```

**Good:**
```typescript
console.debug(`[Update Plugins Paths] Scanned ${count} folders`);  // ✅ debug OK
console.warn('Something went wrong');  // ✅ warn OK
console.error('Critical error:', error);  // ✅ error OK
```

### 3. UI Text Case (HIGH)

**Error:** `Use sentence case for UI text`

**Bad:**
```typescript
.setName('Update Plugin Paths')  // ❌ Title case
button.setText('APPLY CHANGES')   // ❌ ALL CAPS
```

**Good:**
```typescript
.setName('Update plugin paths')   // ✅ Sentence case
button.setText('Apply changes')    // ✅ Sentence case
```

### 4. Command ID Conflicts (HIGH)

**Error:** `The command ID should not include the plugin ID`

**Bad:**
```typescript
this.addCommand({
  id: 'update-plugins-paths-open-modal',  // ❌ Repeats plugin ID
  name: 'Open modal'
});
```

**Good:**
```typescript
this.addCommand({
  id: 'open-modal',  // ✅ Just the action
  name: 'Open modal'
});
```

Obsidian automatically prefixes with plugin ID: `update-plugins-paths:open-modal`

### 5. Unused Imports (MEDIUM)

**Error:** `'Module' is defined but never used`

**Bad:**
```typescript
import { App, Modal, Notice, Plugin } from 'obsidian';
// But only using Plugin
```

**Good:**
```typescript
import { Plugin } from 'obsidian';
```

## Prevention Rules for This Plugin

### For main.ts
- ✅ Use only `console.debug`, `console.warn`, `console.error`
- ✅ Import only what you use
- ✅ Command IDs should be: `scan-plugins`, `preview-changes`, `apply-changes`
- ✅ All console output should include debug context: `console.debug('[Update Plugins Paths] ...')`

### For Modal Files (findReplaceModal.ts, previewModal.ts)
- ✅ **ALL styling must be in styles.css**
- ✅ Use CSS classes: `appendChild(createElement('div', { cls: 'find-replace-container' }))`
- ✅ Create semantic class names (see styles.css structure below)
- ✅ No inline `el.style.*` assignments anywhere
- ✅ Use Obsidian Setting API for standard form controls
- ✅ All text in `setText()`, `setName()`, `setDesc()` must be sentence case

### Styles.css Structure

```css
/* Modal containers */
.find-replace-modal { }
.find-replace-section { }
.preview-modal { }

/* Form inputs */
.path-input { }
.autocomplete-wrapper { }
.autocomplete-suggestions { }
.suggestion-item { }
.suggestion-item.suggestion-existing { }
.suggestion-item.suggestion-create { }

/* Plugin list */
.plugins-list { }
.checkbox-label { }

/* Preview section */
.preview-container { }
.preview-section { }
.preview-diff { }
.preview-before { color: var(--text-error); }
.preview-after { color: var(--text-success); }

/* Buttons */
.button-group { }
```

## File-Specific Rules

### src/main.ts
- ✅ Only console.debug/warn/error
- ✅ Command IDs: no plugin prefix
- ✅ Sentence case for all command names
- ✅ Import only used symbols

### src/modals/findReplaceModal.ts
- ✅ ZERO inline styles — all in CSS
- ✅ Use `.addClass('class-name')`
- ✅ All form controls via Setting API or Obsidian components
- ✅ Sentence case for all labels, placeholders, buttons

### src/modals/previewModal.ts
- ✅ ZERO inline styles — all in CSS
- ✅ Use CSS for diff colors
- ✅ Semantic HTML: use createElement with cls parameter

### src/settings.ts
- ✅ Use Setting API (already doing this correctly)
- ✅ Sentence case for all setting names/descriptions

## Testing

Run before every commit:
```bash
npm run lint
```

Should output: **0 errors, 0 warnings**

If lint fails:
1. Don't commit
2. Fix all errors (see "Common Violations & Fixes" above)
3. Run lint again
4. Then commit

## Related Files

- `styles.css` — All UI styling definitions
- `eslint.config.mts` — ESLint configuration (obsidianmd plugin rules)
- `manifest.json` — Plugin metadata (checked by ESLint)

## Links

- [Obsidian ESLint Plugin Rules](https://github.com/obsidianmd/eslint-plugin-obsidianmd)
- [Obsidian UI Guidelines](https://docs.obsidian.md/User+interface/Color+scheme)
- [Obsidian Command API](https://docs.obsidian.md/Plugins/Manifest#Commands)

## When to Apply This Rule

✅ Before writing any UI code  
✅ Before running `npm run build`  
✅ Before committing  
✅ When ESLint output shows violations  

## Severity Levels

| Level | When | Impact |
|-------|------|--------|
| CRITICAL | Build fails | Cannot test plugin |
| HIGH | Community registry rejects | Plugin won't distribute |
| MEDIUM | Code quality | May cause bugs |
| LOW | Style guide | Consistency only |

---

**Last Updated:** 2026-05-26  
**Issue:** Session MVP build encountered 40+ ESLint errors that prevented testing plugin in Obsidian
