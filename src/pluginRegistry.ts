export interface PluginPathMapping {
	id: string;
	name: string;
	pathFields: string[];
	type: 'core' | 'community';
}

export interface PluginRegistry {
	core: PluginPathMapping[];
	community: PluginPathMapping[];
}

export const PLUGIN_REGISTRY: PluginRegistry = {
	core: [
		{ id: 'daily-notes', name: 'Daily Notes', pathFields: ['folder'], type: 'core' },
		{ id: 'file-explorer', name: 'File Explorer', pathFields: [], type: 'core' },
		{ id: 'outline', name: 'Outline', pathFields: [], type: 'core' },
		{ id: 'backlink', name: 'Backlinks', pathFields: [], type: 'core' },
		{ id: 'search', name: 'Search', pathFields: [], type: 'core' },
	],
	community: [
		{ id: 'dataview', name: 'Dataview', pathFields: ['folder', 'indexFolder'], type: 'community' },
		{ id: 'templater', name: 'Templater', pathFields: ['templates_folder', 'folder'], type: 'community' },
		{ id: 'obsidian-git', name: 'Obsidian Git', pathFields: ['basePath'], type: 'community' },
		{ id: 'daily-notes-editor', name: 'Daily Notes Editor', pathFields: ['folder'], type: 'community' },
		{ id: 'obsidian-excalibrain', name: 'ExcaliBrain', pathFields: ['folder'], type: 'community' },
		{ id: 'breadcrumbs', name: 'Breadcrumbs', pathFields: ['matrix'], type: 'community' },
		{ id: 'periodic-notes', name: 'Periodic Notes', pathFields: ['daily', 'weekly', 'monthly', 'yearly'], type: 'community' },
	]
};
