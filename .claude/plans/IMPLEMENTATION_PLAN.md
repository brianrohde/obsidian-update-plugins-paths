# Implementation Plan: Obsidian Update Plugins Paths

## Overview

This document outlines the phased approach to building the "Update Plugins Paths" plugin, with detailed technical specifications for Phase 1 (MVP).

## Phase 1: MVP - Core Plugin Discovery & Path Replacement (Layer A)

### Goals
- Scan all installed plugins (core + community) for path-related settings
- Provide intelligent UI for finding and replacing paths
- Safe apply with preview and selective enable/disable per plugin
- Automatic backup on apply

### Technical Architecture

#### 1. Plugin Registry System

**Purpose:** Curated mapping of known plugins → their path-related settings

**Implementation:**
```typescript
interface PluginPathMapping {
  id: string;
  name: string;
  pathFields: string[];  // e.g., ["folder", "baseFolder", "templates_folder"]
  type: 'core' | 'community';
}

interface PluginRegistry {
  core: PluginPathMapping[];
  community: PluginPathMapping[];
}

// New file: src/pluginRegistry.ts
export const PLUGIN_REGISTRY: PluginRegistry = {
  core: [
    { id: 'daily-notes', name: 'Daily Notes', pathFields: ['folder'], type: 'core' },
    { id: 'file-explorer', name: 'File Explorer', pathFields: [], type: 'core' },
    // ... more core plugins
  ],
  community: [
    { id: 'dataview', name: 'Dataview', pathFields: ['folder', 'indexFolder'], type: 'community' },
    { id: 'templater', name: 'Templater', pathFields: ['templates_folder'], type: 'community' },
    // ... more community plugins
  ]
};
```

**Maintenance:**
- Start with 10-15 most common plugins
- Add new ones as issues/PRs come in
- User can extend via settings (see "Custom Mappings" below)

#### 2. Vault Folder Scanner

**Purpose:** Build real-time index of vault's folder structure for autocomplete

**Implementation:**
```typescript
// New file: src/vaultScanner.ts
export class VaultScanner {
  private vaultFolders: string[] = [];
  private plugin: MyPlugin;

  constructor(plugin: MyPlugin) {
    this.plugin = plugin;
  }

  // Scan on load + on-demand
  async scanVault(includeHidden: boolean = false): Promise<void> {
    const root = this.plugin.app.vault.getRoot();
    this.vaultFolders = await this.recursiveGetFolders(root, includeHidden);
  }

  private async recursiveGetFolders(folder: TFolder, includeHidden: boolean): Promise<string[]> {
    const paths: string[] = [];
    const skip = ['.obsidian', '.git'];

    for (const child of folder.children) {
      if (child instanceof TFolder) {
        const name = child.name;
        if (includeHidden || !skip.includes(name)) {
          paths.push(child.path);  // Relative path
          paths.push(...await this.recursiveGetFolders(child, includeHidden));
        }
      }
    }
    return paths;
  }

  getFolders(): string[] {
    return this.vaultFolders;
  }
}
```

**Integration:**
- Call `scanVault()` in `plugin.onload()`
- Provide refresh button in UI to re-scan on demand
- Cache result in memory until refresh

#### 3. Plugin Data Scanner

**Purpose:** Read plugin data.json files and detect path values

**Implementation:**
```typescript
// New file: src/pluginDataScanner.ts
export interface PluginDataWithPaths {
  id: string;
  name: string;
  registryMatch?: PluginPathMapping;
  detectedSettings: {
    [fieldName: string]: string;  // Path values found
  };
}

export class PluginDataScanner {
  private plugin: MyPlugin;

  async scanAllPlugins(): Promise<PluginDataWithPaths[]> {
    const pluginsDir = `.obsidian/plugins`;
    const pluginDirs = await this.plugin.app.vault.adapter.list(pluginsDir);
    
    const results: PluginDataWithPaths[] = [];

    for (const dir of pluginDirs.folders) {
      const pluginId = dir.split('/').pop();
      if (!pluginId) continue;

      const dataFile = `${dir}/data.json`;
      try {
        const dataContent = await this.plugin.app.vault.adapter.read(dataFile);
        const data = JSON.parse(dataContent);

        const result = await this.analyzePluginData(pluginId, data);
        results.push(result);
      } catch (e) {
        // Plugin has no data.json or can't parse — skip
      }
    }

    return results;
  }

  private async analyzePluginData(
    pluginId: string,
    data: Record<string, any>
  ): Promise<PluginDataWithPaths> {
    // Step 1: Check manual registry
    const registryMatch = this.findInRegistry(pluginId);
    const detected: Record<string, string> = {};

    if (registryMatch) {
      // Extract known path fields
      for (const field of registryMatch.pathFields) {
        if (typeof data[field] === 'string' && data[field].length > 0) {
          detected[field] = data[field];
        }
      }
    }

    // Step 2: Heuristic scan for path-like patterns
    const heuristic = this.heuristicScan(data);
    for (const [key, value] of Object.entries(heuristic)) {
      if (!detected[key]) {
        detected[key] = value;
      }
    }

    return {
      id: pluginId,
      name: registryMatch?.name || pluginId,
      registryMatch,
      detectedSettings: detected
    };
  }

  private heuristicScan(data: Record<string, any>): Record<string, string> {
    const pathLikePattern = /\//;  // Contains forward slash
    const detected: Record<string, string> = {};

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && pathLikePattern.test(value)) {
        // Likely a path — flag it
        detected[key] = value;
      }
    }

    return detected;
  }

  private findInRegistry(pluginId: string): PluginPathMapping | undefined {
    const { PLUGIN_REGISTRY } = require('./pluginRegistry');
    return [
      ...PLUGIN_REGISTRY.core,
      ...PLUGIN_REGISTRY.community
    ].find(p => p.id === pluginId);
  }
}
```

