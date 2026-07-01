import { 
    loadFirstUsers,
    getSearchedUsers,
    resetSearchedUsers
} from "../functions/searchUsers.js"

import { storeSearchedUserToHistory } from "../functions/searchUsersHistory.js"
import { toggleFollow } from "../functions/toggleFollow.js"

"use strict"

document.addEventListener("DOMContentLoaded", async function():Promise<void> {
    // Search Users

    // Variables

    const search_bar_container:HTMLDivElement = document.querySelector(".search_bar_container") as HTMLDivElement // Gets Search Bar Container
    const search_bar:HTMLInputElement = search_bar_container.querySelector(".search_bar") as HTMLInputElement // Gets The Search Bar Input
    const delete_search_bar:HTMLButtonElement = search_bar_container.querySelector(".delete_search_bar") as HTMLButtonElement // Gets The Delete Search Bar Button

    const search_result_container:HTMLDivElement = document.querySelector(".search_result_container") as HTMLDivElement // Gets The Search Result Container
    const one_user_template:HTMLTemplateElement = search_result_container.querySelector(".one_user_template") as HTMLTemplateElement // Gets The One User Template
    const all_users_container:HTMLDivElement = search_result_container.querySelector(".all_users") as HTMLDivElement // Gets The All Users Container
    const logged_in_user_id:number|null = Number(all_users_container.dataset["logged_in_user_id"]) || null // Gets The Logged In User ID

    await loadFirstUsers(all_users_container, one_user_template, logged_in_user_id) // Loads The First Users For The Search Users Container
    let all_users:NodeListOf<HTMLAnchorElement> = all_users_container.querySelectorAll<HTMLAnchorElement>(".one_user") // Gets All Users
    const first_users:NodeListOf<HTMLAnchorElement> = all_users // Stores First Loaded Users

    const users_loading:HTMLDivElement = search_result_container.querySelector(".search_result_container .loading") as HTMLDivElement // Gets The Loading

    let previous_search_bar_length:number = 0 // Stores The Previous Search Bar Input Length
    let search_users_timeout:number // Debounce Timeout Between Requests

    // Events

    // Search Bar Input Functionalities
    search_bar.addEventListener("input", async function() {
        if(this.value.trim() !== "") {
            all_users.forEach(one_user => one_user.classList.remove("hidden")) // Shows All Hidden Users
            
            // Gets Users From The DB If The First Character Is Entered
            if(this.value.length === 1 && previous_search_bar_length !== 2) {
                users_loading.classList.remove("hidden") // Shows The Loader

                if(search_users_timeout) clearTimeout(search_users_timeout) // Deletes The Previous Search Users Timeout

                // Gets The Users After 1 Second Of Delay
                search_users_timeout = window.setTimeout(function():void {
                    getSearchedUsers(search_bar.value, all_users_container, users_loading) // Gets The Searched Users
                }, 1000)
            }

            // Filters Users From Already Obtained Users
            else {
                all_users = all_users_container.querySelectorAll<HTMLAnchorElement>(".one_user") // Gets All Users

                // Gets Unmatched Users
                const filtered_users:HTMLAnchorElement[] = [...all_users].filter(function(one_user:HTMLAnchorElement):boolean {
                    // Filters By Full Name, Username And By Friend Code
                    const full_name:string = one_user.dataset["full_name"]?.toLowerCase() || ""
                    const username:string = one_user.dataset["username"]?.toLowerCase() || ""
                    const friend_code:string = one_user.dataset["friend_code"]?.toLowerCase() || ""
                    const text:string = search_bar.value.toLowerCase() || ""

                    return (
                        !full_name.includes(text) && 
                        !username.includes(text) && 
                        !friend_code.includes(text)
                    )
                })

                filtered_users.forEach(one_user => one_user.classList.add("hidden")) // Hides Unmatched Users
            }

            previous_search_bar_length = this.value.length // Sets The Previous Search Bar Length
        }

        else resetSearchedUsers(search_bar, all_users_container, first_users) // Resets The Searched Users
    })

    // Delete Search Bar Click Functionality
    delete_search_bar.addEventListener("click", () => resetSearchedUsers(search_bar, all_users_container, first_users)) // Resets The Searched Users

    // Global Event Delegations

    // All Users Container Click Functionalities
    all_users_container.addEventListener("click", function(event:PointerEvent):void {
        // Toggle Follow
        if((event.target as HTMLElement).closest(".follow_button")) {
            event.preventDefault() // Prevents Redirect To The User's Profile
            const follow_button:HTMLButtonElement = event.target as HTMLButtonElement // Gets The Follow Button
            const clicked_user_id:number|null = Number(((event.target as HTMLElement).closest(".one_user") as HTMLDivElement).dataset["id"]) || null // Gets Clicked User ID
            toggleFollow(follow_button, clicked_user_id)
        }

        // Store User To The Searched Users History 
        if(
            event.target instanceof HTMLAnchorElement ||
            (event.target as HTMLElement).parentElement instanceof HTMLAnchorElement
        ) {
            const one_user:HTMLAnchorElement = (event.target as HTMLElement).closest(".one_user") as HTMLAnchorElement // Gets The One User
            const username:HTMLParagraphElement = one_user.querySelector(".username") as HTMLParagraphElement // Gets The Username Paragraph

            storeSearchedUserToHistory(username.textContent) // Stores The Searched User To The Searched Users History 
        }
    })

    // All Users Container Keydown Functionalities
    all_users_container.addEventListener("keydown", function(event:KeyboardEvent):void {
        if(event.key === "Enter") {
            // Toggle Follow
            if((event.target as HTMLButtonElement).classList.contains("follow_button")) {
                event.preventDefault() // Prevents Redirect To The User's Profile
                const follow_button:HTMLButtonElement = event.target as HTMLButtonElement // Gets The Follow Button
                const clicked_user_id:number|null = Number(((event.target as HTMLElement).closest(".one_user") as HTMLDivElement).dataset["id"]) || null // Gets Clicked User ID
                toggleFollow(follow_button, clicked_user_id)
            }
        }
    })
})