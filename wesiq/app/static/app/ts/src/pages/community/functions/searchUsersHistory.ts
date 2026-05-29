import { search_users_state } from "../state.js"

// Function For Store The Searched User To The History
export function storeSearchedUserToHistory(username:string):void {
    let searched_users_history:string[] = JSON.parse(localStorage.getItem("searched_users_history") || "[]") as string[] // Gets The Searched Users History From The Local Storage

    // Stores The New Result
    if(!searched_users_history.includes(username)) {
        searched_users_history.unshift(username) // Updates The Searched Users History
        if(searched_users_history.length > search_users_state.MAX_HISTORY_LENGTH) searched_users_history = searched_users_history.slice(0, search_users_state.MAX_HISTORY_LENGTH) // Shows Maximum Of 3 Results From The Searched Users History, Others Will Be Deleted From The Searched Users History
        localStorage.setItem("searched_users_history", JSON.stringify(searched_users_history)) // Saves Updated Searched Users History To The Local Storage
    }

    // Updates The Order
    else {
        const searched_user_index = searched_users_history.indexOf(username)

        if(searched_user_index !== -1) searched_users_history.splice(searched_user_index, 1) // Deletes The Previous Searched User From The Searched Users History
        searched_users_history.unshift(username) // Updates Searched Users History
        if(searched_users_history.length > search_users_state.MAX_HISTORY_LENGTH) searched_users_history = searched_users_history.slice(0, search_users_state.MAX_HISTORY_LENGTH) // Shows Maximum Of 3 Results From The Searched Users History, Others Will Be Deleted From The Searched Users History

        localStorage.setItem("searched_users_history", JSON.stringify(searched_users_history)) // Saves Updated Searched Users History To The Local Storage
    }
}