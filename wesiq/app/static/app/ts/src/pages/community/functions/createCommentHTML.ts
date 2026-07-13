import { createCommentPropertiesHTML } from "./createCommentPropertiesHTML.js"
import { getFormattedDate } from "../../../utils/getFormattedDate.js"

import type { comment } from "./createCommentPropertiesHTML.js"

// Function For Create Comment HTML Structure
export function createCommentHTML(feed:HTMLDivElement, all_comments:HTMLDivElement, one_visible_comment:comment, post_container:HTMLDivElement, logged_in_user_id:number|null, logged_in_user_role:"developer"|"admin"|"user"|"unauthorized"):DocumentFragment {
    const user_id:number = Number(post_container.dataset["user_id"]) // Gets The Post Author's ID
    const username:string = post_container.dataset["username"] as string // Gets The Post Author's Username
    const profile_picture_name:string = post_container.dataset["profile_picture_name"] as string // Gets The Post Author's Profile Picture Name

    const one_comment_template:HTMLTemplateElement = feed.querySelector(".one_comment_template") as HTMLTemplateElement // Gets The One Comment Template
    const one_comment_template_clone:DocumentFragment = one_comment_template.content.cloneNode(true) as DocumentFragment // Clones The One Comment Template Content
    const one_comment_container:HTMLDivElement = one_comment_template_clone.querySelector(".one_comment") as HTMLDivElement // Gets The One Comment Container

    const report_template:HTMLTemplateElement = feed.querySelector(".report_template") as HTMLTemplateElement // Gets The Report Template
    const report_template_clone:DocumentFragment = report_template.content.cloneNode(true) as DocumentFragment // Clones The Report Template Content
    const report_container:HTMLDivElement = report_template_clone.querySelector(".report") as HTMLDivElement // Gets The Report Container

    one_comment_container.dataset["comment_id"] = String(one_visible_comment.id) // Stores The Comment ID

    // Comment Author Profile Picture Link
    const comment_author_profile_picture_link:HTMLAnchorElement = one_comment_container.querySelector(".comment_container .user a") as HTMLAnchorElement // Gets The Comment Author Profile Picture Link
    comment_author_profile_picture_link.href = interpolate(gettext("/sk/profil/%s"), [username]) // Sets The Link To The User's Profile
    comment_author_profile_picture_link.title = gettext("Zobraziť užívateľa")
    comment_author_profile_picture_link.ariaLabel = gettext("Zobraziť užívateľa")

    // Comment Author Profile Picture
    const comment_author_profile_picture:HTMLImageElement = comment_author_profile_picture_link.querySelector(".profile_picture") as HTMLImageElement // Gets The Comment Author Profile Picture 
    if(one_visible_comment.user.subscription && one_visible_comment.user.subscription.is_active) comment_author_profile_picture.classList.add("subscriber") // Adds The Subscriber Class
    comment_author_profile_picture.src = one_visible_comment.user.profile_picture_name ? `/../media/images/${one_visible_comment.user.id}/${one_visible_comment.user.profile_picture_name}` : "/../static/images/profile_picture.png" // Sets Profile Picture - https://www.flaticon.com/free-icon/user_3177440
    comment_author_profile_picture.alt = ""

    // Comment Author Username
    const comment_author_username:HTMLParagraphElement = one_comment_container.querySelector(".comment_container .user .username") as HTMLParagraphElement // Gets The Comment Author Username
    comment_author_username.classList.add("username") // Adds The Username Class
    comment_author_username.textContent = one_visible_comment.user.username // Sets The Comment Author Username Text

    // Comment Properties
    createCommentPropertiesHTML(one_comment_container, report_container, one_visible_comment, logged_in_user_id, logged_in_user_role) // Creates The Comment Properties HTML

    // Comment
    const comment:HTMLParagraphElement = one_comment_container.querySelector(".comment_container .right .comment") as HTMLParagraphElement // Gets The Comment Paragraph
    comment.textContent = one_visible_comment.comment as string // Sets The Comment Text

    // Likes Container
    const likes_container:HTMLDivElement = one_comment_container.querySelector(".comment_container .right .likes_container") as HTMLDivElement // Gets The Likes Container

    const is_liked_by_author:boolean = one_visible_comment.likes_from_users.includes(user_id) // Checks If The Comment Is Liked By Author

    // Liked Comment By Author
    if(is_liked_by_author) {
        const profile_picture:HTMLImageElement = document.createElement("img") // Creates The Profile Picture

        profile_picture.classList.add("profile_picture") // Adds The Profile Picture Class
        profile_picture.src = profile_picture_name ? `/../media/images/${user_id}/${profile_picture_name}` : "/../static/images/profile_picture.png" // Sets Profile Picture - https://www.flaticon.com/free-icon/user_3177440
        profile_picture.alt = gettext("Autorovi príspevku sa páči komentár.")
        profile_picture.title = gettext("Autorovi príspevku sa páči komentár.")
        likes_container.prepend(profile_picture) // Prepends The Profile Picture To The Likes Counter
    }

    // Likes
    const likes:HTMLButtonElement = likes_container.querySelector(".likes") as HTMLButtonElement // Gets The Like Button

    const like_icon:HTMLElement = likes.querySelector(".fa-heart") as HTMLElement // Gets The Heart Icon
    logged_in_user_id && one_visible_comment.likes_from_users.includes(logged_in_user_id) ? like_icon.classList.add("fa-solid") : like_icon.classList.add("fa-regular") // Shows The Empty Or Filled Heart Icon - https://fontawesome.com/icons/heart

    // Likes Counter
    const likes_counter:HTMLParagraphElement = likes.querySelector(".likes_counter") as HTMLParagraphElement // Gets The Likes Counter
    likes_counter.textContent = String(one_visible_comment.likes) // Sets The Likes Counter
    likes.appendChild(likes_counter) // Appends The Likes Counter To The Likes
    
    // Appends The Reply
    if(one_visible_comment.parent_id) {
        const parent_comment:HTMLDivElement|null = all_comments.querySelector(`[data-comment_id="${one_visible_comment.parent_id}"]`) as HTMLDivElement || null // Gets The Parent Comment

        if(parent_comment) {
            const reply_container:HTMLDivElement = parent_comment.querySelector(".reply_container") as HTMLDivElement // Gets The Reply Container

            reply_container.prepend(one_comment_container)

            if(one_visible_comment.level === 2) {
                one_comment_container.classList.add("first_level_reply")
            }
        }
    }

    // Interactions
    const interactions:HTMLDivElement = one_comment_container.querySelector(".interactions") as HTMLDivElement // Gets The Comment Interactions Container

    // Reply
    // Displays The Reply Option Only If The Nested Level Of The Comment Is Less Than 5
    if(one_visible_comment.level < 5) {
        const reply:HTMLButtonElement = document.createElement("button") // Creates The Reply Button
        reply.classList.add("reply") // Adds The Reply Class
        reply.title = gettext("Odpovedať...")
        reply.ariaLabel = gettext("Odpovedať...")
        reply.innerHTML = "<i class='fa-regular fa-comment'></i>" // https://fontawesome.com/icons/comment
        interactions.prepend(reply) // Prepends The Reply Button To The Interactions
    }

    // Date
    const date:HTMLDivElement = interactions.querySelector(".date") as HTMLDivElement // Gets The Date Container

    const date_paragraph:HTMLParagraphElement = date.querySelector("p") as HTMLParagraphElement // Gets The Date Paragraph
    date_paragraph.textContent = getFormattedDate(one_visible_comment.creation_time)

    // Shows Replies
    if(one_visible_comment.parent_id) {
        const new_parent_comment:HTMLDivElement = (one_comment_container.parentElement as HTMLDivElement).closest(".one_comment") as HTMLDivElement // Gets The New Parent Comment (If Is Not In The 1st Level)
        const new_parent_comment_interactions:HTMLDivElement = new_parent_comment.querySelector(".interactions") as HTMLDivElement // Gets The Interactions Container Of The New Parent Comment

        // Checks If The Toggle Show Replies Button Isn't Already In DOM
        if(!new_parent_comment_interactions.querySelector(".show_replies")) {
            const show_replies:HTMLButtonElement = document.createElement("button") // Creates The Show Replies Button
            show_replies.classList.add("show_replies") // Adds The Show Replies Class
            show_replies.title = gettext("Zobraziť odpovede...")
            show_replies.ariaLabel = gettext("Zobraziť odpovede...")
            show_replies.innerHTML = "<i class='fa-solid fa-angle-down'></i>" // Adds The Icon
            new_parent_comment_interactions.insertBefore(show_replies, new_parent_comment_interactions.querySelector(".date") as HTMLDivElement) // Appends The Show Replies To The New Parent Comment
        }
    }

    return one_comment_template_clone // Returns The One Comment Template Clone
}