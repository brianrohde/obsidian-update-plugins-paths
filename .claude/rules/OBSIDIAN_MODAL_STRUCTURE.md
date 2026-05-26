# OBSIDIAN_MODAL_STRUCTURE

## Rule ID
`OMS-001` — Obsidian Modal & UI Component Patterns

## Severity
**HIGH** — Affects plugin quality, theming, and maintainability

## Description

Obsidian modal and UI components must follow specific patterns for:
- Proper theme support (light/dark mode)
- Accessibility
- Consistency with Obsidian design
- Maintainability

## Core Principles

### 1. Never Use Inline Styles

**Bad:**
```typescript
const el = contentEl.createEl('div');
el.style.width = '100%';
el.style.marginBottom = '1rem';
el.style.display = 'flex';
el.style.gap = '1rem';
```

**Good:**
```typescript
const el = contentEl.createEl('div', { cls: 'button-group' });

// styles.css
.button-group {
  width: 100%;
  margin-bottom: 1rem;
  display: flex;
  gap: 1rem;
}
```

**Why:**
- Inline styles bypass Obsidian's CSS variable system
- Won't respond to theme changes
- Hard to maintain (scattered across code)
- Violates ESLint rules

### 2. Use CSS Variables for Colors

**Bad:**
```typescript
const el = contentEl.createEl('div');
el.style.color = '#ff0000';
el.style.backgroundColor = '#ffffff';
```

**Good:**
```typescript
const el = contentEl.createEl('div', { cls: 'preview-before' });

// styles.css
.preview-before {
  color: var(--text-error);      /* Obsidian's red */
  background-color: var(--background-primary); /* Theme-aware */
}
```

**Available Variables:**
```css
/* Text colors */
--text-normal
--text-muted
--text-faint
--text-on-accent
--text-error
--text-success
--text-warning

/* Background colors */
--background-primary
--background-primary-alt
--background-secondary
--background-secondary-alt
--background-modifier-border
--background-modifier-form-field
--background-modifier-hover
--background-modifier-active

/* Interactive */
--interactive-normal
--interactive-hover
--interactive-accent
--interactive-accent-hover

/* Sizing */
--size-4-1
--size-4-2
--size-4-3
--size-4-4
--size-4-5
--size-4-6
--size-4-8
```

### 3. Structure: Element Classes (correct way)

**Pattern:**
```typescript
// 1. Create container with CSS class
const modalContainer = contentEl.createEl('div', { cls: 'find-replace-modal' });

// 2. Add labeled sections
const fromSection = modalContainer.createEl('div', { cls: 'form-section' });
fromSection.createEl('label', { text: 'FROM path:', cls: 'form-label' });

// 3. Create form elements
const fromInput = fromSection.createEl('input', { 
  type: 'text',
  placeholder: 'Enter path to replace' 
});
fromInput.addClass('form-input');

// 4. Add interactivity via event listeners (not inline handlers)
fromInput.addEventListener('input', (e: Event) => {
  const value = (e.target as HTMLInputElement).value;
  this.handleFromPathChange(value);
});

// CSS does all styling
.find-replace-modal { padding: 1rem; }
.form-section { margin-bottom: 1.5rem; }
.form-label { display: block; margin-bottom: 0.5rem; font-weight: 600; }
.form-input { width: 100%; padding: 0.5rem; border: 1px solid var(--background-modifier-border); }
```

### 4. Form Controls: Use Obsidian API

For standard controls, use Obsidian's Setting API:

**Good (for settings.ts):**
```typescript
new Setting(containerEl)
  .setName('Auto-create folders')
  .setDesc('Create folders when you add new paths')
  .addToggle(toggle => toggle
    .setValue(this.plugin.settings.autoCreateFolders)
    .onChange(async (value) => {
      this.plugin.settings.autoCreateFolders = value;
      await this.plugin.saveSettings();
    })
  );
```

For custom modals, build with createEl + CSS:

**Good (for modals):**
```typescript
const checkboxContainer = pluginsList.createEl('div', { cls: 'checkbox-item' });
const checkbox = checkboxContainer.createEl('input', { type: 'checkbox' });
checkbox.addClass('plugin-checkbox');
const label = checkboxContainer.createEl('label', { text: 'Plugin Name' });
label.addClass('plugin-label');

checkbox.addEventListener('change', (e: Event) => {
  if ((e.target as HTMLInputElement).checked) {
    this.selectedPlugins.add(pluginId);
  }
});
```

### 5. Autocomplete/Dropdown Pattern

**Structure:**
```typescript
// Input wrapper
const wrapper = containerEl.createEl('div', { cls: 'autocomplete-wrapper' });

// Input field
const input = wrapper.createEl('input', { 
  type: 'text',
  placeholder: 'Type to search...' 
});
input.addClass('autocomplete-input');

// Suggestions container (hidden by default)
const suggestions = wrapper.createEl('div', { cls: 'autocomplete-suggestions' });
suggestions.style.display = 'none';  // ✅ Only for initial hidden state

// Input listener
input.addEventListener('input', (e: Event) => {
  const query = (e.target as HTMLInputElement).value;
  const results = this.getFuzzyMatches(query);
  
  suggestions.empty();
  suggestions.style.display = results.length > 0 ? 'block' : 'none';
  
  for (const result of results) {
    const item = suggestions.createEl('div', { 
      text: result.label,
      cls: 'suggestion-item'
    });
    item.addEventListener('click', () => {
      input.value = result.value;
      suggestions.style.display = 'none';
      this.handleSelection(result);
    });
  }
});
```

