# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Plugin Overview

**Obsidian Update Plugins Paths** is a community plugin for Obsidian that helps users bulk-update hardcoded folder and file paths across all installed plugins when their vault structure changes. It scans plugin configuration files (`.obsidian/plugins/*/data.json`), provides intelligent path discovery with fuzzy autocomplete, and allows users to find-and-replace paths across multiple plugins simultaneously with preview and selective enable/disable.

## Core Development Commands

```bash
# Install dependencies
npm i

# Development mode (watch compilation, auto-rebuild on changes)
npm run dev

# Build for production (minified, no source maps)
npm run build

# Lint code (TypeScript + Obsidian-specific rules)
npm run lint

# Bump version (use after updating minAppVersion in manifest.json)
npm version patch|minor|major
```

## Architecture

### High-Level Flow

1. **Plugin Load** (`src/main.ts` - `onload()`)
   - Vault folder structure is scanned on load
   - Manual registry of known plugins is initialized
   - Event listeners registered for UI interactions

2. **Discovery System** (Planned - Phase 1)
   - Scan all `.obsidian/plugins/*/data.json` files
   - Match against manual registry (known plugin path fields)
   - Fallback to heuristic matching (detect path-like patterns)
   - Merge results for user review

3. **Path Autocomplete** (Planned - Phase 1)
   - Vault folder structure cached from `app.vault.adapter`
   - Fuzzy matching on user input (real-time)
   - Surface existing folders + option to create new paths
   - Relative paths by default (absolute as toggle option)

4. **Find/Replace & Apply** (Planned - Phase 1)
   - Preview mode shows JSON diffs before commit
   - User selects which plugins to update via checkboxes
   - Automatic backup created before writing changes
   - Apply updates to plugin data.json files

### Key Files

- **`src/main.ts`** — Main plugin class, entry point, command registration, lifecycle hooks
- **`src/settings.ts`** — Plugin settings interface and settings tab UI
- **`manifest.json`** — Plugin metadata (id, name, version, minAppVersion)
- **`esbuild.config.mjs`** — Build configuration (bundles TypeScript → main.js, externals Obsidian API)
- **`eslint.config.mts`** — Linting config (TypeScript + Obsidian plugin rules)

### Build Pipeline

TypeScript → esbuild (bundles, minifies in prod) → `main.js` + `styles.css` + `manifest.json` → Obsidian plugin

- Dev mode: Inline source maps, watch mode, no minification
- Prod mode: Minified, no source maps
- External dependencies: `obsidian`, `electron`, CodeMirror, Lezer (provided by Obsidian at runtime)

## Obsidian Plugin Specifics

- **Plugin ID:** Must match id in `manifest.json` (currently `update-plugins-paths`)
- **Settings persistence:** Use `this.loadData()` / `this.saveData()` for plugin-scoped storage
- **Vault access:** `this.app.vault` provides access to vault structure and file system
- **UI components:** Use Obsidian's built-in Setting, Modal, Notice, etc. from `obsidian` package
- **Min version:** Update `minAppVersion` in `manifest.json` when using new Obsidian API features

## ESLint & Code Quality Rules

**CRITICAL:** This project is subject to `eslint-plugin-obsidianmd` rules. Before committing:

```bash
npm run lint  # Must pass with 0 errors
```

See [.claude/rules/README.md](.claude/rules/README.md) for detailed rules:

- **OPE-001:** [[OBSIDIAN_PLUGIN_ESLINT_VIOLATIONS]] — Console.log, inline styles, sentence case, unused imports
- **OMS-001:** [[OBSIDIAN_MODAL_STRUCTURE]] — Modal styling patterns, CSS variables, component structure

Key rules:
- ❌ Never use `element.style.*` — use CSS classes instead
- ❌ Never `console.log()` — use `console.debug()`, `console.warn()`, or `console.error()`
- ❌ Never include plugin ID in command IDs (Obsidian adds it automatically)
- ✅ All UI text must be sentence case, not Title Case
- ✅ All colors must use CSS variables (`var(--text-normal)`, etc.)
- ✅ All styling must be in `styles.css`, never inline

## Roadmap (Planned Phases)

**Phase 1 (MVP - Layer A):**
- Plugin discovery (manual registry + heuristic scan)
- Path autocomplete with fuzzy matching
- Find/replace dialog with checkboxes
- Preview changes before apply
- Backup mechanism

**Phase 2 (Layer B):**
- Scan and update hardcoded paths in plugin source code (`main.js`)

**Phase 3 (Layer C):**
- Bulk find/replace in vault notes (fix broken links, embeds, image references)

## Configuration & Discovery

### Manual Plugin Registry (Planned)

A curated list of known plugins and their path-related settings. Lives in code or as config file:

```json
{
  "core-plugins": [
    {"id": "daily-notes", "name": "Daily Notes", "pathFields": ["folder"]},
    {"id": "file-explorer", "name": "File Explorer", "pathFields": []}
  ],
  "community-plugins": [
    {"id": "dataview", "name": "Dataview", "pathFields": ["folder", "indexFolder"]},
    {"id": "templater", "name": "Templater", "pathFields": ["templates_folder"]}
  ]
}
```

### Path Autocomplete Behavior (Planned)

- Scans vault on load + on-demand with refresh button
- Fuzzy matches user input against existing folders
- Shows relative paths by default (toggle to absolute)
- Automatically creates new folder when user confirms
- Hides `.obsidian`, `.git` by default (optional toggle to show)

## Testing & QA

- No existing test suite; add tests as features are implemented
- Manual testing in Obsidian dev environment recommended
- Build must pass `npm run lint` before commit
- CI runs lint on all branches (GitHub Actions)

## Common Tasks

**Modify settings interface:** Edit `src/settings.ts` → `SampleSettingTab.display()`

**Add new commands:** In `src/main.ts` → `this.addCommand({...})`

**Access vault structure:** Use `this.app.vault.getRoot()`, `app.vault.adapter` for file system operations

**Read plugin data files:** Parse `.obsidian/plugins/[plugin-id]/data.json` with `app.vault.adapter.read()`

## Notes for Future Work

- Plugin ID and name in `manifest.json` need to be updated to reflect the actual plugin purpose
- Consider where to store and version the plugin registry (code vs. external config)
- Path creation behavior needs decision: should new paths auto-create folders or just allow the reference?
- Backup format and restore mechanism should be designed early
