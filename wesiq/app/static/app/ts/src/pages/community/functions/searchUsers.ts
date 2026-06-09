import { sendPOST } from "../../../services/sendPOST.js"
import { displayMessage } from "../../../utils/displayMessage.js"

interface loadedUser {
    id:number,
    first_name:string,
    last_name:string,
    username:string,
    profile_picture_name:string,
    friend_code:string,
    followers:number,
    has_follow:boolean
}

interface firstLoadedUsersResponse {
    success: boolean,
    logged_in_user_id?:number,
    users:loadedUser[],
    message: string
}

interface searchedUser {
    id:number,
    first_name:string,
    last_name:string,
    username:string,
    profile_picture_name:string,
    friend_code:string,
    followers:number[]
}

interface searchedUsersResponse {
    success:boolean,
    logged_in_user_id?:number,
    users?:searchedUser[],
    message:string
}

// Function For Load The First Users For The Search Users Container
export async function loadFirstUsers(all_users_container:HTMLDivElement, one_user_template:HTMLTemplateElement):Promise<void> {
    let searched_users_history:string[] = JSON.parse(localStorage.getItem("searched_users_history") || "[]") as string[] // Gets The Searched Users History From The Local Storage

    try {
        const first_loaded_users_response:firstLoadedUsersResponse = await sendPOST(window.location.pathname, searched_users_history, "load-first-users") // Sends Searched Users History As A POST Data

        // If The Response Isn't Success
        if(!first_loaded_users_response.success) {
            displayMessage(first_loaded_users_response.message, "error") // Displays The Error Message
            return
        }

        first_loaded_users_response.users.forEach(one_user_data => all_users_container.appendChild(createLoadedUserHTML(one_user_template, one_user_data, first_loaded_users_response.logged_in_user_id))) // Creates The HTML For Every Loaded User
    }

    catch {
        displayMessage(gettext("Pri načítavaní užívateľov došlo k chybe."), "error") // Displays The Error Message
    }
}

// Function For Create Loaded User HTML
function createLoadedUserHTML(one_user_template:HTMLTemplateElement, user_data:loadedUser, logged_in_user_id?:number):HTMLAnchorElement {
    const one_user_template_clone:DocumentFragment = one_user_template.content.cloneNode(true) as DocumentFragment // Clones The One User Template Content
    
    // One User Link
    const one_user:HTMLAnchorElement = one_user_template_clone.querySelector(".one_user") as HTMLAnchorElement // Gets The One User Link
    one_user.href = interpolate(gettext("/sk/profil/%s"), [user_data.username]) // Sets The Link To The User's Profile
    one_user.dataset["id"] = String(user_data.id)
    one_user.dataset["full_name"] = `${user_data.first_name} ${user_data.last_name}`
    one_user.dataset["username"] = user_data.username
    one_user.dataset["friend_code"] = user_data.friend_code

    // Profile Picture
    const profile_picture:HTMLImageElement = one_user.querySelector(".profile_picture") as HTMLImageElement // Gets The Profile Picture 
    profile_picture.src = user_data.profile_picture_name ? `/../media/images/${user_data.id}/${user_data.profile_picture_name}` : "/../static/images/profile_picture.png" // Sets Profile Picture - https://www.flaticon.com/free-icon/user_3177440

    // Username
    const username:HTMLParagraphElement = one_user.querySelector(".username") as HTMLParagraphElement // Gets The Username Paragraph
    username.textContent = user_data.username

    // Full Name
    const full_name:HTMLParagraphElement = one_user.querySelector(".full_name") as HTMLParagraphElement // Gets The Full Name Paragraph
    full_name.textContent = `${user_data.first_name} ${user_data.last_name}`

    // Followers
    const followers:HTMLParagraphElement = one_user.querySelector(".followers") as HTMLParagraphElement // Gets The Followers Paragraph
    followers.textContent = String(user_data.followers)

    // Follow Button
    const follow_button:HTMLButtonElement = one_user.querySelector(".follow_button") as HTMLButtonElement // Gets The Follow Button
    const follow_icon:HTMLElement = follow_button.querySelector("i") as HTMLElement // Gets The Follow Icon

    if(logged_in_user_id) user_data.has_follow ? follow_icon.classList.add("fa-user-minus") : follow_icon.classList.add("fa-user-plus") // https://fontawesome.com/icons/user-plus https://fontawesome.com/icons/user-minus
    else follow_icon.classList.add("fa-user") // https://fontawesome.com/icons/user

    return one_user // Returns The One User Link
}

