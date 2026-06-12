import { 
    fillArticlesData,
    renderArticles
} from "../components/blogFunctions.js"

import { customSelectMenu } from "../components/customSelectMenu.js"

interface article {
    class_name:string,
    title:string
}

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Blog

    // Variables

    const all_articles:NodeListOf<HTMLElement> = document.querySelectorAll<HTMLElement>("article") // Gets Every Article HTML Tags From Page

    let articles_data:article[] = [] // Data - Array of Objects of Articles
    articles_data = fillArticlesData(all_articles) // Fills Articles Data

    const search_bar_container:HTMLDivElement = document.querySelector(".search_bar_container") as HTMLDivElement // Gets The Search Bar Container
    const search_bar_menu:HTMLDivElement = search_bar_container.querySelector(".search_bar_menu") as HTMLDivElement // Gets The Search Bar Menu
    const search_bar:HTMLInputElement = search_bar_menu.querySelector(".search_bar") as HTMLInputElement // Gets Search Bar
    const delete_search_bar:HTMLButtonElement = search_bar_menu.querySelector(".delete_search_bar") as HTMLButtonElement // Gets Delete Search Bar Button
    const share_buttons:NodeListOf<HTMLButtonElement> = document.querySelectorAll<HTMLButtonElement>(".share") // Gets Every Share Button

    const select_menus:HTMLDivElement = search_bar_container.querySelector(".select_menus") as HTMLDivElement // Gets The Select Menus
    const sort_select_menu:HTMLDivElement = select_menus.querySelector(".sort_select_menu") as HTMLDivElement // Gets Sort Select Menu
    const category_select_menu:HTMLDivElement = select_menus.querySelector(".category_select_menu") as HTMLDivElement // Gets Category Select Menu

    // Events

    search_bar.addEventListener("input", () => renderArticles(search_bar, all_articles, articles_data)) // Renders Articles

    // Delete Search Bar Click Functionality
    delete_search_bar.addEventListener("click", function():void {
        search_bar.value = "" // Deletes Search Bar Value
        renderArticles(search_bar, all_articles, articles_data) // Renders Articles
    })

    // Share Button Click Functionality
    share_buttons.forEach(function(one_share_button:HTMLButtonElement):void {
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

            await navigator.share(share_data) // Opens The Share Menu
        })
    })

    // Initialization

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

    all_articles.forEach(one_article => observer.observe(one_article))

    customSelectMenu(sort_select_menu, "sort") // Adds Functionality For Sort Select Menu That Sets The Sort URL Parameter
    customSelectMenu(category_select_menu, "category") // Adds Functionality For Category Select Menu That Sets The Category URL Parameter
})