#### 4. Path Autocomplete System

**Purpose:** Provide fuzzy-matched folder suggestions as user types

**Implementation:**
```typescript
// New file: src/pathAutocomplete.ts
export class PathAutocomplete {
  private vaultScanner: VaultScanner;
  private showHidden: boolean = false;

  constructor(vaultScanner: VaultScanner) {
    this.vaultScanner = vaultScanner;
  }

  getSuggestions(query: string, createOption: boolean = true): PathSuggestion[] {
    const folders = this.vaultScanner.getFolders();
    const matches = this.fuzzyMatch(query, folders);

    const suggestions: PathSuggestion[] = matches.map(path => ({
      type: 'existing',
      path,
      relativeFormat: path,
      absoluteFormat: this.toAbsolute(path)
    }));

    // Add "create new" option if query doesn't match exactly
    if (createOption && query.length > 0 && !matches.includes(query)) {
      suggestions.push({
        type: 'create',
        path: query,
        relativeFormat: query,
        absoluteFormat: this.toAbsolute(query)
      });
    }

    return suggestions;
  }

  private fuzzyMatch(query: string, paths: string[]): string[] {
    const lower = query.toLowerCase();

    const exact = paths.filter(p => p.toLowerCase() === lower);
    const contains = paths.filter(
      p => p.toLowerCase().includes(lower) && !exact.includes(p)
    );
    const fuzzy = paths.filter(
      p => this.fuzzyScore(lower, p) > 0 && !exact.includes(p) && !contains.includes(p)
    );

    // Sort by relevance
    contains.sort((a, b) => a.indexOf(query) - b.indexOf(query));
    fuzzy.sort((a, b) => this.fuzzyScore(lower, b) - this.fuzzyScore(lower, a));

    return [...exact, ...contains, ...fuzzy];
  }

  private fuzzyScore(query: string, text: string): number {
    // Simple fuzzy score: sum of character position distances
    let score = 0;
    let lastIndex = 0;

    for (const char of query) {
      const index = text.toLowerCase().indexOf(char, lastIndex);
      if (index === -1) return 0;
      score += index - lastIndex;
      lastIndex = index + 1;
    }

    return 100 - score;  // Higher score = better match
  }

  private toAbsolute(relativePath: string): string {
    // Assuming vault root is vault's base dir
    return `/${relativePath}`;
  }
}

interface PathSuggestion {
  type: 'existing' | 'create';
  path: string;
  relativeFormat: string;
  absoluteFormat: string;
}
```

#### 5. Find/Replace Modal UI

**Purpose:** Central UI for entering find/replace paths and selecting plugins

