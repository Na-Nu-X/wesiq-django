interface article {
    class_name: string;
    title: string;
}
export declare function fillArticlesData(all_articles: NodeListOf<HTMLElement>): article[];
export declare function renderArticles(search_bar: HTMLInputElement, all_articles: NodeListOf<HTMLElement>, articles_data: article[]): void;
export {};
//# sourceMappingURL=blogFunctions.d.ts.map