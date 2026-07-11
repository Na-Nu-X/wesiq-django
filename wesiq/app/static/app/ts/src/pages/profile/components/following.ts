import { toggleFollow } from "../../community/functions/toggleFollow.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Following

    // Variables

    const profile:HTMLDivElement = document.querySelector(".profile") as HTMLDivElement // Gets The Profile Container
    const follow_container:HTMLDivElement = profile.querySelector(".middle .follow_container") as HTMLDivElement // Gets The Follow Container
    const following:HTMLDivElement = follow_container.querySelector(".statistics .following") as HTMLDivElement // Gets The Following Container
    const following_dialog:HTMLDialogElement = follow_container.querySelector(".statistics .following_dialog") as HTMLDialogElement // Gets The Following Dialog
    const all_followings:HTMLDivElement = following_dialog.querySelector(".all_followings") as HTMLDivElement // Gets The All Followings Container

    // Events

    // Following Container Click Functionality
    following.addEventListener("click", function():void {
        following_dialog.showModal() // Shows The Follow Requests Dialog
    })

    // Following Dialog Click Functionality
    following_dialog.addEventListener("click", function(event:PointerEvent):void {
        const all_followings_rect:DOMRect = all_followings.getBoundingClientRect() // Gets The All Followings Container Rect

        if (
            event.clientX < all_followings_rect.left ||
            event.clientX > all_followings_rect.right ||
            event.clientY < all_followings_rect.top ||
            event.clientY > all_followings_rect.bottom ||
            (event.target as HTMLAnchorElement).classList.contains("back") ||
            ((event.target as HTMLElement).parentNode as HTMLAnchorElement).classList.contains("back")
        ) {
            this.close() // Closes The Following Dialog
        }
    })

    // Toggle Follow

    // Global Event Delegations

    // All Followings Container Click Functionalities
    all_followings.addEventListener("click", function(event:PointerEvent):void {
        if((event.target as HTMLButtonElement).classList.contains("follow_button")) {
            const follow_button:HTMLButtonElement = event.target as HTMLButtonElement // Gets The Follow Button
            const clicked_user_id:number|null = Number(follow_button.dataset["id"]) || null // Gets Clicked User ID
            
            toggleFollow(follow_button, clicked_user_id) // Adds Or Removes The Follow
        }
    })
})