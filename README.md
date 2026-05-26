# Obsidian Update Plugins Paths

A powerful Obsidian plugin that helps users bulk-update hardcoded folder and file path references across all installed plugins when their vault structure changes.

## Problem

When you reorganize your Obsidian vault (move folders, rename directories, restructure your layout), many community plugins break because they store hardcoded path references in their configuration files. Instead of manually updating each plugin's settings one by one, this plugin lets you find and replace paths across multiple plugins at once.

## Features

### Phase 1 (MVP)

- **Plugin Discovery** — Scans all installed core and community plugins for path-related settings
  - Manual registry of known plugins and their path fields
  - Heuristic scanning to detect path-like patterns in plugin configs
  - User can manually add custom path field mappings
  
- **Intelligent Path Autocomplete** — As you type the new path, get real-time suggestions
  - Fuzzy match against existing folders in your vault
  - Shows relative paths by default (toggle to absolute)
  - Option to create brand new paths
  - Auto-creates the folder when confirmed (with option to skip)
  
- **Preview & Selective Apply** — Review changes before committing
  - See a preview of all JSON changes across plugins
  - Enable/disable which plugins get updated via checkboxes
  - Automatic backup created before applying
  - Cancel anytime

### Phase 2 (Planned)

- Scan and update hardcoded paths in plugin source code (`main.js`)

### Phase 3 (Planned)

- Bulk find/replace broken links and image paths in vault notes

## Installation

### Community Plugins

Once released, install from Obsidian's community plugins browser:
1. Open Settings → Community plugins → Browse
2. Search for "Update Plugins Paths"
3. Install and enable

### Manual Installation (Development)

1. Clone this repo into your vault: `.obsidian/plugins/obsidian-update-plugins-paths/`
2. Run `npm i` to install dependencies
3. Run `npm run dev` to compile
4. In Obsidian, enable the plugin in Settings → Community plugins

## How to Use

1. Open the command palette and search for "Update Plugins Paths" (or click the ribbon icon)
2. The plugin scans your installed plugins and displays detected path settings
3. Enter the old path you want to replace (autocomplete helps find existing folders)
4. Enter the new path you want to replace it with (autocomplete suggests matching folders)
5. Review the list of plugins that will be updated — toggle each one on/off as needed
6. Click "Preview" to see exactly what will change
7. Click "Apply" to update all selected plugins
8. A backup is automatically created at `.obsidian/plugin-configs-backup-[timestamp].json`

## Configuration

Plugin settings include:

- **Show Hidden Folders in Autocomplete** — Toggle visibility of `.obsidian`, `.git`, etc. (off by default)
- **Path Format** — Choose relative (default) or absolute paths
- **Auto-create Folders** — Automatically create new folders when you add a new path (on by default)

## Plugin Registry

The plugin includes a curated registry of known Obsidian plugins and their path-related settings:

- Dataview, Templater, Daily Notes, Obsidian Git, Excalibrain, Breadcrumbs, etc.

The registry is designed to be extended as new plugins are discovered. User-added custom path mappings are persisted across sessions.

## Safety

- **Backup on Apply** — An automatic backup of all affected plugin configs is created before any changes
- **Preview Mode** — Always review what will change before applying
- **Selective Enable/Disable** — Choose exactly which plugins get updated
- **No Vault Content Changes (Phase 1)** — Only affects plugin configuration, not your actual notes

## Development

### Setup

```bash
npm i              # Install dependencies
npm run dev        # Watch mode (auto-compile on changes)
npm run build      # Production build
npm run lint       # Run ESLint
```

### Project Structure

- `src/main.ts` — Main plugin entry point
- `src/settings.ts` — Settings tab UI
- `manifest.json` — Plugin metadata
- `esbuild.config.mjs` — Build configuration
- `eslint.config.mts` — Linting rules

### Plugin Registration

To add a new plugin to the manual registry, edit the registry file (TBD) and add:

```json
{
  "id": "plugin-id",
  "name": "Plugin Name",
  "pathFields": ["field1", "field2"]
}
```

### Roadmap

1. **Phase 1 (MVP)** — Plugin discovery + path autocomplete + find/replace
2. **Phase 2** — Source code path scanning (main.js)
3. **Phase 3** — Vault note link/reference fixing

## Contributing

Contributions welcome! Please:

1. Test in development mode (`npm run dev`)
2. Ensure linting passes (`npm run lint`)
3. For new plugins in the registry, verify path field names are correct

## License

BSD 0-Clause (See LICENSE file)

## Support

For issues, feature requests, or plugin registry additions, please open an issue on GitHub.

---

Made with ❤️ for Obsidian users who reorganize their vaults


# Project Tree
```
obsidian-update-plugins-paths
├─ .editorconfig
├─ .npmrc
├─ AGENTS.md
├─ LICENSE
├─ esbuild.config.mjs
├─ eslint.config.mts
├─ manifest.json
├─ package-lock.json
├─ package.json
├─ src
│  ├─ main.ts
│  └─ settings.ts
├─ styles.css
├─ tsconfig.json
├─ version-bump.mjs
├─ versions.json
├─ CLAUDE.md
├─ README.md
└─ IMPLEMENTATION_PLAN.md

```