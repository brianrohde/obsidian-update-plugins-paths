import { App, Modal, Notice } from 'obsidian';
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
		contentEl.createEl('h2', { text: 'Update plugin paths' });

		// Scan plugins
		if (!this.plugin.pluginDataScanner) {
			new Notice('Plugin scanner not initialized');
			this.close();
			return;
		}

		this.allPlugins = await this.plugin.pluginDataScanner.scanAllPlugins();
		console.debug(`[Update Plugins Paths] Found ${this.allPlugins.length} plugins with path settings`);

		// FROM path section
		contentEl.createEl('label', { text: 'From (current path):', cls: 'form-label' });
		const fromInput = contentEl.createEl('input', {
			type: 'text',
			placeholder: 'e.g. old/vault/path'
		});
		fromInput.addClass('form-input');
		fromInput.addEventListener('input', (e: Event) => {
			this.fromPath = (e.target as HTMLInputElement).value;
		});

		// TO path section with autocomplete
		contentEl.createEl('label', { text: 'To (new path):', cls: 'form-label' });
		const toInputWrapper = contentEl.createEl('div', { cls: 'autocomplete-wrapper' });
		const toInput = toInputWrapper.createEl('input', {
			type: 'text',
			placeholder: 'e.g. new/vault/path'
		});
		toInput.addClass('form-input');

		const suggestionsEl = toInputWrapper.createEl('div', { cls: 'autocomplete-suggestions' });
		suggestionsEl.addClass('autocomplete-suggestions-hidden');

		toInput.addEventListener('input', (e: Event) => {
			const query = (e.target as HTMLInputElement).value;
			this.toPath = query;

			if (query.length === 0) {
				suggestionsEl.empty();
				suggestionsEl.addClass('autocomplete-suggestions-hidden');
				return;
			}

			suggestionsEl.empty();
			if (this.plugin.pathAutocomplete) {
				const suggestions = this.plugin.pathAutocomplete.getSuggestions(query);
				if (suggestions.length > 0) {
					suggestionsEl.removeClass('autocomplete-suggestions-hidden');
					for (const suggestion of suggestions) {
						const item = suggestionsEl.createEl('div', {
							text: suggestion.relativeFormat,
							cls: `suggestion-item suggestion-${suggestion.type}`
						});
						item.addEventListener('click', () => {
							toInput.value = suggestion.relativeFormat;
							this.toPath = suggestion.relativeFormat;
							suggestionsEl.empty();
							suggestionsEl.addClass('autocomplete-suggestions-hidden');
						});
					}
				}
			}
		});

		// Plugin selection
		contentEl.createEl('h3', { text: 'Plugins to update' });

		if (this.allPlugins.length === 0) {
			contentEl.createEl('p', { text: 'No plugins with path settings found.', cls: 'setting-item-description' });
		} else {
			const pluginsList = contentEl.createEl('div', { cls: 'plugins-list' });

			for (const pluginData of this.allPlugins) {
				const label = pluginsList.createEl('label', { cls: 'checkbox-label' });

				const checkbox = label.createEl('input', { type: 'checkbox' });
				checkbox.addClass('plugin-checkbox');
				checkbox.addEventListener('change', (e: Event) => {
					const target = e.target as HTMLInputElement;
					if (target.checked) {
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

		buttonGroup.createEl('button', { text: 'Preview' })
			.addEventListener('click', () => this.preview());

		buttonGroup.createEl('button', { text: 'Cancel' })
			.addEventListener('click', () => this.close());

		const applyBtn = buttonGroup.createEl('button', { text: 'Apply', cls: 'mod-cta' });
		applyBtn.addEventListener('click', () => {
			void this.apply();
		});
	}

	private preview() {
		if (!this.fromPath || !this.toPath) {
			new Notice('Please enter both from and to paths');
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
			new Notice('Please enter both from and to paths');
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

	private async applyChanges(): Promise<void> {
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const backupPath = `${this.app.vault.configDir}/plugin-configs-backup-${timestamp}.json`;

		const backup: Record<string, Record<string, unknown>> = {};

		// Create backup
		for (const pluginId of this.selectedPlugins) {
			const dataFile = `${this.app.vault.configDir}/plugins/${pluginId}/data.json`;
			try {
				const content = await this.app.vault.adapter.read(dataFile);
				backup[pluginId] = JSON.parse(content) as Record<string, unknown>;
			} catch {
				console.warn(`Could not backup ${pluginId}`);
			}
		}

		await this.app.vault.adapter.write(backupPath, JSON.stringify(backup, null, 2));

		// Apply changes
		for (const pluginId of this.selectedPlugins) {
			const dataFile = `${this.app.vault.configDir}/plugins/${pluginId}/data.json`;
			try {
				const content = await this.app.vault.adapter.read(dataFile);
				const data = JSON.parse(content) as Record<string, unknown>;

				const updated = this.replaceInObject(data, this.fromPath, this.toPath) as Record<string, unknown>;

				await this.app.vault.adapter.write(dataFile, JSON.stringify(updated, null, 2));
			} catch (error) {
				console.error(`Failed to update ${pluginId}:`, error);
			}
		}

		new Notice(`✓ Updated ${this.selectedPlugins.size} plugins. Backup: ${backupPath}`);
	}

	private replaceInObject(obj: Record<string, unknown> | string | unknown[], fromPath: string, toPath: string): unknown {
		if (typeof obj === 'string') {
			return obj === fromPath ? toPath : obj;
		}
		if (typeof obj === 'object' && obj !== null) {
			if (Array.isArray(obj)) {
				return obj.map(item => this.replaceInObject(item as string | Record<string, unknown> | unknown[], fromPath, toPath));
			} else {
				const result: Record<string, unknown> = {};
				for (const [key, value] of Object.entries(obj)) {
					result[key] = this.replaceInObject(value as string | Record<string, unknown> | unknown[], fromPath, toPath);
				}
				return result;
			}
		}
		return obj;
	}
}
