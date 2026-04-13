import { sendPOST } from "../../../services/sendPOST.js";

export interface searchedUser {
    id:number,
    first_name:string,
    last_name:string,
    profile_picture_name:string,
    friend_code:string,
    following:string[],
    followers:string[]
}

export interface searchedUsersResponse {
    success:boolean,
    logged_in_user_id:number,
    users:searchedUser[]
}

// Function For Add Follow
export function follow(event:PointerEvent):void {
    event.preventDefault() // Prevents Redirect To The User's Profile

    const clicked_user_id:string = ((event.target as HTMLElement).parentNode as HTMLDivElement).dataset["id"] || "" // Gets Clicked User ID

    sendPOST(`/follow/${clicked_user_id}/`); // Sends Clicked User ID As A POST Data To Follow Page
    (event.target as HTMLElement).classList.replace("fa-user-plus", "fa-user-minus") // Shows The Unfollow Icon

    const followers_counter:HTMLParagraphElement = ((event.target as HTMLElement).parentNode as HTMLDivElement).querySelector(".followers") as HTMLParagraphElement // Gets The Followers Counter

    followers_counter.textContent = String(parseInt(followers_counter.textContent) + 1) // Increases The Followers Counter
}

// Function For Remove Follow
export function unfollow(event:PointerEvent):void {
    event.preventDefault() // Prevents Redirect To The User's Profile

    const clicked_user_id:string = ((event.target as HTMLElement).parentNode as HTMLDivElement).dataset["id"] || "" // Gets Clicked User ID

    sendPOST(`/unfollow/${clicked_user_id}/`); // Sends Clicked User ID As A POST Data To Unfollow Page
    (event.target as HTMLElement).classList.replace("fa-user-minus", "fa-user-plus") // Shows The Follow Icon

    const followers_counter:HTMLParagraphElement = ((event.target as HTMLElement).parentNode as HTMLDivElement).querySelector(".followers") as HTMLParagraphElement // Gets The Followers Counter

    followers_counter.textContent = String(parseInt(followers_counter.textContent) - 1) // Decreases The Followers Counter
}

// Function For Render Users From The POST Response
export function renderUsers(user_data:searchedUser, logged_in_user_id:number, all_users_container:HTMLDivElement):void {
    const one_user:HTMLAnchorElement = document.createElement("a") // Creates One User Container
    const profile_picture:HTMLImageElement = document.createElement("img") // Creates Profile Picture Image
    const full_name:HTMLParagraphElement = document.createElement("p") // Creates Full Name Paragraph
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

    full_name.classList.add("full_name") // Adds Full Name Class
    full_name.textContent = `${user_data.first_name} ${user_data.last_name}` // Sets First Name And Last Name
    one_user.appendChild(full_name) // Appends The Full Name To The One User Container

    followers.classList.add("followers") // Adds Followers Class
    followers.textContent = `${user_data.followers.length}` // Sets Followers Amount
    one_user.appendChild(followers) // Appends The Followers To The One User Container

    follow_unfollow_icon.classList.add("fa-solid") // Adds fa-solid Class From https://fontawesome.com/
    !user_data.followers.includes(String(logged_in_user_id)) ? follow_unfollow_icon.classList.add("fa-user-plus") : follow_unfollow_icon.classList.add("fa-user-minus")
    one_user.appendChild(follow_unfollow_icon) // Appends The Follow / Unfollow Icon To The One User Container
}

// Function For Reset Searched Users (Displays The Initial State)
export function resetSearchedUsers(search_bar:HTMLInputElement, all_users_container:HTMLDivElement, first_users:NodeListOf<HTMLAnchorElement>):void {
    search_bar.value = "" // Deletes Search Bar Value
    all_users_container.innerHTML = "" // Deletes All Users Container
    first_users.forEach(one_user => all_users_container.appendChild(one_user)) // Shows The First Loaded Users
}