**Implementation:**
```typescript
// New file: src/modals/FindReplaceModal.ts
export class FindReplaceModal extends Modal {
  private fromPath: string = '';
  private toPath: string = '';
  private selectedPlugins: Set<string> = new Set();
  private allPlugins: PluginDataWithPaths[] = [];
  private pathAutocomplete: PathAutocomplete;

  async open() {
    super.open();
    this.allPlugins = await this.scanPlugins();
    this.render();
  }

  private render() {
    const { contentEl } = this;
    contentEl.empty();

    // Find path input with autocomplete
    contentEl.createEl('label', { text: 'FROM (current path):' });
    const fromInput = contentEl.createEl('input', {
      type: 'text',
      placeholder: '/old/vault/path'
    });
    const fromSuggestions = contentEl.createEl('div', { cls: 'autocomplete-list' });

    fromInput.addEventListener('input', (e) => {
      this.fromPath = (e.target as HTMLInputElement).value;
      this.updateAutocomplete(fromSuggestions, this.fromPath);
    });

    // To path input with autocomplete
    contentEl.createEl('label', { text: 'TO (new path):' });
    const toInput = contentEl.createEl('input', {
      type: 'text',
      placeholder: '/new/vault/path'
    });
    const toSuggestions = contentEl.createEl('div', { cls: 'autocomplete-list' });

    toInput.addEventListener('input', (e) => {
      this.toPath = (e.target as HTMLInputElement).value;
      this.updateAutocomplete(toSuggestions, this.toPath);
    });

    // Plugin selection checkboxes
    contentEl.createEl('h3', { text: 'Plugins to update:' });
    const pluginsList = contentEl.createEl('div');

    for (const plugin of this.allPlugins) {
      if (Object.keys(plugin.detectedSettings).length === 0) continue;

      const label = pluginsList.createEl('label');
      const checkbox = label.createEl('input', { type: 'checkbox' });
      checkbox.checked = false;
      checkbox.addEventListener('change', (e) => {
        if ((e.target as HTMLInputElement).checked) {
          this.selectedPlugins.add(plugin.id);
        } else {
          this.selectedPlugins.delete(plugin.id);
        }
      });

      label.createEl('span', {
        text: `${plugin.name} (${Object.keys(plugin.detectedSettings).length} path settings)`
      });
    }

    // Preview, Cancel, Apply buttons
    const buttonGroup = contentEl.createEl('div', { cls: 'button-group' });
    buttonGroup.createEl('button', { text: 'Preview' })
      .addEventListener('click', () => this.preview());
    buttonGroup.createEl('button', { text: 'Cancel' })
      .addEventListener('click', () => this.close());
    buttonGroup.createEl('button', { text: 'Apply', cls: 'mod-cta' })
      .addEventListener('click', () => this.apply());
  }

  private updateAutocomplete(container: HTMLElement, query: string) {
    container.empty();
    const suggestions = this.pathAutocomplete.getSuggestions(query);

    for (const suggestion of suggestions.slice(0, 5)) {
      const item = container.createEl('div', {
        cls: `autocomplete-item ${suggestion.type}`,
        text: suggestion.relativeFormat
      });
      item.addEventListener('click', () => {
        // Update the input field
      });
    }
  }

  private async preview() {
    // Show modal with JSON diffs
    new PreviewModal(this.app, this.selectedPlugins, this.fromPath, this.toPath).open();
  }

  private async apply() {
    // Apply changes and create backup
    // ...
  }
}
```

#### 6. Preview Modal

**Purpose:** Show before/after JSON diffs before applying changes

**Implementation:**
```typescript
// New file: src/modals/PreviewModal.ts
export class PreviewModal extends Modal {
  async open() {
    super.open();
    const { contentEl } = this;

    for (const pluginId of this.selectedPlugins) {
      const before = await this.getPluginDataBefore(pluginId);
      const after = this.getPluginDataAfter(before);

      const section = contentEl.createEl('div', { cls: 'preview-section' });
      section.createEl('h3', { text: pluginId });
      
      const diff = section.createEl('pre', { cls: 'preview-diff' });
      diff.setText(this.jsonDiff(before, after));
    }

    contentEl.createEl('button', { text: 'Confirm & Apply' })
      .addEventListener('click', () => this.apply());
  }

  private jsonDiff(before: object, after: object): string {
    // Generate readable diff (could use a lib like diff-match-patch)
    return JSON.stringify({ before, after }, null, 2);
  }
}
```

#### 7. Apply & Backup System

**Purpose:** Safely apply changes with automatic backup

**Implementation:**
```typescript
// New file: src/applyChanges.ts
export class ApplyChangesManager {
  private plugin: MyPlugin;

  async applyChanges(
    selectedPlugins: Set<string>,
    fromPath: string,
    toPath: string
  ): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `.obsidian/plugin-configs-backup-${timestamp}.json`;

    // Step 1: Create backup of all affected plugin data files
    const backup: Record<string, any> = {};
    for (const pluginId of selectedPlugins) {
      const dataFile = `.obsidian/plugins/${pluginId}/data.json`;
      try {
        const content = await this.plugin.app.vault.adapter.read(dataFile);
        backup[pluginId] = JSON.parse(content);
      } catch (e) {
        // Skip if can't read
      }
    }

    // Write backup
    await this.plugin.app.vault.adapter.write(
      backupPath,
      JSON.stringify(backup, null, 2)
    );

    // Step 2: Apply find/replace to each plugin
    for (const pluginId of selectedPlugins) {
      const dataFile = `.obsidian/plugins/${pluginId}/data.json`;
      try {
        const content = await this.plugin.app.vault.adapter.read(dataFile);
        let data = JSON.parse(content);

        // Recursively replace paths
        data = this.replaceInObject(data, fromPath, toPath);

        await this.plugin.app.vault.adapter.write(
          dataFile,
          JSON.stringify(data, null, 2)
        );
      } catch (e) {
        console.error(`Failed to update ${pluginId}:`, e);
      }
    }

    new Notice(`✓ Updated ${selectedPlugins.size} plugins. Backup saved.`);
  }

  private replaceInObject(obj: any, fromPath: string, toPath: string): any {
    if (typeof obj === 'string') {
      return obj === fromPath ? toPath : obj;
    }
    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        return obj.map(item => this.replaceInObject(item, fromPath, toPath));
      } else {
        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = this.replaceInObject(value, fromPath, toPath);
        }
        return result;
      }
    }
    return obj;
  }
}
```

