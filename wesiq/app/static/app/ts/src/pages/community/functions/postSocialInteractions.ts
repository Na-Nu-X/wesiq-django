import { sendPOST } from "../../../services/sendPOST.js"
import { generateNumberRange } from "../../../utils/generateNumberRange.js"
import { displayMessage } from "../../../utils/displayMessage.js"

import type { response } from "../../../services/sendPOST.js"

// Function For Toggle Post Like
export async function togglePostLike(icon:HTMLElement, counter:HTMLParagraphElement|null, id:number, particles:HTMLDivElement):Promise<void> {
    try {
        const toggle_post_like_response:response = await sendPOST(window.location.pathname, id, "toggle-post-like") // Sends Liked Post ID As A POST Data

        // If The Response Isn't Success
        if(!toggle_post_like_response.success) {
            displayMessage(toggle_post_like_response.message, "error") // Displays The Error Message
            return
        }

        // If The Heart Is Empty
        if(icon.classList.contains("fa-regular")) {
            generateHeartParticles(particles) // Generates The Heart Particles
            icon.classList.replace("fa-regular", "fa-solid") // Adds Filled Heart Image
            if(counter) counter.textContent = String(parseInt(counter.textContent) + 1) // Adds 1 Like To The Counter By Clicking On The Empty Heart
        }

        // If The Heart Is Already Clicked
        else if(icon.classList.contains("fa-solid")) {
            icon.classList.replace("fa-solid", "fa-regular") // Adds Empty Heart Image
            if(counter) counter.textContent = String(parseInt(counter.textContent) - 1) // Subtracts 1 Like To The Counter By Clicking On The Already Clicked Heart
        }
    }

    catch {
        displayMessage(gettext("Pri zmene označenia páči sa mi to došlo k chybe."), "error") // Displays The Error Message
    }
}

// Function For Share The Post
export async function sharePost(id:number, author:string):Promise<void> {
    const link:string = interpolate(gettext("/sk/prispevok/%s"), [id]) // Sets The Link To The Post

    // Creates And Fill Object With Data Values
    const share_data:{
        title:string,
        url:string
    } = {
        title: `Wesiq - Príspevok užívateľa ${author}`,
        url: window.location.origin + link
    }

    try {
        if(navigator.share) {
            await navigator.share(share_data) // Opens The Share Menu
            return
        }

        await navigator.clipboard.writeText(window.location.origin + link) // Copies The Link

        displayMessage("Odkaz bol skopírovaný", "success") // Displays The Success Message
    }
    
    catch {
        displayMessage("Odkaz sa nepodarilo skopírovať", "error") // Displays The Error Message
    }
}

// Function For Save Or Unsave The Post
export async function togglePostSave(icon:HTMLElement, id:number):Promise<void> {
    try {
        const toggle_post_save_response:response = await sendPOST(window.location.pathname, id, "toggle-post-save") // Sends Saved Post ID As A POST Data

        // If The Response Isn't Success
        if(!toggle_post_save_response.success) {
            displayMessage(toggle_post_save_response.message, "error") // Displays The Error Message
            return
        }

        // Save (If The Save Icon Is Inactive)
        if(!icon.classList.contains("active")) {
            icon.classList.add("active") // Adds The Active Class
            icon.classList.replace("fa-regular", "fa-solid") // Adds Filled Bookmark Image
        }

        // Unsave (If The Save Icon Is Active)
        else if(icon.classList.contains("active")) {
            icon.classList.remove("active") // Removes The Active Class
            icon.classList.replace("fa-solid", "fa-regular") // Adds Empty Bookmark Image
        }
    }

    catch {
        displayMessage(gettext("Pri zmene uloženia príspevku došlo k chybe."), "error") // Displays The Error Message
    }
}

// Function For Report The Post
export async function reportPost(id:number, reason:string):Promise<void> {
    try {
        const report_post_data:{
            post_id:number,
            reason:string
        } = {
            post_id: id,
            reason
        }

        const report_post_response:response = await sendPOST(window.location.pathname, report_post_data, "report-post") // Sends Reported Post Data As A POST Data

        // If The Response Isn't Success
        if(!report_post_response.success) {
            displayMessage(report_post_response.message, "error") // Displays The Error Message
            return
        }

        displayMessage(report_post_response.message, "success") // Displays The Success Message
    }

    catch {
        displayMessage(gettext("Pri odosielaní nahlásenia došlo k chybe."), "error") // Displays The Error Message
    }
}

