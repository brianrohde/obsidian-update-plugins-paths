import { App, TFolder, TFile } from 'obsidian';

export class VaultScanner {
	private vaultFolders: string[] = [];
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	async scanVault(includeHidden: boolean = false): Promise<void> {
		const root = this.app.vault.getRoot();
		this.vaultFolders = await this.recursiveGetFolders(root, includeHidden);
	}

	private async recursiveGetFolders(folder: TFolder, includeHidden: boolean): Promise<string[]> {
		const paths: string[] = [];
		const skip = ['.obsidian', '.git'];

		for (const child of folder.children) {
			if (child instanceof TFolder) {
				const name = child.name;
				if (includeHidden || !skip.includes(name)) {
					paths.push(child.path);
					paths.push(...await this.recursiveGetFolders(child, includeHidden));
				}
			}
		}
		return paths;
	}

	getFolders(): string[] {
		return this.vaultFolders;
	}

	getCount(): number {
		return this.vaultFolders.length;
	}
}
