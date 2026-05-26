import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, UpdatePathsPluginSettings, UpdatePathsSettingTab } from "./settings";
import { VaultScanner } from './vaultScanner';
import { PluginDataScanner } from './pluginDataScanner';
import { PathAutocomplete } from './pathAutocomplete';
import { FindReplaceModal } from './modals/findReplaceModal';

export default class UpdatePluginsPathsPlugin extends Plugin {
	settings: UpdatePathsPluginSettings;
	vaultScanner: VaultScanner | null = null;
	pluginDataScanner: PluginDataScanner | null = null;
	pathAutocomplete: PathAutocomplete | null = null;

	async onload() {
		await this.loadSettings();

		// Initialize scanners
		this.vaultScanner = new VaultScanner(this.app);
		this.pluginDataScanner = new PluginDataScanner(this.app);
		this.pathAutocomplete = new PathAutocomplete(this.vaultScanner);

		// Scan vault on load
		await this.vaultScanner.scanVault(this.settings.showHiddenFolders);
		console.debug(`[Update Plugins Paths] Scanned ${this.vaultScanner.getCount()} folders`);

		// Ribbon icon
		this.addRibbonIcon('refresh-cw', 'Update plugin paths', () => {
			new FindReplaceModal(this.app, this).open();
		});

		// Command
		this.addCommand({
			id: 'open-modal',
			name: 'Update plugin paths',
			callback: () => {
				new FindReplaceModal(this.app, this).open();
			}
		});

		// Settings tab
		this.addSettingTab(new UpdatePathsSettingTab(this.app, this));

		console.debug('Update Plugins Paths plugin loaded');
	}

	onunload() {
		console.debug('Update Plugins Paths plugin unloaded');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<UpdatePathsPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
