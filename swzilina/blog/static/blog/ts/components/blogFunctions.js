// Function For Fill Articles Data
export function fillArticlesData(all_articles) {
    let result = [];
    all_articles.forEach(function (one_article) {
        // Gets Data From HTML Tags
        const one_article_class = one_article.className; // For Example: front-lever
        const one_article_title = one_article.dataset.title; // For Example: Front Lever
        if (!one_article_title)
            return;
        // Creates And Fill One Object With Values (For Example: { class_name: "front-lever", title: "Front Lever" })
        const one_article_object = {
            class_name: one_article_class,
            title: one_article_title
        };
        // Saves Filled Object With Values To Data Array
        result.push(one_article_object);
    });
    return result;
}
// Function For Rendering Articles
export function renderArticles(search_bar, all_articles, articles_data) {
    let searched_text = search_bar.value; // Searched Text Value
    // Every Article Is Visible By Default
    articles_data.forEach(function (one_article) {
        document.querySelector(`.${one_article.class_name}`).style.display = "block";
    });
    // Filters Articles by Searched Text Value
    let filtered_articles = articles_data.filter(function (one_article) {
        return !one_article.title.toLowerCase().includes(searched_text.toLowerCase());
    });
    // Hides Mismatched Articles
    filtered_articles.forEach(function (one_article) {
        document.querySelector(`.${one_article.class_name}`).style.display = "none";
    });
    // Found Articles Counter
    const num_articles = document.querySelector(".num_articles p");
    let found_articles_count = all_articles.length - filtered_articles.length; // Gets Amount Of Found Articles
    // No Articles Message
    const no_articles = document.querySelector(".no_articles");
    no_articles.innerHTML = "Ospravedlňujeme&nbsp;sa!<br>Nepodarilo&nbsp;sa&nbsp;nájsť žiadne&nbsp;články.";
    found_articles_count === 0 ? no_articles.innerHTML = "Ospravedlňujeme&nbsp;sa!<br>Nepodarilo&nbsp;sa&nbsp;nájsť žiadne&nbsp;články." : no_articles.innerHTML = "";
    // Found Articles Messages
    if (found_articles_count == 1)
        num_articles.innerHTML = `Našiel sa <span>${found_articles_count}</span> článok.`;
    else if (found_articles_count > 1 && found_articles_count < 5)
        num_articles.innerHTML = `Našli sa <span>${found_articles_count}</span> články.`;
    else
        num_articles.innerHTML = `Našlo sa <span>${found_articles_count}</span> článkov.`;
    // Shows All Articles When Searched Text Value is Empty
    if (searched_text.trim() === "") {
        articles_data.forEach(function (one_article) {
            document.querySelector(`.${one_article.class_name}`).style.display = "block";
        });
    }
}
//# sourceMappingURL=blogFunctions.js.map