// Function For Get Searched Users
export async function getSearchedUsers(searched_text:string, all_users_container:HTMLDivElement, users_loading:HTMLDivElement):Promise<void> {
    try {
        const search_bar_response:searchedUsersResponse = await sendPOST(window.location.pathname, searched_text, "search-users") // Sends The Data With POST

        // If The Response Isn't Success
        if(!search_bar_response.success) {
            displayMessage(search_bar_response.message, "error") // Displays The Error Message
            return
        }

        if(search_bar_response.users) {
            all_users_container.innerHTML = "" // Deletes All Users Container

            // Renders Users
            search_bar_response.users.forEach(function(one_user_data:searchedUser) {
                renderUsers(one_user_data, all_users_container, search_bar_response.logged_in_user_id)
            })
        }
    }

    catch {
        displayMessage(gettext("Pri hľadaní užívateľov došlo k chybe."), "error") // Displays The Error Message
    }
    
    finally {
        users_loading.classList.add("hidden") // Hides The Loader
    }
}

// Function For Render Users From The POST Response
function renderUsers(user_data:searchedUser, all_users_container:HTMLDivElement, logged_in_user_id?:number):void {
    const one_user:HTMLAnchorElement = document.createElement("a") // Creates One User Container
    const profile_picture:HTMLImageElement = document.createElement("img") // Creates Profile Picture Image
    const username:HTMLParagraphElement = document.createElement("p") // Creates The Username Paragraph
    const full_name:HTMLParagraphElement = document.createElement("p") // Creates Full Name Paragraph
    const followers:HTMLParagraphElement = document.createElement("p") // Creates Followers Paragraph
    const follow_button:HTMLButtonElement = document.createElement("button") // Creates The Follow Button
    const follow_icon:HTMLElement = document.createElement("i") // Creates Follow Icon

    one_user.classList.add("one_user") // Adds One User Class
    one_user.href = interpolate(gettext("/sk/profil/%s"), [user_data.username]) // Sets The Link To The User's Profile
    one_user.title = gettext("Zobraziť užívateľa") // Sets The Title
    one_user.target = "_self" // Sets The Target
    one_user.dataset["id"] = String(user_data.id) // Stores User's ID
    one_user.dataset["full_name"] = `${user_data.first_name} ${user_data.last_name}`
    one_user.dataset["username"] = user_data.username
    one_user.dataset["friend_code"] = user_data.friend_code // Stores User's Friend Code
    all_users_container.appendChild(one_user) // Appends One User To The All Users Container

    profile_picture.classList.add("profile_picture") // Adds Profile Picture Class
    user_data.profile_picture_name ? profile_picture.src = `/../media/images/${user_data.id}/${user_data.profile_picture_name}` : profile_picture.src = "/../static/images/profile_picture.png" // Sets Profile Picture - https://www.flaticon.com/free-icon/user_3177440
    one_user.appendChild(profile_picture) // Appends The Profile Picture To The One User Container

    username.classList.add("username") // Adds The Username Class
    username.textContent = user_data.username // Sets The Username
    one_user.appendChild(username) // Appends The Username To The One User Container

    full_name.classList.add("full_name") // Adds The Full Name Class
    full_name.textContent = `${user_data.first_name} ${user_data.last_name}` // Sets First Name And Last Name
    one_user.appendChild(full_name) // Appends The Full Name To The One User Container

    followers.classList.add("followers") // Adds Followers Class
    followers.textContent = `${user_data.followers.length}` // Sets Followers Amount
    one_user.appendChild(followers) // Appends The Followers To The One User Container

    follow_button.classList.add("follow_button") // Adds The Follow Button Class
    one_user.appendChild(follow_button) // Appends The Follow Button To The One User Container
    
    follow_icon.classList.add("fa-solid")
    if(logged_in_user_id) !user_data.followers.includes(logged_in_user_id) ? follow_icon.classList.add("fa-user-plus") : follow_icon.classList.add("fa-user-minus") // https://fontawesome.com/icons/user-plus https://fontawesome.com/icons/user-minus
    else follow_icon.classList.add("fa-user") // https://fontawesome.com/icons/user
    follow_button.appendChild(follow_icon) // Appends The Follow Icon To The Follow Button
}

// Function For Reset Searched Users (Displays The Initial State)
export function resetSearchedUsers(search_bar:HTMLInputElement, all_users_container:HTMLDivElement, first_users:NodeListOf<HTMLAnchorElement>):void {
    search_bar.value = "" // Deletes Search Bar Value
    all_users_container.innerHTML = "" // Deletes All Users Container
    first_users.forEach(one_user => all_users_container.appendChild(one_user)) // Shows The First Loaded Users
}