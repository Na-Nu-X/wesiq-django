import { displayMessage } from "../../../utils/displayMessage.js"
import { createCommentHTML } from "./createCommentHTML.js"

import type { comment } from "./createCommentPropertiesHTML.js"

interface loadedPostCommentsResponse {
    success:boolean,
    has_next?:boolean,
    visible_comments:comment[],
    message:string
}

// Function For Load Comments
export async function loadComments(feed:HTMLDivElement, post_container:HTMLDivElement, all_comments:HTMLDivElement, logged_in_user_id:number|null, logged_in_user_role:"developer"|"admin"|"user"|"unauthorized"):Promise<void> {
    const post_id:number = Number(post_container.dataset["post_id"]) // Gets The Post ID
    const page:number = Number(all_comments.dataset["page"]) || 1 // Gets The Current Page Number
    const show_more:HTMLButtonElement = all_comments.querySelector(".show_more") as HTMLButtonElement // Gets The Show More Button

    try {
        const params:URLSearchParams = new URLSearchParams({
            page: String(page)
        })

        // Gets Full Loaded Posts Response
        const full_loaded_post_comments_response:Response = await fetch(`/api/load-post-comments/${post_id}?${params.toString()}`, {
            method: "GET",

            headers: {
                "X-Requested-With": "XMLHttpRequest",
            }
        })

        // If The Response Isn't Success
        if(!full_loaded_post_comments_response.ok) {
            displayMessage("Pri hľadaní komentárov došlo k chybe.", "error") // Displays The Error Message
            return
        }

        const loaded_post_comments_response:loadedPostCommentsResponse = await full_loaded_post_comments_response.json() // Gets Loaded Posts Response

        // If The Response Isn't Success
        if(!loaded_post_comments_response.success) {
            displayMessage(loaded_post_comments_response.message, "error") // Displays The Error Message
            return
        }

        const all_comment_containers:NodeListOf<HTMLDivElement> = all_comments.querySelectorAll<HTMLDivElement>(".one_comment") // Gets All Post Containers

        // Gets Only The Posts Data Of Posts Which Aren't Already Rendered
        const no_already_rendered_post_comments_data:comment[] = loaded_post_comments_response.visible_comments.filter(function(one_loaded_post_comment:comment):boolean {
            return (
                ![...all_comment_containers].some(function(one_comment_container:HTMLDivElement):boolean {
                    return one_loaded_post_comment.id === Number(one_comment_container.dataset["comment_id"]) // If The Post ID Is Equal To Data In The Rendered Post In The DOM
                })
            )
        })

        no_already_rendered_post_comments_data.forEach(function(one_comment:comment):void {
            if(all_comment_containers.length >= 5 && !show_more.classList.contains("hidden")) all_comments.insertBefore(createCommentHTML(feed, all_comments, one_comment, post_container, logged_in_user_id, logged_in_user_role), show_more) // Appends The Comment To The All Comments Container To The Bottom Position
            else all_comments.prepend(createCommentHTML(feed, all_comments, one_comment, post_container, logged_in_user_id, logged_in_user_role)) // Appends The Comment To The All Comments Container To The Top Position
        })

        all_comments.dataset["has_next"] = String(loaded_post_comments_response.has_next || false) // Sets The Has More Comments

        if(loaded_post_comments_response.has_next) {
            show_more.classList.remove("hidden") // Shows The Show More Button
            all_comments.dataset["page"] = String(Number(all_comments.dataset["page"]) + 1) // Increases And Updates The Stored Page
        }

        else show_more.classList.add("hidden") // Hides The Show More Button

        // Comment Preview
        const root_comments:comment[] = loaded_post_comments_response.visible_comments.filter(one_comment => one_comment.level === 1) // Gets Only Root Comments

        if(root_comments.length > 0) {
            const media:HTMLDivElement = post_container.querySelector(".media") as HTMLDivElement // Gets The Media Container
            const random_comment:comment = root_comments[Math.floor(Math.random() * root_comments.length)] as comment // Gets The Random Comment

            // Comment Preview
            const comment_preview:HTMLDivElement = document.createElement("div") // Creates The Comment Preview Container
            comment_preview.classList.add("comment_preview") // Adds The Comment Preview Class
            media.appendChild(comment_preview) // Appends The Comment Preview To The Media Container

            // Profile Picture
            const profile_picture:HTMLImageElement = document.createElement("img") // Creates The Profile Picture Image
            profile_picture.classList.add("profile_picture") // Adds The Profile Picture Class
            profile_picture.src = random_comment.user.profile_picture_name ? `/../media/images/${random_comment.user.id}/${random_comment.user.profile_picture_name}` : "/../static/images/profile_picture.png" // Sets Profile Picture - https://www.flaticon.com/free-icon/user_3177440
            profile_picture.alt = ""
            comment_preview.appendChild(profile_picture) // Appends The Profile Picture To The Comment Preview

            // Username
            const username:HTMLParagraphElement = document.createElement("p") // Creates The Username Paragraph
            username.classList.add("username") // Adds The Username Class
            username.textContent = random_comment.user.username // Adds The Username
            comment_preview.appendChild(username) // Appends The Username To The Comment Preview

            // Comment
            const comment:HTMLParagraphElement = document.createElement("p") // Creates The Comment Paragraph
            comment.classList.add("comment") // Adds The Username Class
            comment.textContent = random_comment.comment // Adds The Comment
            comment_preview.appendChild(comment) // Appends The Comment To The Comment Preview

            // Likes
            const likes:HTMLDivElement = document.createElement("div") // Creates The Likes Container
            likes.classList.add("likes") // Adds The Likes Class
            comment_preview.appendChild(likes) // Appends The Likes Container To The Comment Preview

            // Like Icon
            const like_icon:HTMLElement = document.createElement("i") // Creates The Like Icon
            like_icon.classList.add("fa-heart")
            logged_in_user_id && random_comment.likes_from_users.includes(logged_in_user_id) ? like_icon.classList.add("fa-solid") : like_icon.classList.add("fa-regular") // Shows The Empty Or Filled Heart Icon - https://fontawesome.com/icons/heart
            likes.appendChild(like_icon) // Appends The Like Icon To The Likes

            // Likes Counter
            const likes_counter:HTMLParagraphElement = document.createElement("p") // Creates The Likes Counter
            likes_counter.textContent = String(random_comment.likes) // Sets The Likes Counter
            likes.appendChild(likes_counter) // Appends The Likes Counter To The Likes
        }
    }
    
    catch {
        displayMessage("Pri hľadaní komentárov došlo k chybe.", "error") // Displays The Error Message
    }
}