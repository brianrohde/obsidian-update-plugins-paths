# Testing Guide: Update Plugins Paths MVP

## Quick Start

### 1. Build the Plugin

```bash
npm run build    # Production build
# or
npm run dev      # Watch mode (auto-recompiles on file changes)
```

Output files:
- `main.js` — Compiled plugin
- `manifest.json` — Plugin metadata
- `styles.css` — Plugin styles

### 2. Install in Obsidian Dev Vault

There are two ways to test:

#### Option A: Direct File Copy (Recommended for MVP Testing)

1. **Create a test vault** in Obsidian (File → New vault)
2. **Copy plugin files** to `.obsidian/plugins/update-plugins-paths/`:
   ```bash
   # From Windows PowerShell or CMD
   mkdir path\to\vault\.obsidian\plugins\update-plugins-paths
   copy main.js path\to\vault\.obsidian\plugins\update-plugins-paths\
   copy manifest.json path\to\vault\.obsidian\plugins\update-plugins-paths\
   copy styles.css path\to\vault\.obsidian\plugins\update-plugins-paths\
   ```

3. **Enable the plugin**:
   - Open Obsidian settings
   - Go to Community plugins (or Plugins if it's in that section)
   - Find "Update Plugins Paths" and toggle it on
   - You should see a refresh icon in the left ribbon

#### Option B: Symlink (For Live Development)

If you want live reloading as you change code:

```powershell
# PowerShell (run as admin)
New-Item -ItemType SymbolicLink `
  -Path "C:\Users\YourName\AppData\Roaming\Obsidian\Obsidian\update-plugins-paths" `
  -Target "Z:\_dev-ssd\obsidian-update-plugins-paths"
```

Then run `npm run dev` and Obsidian will auto-reload changes.

---

## MVP Testing Checklist

### Phase 1: Plugin Loads Correctly

- [ ] Obsidian recognizes the plugin
- [ ] Plugin appears in Community plugins list
- [ ] Can enable/disable without errors
- [ ] Refresh icon appears in left ribbon
- [ ] Command "Update Plugin Paths" appears in command palette
- [ ] Check browser console for errors: Settings → Help → Show debug info → toggle console

### Phase 2: Plugin Initialization

- [ ] Plugin logs to console: `[Update Plugins Paths] Scanned X folders`
- [ ] Vault folders are detected correctly
  - Create test folders: `templates/`, `projects/`, `archive/`
  - Check console for folder count
- [ ] Plugin data scanner finds plugin settings
  - Test with a community plugin that has path settings (Templater, Dataview, etc.)
  - Check console output

### Phase 3: UI Opening

- [ ] Click ribbon icon → "Update Plugin Paths" modal opens
- [ ] Command palette: Search "Update Plugin Paths" → opens modal
- [ ] Modal shows:
  - "FROM (current path)" input field
  - "TO (new path)" input field with autocomplete
  - List of detected plugins with checkboxes
  - Preview, Cancel, Apply buttons

### Phase 4: Autocomplete Testing

**Setup:** Create test folder structure:
```
vault/
├─ templates/
├─ daily-notes/
├─ archive/
│  └─ old-templates/
└─ projects/
```

**Tests:**
- [ ] Type "temp" in TO field → suggests "templates", "old-templates"
- [ ] Type "arch" → suggests "archive", "archive/old-templates"
- [ ] Type exact folder name → shows as first result
- [ ] Type non-existent folder → shows "+ Create new path: your-path"
- [ ] Click on suggestion → fills field with path
- [ ] Paths show in relative format by default

### Phase 5: Plugin Detection

**Setup:** Install a real community plugin with path settings:
- Templater (has `templates_folder` setting)
- Dataview (has `folder` setting)
- Daily Notes (has `folder` setting)

**Tests:**
- [ ] Open "Update Plugin Paths" modal
- [ ] Modal shows detected plugins in the list
- [ ] Plugin names match registry (e.g., "Templater", "Dataview")
- [ ] Shows correct number of path settings per plugin
- [ ] Checkboxes default to unchecked

### Phase 6: Find/Replace Workflow

**Test Case:** Rename a folder used by Templater

**Setup:**
- Install Templater plugin
- Set it to use `templates` folder
- Create `templates/` folder in vault

**Steps:**
1. Open "Update Plugin Paths"
2. FROM: `templates`
3. TO: `my-templates` (or use autocomplete)
4. Check "Templater" checkbox
5. Click "Preview"
   - [ ] Preview modal opens
   - [ ] Shows before/after JSON diff
   - [ ] FROM path highlighted in red
   - [ ] TO path highlighted in green
6. Click "Confirm & Apply"
   - [ ] Modal closes
   - [ ] Notice shows: "✓ Updated 1 plugins. Backup: .obsidian/plugin-configs-backup-[timestamp].json"
7. Verify in Obsidian settings:
   - [ ] Templater settings show new path: `my-templates`
8. Check backup file exists:
   - [ ] File created at `.obsidian/plugin-configs-backup-[timestamp].json`
   - [ ] Contains old config

### Phase 7: Multiple Plugin Updates

**Test Case:** Update path used by multiple plugins

**Setup:**
- Install Templater + Daily Notes (both can have path settings)
- Both use same `templates` folder
- Create `templates/` folder

**Steps:**
1. FROM: `templates`
2. TO: `vault-templates`
3. Check BOTH plugins
4. Preview → should show changes in both
5. Apply → both should update
   - [ ] Notice confirms 2 plugins updated
   - [ ] Both plugins show new path in their settings

### Phase 8: Selective Plugin Updates

- [ ] Enable plugin A, disable plugin B
- [ ] Apply changes
- [ ] Verify only plugin A was updated
- [ ] Verify plugin B's config unchanged

### Phase 9: Settings Tab

Go to Obsidian Settings → Update Plugins Paths

- [ ] "Show hidden folders" toggle works
  - When enabled, autocomplete shows `.obsidian`, `.git`
  - When disabled, they're hidden
- [ ] "Path format" dropdown:
  - [ ] Select "Relative" → autocomplete shows `folder/subfolder`
  - [ ] Select "Absolute" → autocomplete shows `/folder/subfolder`
- [ ] "Auto-create folders" toggle
  - When enabled: creating new path should create folder (Phase 2)
  - When disabled: just sets path reference

### Phase 10: Error Handling

- [ ] Close modal without selecting anything → no errors in console
- [ ] Click "Preview" without FROM/TO paths → shows notice "Please enter both FROM and TO paths"
- [ ] Click "Preview" without selecting plugins → shows notice "Please select at least one plugin"
- [ ] Try to update plugin with no write permissions → error in console, notice shown
- [ ] Invalid folder paths → handled gracefully

### Phase 11: Backup & Recovery

- [ ] Backup file is created before apply
- [ ] Backup file is valid JSON
- [ ] Can manually restore from backup by copying JSON back to plugin's data.json

---

## Console Debugging

Open Obsidian Developer Tools:

1. Settings → Help → Show debug info
2. Scroll to bottom, click "Show console in DevTools"
3. Look for logs:

```
[Update Plugins Paths] Scanned 12 folders
Found 3 plugins with path settings
```

---

## Troubleshooting

**Plugin doesn't load:**
- Check manifest.json has valid id, name, version
- Verify main.js file exists and is not empty
- Look at console for TypeScript errors

**Autocomplete doesn't show suggestions:**
- Verify folders exist in vault
- Check VaultScanner.scanVault() was called
- Manually type exact folder name to test

**Plugin settings not being updated:**
- Verify plugin's data.json path is correct
- Check backup file was created
- Look at console for file write errors
- Verify vault has write permissions

**Modal UI is broken:**
- May be CSS issue; check console for style errors
- Verify Obsidian version >= 0.15.0

---

## Performance Testing

- [ ] Plugin loads within 2 seconds
- [ ] Scanning 100+ folders still responsive
- [ ] Autocomplete returns results within 500ms
- [ ] Applying changes to 10+ plugins completes in < 5 seconds

---

## Next Steps After MVP Testing

1. Fix any bugs found during testing
2. Polish UI styling
3. Add support for Phase 2 (source code scanning)
4. Add unit tests
5. Submit to Obsidian community plugins list

---

## Test Data

### Sample Folder Structure
```
My Vault/
├─ 📁 templates
├─ 📁 daily-notes
├─ 📁 projects
│  ├─ 📁 active
│  └─ 📁 completed
├─ 📁 archive
│  └─ 📁 old-templates
└─ 📁 Reference
   └─ 📁 images
```

### Sample Plugin Config (Templater data.json)
```json
{
  "templates_folder": "templates",
  "empty_file_on_new_note": false,
  "syntax_highlighting": true
}
```

---

## Recording Issues

When filing bugs, include:
- Obsidian version
- Plugin version
- Folder structure used
- Steps to reproduce
- Console output
- Browser/OS details
