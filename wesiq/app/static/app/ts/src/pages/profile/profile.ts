"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Variables

    const profile_container:HTMLDivElement = document.querySelector(".profile_container") as HTMLDivElement // Gets The Profile Container
    const profile:HTMLDivElement = profile_container.querySelector(".profile") as HTMLDivElement // Gets The Profile Container
    const grid_select:HTMLDivElement|null = profile.querySelector(".bottom .grid_select") as HTMLDivElement || null // Gets The Grid Select Menu

    if(grid_select) {
        const all_posts_icon:HTMLElement = grid_select.querySelector(".fa-buffer") as HTMLElement // Gets The All Posts Icon
        const saved_posts_icon:HTMLElement = grid_select.querySelector(".fa-bookmark") as HTMLElement // Gets The Saved Posts Icon
        const posts_container:HTMLDivElement = profile.querySelector(".bottom .posts_container") as HTMLDivElement // Gets The Posts Container
        const saved_posts_container:HTMLDivElement = profile.querySelector(".bottom .saved_posts_container") as HTMLDivElement // Gets The Saved Posts Container
    
        all_posts_icon.addEventListener("click", function():void {
            posts_container.classList.remove("hidden")
            saved_posts_container.classList.add("hidden")
        })
    
        saved_posts_icon.addEventListener("click", function():void {
            saved_posts_container.classList.remove("hidden")
            posts_container.classList.add("hidden")
        })
    }
})