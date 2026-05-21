import { sendPOST } from "../../../services/sendPOST.js"
import { getFormattedDate } from "../../../utils/getFormattedDate.js"
import { displayMessage } from "../../../utils/displayMessage.js"
import { createCommentPropertiesHTML } from "./createCommentPropertiesHTML.js"

import type { comment } from "./createCommentPropertiesHTML.js"

interface addCommentResponse {
    success: boolean,

    logged_in_user:{
        logged_in_user_id:number,
    },

    comment:comment,
    message: string
}

// Function For Add Comment
export async function addComment(post_id:number, write_comment_form:HTMLDivElement, all_comments:HTMLDivElement, feed:HTMLDivElement, parent_id:number|null, comments_counter:HTMLParagraphElement):Promise<void> {
    try {
        const comment_input:HTMLDivElement = write_comment_form.querySelector(".comment") as HTMLDivElement // Gets The Comment Input

        const comment_data:{
            post_id:number,
            comment:string,
            parent_id:number|null
        } = {
            post_id: Number(post_id),
            comment: comment_input.textContent,
            parent_id: parent_id
        }

        const add_comment_response:addCommentResponse = await sendPOST(window.location.pathname, comment_data, "add-comment") // Sends The Data With POST

        // If The Response Isn't Success
        if(!add_comment_response.success) {
            displayMessage(add_comment_response.message, "error") // Displays The Error Message
            return
        }

        const one_comment_template:HTMLTemplateElement = feed.querySelector(".one_comment_template") as HTMLTemplateElement // Gets The One Comment Template
        const one_comment_template_clone:DocumentFragment = one_comment_template.content.cloneNode(true) as DocumentFragment // Clones The One Comment Template Content
        const one_comment_container:HTMLDivElement = one_comment_template_clone.querySelector(".one_comment") as HTMLDivElement // Gets The One Comment Container

        const report_template:HTMLTemplateElement = feed.querySelector(".report_template") as HTMLTemplateElement // Gets The Report Template
        const report_template_clone:DocumentFragment = report_template.content.cloneNode(true) as DocumentFragment // Clones The Report Template Content
        const report_container:HTMLDivElement = report_template_clone.querySelector(".report") as HTMLDivElement // Gets The Report Container
        
        one_comment_container.dataset["comment_id"] = String(add_comment_response.comment.id) // Stores The Comment ID

        // Comment Author Profile Picture Link
        const comment_author_profile_picture_link:HTMLAnchorElement = one_comment_container.querySelector(".comment_container .user a") as HTMLAnchorElement // Gets The Comment Author Profile Picture Link
        comment_author_profile_picture_link.href = interpolate(gettext("/sk/profil/%s"), [add_comment_response.comment.user.username]) // Sets The Link To The User's Profile
        comment_author_profile_picture_link.title = gettext("Zobraziť užívateľa")

        // Comment Author Profile Picture
        const comment_author_profile_picture:HTMLImageElement = comment_author_profile_picture_link.querySelector(".profile_picture") as HTMLImageElement // Gets The Comment Author Profile Picture 
        comment_author_profile_picture.src = add_comment_response.comment.user.profile_picture_name ? `/../media/images/${add_comment_response.comment.user.id}/${add_comment_response.comment.user.profile_picture_name}` : "/../static/images/profile_picture.png" // Sets Profile Picture - https://www.flaticon.com/free-icon/user_3177440

        // Comment Author Username
        const comment_author_username:HTMLParagraphElement = one_comment_container.querySelector(".comment_container .user .username") as HTMLParagraphElement // Gets The Comment Author Username
        comment_author_username.classList.add("username") // Adds The Username Class
        comment_author_username.textContent = add_comment_response.comment.user.username // Sets The Comment Author Username Text

        // Comment Properties
        createCommentPropertiesHTML(one_comment_container, report_container, add_comment_response.comment, add_comment_response.logged_in_user.logged_in_user_id) // Creates The Comment Properties HTML

        // Comment
        const comment:HTMLParagraphElement = one_comment_container.querySelector(".comment_container .right .comment") as HTMLParagraphElement // Gets The Comment Paragraph
        comment.textContent = comment_input.textContent // Sets The Comment Text

        // Likes
        const likes:HTMLDivElement = one_comment_container.querySelector(".comment_container .right .likes") as HTMLDivElement // Gets The Likes Container

        const like_icon:HTMLElement = likes.querySelector(".fa-heart") as HTMLElement // Gets The Heart Icon
        like_icon.classList.add("fa-regular") // Shows The Empty Heart Icon - https://fontawesome.com/icons/heart

        // Likes Counter
        const likes_counter:HTMLParagraphElement = likes.querySelector(".likes_counter") as HTMLParagraphElement // Gets The Likes Counter
        likes_counter.textContent = "0" // Sets The Likes Counter
        likes.appendChild(likes_counter) // Appends The Likes Counter To The Likes

        comment_input.innerHTML = "" // Deletes The Comment Input

        if(parent_id) {
            const parent_comment:HTMLDivElement|null = all_comments.querySelector(`[data-comment_id="${parent_id}"]`) as HTMLDivElement || null

            write_comment_form.dataset["parent_id"] = "";
            (write_comment_form.querySelector(".comment") as HTMLDivElement).dataset["placeholder"] = gettext("Napísať komentár")

            if(parent_comment) {
                const reply_container:HTMLDivElement = parent_comment.querySelector(".reply_container") as HTMLDivElement // Gets The Reply Container
                const icon:HTMLElement = parent_comment.querySelector(".interactions .reply i") as HTMLElement
    
                icon.classList.remove("fa-solid", "fa-xmark") // https://fontawesome.com/icons/xmark
                icon.classList.add("fa-regular", "fa-comment") // https://fontawesome.com/icons/comment
    
                reply_container.prepend(one_comment_container) // Prepends The One Comment Container To The Reply Container
                reply_container.classList.remove("hidden") // Shows The Reply Container

                if(add_comment_response.comment.level === 2) {
                    one_comment_container.classList.add("first_level_reply")
                }
            }
        }

        else {
            all_comments.prepend(one_comment_container)
        }

        // Interactions
        const interactions:HTMLDivElement = one_comment_container.querySelector(".interactions") as HTMLDivElement // Gets The Comment Interactions Container

        // Reply
        // Displays The Reply Option Only If The Nested Level Of The Comment Is Less Than 5
        if(add_comment_response.comment.level < 5) {
            const reply:HTMLDivElement = document.createElement("div") // Creates The Reply Container
            reply.classList.add("reply") // Adds The Reply Class
            reply.title = gettext("Odpovedať...")
            reply.innerHTML = "<i class='fa-regular fa-comment'></i>" // https://fontawesome.com/icons/comment
            interactions.prepend(reply) // Prepends The Reply Container To The Interactions
        }

        // Date
        const date:HTMLDivElement = interactions.querySelector(".date") as HTMLDivElement // Gets The Date Container

        const date_paragraph:HTMLParagraphElement = date.querySelector("p") as HTMLParagraphElement // Gets The Date Paragraph
        date_paragraph.textContent = getFormattedDate(add_comment_response.comment.creation_time)

        // Show Replies
        const new_parent_comment:HTMLDivElement|null = (one_comment_container.parentElement as HTMLDivElement).closest(".one_comment") as HTMLDivElement || null // Gets The New Parent Comment (If Is Not In The 1st Level)

        if(new_parent_comment) {
            const new_parent_comment_interactions:HTMLDivElement = new_parent_comment.querySelector(".interactions") as HTMLDivElement // Gets The Interactions Container Of The New Parent Comment

            // Checks If The Toggle Show Replies Button Isn't Already In DOM
            if(!new_parent_comment_interactions.querySelector(".show_replies")) {
                const show_replies:HTMLDivElement = document.createElement("div") // Creates The Show Replies Container
                show_replies.classList.add("show_replies") // Adds The Show Replies Class
                show_replies.title = gettext("Zobraziť odpovede...")
                show_replies.innerHTML = "<i class='fa-solid fa-angle-down'></i>" // Adds The Icon
                new_parent_comment_interactions.insertBefore(show_replies, new_parent_comment_interactions.querySelector(".date") as HTMLDivElement) // Appends The Show Replies To The New Parent Comment
            }
        }

        comments_counter.textContent = String(Number(comments_counter.textContent) + 1) // Increases The Comments Counter
    }

    catch {
        displayMessage(gettext("Pri odosielaní komentáru došlo k chybe."), "error") // Displays The Error Message
    }
}

