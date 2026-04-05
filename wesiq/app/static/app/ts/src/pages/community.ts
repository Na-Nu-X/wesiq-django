import { sendPOST } from "../services/sendPOST.js"

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

    const loading:HTMLDivElement = all_users_container.querySelector(".loading") as HTMLDivElement // Gets Loading

    let previous_search_bar_length:number = 0 // Stores The Previous Search Bar Input Length

    // Functions

    // Function For Add Follow
    function follow(event:PointerEvent):void {
        event.preventDefault() // Prevents Redirect To The User's Profile

        const clicked_user_id:string = ((event.target as HTMLElement).parentNode as HTMLDivElement).dataset["id"] || "" // Gets Clicked User ID

        sendPOST(`/follow/${clicked_user_id}/`); // Sends Clicked User ID As A POST Data To Follow Page
        (event.target as HTMLElement).classList.replace("fa-user-plus", "fa-user-minus") // Shows The Unfollow Icon

        const followers_counter:HTMLParagraphElement = ((event.target as HTMLElement).parentNode as HTMLDivElement).querySelector(".followers") as HTMLParagraphElement // Gets The Followers Counter

        followers_counter.textContent = String(parseInt(followers_counter.textContent) + 1) // Increases The Followers Counter
    }

    // Function For Remove Follow
    function unfollow(event:PointerEvent):void {
        event.preventDefault() // Prevents Redirect To The User's Profile

        const clicked_user_id:string = ((event.target as HTMLElement).parentNode as HTMLDivElement).dataset["id"] || "" // Gets Clicked User ID

        sendPOST(`/unfollow/${clicked_user_id}/`); // Sends Clicked User ID As A POST Data To Unfollow Page
        (event.target as HTMLElement).classList.replace("fa-user-minus", "fa-user-plus") // Shows The Follow Icon

        const followers_counter:HTMLParagraphElement = ((event.target as HTMLElement).parentNode as HTMLDivElement).querySelector(".followers") as HTMLParagraphElement // Gets The Followers Counter

        followers_counter.textContent = String(parseInt(followers_counter.textContent) - 1) // Decreases The Followers Counter
    }

    // Function For Render Users From The POST Response
    function renderUsers(user_data:user, logged_in_user_id:number):void {
        const one_user:HTMLAnchorElement = document.createElement("a") // Creates One User Container
        const profile_picture:HTMLImageElement = document.createElement("img") // Creates Profile Picture Image
        const user_name:HTMLParagraphElement = document.createElement("p") // Creates User Name Paragraph
        const followers:HTMLParagraphElement = document.createElement("p") // Creates Followers Paragraph
        const follow_unfollow_icon:HTMLElement = document.createElement("i") // Creates Follow / Unfollow Icon

        one_user.classList.add("one_user") // Adds One User Class
        one_user.href = "#" // Sets The Link To The User's Profile
        one_user.title = gettext("Zobraziť užívateľa") // Sets The Title
        one_user.target = "_self" // Sets The Target
        one_user.dataset["id"] = String(user_data.id) // Stores User's ID
        one_user.dataset["friend_code"] = String(user_data.friend_code) // Stores User's Friend Code
        all_users_container.appendChild(one_user) // Appends One User To The All Users Container

        profile_picture.classList.add("profile_picture") // Adds Profile Picture Class
        // profile_picture.classList.add("skeleton_loading") // Adds Skeleton Loading Class
        user_data.profile_picture_name ? profile_picture.src = `/../media/images/${user_data.id}/${user_data.profile_picture_name}` : profile_picture.src = "/../static/images/profile_picture.png" // Sets Profile Picture Name
        one_user.appendChild(profile_picture) // Appends The Profile Picture To The One User Container

        user_name.classList.add("user_name") // Adds User Name Class
        user_name.textContent = `${user_data.first_name} ${user_data.last_name}` // Sets First Name And Last Name
        one_user.appendChild(user_name) // Appends The User Name To The One User Container

        followers.classList.add("followers") // Adds Followers Class
        followers.textContent = `${user_data.followers.length}` // Sets Followers Amount
        one_user.appendChild(followers) // Appends The Followers To The One User Container

        follow_unfollow_icon.classList.add("fa-solid") // Adds fa-solid Class From https://fontawesome.com/
        !user_data.followers.includes(String(logged_in_user_id)) ? follow_unfollow_icon.classList.add("fa-user-plus") : follow_unfollow_icon.classList.add("fa-user-minus")
        one_user.appendChild(follow_unfollow_icon) // Appends The Follow / Unfollow Icon To The One User Container
    }

    // Function For Reset Searched Users (Displays The Initial State)
    function resetSearchedUsers():void {
        search_bar.value = "" // Deletes Search Bar Value
        all_users_container.innerHTML = "" // Deletes All Users Container
        first_users.forEach(one_user => all_users_container.appendChild(one_user)) // Shows The First Loaded Users
    }

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