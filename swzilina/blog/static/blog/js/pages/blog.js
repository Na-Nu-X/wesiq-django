import {
    setSortParameter,
    setCategoryParameter
} from "../utils/setParameters.js"

"use strict"

document.addEventListener("DOMContentLoaded", function() {
    // Search Bar
    const search_bar = document.querySelector(".search_bar")
    const delete_search_bar = document.querySelector(".fa-xmark")
    const article_tags = document.querySelectorAll("article") // Gets Every Article HTML Tags From Page

    const articles_data = [] // Data - Array of Objects of Articles

    article_tags.forEach(function(one_article) {
        // Gets Data From HTML Tags
        const one_article_class = one_article.className // For Example: front-lever
        const one_article_title = one_article.dataset.title // For Example: Front Lever
        
        // Creates And Fill One Object With Values
        const one_article_object = {} // For Example: { class_name: "front-lever", title: "Front Lever" }
        one_article_object.class_name = one_article_class
        one_article_object.title = one_article_title

        // Saves Filled Object With Values To Data Array
        articles_data.push(one_article_object)
    })

    // Function For Rendering Articles
    function renderArticles() {
        let searched_text = search_bar.value // Searched Text Value
        
        // Every Article Has display: block; By Default
        articles_data.forEach(function(one_article) {
            document.querySelector(`.${one_article.class_name}`).style.display = "block"
        })

        // Filters Articles by Searched Text Value
        let filtered_articles = articles_data.filter(function(one_article) {
            return !one_article.title.toLowerCase().includes(searched_text.toLowerCase())
        })

        // Hides Mismatched Articles
        filtered_articles.forEach(function(one_article) {
            document.querySelector(`.${one_article.class_name}`).style.display = "none"
        })

        // Found Articles Counter
        const num_articles = document.querySelector(".num_articles p")
        let found_articles_count = article_tags.length - filtered_articles.length

        // No Articles Message
        const no_articles = document.querySelector(".no_articles")
        no_articles.innerHTML = "Ospravedlňujeme&nbsp;sa!<br>Nepodarilo&nbsp;sa&nbsp;nájsť žiadne&nbsp;články."

        if(found_articles_count === 0) {
            no_articles.innerHTML = "Ospravedlňujeme&nbsp;sa!<br>Nepodarilo&nbsp;sa&nbsp;nájsť žiadne&nbsp;články."
        }

        else {
            no_articles.innerHTML = ""
        }

        // Found Articles Messages
        if(found_articles_count == 1) {
            num_articles.innerHTML = `Našiel sa <span>${found_articles_count}</span> článok.`
        }

        else if(found_articles_count > 1 && found_articles_count < 5) {
            num_articles.innerHTML = `Našli sa <span>${found_articles_count}</span> články.`
        }

        else {
            num_articles.innerHTML = `Našlo sa <span>${found_articles_count}</span> článkov.`
        }

        // Shows All Articles When Searched Text Value is Empty
        if(searched_text.trim() === "") {
            articles_data.forEach(function(one_article) {
                document.querySelector(`.${one_article.class_name}`).style.display = "block"
            })
        }
    }

    // Search Bar Input
    search_bar.addEventListener("input", renderArticles)

    // Delete Search Bar Icon
    delete_search_bar.addEventListener("click", function() {
        search_bar.value = ""
        renderArticles()
    })

    // Share Article

    const share_buttons = document.querySelectorAll(".share") // Gets Every Share Button HTML Tags From Page

    share_buttons.forEach(function(one_share_button) {
        one_share_button.addEventListener("click", async function() {
            // Gets Data From HTML Tags
            let clicked_share_button_title = one_share_button.dataset.title
            let clicked_share_button_link = one_share_button.dataset.link

            // Creates And Fill Object With Data Values
            let share_data = {
                title: `Street Workout Žilina - ${clicked_share_button_title}`,
                url: `http://127.0.0.1:8000/blog/${clicked_share_button_link}`,
            }

            await navigator.share(share_data) // Opens Share Menu
        })
    })

    // Animated Articles

    window.addEventListener("load", function() {
        window.addEventListener("scroll", function() {
            const search_bar_container = document.querySelector(".search_bar_container")

            if(window.scrollY > search_bar_container.offsetHeight + 20) {
                const article_tags = document.querySelectorAll("article") // Gets Every Article HTML Tags From Page

                article_tags.forEach(function(one_article) {
                    one_article.style.animation = "fade_in_animation 1s ease-out"
                })
            }
        })
    })

    // Custom Select Menu

    const sort_select = document.querySelector(".sort_select_menu .select")
    const sort_options_list = document.querySelector(".sort_select_menu .options_list")
    const sort_options = document.querySelectorAll(".sort_select_menu .option")

    sort_select.addEventListener("click", function() {
        sort_options_list.classList.toggle("active")
        sort_select.querySelector(".fa-angle-down").classList.toggle("fa-angle-up")
    })

    sort_options.forEach(function(option) {
        option.addEventListener("click", function() {
            setSortParameter(option.dataset.sort) // Sets sort URL Parameter With Value From data in Options

            sort_options_list.classList.toggle("active")
            sort_select.querySelector(".fa-angle-down").classList.toggle("fa-angle-up")
        })

        // Shows Current Selected Option From List Without Icon
        if(option.classList[1] === "selected") {
            sort_select.querySelector("span").textContent = option.querySelector("span").textContent
        }
    })

    const category_select = document.querySelector(".category_select_menu .select")
    const category_options_list = document.querySelector(".category_select_menu .options_list")
    const category_options = document.querySelectorAll(".category_select_menu .option")

    category_select.addEventListener("click", function() {
        category_options_list.classList.toggle("active")
        category_select.querySelector(".fa-angle-down").classList.toggle("fa-angle-up")
    })

    category_options.forEach(function(option) {
        option.addEventListener("click", function() {
            setCategoryParameter(option.dataset.category) // Sets category URL Parameter With Value From data in Options

            category_options_list.classList.toggle("active")
            category_select.querySelector(".fa-angle-down").classList.toggle("fa-angle-up")
        })

        // Shows Current Selected Option From List Without Icon
        if(option.classList[1] === "selected") {
            category_select.querySelector("span").textContent = option.querySelector("span").textContent
        }
    })

    // Refresh Select Menus

    const sort_select_menu_refresh = document.querySelector(".sort_select_menu .refresh .fa-arrow-rotate-right")
    const category_select_menu_refresh = document.querySelector(".category_select_menu .refresh .fa-arrow-rotate-right")

    sort_select_menu_refresh.addEventListener("click", function() {
        const page_url = new URL(window.location.href) // Gets Current URL

        // Deletes Parameters In URL
        page_url.searchParams.delete("sort")

        window.location.href = page_url // Redirects Page
    })

    category_select_menu_refresh.addEventListener("click", function() {
        const page_url = new URL(window.location.href) // Gets Current URL

        // Deletes Parameters In URL
        page_url.searchParams.delete("category")

        window.location.href = page_url // Redirects Page
    })
})