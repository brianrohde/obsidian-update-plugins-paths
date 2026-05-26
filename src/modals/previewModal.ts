import { App, Modal, Notice } from 'obsidian';
import UpdatePluginsPathsPlugin from '../main';
import { PluginDataWithPaths } from '../pluginDataScanner';

export class PreviewModal extends Modal {
	private plugin: UpdatePluginsPathsPlugin;
	private selectedPluginIds: string[];
	private fromPath: string;
	private toPath: string;
	private allPlugins: PluginDataWithPaths[];

	constructor(
		app: App,
		plugin: UpdatePluginsPathsPlugin,
		selectedPluginIds: string[],
		fromPath: string,
		toPath: string,
		allPlugins: PluginDataWithPaths[]
	) {
		super(app);
		this.plugin = plugin;
		this.selectedPluginIds = selectedPluginIds;
		this.fromPath = fromPath;
		this.toPath = toPath;
		this.allPlugins = allPlugins;
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h2', { text: 'Preview Changes' });

		contentEl.createEl('p', {
			text: `${this.selectedPluginIds.length} plugin${this.selectedPluginIds.length !== 1 ? 's' : ''} will be updated`
		});

		const previewContainer = contentEl.createEl('div', { cls: 'preview-container' });
		previewContainer.style.maxHeight = '400px';
		previewContainer.style.overflowY = 'auto';
		previewContainer.style.border = '1px solid var(--background-modifier-border)';
		previewContainer.style.borderRadius = '4px';
		previewContainer.style.padding = '1rem';
		previewContainer.style.marginBottom = '1rem';
		previewContainer.style.backgroundColor = 'var(--background-secondary)';

		for (const pluginId of this.selectedPluginIds) {
			const pluginData = this.allPlugins.find(p => p.id === pluginId);
			if (!pluginData) continue;

			const section = previewContainer.createEl('div', { cls: 'preview-section' });
			section.style.marginBottom = '1.5rem';

			section.createEl('h4', { text: pluginData.name });

			for (const [fieldName, fieldValue] of Object.entries(pluginData.detectedSettings)) {
				if (fieldValue === this.fromPath) {
					const diff = section.createEl('div', { cls: 'preview-diff' });
					diff.style.fontFamily = 'monospace';
					diff.style.fontSize = '0.85em';
					diff.style.margin = '0.5rem 0';

					const beforeEl = diff.createEl('div', { cls: 'preview-before' });
					beforeEl.style.color = 'var(--text-error)';
					beforeEl.setText(`- "${fieldName}": "${fieldValue}"`);

					const afterEl = diff.createEl('div', { cls: 'preview-after' });
					afterEl.style.color = 'var(--text-success)';
					afterEl.setText(`+ "${fieldName}": "${this.toPath}"`);
				}
			}
		}

		// Buttons
		const buttonGroup = contentEl.createEl('div', { cls: 'button-group' });
		buttonGroup.style.display = 'flex';
		buttonGroup.style.gap = '1rem';

		buttonGroup.createEl('button', { text: 'Cancel' })
			.addEventListener('click', () => this.close());

		buttonGroup.createEl('button', { text: 'Confirm & Apply', cls: 'mod-cta' })
			.addEventListener('click', () => this.confirmAndApply());
	}

	private async confirmAndApply() {
		try {
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const backupPath = `.obsidian/plugin-configs-backup-${timestamp}.json`;

			const backup: Record<string, any> = {};

			// Create backup
			for (const pluginId of this.selectedPluginIds) {
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
			for (const pluginId of this.selectedPluginIds) {
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

			new Notice(`✓ Updated ${this.selectedPluginIds.length} plugins. Backup: ${backupPath}`);
			this.close();
		} catch (error) {
			console.error('Error applying changes:', error);
			new Notice(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
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
