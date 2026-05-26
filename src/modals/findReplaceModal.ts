import { App, Modal, Notice, Setting } from 'obsidian';
import UpdatePluginsPathsPlugin from '../main';
import { PluginDataWithPaths } from '../pluginDataScanner';
import { PreviewModal } from './previewModal';

export class FindReplaceModal extends Modal {
	private plugin: UpdatePluginsPathsPlugin;
	private fromPath: string = '';
	private toPath: string = '';
	private selectedPlugins: Set<string> = new Set();
	private allPlugins: PluginDataWithPaths[] = [];
	private pluginCheckboxes: Map<string, HTMLInputElement> = new Map();

	constructor(app: App, plugin: UpdatePluginsPathsPlugin) {
		super(app);
		this.plugin = plugin;
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// Title
		contentEl.createEl('h2', { text: 'Update Plugin Paths' });

		// Scan plugins
		if (!this.plugin.pluginDataScanner) {
			new Notice('Plugin scanner not initialized');
			this.close();
			return;
		}

		this.allPlugins = await this.plugin.pluginDataScanner.scanAllPlugins();
		console.log(`Found ${this.allPlugins.length} plugins with path settings`);

		// FROM path section
		contentEl.createEl('label', { text: 'FROM (current path):', cls: 'setting-label' });
		const fromInput = contentEl.createEl('input', {
			type: 'text',
			placeholder: 'e.g. old/vault/path'
		});
		fromInput.style.width = '100%';
		fromInput.style.marginBottom = '1rem';
		fromInput.addEventListener('input', (e: Event) => {
			this.fromPath = (e.target as HTMLInputElement).value;
		});

		// TO path section with autocomplete
		contentEl.createEl('label', { text: 'TO (new path):', cls: 'setting-label' });
		const toInputWrapper = contentEl.createEl('div', { cls: 'autocomplete-wrapper' });
		const toInput = toInputWrapper.createEl('input', {
			type: 'text',
			placeholder: 'e.g. new/vault/path'
		});
		toInput.style.width = '100%';
		toInput.style.marginBottom = '0.5rem';

		const suggestionsEl = toInputWrapper.createEl('div', { cls: 'autocomplete-suggestions' });
		suggestionsEl.style.maxHeight = '200px';
		suggestionsEl.style.overflowY = 'auto';
		suggestionsEl.style.border = '1px solid var(--background-modifier-border)';
		suggestionsEl.style.borderRadius = '4px';
		suggestionsEl.style.display = 'none';

		toInput.addEventListener('input', (e: Event) => {
			const query = (e.target as HTMLInputElement).value;
			this.toPath = query;

			if (query.length === 0) {
				suggestionsEl.empty();
				suggestionsEl.style.display = 'none';
				return;
			}

			suggestionsEl.empty();
			if (this.plugin.pathAutocomplete) {
				const suggestions = this.plugin.pathAutocomplete.getSuggestions(query);
				if (suggestions.length > 0) {
					suggestionsEl.style.display = 'block';
					for (const suggestion of suggestions) {
						const item = suggestionsEl.createEl('div', {
							text: suggestion.relativeFormat,
							cls: `suggestion-item suggestion-${suggestion.type}`
						});
						item.style.padding = '0.5rem';
						item.style.cursor = 'pointer';
						item.style.borderBottom = '1px solid var(--background-modifier-border)';
						item.addEventListener('click', () => {
							toInput.value = suggestion.relativeFormat;
							this.toPath = suggestion.relativeFormat;
							suggestionsEl.empty();
							suggestionsEl.style.display = 'none';
						});
					}
				}
			}
		});

		// Plugin selection
		contentEl.createEl('h3', { text: 'Plugins to update:' });

		if (this.allPlugins.length === 0) {
			contentEl.createEl('p', { text: 'No plugins with path settings found.', cls: 'setting-item-description' });
		} else {
			const pluginsList = contentEl.createEl('div', { cls: 'plugins-list' });
			pluginsList.style.maxHeight = '300px';
			pluginsList.style.overflowY = 'auto';
			pluginsList.style.border = '1px solid var(--background-modifier-border)';
			pluginsList.style.borderRadius = '4px';
			pluginsList.style.padding = '0.5rem';
			pluginsList.style.marginBottom = '1rem';

			for (const pluginData of this.allPlugins) {
				const label = pluginsList.createEl('label', { cls: 'checkbox-label' });
				label.style.display = 'flex';
				label.style.alignItems = 'center';
				label.style.padding = '0.5rem';
				label.style.cursor = 'pointer';

				const checkbox = label.createEl('input', { type: 'checkbox' });
				checkbox.style.marginRight = '0.5rem';
				checkbox.addEventListener('change', (e: Event) => {
					if ((e.target as HTMLInputElement).checked) {
						this.selectedPlugins.add(pluginData.id);
					} else {
						this.selectedPlugins.delete(pluginData.id);
					}
				});
				this.pluginCheckboxes.set(pluginData.id, checkbox);

				const pathCount = Object.keys(pluginData.detectedSettings).length;
				label.createEl('span', {
					text: `${pluginData.name} (${pathCount} path setting${pathCount !== 1 ? 's' : ''})`
				});
			}
		}

		// Buttons
		const buttonGroup = contentEl.createEl('div', { cls: 'button-group' });
		buttonGroup.style.display = 'flex';
		buttonGroup.style.gap = '1rem';
		buttonGroup.style.marginTop = '1rem';

		buttonGroup.createEl('button', { text: 'Preview' })
			.addEventListener('click', () => this.preview());

		buttonGroup.createEl('button', { text: 'Cancel' })
			.addEventListener('click', () => this.close());

		buttonGroup.createEl('button', { text: 'Apply', cls: 'mod-cta' })
			.addEventListener('click', () => this.apply());
	}