**CSS:**
```css
.autocomplete-wrapper {
  position: relative;
  width: 100%;
}

.autocomplete-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--background-modifier-border);
  border-radius: 4px;
}

.autocomplete-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--background-secondary);
  border: 1px solid var(--background-modifier-border);
  border-top: none;
  border-radius: 0 0 4px 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
}

.suggestion-item {
  padding: 0.5rem;
  cursor: pointer;
  border-bottom: 1px solid var(--background-modifier-border);
}

.suggestion-item:hover {
  background-color: var(--background-modifier-hover);
}

.suggestion-item.suggestion-create {
  font-style: italic;
  color: var(--text-muted);
}
```

### 6. Modal Structure Pattern

```typescript
export class FindReplaceModal extends Modal {
  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    
    // 1. Title
    contentEl.createEl('h2', { text: 'Update plugin paths' });
    
    // 2. Form sections with CSS
    const formContainer = contentEl.createEl('div', { cls: 'form-container' });
    
    // From section
    const fromSection = formContainer.createEl('div', { cls: 'form-section' });
    fromSection.createEl('label', { text: 'FROM path:', cls: 'form-label' });
    const fromInput = fromSection.createEl('input', { type: 'text' });
    fromInput.addClass('form-input');
    
    // To section with autocomplete
    const toSection = formContainer.createEl('div', { cls: 'form-section' });
    toSection.createEl('label', { text: 'TO path:', cls: 'form-label' });
    this.renderAutocompleteInput(toSection); // ← Separate method
    
    // Plugin checklist
    const pluginSection = formContainer.createEl('div', { cls: 'plugin-section' });
    pluginSection.createEl('h3', { text: 'Plugins to update' });
    this.renderPluginList(pluginSection); // ← Separate method
    
    // Buttons
    const buttonGroup = contentEl.createEl('div', { cls: 'button-group' });
    buttonGroup.createEl('button', { text: 'Preview' })
      .addEventListener('click', () => this.preview());
    buttonGroup.createEl('button', { text: 'Cancel' })
      .addEventListener('click', () => this.close());
    buttonGroup.createEl('button', { text: 'Apply' })
      .addEventListener('click', () => this.apply());
  }
  
  private renderAutocompleteInput(parent: HTMLElement): void {
    // Separate method keeps onOpen clean
  }
  
  private renderPluginList(parent: HTMLElement): void {
    // Separate method keeps onOpen clean
  }
}
```

**CSS for modal:**
```css
.form-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin: 1rem 0;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
  color: var(--text-normal);
}

.form-input {
  padding: 0.5rem;
  border: 1px solid var(--background-modifier-border);
  border-radius: 4px;
  background-color: var(--background-modifier-form-field);
  color: var(--text-normal);
}

.form-input:focus {
  outline: 1px solid var(--interactive-accent);
  background-color: var(--background-primary);
}

.plugin-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.plugin-section h3 {
  margin: 0;
  font-size: 1rem;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
}

.button-group button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--background-modifier-border);
  border-radius: 4px;
  background-color: var(--interactive-normal);
  color: var(--text-normal);
  cursor: pointer;
  transition: background-color 0.2s;
}

.button-group button:hover {
  background-color: var(--interactive-hover);
}

.button-group button.mod-cta {
  background-color: var(--interactive-accent);
  color: var(--text-on-accent);
}

.button-group button.mod-cta:hover {
  background-color: var(--interactive-accent-hover);
}
```

## Rules for This Plugin

### Modal Files (findReplaceModal.ts, previewModal.ts)

✅ **DO:**
- Use `contentEl.createEl(type, { cls: 'class-name' })`
- Define all styling in styles.css
- Use CSS variables for colors
- Separate UI render methods for clarity
- Use semantic class names

❌ **DON'T:**
- Set `element.style.*` properties
- Use hardcoded colors (#fff, #000)
- Put styles in TypeScript
- Mix styling with logic

### CSS Class Naming

Use BEM-like naming for clarity:

```css
/* Block: component name */
.find-replace-modal { }
.preview-modal { }

/* Element: parts of component */
.find-replace-modal__input { }
.find-replace-modal__button { }

/* OR simpler: component-part */
.form-input { }
.form-section { }
.button-group { }
```

## Testing Modal Styling

1. **Light theme:** Obsidian Settings → Appearance → Light
2. **Dark theme:** Obsidian Settings → Appearance → Dark (Obsidian)
3. **High contrast:** Test with other community themes
4. All text readable
5. All buttons clickable
6. All inputs accessible
7. No style "leaking" to vault content

## Common Mistakes to Avoid

| Mistake | Why Bad | Fix |
|---------|---------|-----|
| `el.style.color = '#fff'` | Breaks dark mode | Use `var(--text-normal)` |
| `el.style.display = 'flex'` | ESLint error | Use CSS class |
| Hardcoded colors | Won't theme | Use CSS variables |
| All code in onOpen() | Hard to read | Use separate render methods |
| Mixing JS + CSS logic | Maintenance nightmare | All styling in CSS |

## Related Files

- `styles.css` — All CSS definitions
- `src/modals/*.ts` — Modal implementations
- `src/settings.ts` — Settings tab (uses Setting API)
- `eslint.config.mts` — ESLint config

---

**Last Updated:** 2026-05-26  
**Motivation:** MVP modals had 40+ inline style violations; moving all styling to CSS
