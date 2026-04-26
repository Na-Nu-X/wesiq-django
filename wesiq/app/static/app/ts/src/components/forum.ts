import { sendPOST } from "../services/sendPOST.js"

import type { response } from "../services/sendPOST.js"

// Function For Toggle Like And Cancel Like
function toggleLike(icon:HTMLElement, counter:HTMLParagraphElement, id:string):void {
    icon.addEventListener("click", async function():Promise<void> {
        // If The Heart Is Empty
        if(this.classList.contains("fa-regular")) {
            try {
                const like_comment_response:response = await sendPOST(window.location.pathname, id, "like-comment") // Sends Liked Comment ID As A POST Data
    
                // If The Response Isn't Success
                if(!like_comment_response.success) {
                    console.error(like_comment_response.message)
                    return
                }

                this.classList.replace("fa-regular", "fa-solid") // Adds Filled Heart Image
                this.style.color = "#df3535" // Fills The Heart With Red Color
                counter.textContent = String(parseInt(counter.textContent) + 1) // Adds 1 Like To The Counter By Clicking On The Empty Heart
            }

            catch {
                console.error(gettext("Pri pridávaní označenia páči sa mi to došlo k chybe."))
            }
        }

        // If The Heart Is Already Clicked
        else if(this.classList.contains("fa-solid")) {
            try {
                const cancel_like_comment_response:response = await sendPOST(window.location.pathname, id, "cancel-like-comment") // Sends Liked Comment ID As A POST Data
    
                // If The Response Isn't Success
                if(!cancel_like_comment_response.success) {
                    console.error(cancel_like_comment_response.message)
                    return
                }

                this.classList.replace("fa-solid", "fa-regular") // Adds Empty Heart Image
                this.style.color = "#999999" // Fills The Heart With Gray Color
                counter.textContent = String(parseInt(counter.textContent) - 1) // Subtracts 1 Like To The Counter By Clicking On The Already Clicked Heart
            }

            catch {
                console.error(gettext("Pri rušení označenia páči sa mi to došlo k chybe."))
            }
        }
    })
}

// Function For Toggle Show And Hide Reply Form
function toggleReply(icon:HTMLElement, form:HTMLFormElement):void {
    icon.addEventListener("click", function():void {
        form.classList.toggle("visible") // Shows And Hides The Form

        if(form.classList.contains("visible")) this.classList.replace("fa-reply", "fa-xmark") // Shows Close Icon
        else if(!form.classList.contains("visible")) this.classList.replace("fa-xmark", "fa-reply") // Shows Reply Icon
    })
}

// Function For Add Functionality For Comments
export function commentFunctionality(one_comment:HTMLDivElement):void {
    const one_comment_id:string|undefined = one_comment.dataset["id"] // Gets Comment ID From The Data Value

    if(!one_comment_id) return

    // LIKE
    const heart:HTMLElement = one_comment.querySelector(".interactions .likes .fa-heart") as HTMLElement // Gets Heart Icon
    const likes_counter:HTMLParagraphElement = one_comment.querySelector(".interactions .likes .likes_counter") as HTMLParagraphElement // Gets Like Counter

    // If User Already Liked The Comment
    if(heart.classList.contains("fa-solid")) heart.style.color = "#df3535" // Fills The Heart With Red Color
    
    toggleLike(heart, likes_counter, one_comment_id) // Adds Or Removes Like From The Comment

    // REPLY
    const reply:HTMLElement = one_comment.querySelector(".interactions .reply .fa-solid") as HTMLElement // Gets Reply Icon
    const reply_comment_form:HTMLFormElement = one_comment.querySelector(".reply_comment_form") as HTMLFormElement // Gets Reply Comment Form

    toggleReply(reply, reply_comment_form) // Shows / Hides Reply Comment Form

    // REPORT
    const flag:HTMLElement = one_comment.querySelector(".interactions .report .fa-flag") as HTMLElement

    flag.addEventListener("click", async function():Promise<void> {
        try {
            const report_comment_response:response = await sendPOST(window.location.pathname, one_comment_id, "report-comment") // Sends Reported Commet ID As A POST Data

            // If The Response Isn't Success
            if(!report_comment_response.success) {
                console.error(report_comment_response.message)
                return
            }
        }

        catch {
            console.error(gettext("Pri odosielaní nahlásenia došlo k chybe."))
        }
    })
}