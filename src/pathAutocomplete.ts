import { VaultScanner } from './vaultScanner';

export interface PathSuggestion {
	type: 'existing' | 'create';
	path: string;
	relativeFormat: string;
	absoluteFormat: string;
}

export class PathAutocomplete {
	private vaultScanner: VaultScanner;
	private pathFormat: 'relative' | 'absolute' = 'relative';

	constructor(vaultScanner: VaultScanner) {
		this.vaultScanner = vaultScanner;
	}

	setPathFormat(format: 'relative' | 'absolute'): void {
		this.pathFormat = format;
	}

	getSuggestions(query: string, createOption: boolean = true): PathSuggestion[] {
		const folders = this.vaultScanner.getFolders();

		if (!query || query.length === 0) {
			return [];
		}

		const matches = this.fuzzyMatch(query, folders);
		const suggestions: PathSuggestion[] = matches.map(path => ({
			type: 'existing',
			path,
			relativeFormat: path,
			absoluteFormat: `/${path}`
		}));

		// Add "create new" option if query doesn't match exactly
		if (createOption && query.length > 0 && !matches.includes(query)) {
			suggestions.push({
				type: 'create',
				path: query,
				relativeFormat: query,
				absoluteFormat: `/${query}`
			});
		}

		return suggestions.slice(0, 5);
	}

	private fuzzyMatch(query: string, paths: string[]): string[] {
		const lower = query.toLowerCase();

		const exact = paths.filter(p => p.toLowerCase() === lower);
		const contains = paths.filter(
			p => p.toLowerCase().includes(lower) && !exact.includes(p)
		);
		const fuzzy = paths.filter(
			p => this.fuzzyScore(lower, p) > 0 && !exact.includes(p) && !contains.includes(p)
		);

		contains.sort((a, b) => a.toLowerCase().indexOf(lower) - b.toLowerCase().indexOf(lower));
		fuzzy.sort((a, b) => this.fuzzyScore(lower, b) - this.fuzzyScore(lower, a));

		return [...exact, ...contains, ...fuzzy];
	}

	private fuzzyScore(query: string, text: string): number {
		let score = 0;
		let lastIndex = 0;
		const lower = text.toLowerCase();

		for (const char of query) {
			const index = lower.indexOf(char, lastIndex);
			if (index === -1) return 0;
			score += index - lastIndex;
			lastIndex = index + 1;
		}

		return 100 - score;
	}
}
