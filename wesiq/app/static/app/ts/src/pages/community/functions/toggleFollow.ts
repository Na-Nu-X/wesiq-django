import { sendPOST } from "../../../services/sendPOST.js"

import type { response } from "../../../services/sendPOST.js"

// Function For Toggle Follow
export async function toggleFollow(icon:HTMLElement|null, follow_button:HTMLDivElement|null, user_to_follow_id:number|null):Promise<void> {
    try {
        const toggle_follow_response:response = await sendPOST(window.location.pathname, user_to_follow_id, "toggle-follow"); // Sends Clicked User ID As A POST Data

        // If The Response Isn't Success
        if(!toggle_follow_response.success) {
            console.error(toggle_follow_response.message)
            return
        }

        if(user_to_follow_id) {
            if(icon) {
                // Follow
                if(icon.classList.contains("fa-user-plus")) {
                    icon.classList.replace("fa-user-plus", "fa-user-minus") // Shows The Unfollow Icon
        
                    const followers_counter:HTMLParagraphElement = (icon.parentNode as HTMLDivElement).querySelector(".followers") as HTMLParagraphElement // Gets The Followers Counter
        
                    followers_counter.textContent = String(parseInt(followers_counter.textContent) + 1) // Increases The Followers Counter
                }
    
                // Unfollow
                else if(icon.classList.contains("fa-user-minus")) {
                    icon.classList.replace("fa-user-minus", "fa-user-plus") // Shows The Follow Icon
    
                    const followers_counter:HTMLParagraphElement = (icon.parentNode as HTMLDivElement).querySelector(".followers") as HTMLParagraphElement // Gets The Followers Counter
    
                    followers_counter.textContent = String(parseInt(followers_counter.textContent) - 1) // Decreases The Followers Counter
                }
            }

            if(follow_button) {
                // Follow
                if(follow_button.dataset["action"]?.trim() === "follow") {
                    follow_button.textContent = "Prestať sledovať"
                    follow_button.dataset["action"] = "unfollow"

                    const followers_counter:HTMLParagraphElement = (follow_button.parentElement as HTMLDivElement).querySelector(".followers_container .followers") as HTMLParagraphElement // Gets The Followers Counter
        
                    followers_counter.textContent = String(parseInt(followers_counter.textContent) + 1) // Increases The Followers Counter
                }
    
                // Unfollow
                else if(follow_button.dataset["action"]?.trim() === "unfollow") {
                    follow_button.textContent = "Začať sledovať"
                    follow_button.dataset["action"] = "follow"

                    const followers_counter:HTMLParagraphElement = (follow_button.parentElement as HTMLDivElement).querySelector(".followers_container .followers") as HTMLParagraphElement // Gets The Followers Counter
    
                    followers_counter.textContent = String(parseInt(followers_counter.textContent) - 1) // Decreases The Followers Counter
                }
            }
        }
    }

    catch(error) {
        console.log(error)

        console.error(gettext("Pri pridávaní sledovania došlo k chybe."))
    }
}