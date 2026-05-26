import { App } from 'obsidian';
import { PLUGIN_REGISTRY, PluginPathMapping } from './pluginRegistry';

export interface PluginDataWithPaths {
	id: string;
	name: string;
	registryMatch?: PluginPathMapping;
	detectedSettings: {
		[fieldName: string]: string;
	};
}

export class PluginDataScanner {
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	async scanAllPlugins(): Promise<PluginDataWithPaths[]> {
		const pluginsDir = '.obsidian/plugins';
		const results: PluginDataWithPaths[] = [];

		try {
			const pluginsList = await this.app.vault.adapter.list(pluginsDir);

			for (const dir of pluginsList.folders) {
				const pluginId = dir.split('/').pop();
				if (!pluginId) continue;

				const dataFile = `${dir}/data.json`;
				try {
					const dataContent = await this.app.vault.adapter.read(dataFile);
					const data = JSON.parse(dataContent);

					const result = await this.analyzePluginData(pluginId, data);
					if (Object.keys(result.detectedSettings).length > 0) {
						results.push(result);
					}
				} catch (e) {
					// Plugin has no data.json or can't parse — skip
				}
			}
		} catch (e) {
			console.error('Failed to scan plugins directory:', e);
		}

		return results;
	}

	private async analyzePluginData(
		pluginId: string,
		data: Record<string, any>
	): Promise<PluginDataWithPaths> {
		const registryMatch = this.findInRegistry(pluginId);
		const detected: Record<string, string> = {};

		// Step 1: Check manual registry
		if (registryMatch) {
			for (const field of registryMatch.pathFields) {
				if (typeof data[field] === 'string' && data[field].length > 0) {
					detected[field] = data[field];
				}
			}
		}

		// Step 2: Heuristic scan for path-like patterns
		const heuristic = this.heuristicScan(data);
		for (const [key, value] of Object.entries(heuristic)) {
			if (!detected[key]) {
				detected[key] = value;
			}
		}

		return {
			id: pluginId,
			name: registryMatch?.name || pluginId,
			registryMatch,
			detectedSettings: detected
		};
	}

	private heuristicScan(data: Record<string, any>): Record<string, string> {
		const pathLikePattern = /\//;
		const detected: Record<string, string> = {};

		for (const [key, value] of Object.entries(data)) {
			if (typeof value === 'string' && pathLikePattern.test(value) && value.length > 0) {
				detected[key] = value;
			}
		}

		return detected;
	}

	private findInRegistry(pluginId: string): PluginPathMapping | undefined {
		const all = [...PLUGIN_REGISTRY.core, ...PLUGIN_REGISTRY.community];
		return all.find(p => p.id === pluginId);
	}
}
