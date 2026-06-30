import { toggleFollow } from "../../community/functions/toggleFollow.js"
import { sharePost } from "../../community/functions/postSocialInteractions.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Post Feed

    // Variables

    const feed:HTMLDivElement = document.querySelector(".feed") as HTMLDivElement // Gets The Feed Container

    // Global Event Delegations

    // Feed Click Functionalities
    feed.addEventListener("click", function(event:PointerEvent):void {
        // Post Container
        if((event.target as HTMLElement).closest(".post_container") as HTMLDivElement) {
            // Follow Button Click Functionalities
            if((event.target as HTMLDivElement).classList.contains("follow_button")) {
                event.preventDefault() // Prevents Redirect To The User's Profile

                const follow_button:HTMLButtonElement = event.target as HTMLButtonElement // Gets The Follow Button
                const clicked_user_id:number|null = Number(follow_button.dataset["id"]) || null // Gets Clicked User ID
                toggleFollow(follow_button, clicked_user_id)
            }

            // Share Post
            if((event.target as HTMLElement).classList.contains("fa-share-nodes")) {
                const share_icon:HTMLElement = event.target as HTMLElement // Gets The Share Icon
                const share:HTMLDivElement = share_icon.closest(".share") as HTMLDivElement // Gets The Share Container
                const post_container:HTMLDivElement = share_icon.closest(".post_container") as HTMLDivElement // Gets The Post Container

                if(post_container.dataset["post_id"] && share.dataset["author"]) sharePost(Number(post_container.dataset["post_id"]), share.dataset["author"]) // Shares The Post
            }
        }
    })
})