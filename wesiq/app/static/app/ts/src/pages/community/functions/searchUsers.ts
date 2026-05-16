import { sendPOST } from "../../../services/sendPOST.js"
import { displayMessage } from "../../../utils/displayMessage.js"

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

// Function For Get Searched Users
export async function getSearchedUsers(searched_text:string, all_users_container:HTMLDivElement, users_loading:HTMLDivElement):Promise<void> {
    try {
        const search_bar_response:searchedUsersResponse = await sendPOST(window.location.pathname, searched_text, "search-users") // Sends The Data With POST

        // If The Response Isn't Success
        if(!search_bar_response.success) {
            displayMessage(search_bar_response.message, "error") // Displays The Error Message
            return
        }

        if(search_bar_response.users && search_bar_response.logged_in_user_id) {
            all_users_container.innerHTML = "" // Deletes All Users Container

            // Renders Users
            search_bar_response.users.forEach(function(one_user_data:searchedUser) {
                if(search_bar_response.logged_in_user_id) renderUsers(one_user_data, search_bar_response.logged_in_user_id, all_users_container)
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
function renderUsers(user_data:searchedUser, logged_in_user_id:number, all_users_container:HTMLDivElement):void {
    const one_user:HTMLAnchorElement = document.createElement("a") // Creates One User Container
    const profile_picture:HTMLImageElement = document.createElement("img") // Creates Profile Picture Image
    const username:HTMLParagraphElement = document.createElement("p") // Creates The Username Paragraph
    const full_name:HTMLParagraphElement = document.createElement("p") // Creates Full Name Paragraph
    const followers:HTMLParagraphElement = document.createElement("p") // Creates Followers Paragraph
    const follow_unfollow_icon:HTMLElement = document.createElement("i") // Creates Follow / Unfollow Icon

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
    // profile_picture.classList.add("skeleton_loading") // Adds Skeleton Loading Class
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

    follow_unfollow_icon.classList.add("fa-solid") // Adds fa-solid Class From https://fontawesome.com/
    !user_data.followers.includes(logged_in_user_id) ? follow_unfollow_icon.classList.add("fa-user-plus") : follow_unfollow_icon.classList.add("fa-user-minus")
    one_user.appendChild(follow_unfollow_icon) // Appends The Follow / Unfollow Icon To The One User Container
}

// Function For Reset Searched Users (Displays The Initial State)
export function resetSearchedUsers(search_bar:HTMLInputElement, all_users_container:HTMLDivElement, first_users:NodeListOf<HTMLAnchorElement>):void {
    search_bar.value = "" // Deletes Search Bar Value
    all_users_container.innerHTML = "" // Deletes All Users Container
    first_users.forEach(one_user => all_users_container.appendChild(one_user)) // Shows The First Loaded Users
}