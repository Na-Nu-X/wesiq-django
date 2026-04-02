import { 
    fillArticlesData,
    renderArticles
} from "../components/blogFunctions.js"

import { customSelectMenu } from "../components/customSelectMenu.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    interface article {
        class_name:string,
        title:string
    }

    const all_articles:NodeListOf<HTMLElement> = document.querySelectorAll<HTMLElement>("article") // Gets Every Article HTML Tags From Page

    let articles_data:article[] = [] // Data - Array of Objects of Articles
    articles_data = fillArticlesData(all_articles) // Fills Articles Data

    // Animate Articles
    const observer:IntersectionObserver = new IntersectionObserver(
        function(entries:IntersectionObserverEntry[], observer:IntersectionObserver) {
            entries.forEach(function(one_entry:IntersectionObserverEntry):void {
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

    all_articles.forEach(function(one_article:HTMLElement):void {
        observer.observe(one_article)
    })

    // Search Bar
    const search_bar:HTMLInputElement = document.querySelector(".search_bar") as HTMLInputElement // Gets Search Bar

    search_bar.addEventListener("input", function():void {
        renderArticles(this, all_articles, articles_data) // Renders Articles
    })

    // Delete Search Bar
    const delete_search_bar:HTMLElement = document.querySelector(".fa-xmark") as HTMLElement // Gets Delete Search Bar Icon

    delete_search_bar.addEventListener("click", function():void {
        search_bar.value = "" // Deletes Search Bar Value
        renderArticles(search_bar, all_articles, articles_data) // Renders Articles
    })

    // Share Article
    const share_buttons:NodeListOf<HTMLDivElement> = document.querySelectorAll<HTMLDivElement>(".share") // Gets Every Share Button

    share_buttons.forEach(function(one_share_button:HTMLDivElement):void {
        one_share_button.addEventListener("click", async function():Promise<void> {
            let title:string = this.dataset["title"] || "" // Gets Title
            let link:string = this.dataset["link"] || "" // Gets Link

            // Creates And Fill Object With Data Values
            let share_data:{
                title:string,
                url:string
            } = {
                title: `Wesiq - ${title}`,
                url: `${document.location.href + link}` // http://127.0.0.1:8000/blog/${link}
            }

            await navigator.share(share_data) // Opens Share Menu
        })
    })

    // Custom Select Menus
    const sort_select_menu:HTMLDivElement = document.querySelector(".sort_select_menu") as HTMLDivElement // Gets Sort Select Menu
    const category_select_menu:HTMLDivElement = document.querySelector(".category_select_menu") as HTMLDivElement // Gets Category Select Menu

    customSelectMenu(sort_select_menu, "sort") // Adds Functionality For Sort Select Menu That Sets The Sort URL Parameter
    customSelectMenu(category_select_menu, "category") // Adds Functionality For Category Select Menu That Sets The Category URL Parameter
})