### 2. Settings Tab Extensions

**Purpose:** Allow users to customize registry and autocomplete behavior

**Implementation:** Extend `src/settings.ts`

```typescript
export interface MyPluginSettings {
  showHiddenFolders: boolean;
  pathFormat: 'relative' | 'absolute';
  autoCreateFolders: boolean;
  customPathMappings: {
    [pluginId: string]: string[];  // Custom fields for each plugin
  };
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
  showHiddenFolders: false,
  pathFormat: 'relative',
  autoCreateFolders: true,
  customPathMappings: {}
};

// In SampleSettingTab.display():
new Setting(containerEl)
  .setName('Show hidden folders in autocomplete')
  .setDesc('Include .obsidian, .git folders')
  .addToggle(toggle => toggle
    .setValue(this.plugin.settings.showHiddenFolders)
    .onChange(async (value) => {
      this.plugin.settings.showHiddenFolders = value;
      await this.plugin.saveSettings();
    })
  );

// ... similar for other settings
```

### 3. Commands & Ribbon Icon

**Purpose:** Expose the find/replace UI to users

**Implementation:** In `src/main.ts`

```typescript
export default class MyPlugin extends Plugin {
  async onload() {
    await this.loadSettings();

    // Ribbon icon
    this.addRibbonIcon('refresh-cw', 'Update Plugins Paths', () => {
      new FindReplaceModal(this.app, this).open();
    });

    // Command
    this.addCommand({
      id: 'update-plugins-paths',
      name: 'Update Plugin Paths',
      callback: () => {
        new FindReplaceModal(this.app, this).open();
      }
    });

    // On load: scan vault for autocomplete cache
    this.vaultScanner = new VaultScanner(this);
    await this.vaultScanner.scanVault(this.settings.showHiddenFolders);
  }
}
```

---

## Phase 2: Source Code Path Scanning (Layer B)

Scan plugin `main.js` files for hardcoded path strings and offer find/replace options.

**Approach:**
- Regex patterns to detect path assignments
- Similar UI to Phase 1 but with warnings (changes require plugin rebuild)

---

## Phase 3: Vault Content Path Fixing (Layer C)

Bulk find/replace broken links and image references in vault notes.

**Approach:**
- Iterate over all `.md` files
- Update wiki links `[[old/path|alias]]` → `[[new/path|alias]]`
- Update image embeds `![alt](old/path.png)` → `![alt](new/path.png)`
- Preview before apply

---

## Testing Strategy

### Manual Testing

1. Create test vault with plugins + test folder structure
2. Test each major feature:
   - Plugin discovery (registry + heuristic)
   - Autocomplete fuzzy matching
   - Find/replace with preview
   - Backup creation and verification

### Automated Tests (Future)

- Unit tests for VaultScanner, PathAutocomplete, fuzzy matching
- Integration tests for PluginDataScanner

---

## File Structure (Phase 1)

```
src/
  main.ts                    (entry point, commands, ribbon)
  settings.ts                (settings tab)
  pluginRegistry.ts          (manual plugin registry)
  vaultScanner.ts            (scan vault folders)
  pluginDataScanner.ts       (scan plugin data.json files)
  pathAutocomplete.ts        (fuzzy matching)
  applyChanges.ts            (apply + backup)
  modals/
    findReplaceModal.ts      (main UI)
    previewModal.ts          (diff preview)
styles.css                   (UI styling)
```

---

## Timeline & Milestones

- **Week 1:** Plugin registry + vault scanner + basic plugin data scanner
- **Week 2:** Path autocomplete + fuzzy matching
- **Week 3:** Find/replace modal UI
- **Week 4:** Preview modal + apply/backup system
- **Week 5:** Settings tab + testing + polish

---

## Notes & Decisions

- **Path format:** Relative by default (more portable), absolute as option
- **Auto-create:** Enabled by default but user can skip
- **Backup:** Always created, users can manage manually in vault
- **Registry:** Start small, grow based on user feedback
