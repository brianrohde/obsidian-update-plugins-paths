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

		contentEl.createEl('h2', { text: 'Preview changes' });

		contentEl.createEl('p', {
			text: `${this.selectedPluginIds.length} plugin${this.selectedPluginIds.length !== 1 ? 's' : ''} will be updated`
		});

		const previewContainer = contentEl.createEl('div', { cls: 'preview-container' });

		for (const pluginId of this.selectedPluginIds) {
			const pluginData = this.allPlugins.find(p => p.id === pluginId);
			if (!pluginData) continue;

			const section = previewContainer.createEl('div', { cls: 'preview-section' });

			section.createEl('h4', { text: pluginData.name });

			for (const [fieldName, fieldValue] of Object.entries(pluginData.detectedSettings)) {
				if (fieldValue === this.fromPath) {
					const diff = section.createEl('div', { cls: 'preview-diff' });

					const beforeEl = diff.createEl('div', { cls: 'preview-before' });
					beforeEl.setText(`- "${fieldName}": "${fieldValue}"`);

					const afterEl = diff.createEl('div', { cls: 'preview-after' });
					afterEl.setText(`+ "${fieldName}": "${this.toPath}"`);
				}
			}
		}

		// Buttons
		const buttonGroup = contentEl.createEl('div', { cls: 'button-group' });

		buttonGroup.createEl('button', { text: 'Cancel' })
			.addEventListener('click', () => this.close());

		const applyBtn = buttonGroup.createEl('button', { text: 'Confirm and apply', cls: 'mod-cta' });
		applyBtn.addEventListener('click', () => {
			void this.confirmAndApply();
		});
	}

	private async confirmAndApply() {
		try {
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const backupPath = `.obsidian/plugin-configs-backup-${timestamp}.json`;

			const backup: Record<string, Record<string, unknown>> = {};

			// Create backup
			for (const pluginId of this.selectedPluginIds) {
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
			for (const pluginId of this.selectedPluginIds) {
				const dataFile = `${this.app.vault.configDir}/plugins/${pluginId}/data.json`;
				try {
					const content = await this.app.vault.adapter.read(dataFile);
					const data = JSON.parse(content) as Record<string, unknown>;

					const updated = this.replaceInObject(data, this.fromPath, this.toPath);

					await this.app.vault.adapter.write(dataFile, JSON.stringify(updated, null, 2));
				} catch (error) {
					console.error(`Failed to update ${pluginId}:`, error);
				}
			}

			new Notice(`✓ Updated ${this.selectedPluginIds.length} plugins. Backup: ${backupPath}`);
			this.close();
		} catch (error) {
			console.error('Error applying changes:', error);
			new Notice(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
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