// Function For Toggle Visibility Of The Comment Replies
export function toggleShowReplies(icon:HTMLElement, reply_container:HTMLDivElement):void {
    // Shows The Replies
    if(reply_container.classList.contains("hidden")) {
        icon.classList.replace("fa-angle-down", "fa-angle-up") // Shows The Up Icon
        reply_container.classList.remove("hidden") // Shows The Replies
    }

    // Hides The Replies
    else {
        icon.classList.replace("fa-angle-up", "fa-angle-down") // Shows The Down Icon
        reply_container.classList.add("hidden") // Hides The Replies
    }
}

// Function For Toggle Reply On Comment
export function toggleReplyOnComment(icon:HTMLElement, write_comment_form:HTMLDivElement, one_comment:HTMLDivElement):void {
    // Reply
    if(icon.classList.contains("fa-comment")) {
        if(!write_comment_form.dataset["parent_id"] || write_comment_form.dataset["parent_id"].trim() === "") {
            // https://fontawesome.com/icons/comment-slash
            icon.classList.replace("fa-regular", "fa-solid")
            icon.classList.replace("fa-comment", "fa-comment-slash")

            write_comment_form.dataset["parent_id"] = one_comment.dataset["comment_id"]; // Stores The Parent ID
            (write_comment_form.querySelector(".comment") as HTMLDivElement).dataset["placeholder"] = interpolate(gettext("Odpoveď užívateľovi %s"), [(one_comment.querySelector(".comment_container .user .username") as HTMLParagraphElement).textContent]) // Sets The Placeholder
        }
    }
    
    // Cancel Reply
    else {
        // https://fontawesome.com/icons/comment
        icon.classList.replace("fa-solid", "fa-regular")
        icon.classList.replace("fa-comment-slash", "fa-comment")

        write_comment_form.dataset["parent_id"] = "";
        (write_comment_form.querySelector(".comment") as HTMLDivElement).dataset["placeholder"] = gettext("Napísať komentár")
    }
}