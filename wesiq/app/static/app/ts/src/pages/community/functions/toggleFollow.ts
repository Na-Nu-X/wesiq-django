import { sendPOST } from "../../../services/sendPOST.js"
import { displayMessage } from "../../../utils/displayMessage.js";

import type { response } from "../../../services/sendPOST.js"

// Function For Toggle Follow
export async function toggleFollow(icon:HTMLElement|null, follow_button:HTMLButtonElement|null, user_to_follow_id:number|null):Promise<void> {
    try {
        const toggle_follow_response:response = await sendPOST(window.location.pathname, user_to_follow_id, "toggle-follow"); // Sends Clicked User ID As A POST Data

        // If The Response Isn't Success
        if(!toggle_follow_response.success) {
            displayMessage(toggle_follow_response.message, "error") // Displays The Error Message
            return
        }

        if(user_to_follow_id) {
            if(icon) {
                // Follow
                if(icon.classList.contains("fa-user-plus")) {
                    icon.classList.replace("fa-user-plus", "fa-user-minus") // Shows The Unfollow Icon
        
                    const followers_counter:HTMLParagraphElement = (icon.closest(".one_user") as HTMLDivElement).querySelector(".followers") as HTMLParagraphElement // Gets The Followers Counter
        
                    followers_counter.textContent = String(parseInt(followers_counter.textContent) + 1) // Increases The Followers Counter
                }
    
                // Unfollow
                else if(icon.classList.contains("fa-user-minus")) {
                    icon.classList.replace("fa-user-minus", "fa-user-plus") // Shows The Follow Icon
    
                    const followers_counter:HTMLParagraphElement = (icon.closest(".one_user") as HTMLDivElement).querySelector(".followers") as HTMLParagraphElement // Gets The Followers Counter
    
                    followers_counter.textContent = String(parseInt(followers_counter.textContent) - 1) // Decreases The Followers Counter
                }
            }

            if(follow_button) {
                const followers_counter:HTMLParagraphElement|null = (follow_button.parentElement as HTMLDivElement).querySelector(".followers_container .followers") as HTMLParagraphElement || null // Gets The Followers Counter If Is Available

                const follow_container:HTMLDivElement|null = follow_button.closest(".follow_container") as HTMLDivElement || null // Gets The Follow Container
                let followers:HTMLParagraphElement|null = null
                if(follow_container) followers = follow_container.querySelector(".followers .amount") as HTMLParagraphElement || null // Gets The Followers Paragraph

                // Follow
                if(follow_button.dataset["action"]?.trim() === "follow") {
                    follow_button.textContent = "Prestať sledovať"
                    follow_button.dataset["action"] = "unfollow"
    
                    if(followers_counter) followers_counter.textContent = String(parseInt(followers_counter.textContent) + 1) // Increases The Followers Counter
                    if(followers) followers.textContent = String(parseInt(followers.textContent) + 1) // Increases The Followers Counter
                }
    
                // Unfollow
                else if(follow_button.dataset["action"]?.trim() === "unfollow") {
                    follow_button.textContent = "Začať sledovať"
                    follow_button.dataset["action"] = "follow"
    
                    if(followers_counter) followers_counter.textContent = String(parseInt(followers_counter.textContent) - 1) // Decreases The Followers Counter
                    if(followers) followers.textContent = String(parseInt(followers.textContent) - 1) // Decreases The Followers Counter
                }
            }
        }
    }

    catch {
        displayMessage(gettext("Pri pridávaní sledovania došlo k chybe."), "error") // Displays The Error Message
    }
}