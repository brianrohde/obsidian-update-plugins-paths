import { App, PluginSettingTab, Setting } from "obsidian";
import UpdatePluginsPathsPlugin from "./main";

export interface UpdatePathsPluginSettings {
	showHiddenFolders: boolean;
	pathFormat: 'relative' | 'absolute';
	autoCreateFolders: boolean;
	customPathMappings: {
		[pluginId: string]: string[];
	};
}

export const DEFAULT_SETTINGS: UpdatePathsPluginSettings = {
	showHiddenFolders: false,
	pathFormat: 'relative',
	autoCreateFolders: true,
	customPathMappings: {}
}

export class UpdatePathsSettingTab extends PluginSettingTab {
	plugin: UpdatePluginsPathsPlugin;

	constructor(app: App, plugin: UpdatePluginsPathsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const versionEl = containerEl.createEl('div', { cls: 'version-notice' });
		versionEl.createEl('p', { text: `Testing Pre-Release ${this.plugin.manifest.version}` });
		versionEl.createEl('p', { text: 'This is a development build. Thank you for testing!' });

		new Setting(containerEl).setHeading().setName('General');

		new Setting(containerEl)
			.setName('Show hidden folders')
			.setDesc(`Include ${this.app.vault.configDir}, .git and other hidden folders in path autocomplete`)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showHiddenFolders)
				.onChange(async (value) => {
					this.plugin.settings.showHiddenFolders = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Path format')
			.setDesc('Default path format for autocomplete suggestions')
			.addDropdown(dropdown => dropdown
				.addOption('relative', 'Relative (e.g. folder/subfolder)')
				.addOption('absolute', 'Absolute (e.g. /folder/subfolder)')
				.setValue(this.plugin.settings.pathFormat)
				.onChange(async (value: 'relative' | 'absolute') => {
					this.plugin.settings.pathFormat = value;
					if (this.plugin.pathAutocomplete) {
						this.plugin.pathAutocomplete.setPathFormat(value);
					}
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Auto-create folders')
			.setDesc('Automatically create new folders when you add a new path')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoCreateFolders)
				.onChange(async (value) => {
					this.plugin.settings.autoCreateFolders = value;
					await this.plugin.saveSettings();
				})
			);
	}
}
