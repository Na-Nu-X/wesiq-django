"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Variables

    const profile_container:HTMLDivElement = document.querySelector(".profile_container") as HTMLDivElement // Gets The Profile Container
    const profile:HTMLDivElement = profile_container.querySelector(".profile") as HTMLDivElement // Gets The Profile Container
    const grid_select:HTMLDivElement|null = profile.querySelector(".bottom .grid_select") as HTMLDivElement || null // Gets The Grid Select Menu

    if(grid_select) {
        const all_posts_icon:HTMLElement = grid_select.querySelector(".all_posts_icon") as HTMLElement // Gets The All Posts Icon
        const saved_posts_icon:HTMLElement = grid_select.querySelector(".saved_posts_icon") as HTMLElement // Gets The Saved Posts Icon
        const posts_container:HTMLDivElement = profile.querySelector(".bottom .posts_container") as HTMLDivElement // Gets The Posts Container
        const saved_posts_container:HTMLDivElement = profile.querySelector(".bottom .saved_posts_container") as HTMLDivElement // Gets The Saved Posts Container

        // Events
    
        // All Posts Icon Click Functionality
        all_posts_icon.addEventListener("click", function():void {
            // Adds Active Class On The All Posts Icon
            saved_posts_icon.classList.remove("active")
            this.classList.add("active")

            // Shows The Posts Container
            posts_container.classList.remove("hidden")
            saved_posts_container.classList.add("hidden")
        })
    
        // Saved Posts Icon Click Functionality
        saved_posts_icon.addEventListener("click", function():void {
            // Adds Active Class On The Saved Posts Icon
            all_posts_icon.classList.remove("active")
            this.classList.add("active")

            // Shows The Saved Posts Container
            saved_posts_container.classList.remove("hidden")
            posts_container.classList.add("hidden")
        })
    }
})