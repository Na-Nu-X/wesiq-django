interface article {
    class_name:string,
    title:string
}

// Function For Fill Articles Data
export function fillArticlesData(all_articles:NodeListOf<HTMLElement>):article[] {
    let result:article[] = []
    
    all_articles.forEach(function(one_article:HTMLElement):void {
        // Gets Data From HTML Tags
        const one_article_class:string = one_article.className // For Example: front-lever
        const one_article_title:string|undefined = one_article.dataset["title"] // For Example: Front Lever

        if(!one_article_title) return
        
        // Creates And Fill One Object With Values (For Example: { class_name: "front-lever", title: "Front Lever" })
        const one_article_object:article = {
            class_name: one_article_class,
            title: one_article_title
        }

        // Saves Filled Object With Values To Data Array
        result.push(one_article_object)
    })

    return result
}

// Function For Rendering Articles
export function renderArticles(search_bar:HTMLInputElement, all_articles:NodeListOf<HTMLElement>, articles_data:article[]) {
    let searched_text:string = search_bar.value // Searched Text Value
    
    // Every Article Is Visible By Default
    articles_data.forEach(function(one_article:article):void {
        (document.querySelector(`.${one_article.class_name}`) as HTMLElement).style.display = "block"
    })

    // Filters Articles by Searched Text Value
    let filtered_articles:article[] = articles_data.filter(function(one_article:article):boolean {
        return !one_article.title.toLowerCase().includes(searched_text.toLowerCase())
    })

    // Hides Mismatched Articles
    filtered_articles.forEach(function(one_article:article):void {
        (document.querySelector(`.${one_article.class_name}`) as HTMLElement).style.display = "none"
    })

    // Found Articles Counter
    const num_articles:HTMLParagraphElement = document.querySelector(".num_articles p") as HTMLParagraphElement
    let found_articles_count:number = all_articles.length - filtered_articles.length // Gets Amount Of Found Articles

    // No Articles Message
    const no_articles:HTMLHeadingElement = document.querySelector(".no_articles") as HTMLHeadingElement

    no_articles.innerHTML = "Ospravedlňujeme&nbsp;sa!<br>Nepodarilo&nbsp;sa&nbsp;nájsť žiadne&nbsp;články."
    found_articles_count === 0 ? no_articles.innerHTML = "Ospravedlňujeme&nbsp;sa!<br>Nepodarilo&nbsp;sa&nbsp;nájsť žiadne&nbsp;články." : no_articles.innerHTML = ""

    // Found Articles Messages
    if(found_articles_count == 1) num_articles.innerHTML = `Našiel sa <span>${found_articles_count}</span> článok.`
    else if(found_articles_count > 1 && found_articles_count < 5) num_articles.innerHTML = `Našli sa <span>${found_articles_count}</span> články.`
    else num_articles.innerHTML = `Našlo sa <span>${found_articles_count}</span> článkov.`

    // Shows All Articles When Searched Text Value is Empty
    if(searched_text.trim() === "") {
        articles_data.forEach(function(one_article:article):void {
            (document.querySelector(`.${one_article.class_name}`) as HTMLElement).style.display = "block"
        })
    }
}