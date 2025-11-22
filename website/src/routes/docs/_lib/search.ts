import { docsStructure } from './structure';

export interface SearchResult {
    id: string;
    title: string;
    description: string;
    url: string;
    content: string;
}

// Build search index from docs structure
function buildSearchIndex(): SearchResult[] {
    const results: SearchResult[] = [];

    for (const section of docsStructure) {
        for (const page of section.pages) {
            results.push({
                id: page.url,
                title: page.title,
                description: page.description || '',
                url: page.url,
                content: `${page.title} ${page.description || ''} ${section.title}`
            });
        }
    }

    return results;
}

const searchIndex = buildSearchIndex();

export function searchDocs(query: string): SearchResult[] {
    if (!query || query.trim().length === 0) {
        return [];
    }

    const lowerQuery = query.toLowerCase();

    return searchIndex
        .filter((item) => {
            const searchText = `${item.title} ${item.description} ${item.content}`.toLowerCase();
            return searchText.includes(lowerQuery);
        })
        .slice(0, 10); // Limit to 10 results
}
