import { sendPOST } from "../../services/sendPOST.js"

interface user {
    id:number,
    first_name:string,
    last_name:string,
    profile_picture_name:string,
    friend_code:string,
    following:string[],
    followers:string[]
}

interface searchBarResponse {
    success:boolean,
    logged_in_user_id:number,
    users:user[]
}

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
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
                        search_bar_response.users.forEach(one_user_data => renderUsers(one_user_data, search_bar_response.logged_in_user_id)) // Renders Users
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

        else resetSearchedUsers() // Resets The Searched Users
    })

    delete_search_bar.addEventListener("click", resetSearchedUsers) // Delete Search Bar Icon Click Functionality
})