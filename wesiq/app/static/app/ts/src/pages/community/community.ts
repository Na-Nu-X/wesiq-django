import { sendPOST } from "../../services/sendPOST.js"
import { syncFiles } from "./functions/postPreview.js"
import { posts_preview_state } from "./state.js"

import { 
    follow,
    unfollow,
    renderUsers,
    resetSearchedUsers
} from "./functions/searchUsers.js"

import type { 
    searchBarResponse
} from "./functions/searchUsers.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Search Users

    // Variables

    const search_bar_container:HTMLDivElement = document.querySelector(".search_bar_container") as HTMLDivElement // Gets Search Bar Container
    const search_bar:HTMLInputElement = search_bar_container.querySelector(".search_bar") as HTMLInputElement // Gets The Search Bar Input
    const delete_search_bar:HTMLElement = search_bar_container.querySelector(".fa-xmark") as HTMLElement // Gets The Delete Search Bar Icon

    const all_users_container:HTMLDivElement = document.querySelector(".all_users") as HTMLDivElement // Gets The All Users Container

    let all_users:NodeListOf<HTMLAnchorElement> = all_users_container.querySelectorAll<HTMLAnchorElement>(".one_user") // Gets All Users
    const first_users:NodeListOf<HTMLAnchorElement> = all_users // Stores First Loaded Users

    const loading:HTMLDivElement = document.querySelector(".search_result_container .loading") as HTMLDivElement // Gets Loading

    let previous_search_bar_length:number = 0 // Stores The Previous Search Bar Input Length

    // Global Event Delegations

    all_users_container.addEventListener("click", function(event:PointerEvent):void {
        if((event.target as HTMLElement).classList.contains("fa-user-plus")) follow(event) // Follow
        else if((event.target as HTMLElement).classList.contains("fa-user-minus")) unfollow(event) // Unfollow
    })

    // Events

    // Search Bar Input Functionalities
    search_bar.addEventListener("input", async function() {
        if(this.value.trim() !== "") {
            all_users.forEach(one_user => one_user.classList.remove("hidden")) // Shows All Hidden Users
            
            // Gets Users From The DB If The First Character Is Entered
            if(this.value.length === 1 && previous_search_bar_length !== 2) {
                loading.classList.remove("hidden") // Shows The Loader

                try {
                    const search_bar_response:searchBarResponse = await sendPOST(window.location.pathname, this.value) // Sends The Data With POST

                    if(search_bar_response.success) {
                        all_users_container.innerHTML = "" // Deletes All Users Container
                        search_bar_response.users.forEach(one_user_data => renderUsers(one_user_data, search_bar_response.logged_in_user_id, all_users_container)) // Renders Users
                        all_users = all_users_container.querySelectorAll<HTMLAnchorElement>(".one_user") // Gets All Users
                    }
                }

                catch(error) {
                    console.error(gettext("An Error Occurred While Searching for Users."), error)
                }
                
                finally {
                    loading.classList.add("hidden") // Hides The Loader
                }
            }

            // Filters Users From Already Obtained Users
            else {
                // Gets Unmatched Users
                const filtered_users:HTMLAnchorElement[] = [...all_users].filter(function(one_user:HTMLAnchorElement):boolean {
                    return (
                        !(one_user.querySelector(".user_name") as HTMLParagraphElement).textContent.toLowerCase().includes(search_bar.value.toLowerCase()) && // Filters By User Name
                        !(one_user.dataset["friend_code"]!.includes(search_bar.value)) // Filters By Friend Code
                    )
                })

                filtered_users.forEach(one_user => one_user.classList.add("hidden")) // Hides Unmatched Users
            }

            previous_search_bar_length = this.value.length // Sets The Previous Search Bar Length
        }

        else resetSearchedUsers(search_bar, all_users_container, first_users) // Resets The Searched Users
    })

    // Delete Search Bar Icon Click Functionality
    delete_search_bar.addEventListener("click", function():void {
        resetSearchedUsers(search_bar, all_users_container, first_users) // Resets The Searched Users
    })

    // Upload Post Form Dialog

    // Variables

    const upload_post_icon:HTMLElement = document.querySelector(".upload_post .fa-photo-film") as HTMLElement // Gets The Upload Post Icon
    const upload_post_form_dialog:HTMLDialogElement = document.querySelector(".upload_post_form_dialog") as HTMLDialogElement // Gets The Upload Post Form Dialog
    const upload_post_form:HTMLFormElement = upload_post_form_dialog.querySelector(".upload_post_form") as HTMLFormElement // Gets The Upload Post Form

    const select_posts:HTMLInputElement = upload_post_form.querySelector("#select_posts") as HTMLInputElement // Gets The Select Posts Input
    const posts_preview:HTMLDivElement = upload_post_form.querySelector(".posts_preview") as HTMLDivElement // Gets The Posts Preview

    const post_info_container:HTMLDivElement = upload_post_form.querySelector(".post_info_container") as HTMLDivElement // Gets The Post Info Container

    const description:HTMLTextAreaElement = upload_post_form.querySelector("textarea") as HTMLTextAreaElement // Gets The Description Textarea

    const public_visibility:HTMLElement = post_info_container.querySelector(".icons .settings .public_visibility") as HTMLElement // Gets The Public Visibility Icon
    const allow_comments:HTMLElement = post_info_container.querySelector(".icons .settings .allow_comments") as HTMLElement // Gets The Allow Comments Icon
    const hide_likes:HTMLElement = post_info_container.querySelector(".icons .settings .hide_likes") as HTMLElement // Gets The Hide Likes Icon

    const tag_people:HTMLElement = post_info_container.querySelector(".icons .tags .tag_people") as HTMLElement // Gets The Tag People Icon
    const add_hashtag:HTMLElement = post_info_container.querySelector(".icons .tags .add_hashtag") as HTMLElement // Gets The Add Hashtag Icon

    // Events

    upload_post_icon.addEventListener("click", function():void {
        upload_post_form_dialog.showModal() // Shows The Upload Post Form Dialog
    })

    upload_post_form_dialog.addEventListener("click", function(event:PointerEvent):void {
        const upload_post_form_dimensions:DOMRect = upload_post_form.getBoundingClientRect() // Gets The Upload Post Form Dimensions

        if (
            event.clientX < upload_post_form_dimensions.left ||
            event.clientX > upload_post_form_dimensions.right ||
            event.clientY < upload_post_form_dimensions.top ||
            event.clientY > upload_post_form_dimensions.bottom ||
            (event.target as HTMLAnchorElement).classList.contains("back") ||
            ((event.target as HTMLElement).parentNode as HTMLAnchorElement).classList.contains("back")
        ) {
            this.close() // Hides The Upload Post Form Dialog
        }
    })

    // Public Visibility Click Functionalities
    public_visibility.addEventListener("click", function(event:PointerEvent):void {
        // Sets The Private Visibility
        if((event.target as HTMLElement).classList.contains("fa-eye")) {
            (event.target as HTMLElement).classList.replace("fa-eye", "fa-eye-low-vision");
            (event.target as HTMLElement).title = gettext("Vypnúť viditeľnosť len pre sledovateľov")
        }

        // Sets The Public Visibility
        else if((event.target as HTMLElement).classList.contains("fa-eye-low-vision")) {
            (event.target as HTMLElement).classList.replace("fa-eye-low-vision", "fa-eye");
            (event.target as HTMLElement).title = gettext("Zapnúť viditeľnosť len pre sledovateľov")
        }
    })
    
    // Allow Comments Click Functionalities
    allow_comments.addEventListener("click", function(event:PointerEvent):void {
        // Disables The Comments
        if((event.target as HTMLElement).classList.contains("fa-comment")) {
            (event.target as HTMLElement).classList.replace("fa-comment", "fa-comment-slash");
            (event.target as HTMLElement).title = gettext("Zapnúť komentáre")
        }
        
        // Enables The Comments
        else if((event.target as HTMLElement).classList.contains("fa-comment-slash")) {
            (event.target as HTMLElement).classList.replace("fa-comment-slash", "fa-comment");
            (event.target as HTMLElement).title = gettext("Vypnúť komentáre")
        }
    })

    // Hide Likes Click Functionalities
    hide_likes.addEventListener("click", function(event:PointerEvent):void {
        // Hides The Like Counter
        if((event.target as HTMLElement).classList.contains("fa-solid")) {
            (event.target as HTMLElement).classList.replace("fa-solid", "fa-regular");
            (event.target as HTMLElement).title = gettext("Zobraziť počet označení páči sa mi to")
        }

        // Shows The Like Counter
        else if((event.target as HTMLElement).classList.contains("fa-regular")) {
            (event.target as HTMLElement).classList.replace("fa-regular", "fa-solid");
            (event.target as HTMLElement).title = gettext("Skryť počet označení páči sa mi to")
        }
    })

    tag_people.addEventListener("click", function():void {
        if(description.value.length < description.maxLength) {
            description.value += "@"
        }
    })

    add_hashtag.addEventListener("click", function():void {
        if(description.value.length < description.maxLength) {
            description.value += "#"
        }
    })

    // Select Posts Change Functionalities
    select_posts.addEventListener("change", function():void {
        if(!this.files) return
        
        const new_files = [...this.files] // Gets New Selected Files

        posts_preview_state.current_files = [...posts_preview_state.current_files, ...new_files] // Updates An Array of Current Files

        syncFiles(this, posts_preview) // Synchronizes Files
    })
})