// Function For Generates The Heart Particles
function generateHeartParticles(particles:HTMLDivElement):void {
    particles.innerHTML = "" // Deletes The Particles Container

    const heart_amount:number = generateNumberRange(1, 5) // 1 - 5 Hearts

    for(let i:number = 0; i < heart_amount; i++) {
        // https://fontawesome.com/icons/heart
        const heart:HTMLElement = document.createElement("i") // Creates The Heart Icon 
        const heart_classes:string[] = ["fa-solid", "fa-regular"] // Stores The Heart Classes
        const random_heart_classes_index:number = Math.floor(Math.random() * heart_classes.length) // Gets The Random Index Of Heart Classes
    
        heart.classList.add("fa-heart", heart_classes[random_heart_classes_index] as string) // Adds The Classes

        heart.style.setProperty("--x", `${generateNumberRange(20, 110)}px`) // Generates And Sets The Random X Position
        heart.style.setProperty("--y", `-${generateNumberRange(20, 110)}px`) // Generates And Sets The Random Y Position

        particles.appendChild(heart) // Appends The Heart To The Particles Container
    }
}

// Function For Edit The Post Settings
export async function editPostSettings(id:number, toggle_button:HTMLInputElement, icon:HTMLElement):Promise<void> {
    if(
        toggle_button.classList.contains("public_visibility") ||
        toggle_button.classList.contains("allow_comments") ||
        toggle_button.classList.contains("hide_likes")
    ) {
        try {
            const edit_post_settings_data:{
                post_id:number,
                setting:string,
                action:boolean
            } = {
                post_id: id,
                setting: toggle_button.classList[0] as string,
                action: toggle_button.classList.contains("hide_likes") ? !toggle_button.checked : toggle_button.checked
            }
    
            const edit_post_settings_response:response = await sendPOST(window.location.pathname, edit_post_settings_data, "edit-post-settings") // Sends Edited Post Data As A POST Data
    
            // If The Response Isn't Success
            if(!edit_post_settings_response.success) {
                displayMessage(edit_post_settings_response.message, "error") // Displays The Error Message
                return
            }
    
            displayMessage(edit_post_settings_response.message, "success") // Displays The Success Message
        }
    
        catch {
            displayMessage(gettext("Pri úprave príspevku došlo k chybe."), "error") // Displays The Error Message
        }

        finally {
            // Toggle Public Visibility
            if(toggle_button.classList.contains("public_visibility")) {
                !toggle_button.checked ? icon.classList.replace("fa-eye", "fa-eye-low-vision") : icon.classList.replace("fa-eye-low-vision", "fa-eye") // https://fontawesome.com/icons/eye-low-vision / https://fontawesome.com/icons/eye
            }

            // Toggle Comments
            else if(toggle_button.classList.contains("allow_comments")) {
                !toggle_button.checked ? icon.classList.replace("fa-comment", "fa-comment-slash") : icon.classList.replace("fa-comment-slash", "fa-comment") // https://fontawesome.com/icons/comment-slash / https://fontawesome.com/icons/comment
            }

            // Toggle Likes Visibility
            else if(toggle_button.classList.contains("hide_likes")) {
                !toggle_button.checked ? icon.classList.replace("fa-solid", "fa-regular") : icon.classList.replace("fa-regular", "fa-solid") // https://fontawesome.com/icons/heart / https://fontawesome.com/icons/heart
            }
        }
    }
}

// Function For Delete The Post
export async function deletePost(id:number, post_container:HTMLDivElement):Promise<void> {
    try {
        const delete_post_response:response = await sendPOST(window.location.pathname, id, "delete-post") // Sends Post ID As A POST Data

        // If The Response Isn't Success
        if(!delete_post_response.success) {
            displayMessage(delete_post_response.message, "error") // Displays The Error Message
            return
        }

        post_container.remove() // Deletes The Post Container From DOM
        displayMessage(delete_post_response.message, "success") // Displays The Success Message
    }

    catch {
        displayMessage(gettext("Pri odstraňovaní príspevku došlo k chybe."), "error") // Displays The Error Message
    }
}