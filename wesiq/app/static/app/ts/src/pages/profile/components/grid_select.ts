"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Variables

    const profile_container:HTMLDivElement = document.querySelector(".profile_container") as HTMLDivElement // Gets The Profile Container
    const profile:HTMLDivElement = profile_container.querySelector(".profile") as HTMLDivElement // Gets The Profile Container
    const grid_select:HTMLDivElement|null = profile.querySelector(".bottom .grid_select") as HTMLDivElement || null // Gets The Grid Select Menu

    if(grid_select) {
        const all_posts_icon:HTMLButtonElement|null = grid_select.querySelector(".all_posts_icon") as HTMLButtonElement || null // Gets The All Posts Icon If Is Available
        const saved_posts_icon:HTMLButtonElement|null = grid_select.querySelector(".saved_posts_icon") as HTMLButtonElement || null // Gets The Saved Posts Icon If Is Available
        const posts_container:HTMLDivElement = profile.querySelector(".bottom .posts_container") as HTMLDivElement // Gets The Posts Container
        const saved_posts_container:HTMLDivElement = profile.querySelector(".bottom .saved_posts_container") as HTMLDivElement // Gets The Saved Posts Container

        // Events
    
        // All Posts Icon Click Functionality
        all_posts_icon.addEventListener("click", function():void {
            // Adds Active Class On The All Posts Icon
            saved_posts_icon.classList.remove("active")
            this.classList.add("active")

            // Shows The Posts Container
            posts_container.classList.remove("hidden") // Removes The Hidden Class
            posts_container.inert = false // Enables Focus

            saved_posts_container.classList.add("hidden") // Adds The Hidden Class
            saved_posts_container.inert = true // Disables Focus
        })
        
        // Saved Posts Icon Click Functionality
        saved_posts_icon.addEventListener("click", function():void {
            // Adds Active Class On The Saved Posts Icon
            all_posts_icon.classList.remove("active")
            this.classList.add("active")

            // Shows The Saved Posts Container
            saved_posts_container.classList.remove("hidden") // Removes The Hidden Class
            saved_posts_container.inert = false // Enables Focus

            posts_container.classList.add("hidden") // Adds The Hidden Class
            posts_container.inert = true // Disables Focus
        })
    }
})