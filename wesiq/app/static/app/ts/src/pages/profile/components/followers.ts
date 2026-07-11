import { removeFollower } from "../functions/removeFollower.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Followers

    // Variables

    const profile:HTMLDivElement = document.querySelector(".profile") as HTMLDivElement // Gets The Profile Container
    const follow_container:HTMLDivElement = profile.querySelector(".middle .follow_container") as HTMLDivElement // Gets The Follow Container
    const followers:HTMLDivElement = follow_container.querySelector(".statistics .followers") as HTMLDivElement // Gets The Followers Container
    const followers_dialog:HTMLDialogElement = follow_container.querySelector(".statistics .followers_dialog") as HTMLDialogElement // Gets The Followers Dialog
    const all_followers:HTMLDivElement = followers_dialog.querySelector(".all_followers") as HTMLDivElement // Gets The All Followers Container

    // Events

    // Followers Container Click Functionality
    followers.addEventListener("click", function():void {
        followers_dialog.showModal() // Shows The Follow Requests Dialog
    })

    // Followers Dialog Click Functionality
    followers_dialog.addEventListener("click", function(event:PointerEvent):void {
        const all_followers_rect:DOMRect = all_followers.getBoundingClientRect() // Gets The All Followers Container Rect

        if (
            event.clientX < all_followers_rect.left ||
            event.clientX > all_followers_rect.right ||
            event.clientY < all_followers_rect.top ||
            event.clientY > all_followers_rect.bottom ||
            (event.target as HTMLAnchorElement).classList.contains("back") ||
            ((event.target as HTMLElement).parentNode as HTMLAnchorElement).classList.contains("back")
        ) {
            this.close() // Closes The Followers Dialog
        }
    })

    // Toggle Follow

    // Global Event Delegations

    // All Followers Container Click Functionalities
    all_followers.addEventListener("click", async function(event:PointerEvent):Promise<void> {
        if((event.target as HTMLButtonElement).classList.contains("remove_follower")) {
            const remove_follower:HTMLButtonElement = event.target as HTMLButtonElement // Gets The Remove Follower Button
            const clicked_user_id:number|null = Number(remove_follower.dataset["id"]) || null // Gets Clicked User ID
            const one_follower:HTMLDivElement = remove_follower.closest(".one_follower") as HTMLDivElement // Gets The One Follower Container
            const followers_info:HTMLParagraphElement = followers_dialog.querySelector(".followers_info") as HTMLParagraphElement // Gets The Followers Info Paragraph
            const followers_amount:HTMLSpanElement = followers_info.querySelector(".followers_amount") as HTMLSpanElement // Gets The Followers Amount
            
            if(clicked_user_id) {
                await removeFollower(clicked_user_id) // Removes The Follower

                one_follower.classList.add("hidden") // Hides The One Follower Container
                followers_amount.textContent = Number(followers_amount.textContent) - 1 !== 0 ? String(Number(followers_amount.textContent) - 1) : followers_info.textContent = gettext("Žiadne žiadosti o sledovanie") // Updates The Followers Info Paragraph

                if(Number(followers_amount.textContent) - 1 > 0) {
                    followers_amount.textContent = String(Number(followers_amount.textContent) - 1) // Updates The Followers Info Paragraph
                }

                else {
                    followers_dialog.classList.add("no_followers") // Adds The No Followers Class
                    followers_info.textContent = gettext("Žiadny sledovatelia") // Updates The Followers Info Paragraph
                }
            }
        }
    })
})