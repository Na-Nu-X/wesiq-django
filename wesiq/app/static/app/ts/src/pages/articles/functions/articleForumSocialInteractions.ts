import { sendPOST } from "../../../services/sendPOST.js"
import { displayMessage } from "../../../utils/displayMessage.js"

import type { response } from "../../../services/sendPOST.js"

// Function For Toggle Article Comment Like
export async function toggleArticleCommentLike(icon:HTMLElement, counter:HTMLParagraphElement, id:number):Promise<void> {
    try {
        const toggle_article_comment_like_response:response = await sendPOST(window.location.pathname, id, "toggle-article-comment-like") // Sends Liked Article ID As A POST Data

        // If The Response Isn't Success
        if(!toggle_article_comment_like_response.success) {
            displayMessage(toggle_article_comment_like_response.message, "error") // Displays The Error Message
            return
        }

        // If The Heart Is Empty
        if(icon.classList.contains("fa-regular")) {
            icon.classList.replace("fa-regular", "fa-solid") // Adds Filled Heart Image
            counter.textContent = String(parseInt(counter.textContent) + 1) // Adds 1 Like To The Counter By Clicking On The Empty Heart
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

// Function For Report The Comment
export async function reportArticleComment(id:number, reason:string):Promise<void> {
    try {
        const report_comment_data:{
            articleforum_id:number,
            reason:string
        } = {
            articleforum_id: id,
            reason
        }

        const report_article_comment_response:response = await sendPOST(window.location.pathname, report_comment_data, "report-article-comment") // Sends Reported Comment Data As A POST Data

        // If The Response Isn't Success
        if(!report_article_comment_response.success) {
            displayMessage(report_article_comment_response.message, "error") // Displays The Error Message
            return
        }

        displayMessage(report_article_comment_response.message, "success") // Displays The Success Message
    }

    catch {
        displayMessage(gettext("Pri odosielaní nahlásenia došlo k chybe."), "error") // Displays The Error Message
    }
}

// Function For Delete The Comment
export async function deleteArticleComment(id:number, one_comment:HTMLDivElement, comments_counter:HTMLParagraphElement):Promise<void> {
    try {
        const reply_container:HTMLDivElement|null = (one_comment.parentElement as HTMLDivElement).classList.contains("reply_container") ? one_comment.parentElement as HTMLDivElement : null // Gets The Reply Container
        const deleted_comments_amount:number = one_comment.querySelectorAll<HTMLDivElement>(".one_comment").length + 1 // Gets The Total Amount Of Deleted Comments (All Nested Replies + 1 Root Comment)
        const delete_article_comment_response:response = await sendPOST(window.location.pathname, id, "delete-article-comment") // Sends Comment ID As A POST Data

        // If The Response Isn't Success
        if(!delete_article_comment_response.success) {
            displayMessage(delete_article_comment_response.message, "error") // Displays The Error Message
            return
        }

        one_comment.remove() // Deletes The One Comment Container From DOM
        comments_counter.textContent = String(Number(comments_counter.textContent) - deleted_comments_amount) // Decreases The Comments Counter

        if(reply_container && reply_container.children.length === 0) deleteShowRepliesIcon(reply_container) // Deletes The Show Replies Icon From The Comment If There Aren't Any Replies Left
    }

    catch {
        displayMessage(gettext("Pri odosielaní nahlásenia došlo k chybe."), "error") // Displays The Error Message
    }
}

// Function For Delete The Show Replies Icon From The Comment
function deleteShowRepliesIcon(reply_container:HTMLDivElement):void {
    const one_comment:HTMLDivElement = reply_container.parentElement as HTMLDivElement // Gets The One Comment Container
    const show_replies:HTMLDivElement = one_comment.querySelector(".interactions .show_replies") as HTMLDivElement // Gets The Show Replies Container

    show_replies.remove() // Removes The Show Replies Container From DOM
}