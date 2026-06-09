import { 
    checkSearchedPostsHistory,
    hideHistoryContainer,
    changeFocusedSearchedPost
} from "../functions/searchPostsHistory.js"

import { loadPosts } from "../functions/posts.js"
import { feed_state } from "../state.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Search Posts

    // Variables

    const feed:HTMLDivElement = document.querySelector(".feed") as HTMLDivElement // Gets The Feed Container
    const feed_report:HTMLParagraphElement = feed.querySelector(".feed_report") as HTMLParagraphElement // Gets The Feed Report
    const search_posts_container:HTMLDivElement = feed.querySelector(".search_posts_container") as HTMLDivElement // Gets The Search Posts Container
    const search_posts_input:HTMLInputElement = search_posts_container.querySelector(".search_bar") as HTMLInputElement // Gets The Search Posts Input
    const delete_search_posts_input:HTMLButtonElement = search_posts_container.querySelector(".delete_search_bar") as HTMLButtonElement // Gets The Delete Search Posts Input Button
    const history_container:HTMLDivElement = search_posts_container.querySelector(".history_container") as HTMLDivElement // Gets The History Container
    let search_posts_timeout:number // Debounce Timeout Between Requests

    // Events

    // Search Posts Input Focus Functionality
    search_posts_input.addEventListener("focus", () => checkSearchedPostsHistory(history_container, search_posts_input)) // Checks Searched Posts History

    // Search Posts Input Functionality
    search_posts_input.addEventListener("input", function():void {
        if(search_posts_timeout) clearTimeout(search_posts_timeout) // Deletes The Previous Search Posts Timeout
        feed_state.is_loading = true
        feed_report.textContent = gettext("Načítavam...")

        const all_post_containers:NodeListOf<HTMLDivElement> = feed.querySelectorAll<HTMLDivElement>(".post_container") // Gets All Post Containers
        all_post_containers.forEach(one_post_container => (one_post_container.querySelector(".loading") as HTMLDivElement).classList.remove("hidden")) // Shows The Loader

        // Gets The Posts After 2 Seconds Of Delay
        search_posts_timeout = window.setTimeout(function() {
            feed_state.current_page = 1
            feed_state.is_loading = false
            feed_state.has_more_posts = true
            all_post_containers.forEach(one_post_container => one_post_container.remove()) // Removes Every Post Container From The DOM
            loadPosts(feed, feed_report, search_posts_input, history_container) // Loads The Posts
        }, 2000)
    })

    // Search Post Input Key Functionalities
    search_posts_input.addEventListener("keydown", function(event:KeyboardEvent):void {
        const all_searched_posts:NodeListOf<HTMLDivElement> = history_container.querySelectorAll(".searched_post") // Gets All Searched Posts

        if(event.key === "ArrowUp" || event.key === "ArrowDown") event.preventDefault() // Allows Ordinary Typing To The Input

        if(event.key === "ArrowUp") changeFocusedSearchedPost(feed_state.focused_searched_post_index - 1, all_searched_posts, search_posts_input) // Changes Focused Searched Post (Shows The Previous Searched Post)
        else if(event.key === "ArrowDown") changeFocusedSearchedPost(feed_state.focused_searched_post_index + 1, all_searched_posts, search_posts_input) // Changes Focused Searched Post (Shows The Next Searched Post)

        else if(event.key === "Enter") {
            const searched_post:HTMLParagraphElement = ((all_searched_posts[feed_state.focused_searched_post_index] as HTMLDivElement).querySelector("p") as HTMLParagraphElement) // Gets The Searched Post
            let searched_posts_history:string[] = JSON.parse(localStorage.getItem("searched_posts_history") || "[]") as string[] // Gets The Searched Posts History From The Local Storage
            const searched_post_index = searched_posts_history.indexOf(searched_post.textContent)

            if(searched_post_index !== -1) searched_posts_history.splice(searched_post_index, 1) // Deletes The Previous Searched Post From The Searched Posts History
            searched_posts_history.unshift(searched_post.textContent) // Updates Searched Posts History
            if(searched_posts_history.length > feed_state.MAX_HISTORY_LENGTH) searched_posts_history = searched_posts_history.slice(0, feed_state.MAX_HISTORY_LENGTH) // Shows Maximum Of 3 Results From The Searched Posts History, Others Will Be Deleted From The Searched Posts History

            localStorage.setItem("searched_posts_history", JSON.stringify(searched_posts_history)) // Saves Updated Searched Posts History To The Local Storage

            search_posts_input.value = searched_post.textContent // Sets The Search Posts Input Value

            if(search_posts_timeout) clearTimeout(search_posts_timeout) // Deletes The Previous Search Posts Timeout
            feed_state.is_loading = true
            feed_report.textContent = gettext("Načítavam...")

            const all_post_containers:NodeListOf<HTMLDivElement> = feed.querySelectorAll<HTMLDivElement>(".post_container") // Gets All Post Containers
            all_post_containers.forEach(one_post_container => (one_post_container.querySelector(".loading") as HTMLDivElement).classList.remove("hidden")) // Shows The Loader

            // Gets The Posts After 2 Seconds Of Delay
            search_posts_timeout = window.setTimeout(function() {
                feed_state.current_page = 1
                feed_state.is_loading = false
                feed_state.has_more_posts = true
                all_post_containers.forEach(one_post_container => one_post_container.remove()) // Removes Every Post Container From The DOM
                loadPosts(feed, feed_report, search_posts_input, history_container) // Loads The Posts
            }, 2000)
        }
    })

    // Delete Search Posts Input Click Functionality
    delete_search_posts_input.addEventListener("click", function():void {
        if(search_posts_input.value !== "") {
            search_posts_input.value = "" // Deletes Search Posts Input Value

            if(search_posts_timeout) clearTimeout(search_posts_timeout) // Deletes The Previous Search Posts Timeout
            feed_state.is_loading = true
            feed_report.textContent = gettext("Načítavam...")

            const all_post_containers:NodeListOf<HTMLDivElement> = feed.querySelectorAll<HTMLDivElement>(".post_container") // Gets All Post Containers
            all_post_containers.forEach(one_post_container => (one_post_container.querySelector(".loading") as HTMLDivElement).classList.remove("hidden")) // Shows The Loader

            // Gets The Posts After 2 Seconds Of Delay
            search_posts_timeout = window.setTimeout(function() {
                feed_state.current_page = 1
                feed_state.is_loading = false
                feed_state.has_more_posts = true
                all_post_containers.forEach(one_post_container => one_post_container.remove()) // Removes Every Post Container From The DOM
                loadPosts(feed, feed_report, search_posts_input, history_container) // Loads The Posts
            }, 2000)
        }
    })

    // Global Event Delegations

    // Document Click Functionality
    document.addEventListener("click", function(event:PointerEvent):void {
        // When The User Clicks Outside The Search Bar, History Container Or Delete From History Icon
        if(!(event.target as HTMLElement).closest(".search_posts_container")) {
            hideHistoryContainer(search_posts_input, history_container) // Hides The History Container
            return
        }
    })

    // History Container Click Functionalities
    history_container.addEventListener("click", function(event:PointerEvent):void {
        let searched_posts_history:string[] = JSON.parse(localStorage.getItem("searched_posts_history") || "[]") as string[] // Gets The Searched Posts History From The Local Storage

        // Click On The Searched Post
        if(event.target instanceof HTMLParagraphElement) {
            const clicked_searched_post:string|null = (event.target as HTMLParagraphElement).dataset["searched_post"] || null // Gets The Searched Post For Deletion

            if(clicked_searched_post) {
                const clicked_searched_post_index = searched_posts_history.indexOf(clicked_searched_post)

                if(clicked_searched_post_index !== -1) searched_posts_history.splice(clicked_searched_post_index, 1) // Deletes The Previous Searched Post From The Searched Posts History
                searched_posts_history.unshift(clicked_searched_post) // Updates Searched Posts History
                if(searched_posts_history.length > feed_state.MAX_HISTORY_LENGTH) searched_posts_history = searched_posts_history.slice(0, feed_state.MAX_HISTORY_LENGTH) // Shows Maximum Of 3 Results From The Searched Posts History, Others Will Be Deleted From The Searched Posts History

                localStorage.setItem("searched_posts_history", JSON.stringify(searched_posts_history)) // Saves Updated Searched Posts History To The Local Storage

                search_posts_input.value = clicked_searched_post // Sets The Search Posts Input Value

                if(search_posts_timeout) clearTimeout(search_posts_timeout) // Deletes The Previous Search Posts Timeout
                feed_state.is_loading = true
                feed_report.textContent = gettext("Načítavam...")

                const all_post_containers:NodeListOf<HTMLDivElement> = feed.querySelectorAll<HTMLDivElement>(".post_container") // Gets All Post Containers
                all_post_containers.forEach(one_post_container => (one_post_container.querySelector(".loading") as HTMLDivElement).classList.remove("hidden")) // Shows The Loader

                // Gets The Posts After 2 Seconds Of Delay
                search_posts_timeout = window.setTimeout(function() {
                    feed_state.current_page = 1
                    feed_state.is_loading = false
                    feed_state.has_more_posts = true
                    all_post_containers.forEach(one_post_container => one_post_container.remove()) // Removes Every Post Container From The DOM
                    loadPosts(feed, feed_report, search_posts_input, history_container) // Loads The Posts
                }, 2000)
            }
        }

        // Click On The Delete From History Icon
        if((event.target as HTMLElement).classList.contains("delete_from_history")) {
            const searched_post_for_deletion:string|null = ((event.target as HTMLElement).nextSibling as HTMLParagraphElement).dataset["searched_post"] || null // Gets The Searched Post For Deletion

            if(searched_post_for_deletion) {
                searched_posts_history = searched_posts_history.filter(one_item => one_item !== searched_post_for_deletion) // Removes The Clicked Item From The Searched Posts History
                localStorage.setItem("searched_posts_history", JSON.stringify(searched_posts_history)) // Saves Updated Searched Posts History To The Local Storage
                checkSearchedPostsHistory(history_container, search_posts_input) // Checks Searched Posts History
            }
        }
    })

    // History Container Mouse Over Functionality
    history_container.addEventListener("mouseover", function(event:MouseEvent):void {
        // Change Appearance Of Delete From History Icon (Shows The X Icon)
        if((event.target as HTMLElement).classList.contains("delete_from_history")) {
            const delete_from_history:HTMLElement = event.target as HTMLElement // Gets The Delete From History Icon

            // Shows The X Icon
            if(delete_from_history.classList.contains("fa-clock-rotate-left")) {
                delete_from_history.classList.add("hidden");
                (delete_from_history.nextSibling as HTMLElement).classList.remove("hidden")
            }
        }
    })

    // History Container Mouse Out Functionality
    history_container.addEventListener("mouseout", function(event:MouseEvent):void {
        // Change Appearance Of Delete From History Icon (Shows The Clock Icon)
        if((event.target as HTMLElement).classList.contains("delete_from_history")) {
            const delete_from_history:HTMLElement = event.target as HTMLElement // Gets The Delete From History Icon

            // Shows The Clock Icon
            if(delete_from_history.classList.contains("fa-xmark")) {
                delete_from_history.classList.add("hidden");
                (delete_from_history.previousSibling as HTMLElement).classList.remove("hidden")
            }
        }
    })

    // History Container Key Functionalities
    history_container.addEventListener("keydown", function(event:KeyboardEvent):void {
        const all_searched_posts:NodeListOf<HTMLDivElement> = history_container.querySelectorAll(".searched_post") // Gets All Searched Posts

        if(event.key === "ArrowUp" || event.key === "ArrowDown") event.preventDefault()

        if(event.key === "ArrowUp") changeFocusedSearchedPost(feed_state.focused_searched_post_index - 1, all_searched_posts, search_posts_input) // Changes Focused Searched Post (Shows The Previous Searched Post)
        else if(event.key === "ArrowDown") changeFocusedSearchedPost(feed_state.focused_searched_post_index + 1, all_searched_posts, search_posts_input) // Changes Focused Searched Post (Shows The Next Searched Post)

        else if(event.key === "Enter") {
            const searched_post:HTMLParagraphElement = ((all_searched_posts[feed_state.focused_searched_post_index] as HTMLDivElement).querySelector("p") as HTMLParagraphElement) // Gets The Searched Post
            let searched_posts_history:string[] = JSON.parse(localStorage.getItem("searched_posts_history") || "[]") as string[] // Gets The Searched Posts History From The Local Storage
            const searched_post_index = searched_posts_history.indexOf(searched_post.textContent)

            if(searched_post_index !== -1) searched_posts_history.splice(searched_post_index, 1) // Deletes The Previous Searched Post From The Searched Posts History
            searched_posts_history.unshift(searched_post.textContent) // Updates Searched Posts History
            if(searched_posts_history.length > feed_state.MAX_HISTORY_LENGTH) searched_posts_history = searched_posts_history.slice(0, feed_state.MAX_HISTORY_LENGTH) // Shows Maximum Of 3 Results From The Searched Posts History, Others Will Be Deleted From The Searched Posts History

            localStorage.setItem("searched_posts_history", JSON.stringify(searched_posts_history)) // Saves Updated Searched Posts History To The Local Storage

            search_posts_input.value = searched_post.textContent // Sets The Search Posts Input Value

            if(search_posts_timeout) clearTimeout(search_posts_timeout) // Deletes The Previous Search Posts Timeout
            feed_state.is_loading = true
            feed_report.textContent = gettext("Načítavam...")

            const all_post_containers:NodeListOf<HTMLDivElement> = feed.querySelectorAll<HTMLDivElement>(".post_container") // Gets All Post Containers
            all_post_containers.forEach(one_post_container => (one_post_container.querySelector(".loading") as HTMLDivElement).classList.remove("hidden")) // Shows The Loader

            // Gets The Posts After 2 Seconds Of Delay
            search_posts_timeout = window.setTimeout(function() {
                feed_state.current_page = 1
                feed_state.is_loading = false
                feed_state.has_more_posts = true
                all_post_containers.forEach(one_post_container => one_post_container.remove()) // Removes Every Post Container From The DOM
                loadPosts(feed, feed_report, search_posts_input, history_container) // Loads The Posts
            }, 2000)
        }
    })
})