	private preview() {
		if (!this.fromPath || !this.toPath) {
			new Notice('Please enter both FROM and TO paths');
			return;
		}

		if (this.selectedPlugins.size === 0) {
			new Notice('Please select at least one plugin');
			return;
		}

		new PreviewModal(
			this.app,
			this.plugin,
			Array.from(this.selectedPlugins),
			this.fromPath,
			this.toPath,
			this.allPlugins
		).open();
	}

	private async apply() {
		if (!this.fromPath || !this.toPath) {
			new Notice('Please enter both FROM and TO paths');
			return;
		}

		if (this.selectedPlugins.size === 0) {
			new Notice('Please select at least one plugin');
			return;
		}

		try {
			await this.applyChanges();
			this.close();
		} catch (error) {
			console.error('Error applying changes:', error);
			new Notice(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	private async applyChanges() {
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const backupPath = `.obsidian/plugin-configs-backup-${timestamp}.json`;

		const backup: Record<string, any> = {};

		// Create backup
		for (const pluginId of this.selectedPlugins) {
			const dataFile = `.obsidian/plugins/${pluginId}/data.json`;
			try {
				const content = await this.app.vault.adapter.read(dataFile);
				backup[pluginId] = JSON.parse(content);
			} catch (e) {
				console.warn(`Could not backup ${pluginId}`);
			}
		}

		await this.app.vault.adapter.write(backupPath, JSON.stringify(backup, null, 2));

		// Apply changes
		for (const pluginId of this.selectedPlugins) {
			const dataFile = `.obsidian/plugins/${pluginId}/data.json`;
			try {
				const content = await this.app.vault.adapter.read(dataFile);
				let data = JSON.parse(content);

				data = this.replaceInObject(data, this.fromPath, this.toPath);

				await this.app.vault.adapter.write(dataFile, JSON.stringify(data, null, 2));
			} catch (e) {
				console.error(`Failed to update ${pluginId}:`, e);
			}
		}

		new Notice(`✓ Updated ${this.selectedPlugins.size} plugins. Backup: ${backupPath}`);
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
