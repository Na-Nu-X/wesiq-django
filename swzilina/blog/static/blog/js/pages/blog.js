import { 
    fillArticlesData,
    renderArticles
} from "../components/blogFunctions.js"

import { customSelectMenu } from "../components/customSelectMenu.js"

"use strict"

document.addEventListener("DOMContentLoaded", function() {
    const all_articles = document.querySelectorAll("article") // Gets Every Article HTML Tags From Page

    let articles_data = [] // Data - Array of Objects of Articles
    articles_data = fillArticlesData(all_articles) // Fills Articles Data

    // Animate Articles
    const observer = new IntersectionObserver(
        function(entries, observer) {
            entries.forEach(function(one_entry) {
                if(one_entry.isIntersecting) {
                    one_entry.target.classList.add("animate") // Adds Animation
                    observer.unobserve(one_entry.target) // Plays Animation Only Once
                }
            })
        },

        {
            threshold: 0.5 // Starts Animation If 50% Of Object Is Visible
        }
    )

    all_articles.forEach(function(one_article) {
        observer.observe(one_article)
    })

    // Search Bar
    const search_bar = document.querySelector(".search_bar") // Gets Search Bar

    search_bar.addEventListener("input", function() {
        renderArticles(search_bar, all_articles, articles_data) // Renders Articles
    })

    // Delete Search Bar
    const delete_search_bar = document.querySelector(".fa-xmark") // Gets Delete Search Bar Icon

    delete_search_bar.addEventListener("click", function() {
        search_bar.value = "" // Deletes Search Bar Value
        renderArticles(search_bar, all_articles, articles_data) // Renders Articles
    })

    // Share Article
    const share_buttons = document.querySelectorAll(".share") // Gets Every Share Button

    share_buttons.forEach(function(one_share_button) {
        one_share_button.addEventListener("click", async function() {
            let title = one_share_button.dataset.title // Gets Title
            let link = one_share_button.dataset.link // Gets Link

            // Creates And Fill Object With Data Values
            let share_data = {
                title: `Street Workout Žilina - ${title}`,
                url: `http://127.0.0.1:8000/blog/${link}`,
            }

            await navigator.share(share_data) // Opens Share Menu
        })
    })

    // Custom Select Menus
    const sort_select_menu = document.querySelector(".sort_select_menu") // Gets Sort Select Menu
    const category_select_menu = document.querySelector(".category_select_menu") // Gets Category Select Menu

    customSelectMenu(sort_select_menu, "sort") // Adds Functionality For Sort Select Menu That Sets The Sort URL Parameter
    customSelectMenu(category_select_menu, "category") // Adds Functionality For Category Select Menu That Sets The Category URL Parameter
})