import { sendPOST } from "../../../services/sendPOST.js"
import { generateNumberRange } from "../../../utils/generateNumberRange.js"
import { getFormattedDate } from "../../../utils/getFormattedDate.js"
import { feed_state } from "../state.js"
import { getFormattedTime } from "../../../utils/timer.js"
import { displayMessage } from "../../../utils/displayMessage.js"

import type { response } from "../../../services/sendPOST.js"

interface searchedPostsResponse {
    success:boolean,
    has_next?:boolean,

    logged_in_user?:{
        logged_in_user_id:number,
        profile_picture_name:string,
        saved_posts:number[]
    },

    posts:searchedPost[],
    message:string
}

interface searchedPost {
    user:{
        id:number,
        first_name:string,
        last_name:string,
        username:string,
        profile_picture_name:string|null,
        following:number[],
        followers:number[]
    },

    id:number,
    description:string|null,

    tagged_users:{
        id:number,
        first_name:string,
        last_name:string,
        username:string
    }[]|[],

    added_hashtags:string[]|[],
    location:string|null,

    coordinates:{
        latitude:string
        longitude:string
    }|null,

    public_visibility:boolean,
    allow_comments:boolean,
    hide_likes:boolean,
    likes:number,
    likes_from_users:number[],
    created_at:string,

    media:{
        file:string,
        thumbnail:string,
        is_video:boolean
    }[],

    visible_comments:comment[]
}

interface comment {
    id:number,

    user:{
        id:number,
        first_name:string,
        last_name:string,
        username:string,
        profile_picture_name:string|null
    },

    comment:string,
    likes:number,
    likes_from_users:number[],
    creation_time:string,
    parent_id:number|null,
    reports_from_users:number[],
    level:number
}

interface addCommentResponse {
    success: boolean,

    comment: {
        id:number,

        user: {
            id:number,
            username:string,
            profile_picture_name:string
        },

        creation_time:string,
        level:number
    },

    message: string
}

export interface compressTask {
    task_id:number,
    post_media_id:number,
    post_id:number
}

export interface uploadPostResponse {
    success:boolean,
    compress_tasks:compressTask[]
}

interface uploadProgressResponse {
    task_id:number,
    state:"PENDING"|"PROGRESS"|"SUCCESS"|"FAILURE",
    progress:number
}

// Function For Generate Styled Description
export function generateStyledDescription(text:string, tagged_users:string|null, added_hashtags:string|null):string {
    if(tagged_users) {
        const tagged_users_array:string[] = JSON.parse(tagged_users) // Converts The Data To An Array Of The Tagged Users
    
        tagged_users_array.forEach(one_tag => text = text.replace(one_tag, `<a class="tag" href="${interpolate(gettext('/sk/profil/%s'), [one_tag])}">${one_tag}</a>`)) // Puts Every Tag To The Styled Span Element
    }

    if(added_hashtags) {
        const added_hashtags_array:string[] = JSON.parse(added_hashtags.replace(/'/g, '"')) // Converts The Data To An Array Of The Added Hashtags

        added_hashtags_array.forEach(one_hashtag => text = text.replace(one_hashtag, `<span class="hashtag">${one_hashtag}</span>`)) // Puts Every Hashtag To The Styled Span Element
    }

    return text // Returns The Text
}

// Function For Generate The Post Bars
export function generatePostBars(all_media:NodeListOf<HTMLDivElement>, post_bars:HTMLDivElement):void {
    // Creates The Bars Only If There Are More Than One Media In Post
    if(all_media.length > 1) {
        for(let i:number = 0; i < all_media.length; i++) {
            const bar:HTMLDivElement = document.createElement("div") // Creates The Bar

            generateButtons(i, all_media) // Generates The Change Buttons (Previous / Next)
            bar.classList.add("bar") // Adds The Bar Class

            if(i === 0) {
                bar.classList.add("active")
            }

            post_bars.appendChild(bar) // Appends The Bar To The Post Bars
        }
    }

    else {
        post_bars.style.display = "none" // Hides The Post Bars Container
    }
}

// Function For Change The Post
export function changePost(post_index:number, media_container:HTMLDivElement, post_bars:HTMLDivElement):void {
    const all_media:NodeListOf<HTMLDivElement> = media_container.querySelectorAll<HTMLDivElement>(".one_post") // Gets All Media From The Post

    if(post_index >= 0 && post_index <= all_media.length - 1) {
        media_container.dataset["active_index"] = String(post_index) // Stores The New Index As A Active Index

        all_media.forEach(function(one_post:HTMLDivElement, index:number):void {
            if(index !== post_index) {
                one_post.style.display = "none"

                const all_bars:NodeListOf<HTMLDivElement> = post_bars.querySelectorAll<HTMLDivElement>(".bar") // Gets All Bars

                all_bars.forEach(one_bar => one_bar.classList.remove("active")) // Removes The Active Class From All Bars
                if(all_bars[post_index]) all_bars[post_index].classList.add("active") // Adds The Active Class
            }

            else {
                one_post.style.display = "block"
            }
        })
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
        
        one_comment_container.dataset["comment_id"] = String(add_comment_response.comment.id) // Stores The Comment ID

        // Comment Author Profile Picture Link
        const comment_author_profile_picture_link:HTMLAnchorElement = one_comment_container.querySelector(".comment_container .user a") as HTMLAnchorElement // Gets The Comment Author Profile Picture Link
        comment_author_profile_picture_link.href = interpolate(gettext("/sk/profil/%s"), [add_comment_response.comment.user.username]) // Sets The Link To The User's Profile
        comment_author_profile_picture_link.title = gettext("Zobraziť užívateľa")

        // Comment Author Profile Picture
        const comment_author_profile_picture:HTMLImageElement = comment_author_profile_picture_link.querySelector(".profile_picture") as HTMLImageElement // Gets The Comment Author Profile Picture 
        comment_author_profile_picture.src = add_comment_response.comment.user.profile_picture_name ? `/../media/images/${add_comment_response.comment.user.id}/${add_comment_response.comment.user.profile_picture_name}` : "/../static/images/profile_picture.png" // Sets Profile Picture - https://www.flaticon.com/free-icon/user_3177440

        // Comment Author Username
        const comment_author_username:HTMLParagraphElement = one_comment_container.querySelector(".comment_container .username") as HTMLParagraphElement // Gets The Comment Author Username
        comment_author_username.classList.add("username") // Adds The Username Class
        comment_author_username.textContent = add_comment_response.comment.user.username // Sets The Comment Author Username Text

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
                new_parent_comment_interactions.insertBefore(show_replies, new_parent_comment_interactions.querySelector(".report") as HTMLDivElement) // Appends The Show Replies To The New Parent Comment
            }
        }

        comments_counter.textContent = String(Number(comments_counter.textContent) + 1) // Increases The Comments Counter
    }

    catch {
        displayMessage(gettext("Pri odosielaní komentáru došlo k chybe."), "error") // Displays The Error Message
    }
}

// Function For Toggle Post Comment Like
export async function togglePostCommentLike(icon:HTMLElement, counter:HTMLParagraphElement, id:number):Promise<void> {
    try {
        const toggle_post_comment_like_response:response = await sendPOST(window.location.pathname, id, "toggle-post-comment-like") // Sends Liked Post ID As A POST Data

        // If The Response Isn't Success
        if(!toggle_post_comment_like_response.success) {
            displayMessage(toggle_post_comment_like_response.message, "error") // Displays The Error Message
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
export async function reportComment(id:number, reason:string):Promise<void> {
    try {
        const report_comment_data:{
            postforum_id:number,
            reason:string
        } = {
            postforum_id: id,
            reason
        }

        const report_comment_response:response = await sendPOST(window.location.pathname, report_comment_data, "report-post-comment") // Sends Liked Comment ID As A POST Data

        // If The Response Isn't Success
        if(!report_comment_response.success) {
            displayMessage(report_comment_response.message, "error") // Displays The Error Message
            return
        }

        else {
            displayMessage(report_comment_response.message, "success") // Displays The Success Message
        }
    }

    catch {
        displayMessage(gettext("Pri odosielaní nahlásenia došlo k chybe."), "error") // Displays The Error Message
    }
}

// Function For Generate Change Buttons (Previous / Next)
function generateButtons(index:number, all_media:NodeListOf<HTMLDivElement>):void {
    if(index === 0) ((all_media[index] as HTMLDivElement).querySelector(".next") as HTMLDivElement).classList.remove("hidden") // Shows The Next Button In The First Post
    if(index === all_media.length - 1) ((all_media[index] as HTMLDivElement).querySelector(".previous") as HTMLDivElement).classList.remove("hidden") // Shows The Previous Button In The Last Post

    if(index !== 0 && index !== all_media.length - 1) {
        ((all_media[index] as HTMLDivElement).querySelector(".previous") as HTMLDivElement).classList.remove("hidden"); // Shows The Previous Button In The Last Post
        ((all_media[index] as HTMLDivElement).querySelector(".next") as HTMLDivElement).classList.remove("hidden") // Shows The Next Button In The First Post
    }
}

// Function For Create Post HTML Structure
function createPostHTML(post_data:searchedPost, feed:HTMLDivElement, logged_in_user_id:number|undefined, profile_picture_name:string|undefined, saved_posts:number[]|undefined):DocumentFragment {
    const post_container_template:HTMLTemplateElement = feed.querySelector(".post_container_template") as HTMLTemplateElement // Gets The Post Container Template
    const post_container_template_clone:DocumentFragment = post_container_template.content.cloneNode(true) as DocumentFragment // Clones The Post Container Template Content

    // Post Container
    const post_container:HTMLDivElement = post_container_template_clone.querySelector(".post_container") as HTMLDivElement // Creates The Post Container
    post_container.dataset["post_id"] = String(post_data.id) // Stores The Post ID

    // Post Author Profile Picture Link
    const post_author_profile_picture_link:HTMLAnchorElement = post_container.querySelector(".header .left a") as HTMLAnchorElement // Gets The Post Author Profile Picture Link
    post_author_profile_picture_link.href = interpolate(gettext("/sk/profil/%s"), [post_data.user.username]) // Sets The Link To The User's Profile
    post_author_profile_picture_link.title = gettext("Zobraziť užívateľa")

    // Post Author Profile Picture
    const post_author_profile_picture:HTMLImageElement = post_author_profile_picture_link.querySelector(".profile_picture") as HTMLImageElement // Gets The Post Author Profile Picture 
    post_author_profile_picture.src = post_data.user.profile_picture_name ? `/../media/images/${post_data.user.id}/${post_data.user.profile_picture_name}` : "/../static/images/profile_picture.png" // Sets Profile Picture - https://www.flaticon.com/free-icon/user_3177440

    const right:HTMLDivElement = post_container.querySelector(".header .right") as HTMLDivElement // Gets The Right Container Of The Header
    const top:HTMLDivElement = right.querySelector(".top") as HTMLDivElement // Gets The Top Container Of The Right Container

    // Post Author Username
    const post_author_username:HTMLParagraphElement = top.querySelector(".username") as HTMLParagraphElement // Gets The Post Author Username
    post_author_username.textContent = post_data.user.username // Sets The Username

    // Post Author Followers
    const post_author_followers:HTMLParagraphElement = top.querySelector(".followers_container .followers") as HTMLParagraphElement // Gets The Post Author Followers
    post_author_followers.textContent = String(post_data.user.followers.length) // Sets The Amount Of Post Author Followers

    // Follow Button
    if(logged_in_user_id && logged_in_user_id !== post_data.user.id) {
        const follow_button:HTMLButtonElement = document.createElement("button") // Creates The Follow Button

        follow_button.classList.add("follow_button") // Adds The Follow Button Class
        follow_button.dataset["id"] = String(post_data.user.id) // Stores The User ID
        follow_button.dataset["action"] = !post_data.user.followers.includes(logged_in_user_id) ? "follow" : "unfollow"
        follow_button.textContent = !post_data.user.followers.includes(logged_in_user_id) ? gettext("Začať sledovať") : gettext("Prestať sledovať")

        top.appendChild(follow_button) // Appends The Follow Button To The Top Container
    }

    // Post Properties
    const show_post_properties_button:HTMLButtonElement = top.querySelector(".show_post_properties_button") as HTMLButtonElement // Gets The Show Post Properties Button
    const post_properties:HTMLDivElement = top.querySelector(".post_properties") as HTMLDivElement // Gets The Post Properties Menu
    const show_report_post_button:HTMLButtonElement = post_properties.querySelector(".show_report_post_button") as HTMLButtonElement // Gets The Show Report Post Button
    const hide_post_properties_button:HTMLButtonElement = post_properties.querySelector(".hide_post_properties_button") as HTMLButtonElement // Gets The Hide Post Properties Button
    const report_post:HTMLDivElement = top.querySelector(".report_post") as HTMLDivElement // Gets The Report Post Menu
    const back_report_post_button:HTMLButtonElement = report_post.querySelector(".back_report_post_button") as HTMLButtonElement // Gets The Back Report Post Button

    show_post_properties_button.setAttribute("popovertarget", `post_properties_${post_data.id}`) // Links The Pop Over
    show_post_properties_button.style = `anchor-name: --show_post_properties_button_${post_data.id}` // Creates The Anchor
    post_properties.id = `post_properties_${post_data.id}` // Sets The ID
    post_properties.style = `position-anchor: --show_post_properties_button_${post_data.id}` // Links The Anchor
    show_report_post_button.setAttribute("popovertarget", `report_post_${post_data.id}`) // Links The Pop Over
    show_report_post_button.style = `anchor-name: --show_report_post_button_${post_data.id}` // Creates The Anchor
    hide_post_properties_button.setAttribute("popovertarget", `post_properties_${post_data.id}`) // Links The Pop Over
    report_post.id = `report_post_${post_data.id}` // Sets The ID
    report_post.style = `position-anchor: --show_report_post_button_${post_data.id}` // Links The Anchor
    back_report_post_button.setAttribute("popovertarget", `report_post_${post_data.id}`) // Links The Pop Over

    if(logged_in_user_id && logged_in_user_id === post_data.user.id) {
        // Delete Post Button
        const delete_post_button:HTMLButtonElement = document.createElement("button") // Creates The Delete Post Button
        delete_post_button.classList.add("delete_post_button") // Adds The Delete Post Button
        delete_post_button.setAttribute("popovertarget", `delete_post_${post_data.id}`) // Links The Pop Over
        delete_post_button.style = `anchor-name: --delete_post_button_${post_data.id}` // Creates The Anchor
        delete_post_button.textContent = gettext("Vymazať")
        post_properties.insertBefore(delete_post_button, hide_post_properties_button) // Appends The Delete Post Button To The Post Properties Menu

        // Delete Post Menu
        const delete_post:HTMLDivElement = document.createElement("div") // Creates The Delete Post Menu
        delete_post.classList.add("delete_post") // Adds The Delete Post Class
        delete_post.id = `delete_post_${post_data.id}` // Sets The ID
        delete_post.popover = "auto" // Sets The Popover Attribute
        delete_post.style = `position-anchor: --delete_post_button_${post_data.id}` // Links The Anchor
        top.appendChild(delete_post) // Appends The Delete Post To The Post Container

        // Question
        const question:HTMLParagraphElement = document.createElement("p") // Creates The Question Paragraph
        question.textContent = gettext("Naozaj chcete vymazať Váš príspevok?")
        delete_post.appendChild(question) // Appends The Question To The Delete Post Menu

        // Yes
        const yes:HTMLButtonElement = document.createElement("button") // Creates The Yes Button
        yes.textContent = gettext("Vymazať")
        delete_post.appendChild(yes) // Appends The Yes Button To The Delete Post Menu
        
        // No
        const no:HTMLButtonElement = document.createElement("button") // Creates The No Button
        no.setAttribute("popovertarget", `delete_post_${post_data.id}`) // Links The Pop Over
        no.popoverTargetAction = "hide" // Sets The Hide Action
        no.textContent = gettext("Zrušiť")
        delete_post.appendChild(no) // Appends The No Button To The Delete Post Menu
    }

    const bottom:HTMLDivElement = right.querySelector(".bottom") as HTMLDivElement // Gets The Bottom Container Of The Right Container

    // Location
    if(post_data.location) {
        if(post_data.coordinates) {
            const location:HTMLAnchorElement = document.createElement("a") // Creates The Location Link

            location.classList.add("location") // Adds The Location Class
            location.href = `https://www.google.com/maps?q=${post_data.coordinates.latitude},${post_data.coordinates.longitude}` // Creates The Link For Google Maps
            location.title = gettext("Otvoriť mapy") // Sets The Title
            location.target = "_blank"
            location.innerHTML = post_data.location // Sets The Styled Location Text

            bottom.prepend(location) // Appends The Location To The Bottom Container
        }

        else {
            const location:HTMLParagraphElement = document.createElement("p") // Creates The Location Paragraph

            location.classList.add("location") // Adds The Location Class
            location.textContent = post_data.location // Sets The Location Text

            bottom.prepend(location) // Appends The Location To The Bottom Container
        }
    }

    // Created At
    const created_at:HTMLParagraphElement = bottom.querySelector(".created_at") as HTMLParagraphElement // Gets The Created At Paragraph
    created_at.textContent = getFormattedDate(post_data.created_at) // Sets The Formatted Date Text

    // Media
    const media:HTMLDivElement = post_container_template_clone.querySelector(".media") as HTMLDivElement // Gets The Media Container

    post_data.media.forEach(function(one_post_media:{
        file:string,
        thumbnail:string,
        is_video:boolean
    }) {
        const one_post_template:HTMLTemplateElement = feed.querySelector(".one_post_template") as HTMLTemplateElement // Gets The One Post Template
        const one_post_template_clone:DocumentFragment = one_post_template.content.cloneNode(true) as DocumentFragment // Clones The One Post Template Content
        const one_post_container:HTMLDivElement = one_post_template_clone.querySelector(".one_post") as HTMLDivElement // Gets The One Post Container

        // Image
        if(!one_post_media.is_video) {
            const image:HTMLImageElement = document.createElement("img") // Creates The Image

            image.classList.add("image") // Adds The Image Class
            image.src = `/../media/${one_post_media.file}` // Sets The File Path
            image.alt = interpolate(gettext('Príspevok užívateľa %s'), [post_data.user.username]) // Sets The Alternative Text For The Image

            one_post_container.appendChild(image) // Appends The Image To The One Post Container
            media.appendChild(one_post_container)
        }

        // Video
        else if(one_post_media.is_video) {
            const video_container_template:HTMLTemplateElement = feed.querySelector(".video_container_template") as HTMLTemplateElement // Gets The Video Container Template
            const video_container_template_clone:DocumentFragment = video_container_template.content.cloneNode(true) as DocumentFragment // Clones The Video Container Template Content
            const video_container:HTMLDivElement = video_container_template_clone.querySelector(".video_container") as HTMLDivElement // Gets The Video Container
            const video:HTMLVideoElement = video_container.querySelector(".video") as HTMLVideoElement // Gets The Video
            const source:HTMLSourceElement = video.querySelector("source") as HTMLSourceElement // Gets The Video Source

            video.poster = `/../media/${one_post_media.thumbnail}` // Sets The Thumbnail Path
            source.src = interpolate(gettext("/sk/stream-video/%s/%s"), [post_data.user.id, one_post_media.file.substring(one_post_media.file.lastIndexOf('/') + 1)], false) // Sets The File Path
            video.append(interpolate(gettext('Príspevok užívateľa %s'), [post_data.user.username])) // Sets The Alternative Text For The Video

            one_post_container.appendChild(video_container) // Appends The Video Container To The One Post Container
            media.appendChild(one_post_container) // Appends The One Post Container To The Media Container
        }
    })

    // Particles
    const particles:HTMLDivElement = document.createElement("div") // Creates The Particles Container
    particles.classList.add("particles") // Adds The Particles Class
    media.appendChild(particles) // Appends The Particles To The Media Container

    // Post Bars
    const post_bars:HTMLDivElement = document.createElement("div") // Creates The Post Bars Container
    post_bars.classList.add("post_bars") // Adds The Post Bars Class
    media.appendChild(post_bars) // Appends The Post Bars To The Media Container

    // Society
    const society:HTMLDivElement = post_container_template_clone.querySelector(".society") as HTMLDivElement // Gets The Society Container

    // Likes
    const likes:HTMLDivElement = society.querySelector(".likes") as HTMLDivElement // Gets The Likes Container
    const like_icon:HTMLElement = likes.querySelector(".fa-heart") as HTMLElement // Gets The Heart Icon

    logged_in_user_id && post_data.likes_from_users.includes(logged_in_user_id) ? like_icon.classList.add("fa-solid") : like_icon.classList.add("fa-regular") // Shows The Empty Or Filled Heart Icon - https://fontawesome.com/icons/heart

    // Hidden Likes Counter
    if(post_data.hide_likes && post_data.user.id !== logged_in_user_id) {
        const hidden_likes_counter:HTMLParagraphElement = document.createElement("p") // Creates The Hidden Likes Counter
        hidden_likes_counter.classList.add("hidden_likes_counter") // Adds The Hidden Likes Counter
        hidden_likes_counter.textContent = gettext("Skryté")
        likes.appendChild(hidden_likes_counter) // Appends The Hidden Likes Counter To The Likes
    }

    // Likes Counter
    else {
        const likes_counter:HTMLParagraphElement = document.createElement("p") // Creates The Likes Counter
        likes_counter.classList.add("likes_counter") // Adds The Likes Counter
        likes_counter.textContent = String(post_data.likes) // Sets The Likes Counter
        likes.appendChild(likes_counter) // Appends The Likes Counter To The Likes
    }

    // Comments
    const comments:HTMLDivElement = society.querySelector(".comments") as HTMLDivElement // Gets The Comments Container

    // Comments Counter
    if(post_data.allow_comments) {
        const comments_counter:HTMLParagraphElement = document.createElement("p") // Creates The Comments Counter
        comments_counter.classList.add("comments_counter") // Adds The Comments Counter
        comments_counter.textContent = String(post_data.visible_comments.length) // Sets The Comments Counter
        comments.appendChild(comments_counter) // Appends The Comments Counter To The Likes
    }

    // Hidden Comments Counter
    else {
        const hidden_comments_counter:HTMLParagraphElement = document.createElement("p") // Creates The Hidden Comments Counter
        hidden_comments_counter.classList.add("hidden_comments_counter") // Adds The Hidden Comments Counter
        hidden_comments_counter.textContent = gettext("Vypnuté")
        comments.appendChild(hidden_comments_counter) // Appends The Hidden Comments Counter To The Likes
    }

    // Share
    const share:HTMLDivElement = society.querySelector(".share") as HTMLDivElement // Gets The Share Container
    share.dataset["author"] = post_data.user.username // Stores The Author's Username

    // Save
    const save:HTMLDivElement = society.querySelector(".save") as HTMLDivElement // Gets The Save Container
    const save_icon:HTMLElement = save.querySelector(".fa-bookmark") as HTMLElement // Gets The Save Icon

    // https://fontawesome.com/icons/bookmark
    if(saved_posts && saved_posts.includes(post_data.id)) {
        save_icon.classList.add("fa-solid") // Shows The Filled Bookmark Icon
        save_icon.classList.add("active") // Adds The Active Class
    }
    
    else save_icon.classList.add("fa-regular") // Shows The Empty Bookmark Icon

    // Description
    const description:HTMLParagraphElement = document.createElement("p") // Creates The Description Paragraph
    description.classList.add("description") // Adds The Description Class

    const tagged_users:string[] = post_data.tagged_users.map(one_tagged_user => one_tagged_user.username)
    const added_hashtags:string[] = post_data.added_hashtags
    description.dataset["tagged_users"] = JSON.stringify(tagged_users) // Stores The Tagged Users
    description.dataset["added_hashtags"] = JSON.stringify(added_hashtags) // Stores The Added Hashtags
    description.textContent = post_data.description // Sets The Description Text
    post_container.appendChild(description) // Appends The Description To The Post Container

    if(tagged_users.length > 0 || added_hashtags.length > 0) description.innerHTML = generateStyledDescription(description.textContent, JSON.stringify(tagged_users), JSON.stringify(added_hashtags)) // Generates The Styled Description

    const comment_forum_template:HTMLTemplateElement = feed.querySelector(".comment_forum_template") as HTMLTemplateElement // Gets The Comment Forum Template
    const comment_forum_template_clone:DocumentFragment = comment_forum_template.content.cloneNode(true) as DocumentFragment // Clones The Comment Forum Template Content

    // Write Comment Form Profile Picture
    const write_comment_form_profile_picture:HTMLImageElement = comment_forum_template_clone.querySelector(".comment_forum .write_comment_form .profile_picture") as HTMLImageElement // Gets The Write Comment Form Profile Picture
    write_comment_form_profile_picture.src = profile_picture_name ? `/../media/images/${logged_in_user_id}/${profile_picture_name}` : "/../static/images/profile_picture.png" // Sets Profile Picture - https://www.flaticon.com/free-icon/user_3177440

    const all_comments:HTMLDivElement = comment_forum_template_clone.querySelector(".comment_forum .all_comments") as HTMLDivElement // Gets The All Comments Container

    post_container.appendChild(comment_forum_template_clone) // Appends The Comment Forum Template Clone To The Post Container

    // Comments
    if(post_data.visible_comments.length > 0) {
        post_data.visible_comments.forEach(function(one_visible_comment:comment):void {
            const one_comment_template:HTMLTemplateElement = feed.querySelector(".one_comment_template") as HTMLTemplateElement // Gets The One Comment Template
            const one_comment_template_clone:DocumentFragment = one_comment_template.content.cloneNode(true) as DocumentFragment // Clones The One Comment Template Content
            const one_comment_container:HTMLDivElement = one_comment_template_clone.querySelector(".one_comment") as HTMLDivElement // Gets The One Comment Container

            one_comment_container.dataset["comment_id"] = String(one_visible_comment.id) // Stores The Comment ID

            // Comment Author Profile Picture Link
            const comment_author_profile_picture_link:HTMLAnchorElement = one_comment_container.querySelector(".comment_container .user a") as HTMLAnchorElement // Gets The Comment Author Profile Picture Link
            comment_author_profile_picture_link.href = interpolate(gettext("/sk/profil/%s"), [post_data.user.username]) // Sets The Link To The User's Profile
            comment_author_profile_picture_link.title = gettext("Zobraziť užívateľa")

            // Comment Author Profile Picture
            const comment_author_profile_picture:HTMLImageElement = comment_author_profile_picture_link.querySelector(".profile_picture") as HTMLImageElement // Gets The Comment Author Profile Picture 
            comment_author_profile_picture.src = one_visible_comment.user.profile_picture_name ? `/../media/images/${one_visible_comment.user.id}/${one_visible_comment.user.profile_picture_name}` : "/../static/images/profile_picture.png" // Sets Profile Picture - https://www.flaticon.com/free-icon/user_3177440

            // Comment Author Username
            const comment_author_username:HTMLParagraphElement = one_comment_container.querySelector(".comment_container .user .username") as HTMLParagraphElement // Gets The Comment Author Username
            comment_author_username.classList.add("username") // Adds The Username Class
            comment_author_username.textContent = one_visible_comment.user.username // Sets The Comment Author Username Text

            // Comment Properties
            const show_comment_properties_button:HTMLButtonElement = one_comment_container.querySelector(".comment_container .user .show_comment_properties_button") as HTMLButtonElement // Gets The Show Comment Properties Button
            const comment_properties:HTMLDivElement = one_comment_container.querySelector(".comment_container .user .comment_properties") as HTMLDivElement // Gets The Comment Properties Menu
            const show_report_comment_button:HTMLButtonElement = comment_properties.querySelector(".show_report_comment_button") as HTMLButtonElement // Gets The Show Report Comment Button
            const hide_comment_properties_button:HTMLButtonElement = comment_properties.querySelector(".hide_comment_properties_button") as HTMLButtonElement // Gets The Hide Comment Properties Button
            const report_comment:HTMLDivElement = one_comment_container.querySelector(".comment_container .user .report_comment") as HTMLDivElement // Gets The Report Comment Menu
            const back_report_comment_button:HTMLButtonElement = report_comment.querySelector(".back_report_comment_button") as HTMLButtonElement // Gets The Back Report Comment Button

            show_comment_properties_button.setAttribute("popovertarget", `comment_properties_${one_visible_comment.id}`) // Links The Pop Over
            show_comment_properties_button.style = `anchor-name: --show_comment_properties_button_${one_visible_comment.id}` // Creates The Anchor
            comment_properties.id = `comment_properties_${one_visible_comment.id}` // Sets The ID
            comment_properties.style = `position-anchor: --show_comment_properties_button_${one_visible_comment.id}` // Links The Anchor
            show_report_comment_button.setAttribute("popovertarget", `report_comment_${one_visible_comment.id}`) // Links The Pop Over
            show_report_comment_button.style = `anchor-name: --show_report_comment_button_${one_visible_comment.id}` // Creates The Anchor
            hide_comment_properties_button.setAttribute("popovertarget", `comment_properties_${one_visible_comment.id}`) // Links The Pop Over
            report_comment.id = `report_comment_${one_visible_comment.id}` // Sets The ID
            report_comment.style = `position-anchor: --show_report_comment_button_${one_visible_comment.id}` // Links The Anchor
            back_report_comment_button.setAttribute("popovertarget", `report_comment_${one_visible_comment.id}`) // Links The Pop Over

            if(one_visible_comment.user.id === logged_in_user_id) {
                // Delete Comment Button
                const delete_comment_button:HTMLButtonElement = document.createElement("button") // Creates The Delete Comment Button
                delete_comment_button.classList.add("delete_comment_button") // Adds The Delete Comment Button
                delete_comment_button.setAttribute("popovertarget", `delete_comment_${one_visible_comment.id}`) // Links The Pop Over
                delete_comment_button.style = `anchor-name: --delete_comment_button_${one_visible_comment.id}` // Creates The Anchor
                delete_comment_button.textContent = gettext("Vymazať")
                comment_properties.insertBefore(delete_comment_button, hide_comment_properties_button) // Appends The Delete Comment Button To The Comment Properties Menu

                // Delete Comment Menu
                const delete_comment:HTMLDivElement = document.createElement("div") // Creates The Delete Comment Menu
                delete_comment.classList.add("delete_comment") // Adds The Delete Comment Class
                delete_comment.id = `delete_comment_${one_visible_comment.id}` // Sets The ID
                delete_comment.popover = "auto" // Sets The Popover Attribute
                delete_comment.style = `position-anchor: --delete_comment_button_${one_visible_comment.id}`; // Links The Anchor
                (one_comment_container.querySelector(".comment_container .user") as HTMLDivElement).appendChild(delete_comment) // Appends The Delete Comment To The Comment Container

                // Question
                const question:HTMLParagraphElement = document.createElement("p") // Creates The Question Paragraph
                question.textContent = gettext("Naozaj chcete vymazať Váš komentár?")
                delete_comment.appendChild(question) // Appends The Question To The Delete Comment Menu

                // Yes
                const yes:HTMLButtonElement = document.createElement("button") // Creates The Yes Button
                yes.textContent = gettext("Vymazať")
                delete_comment.appendChild(yes) // Appends The Yes Button To The Delete Comment Menu
                
                // No
                const no:HTMLButtonElement = document.createElement("button") // Creates The No Button
                no.setAttribute("popovertarget", `delete_comment_${one_visible_comment.id}`) // Links The Pop Over
                no.popoverTargetAction = "hide" // Sets The Hide Action
                no.textContent = gettext("Zrušiť")
                delete_comment.appendChild(no) // Appends The No Button To The Delete Comment Menu
            }

            // Comment
            const comment:HTMLParagraphElement = one_comment_container.querySelector(".comment_container .right .comment") as HTMLParagraphElement // Gets The Comment Paragraph
            comment.textContent = one_visible_comment.comment // Sets The Comment Text

            // Likes
            const likes:HTMLDivElement = one_comment_container.querySelector(".comment_container .right .likes") as HTMLDivElement // Gets The Likes Container

            const like_icon:HTMLElement = likes.querySelector(".fa-heart") as HTMLElement // Gets The Heart Icon
            logged_in_user_id && one_visible_comment.likes_from_users.includes(logged_in_user_id) ? like_icon.classList.add("fa-solid") : like_icon.classList.add("fa-regular") // Shows The Empty Or Filled Heart Icon - https://fontawesome.com/icons/heart

            // Likes Counter
            const likes_counter:HTMLParagraphElement = likes.querySelector(".likes_counter") as HTMLParagraphElement // Gets The Likes Counter
            likes_counter.textContent = String(one_visible_comment.likes) // Sets The Likes Counter
            likes.appendChild(likes_counter) // Appends The Likes Counter To The Likes

            // Appends The Comment
            if(!one_visible_comment.parent_id) {
                all_comments.prepend(one_comment_container)
            }
            
            // Appends The Reply
            else {
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
                const reply:HTMLDivElement = document.createElement("div") // Creates The Reply Container
                reply.classList.add("reply") // Adds The Reply Class
                reply.title = gettext("Odpovedať...")
                reply.innerHTML = "<i class='fa-regular fa-comment'></i>" // https://fontawesome.com/icons/comment
                interactions.prepend(reply) // Prepends The Reply Container To The Interactions
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
                    const show_replies:HTMLDivElement = document.createElement("div") // Creates The Show Replies Container
                    show_replies.classList.add("show_replies") // Adds The Show Replies Class
                    show_replies.title = gettext("Zobraziť odpovede...")
                    show_replies.innerHTML = "<i class='fa-solid fa-angle-down'></i>" // Adds The Icon
                    new_parent_comment_interactions.insertBefore(show_replies, new_parent_comment_interactions.querySelector(".report") as HTMLDivElement) // Appends The Show Replies To The New Parent Comment
                }
            }
        })
    }

    // Bars
    const media_container:HTMLDivElement = post_container.querySelector(".media") as HTMLDivElement // Gets The Media Container
    const all_media:NodeListOf<HTMLDivElement> = media_container.querySelectorAll<HTMLDivElement>(".one_post") // Gets All Media From The Posts
    
    generatePostBars(all_media, post_bars) // Generates The Post Bars

    // Video Events
    all_media.forEach(function(one_post:HTMLDivElement):void {
        const one_video:HTMLVideoElement|null = one_post.querySelector(".video_container .video") as HTMLVideoElement || null // Gets The Video

        if(one_video) {
            const video_container:HTMLDivElement = one_video.closest(".video_container") as HTMLDivElement // Gets The Video Container
            const total_time:HTMLSpanElement = video_container.querySelector(".controls .buttons .timer .total") as HTMLSpanElement // Gets The Elapsed Timer
            const elapsed_timer:HTMLSpanElement = video_container.querySelector(".controls .buttons .timer .elapsed") as HTMLSpanElement // Gets The Elapsed Timer
            const scrubber_hitbox:HTMLDivElement = video_container.querySelector(".controls .scrubber_hitbox") as HTMLDivElement // Gets The Scrubber Hitbox
            const scrubber:HTMLDivElement = scrubber_hitbox.querySelector(".scrubber") as HTMLDivElement // Gets The Scrubber
            const buffering_bar:HTMLDivElement = video_container.querySelector(".controls .scrubber .buffering_bar") as HTMLDivElement // Gets The Buffering Bar
            const one_post:HTMLDivElement = one_video.closest(".one_post") as HTMLDivElement // Gets The One Post Container
            const loading:HTMLDivElement = one_post?.querySelector(".loading") as HTMLDivElement // Gets The Loading
            let is_hovered_scrubber:boolean = false // Checks If The Scrubber Is Hovered
            let previous_scrubber_progress:string = scrubber.style.getPropertyValue("--progress") || "0%"// Gets The Previous Scrubber Progress
            let previous_elapsed_time:number = one_video.currentTime // Gets The Previous Elapsed Time

            // Set Video Duration Functionality
            if(!isNaN(one_video.duration)) setVideoDuration(one_video.duration, total_time) // Sets The Video Duration

            one_video.addEventListener("loadedmetadata", function():void {
                setVideoDuration(this.duration, total_time) // Sets The Video Duration
            })

            // Video Time Update Functionality
            one_video.addEventListener("timeupdate", function():void {
                const is_playing:boolean = !one_video.paused && !one_video.ended && one_video.readyState > 2

                // if(one_video.seeking) return
                if(!is_hovered_scrubber) updateVideoTimer(this.currentTime, this.duration, elapsed_timer, scrubber) // Updates The Video Timer
                if(!is_playing) elapsed_timer.textContent = `${getFormattedTime("minutes", this.currentTime)}:${getFormattedTime("seconds", this.currentTime, true)}` // Sets The Elapsed Timer
                previous_scrubber_progress = scrubber.style.getPropertyValue("--progress") || "0%"// Updates The Previous Scrubber Progress
                previous_elapsed_time = one_video.currentTime // Updates The Previous Elapsed Time
            })

            // Video Buffering Bar Functionalities
            updateBufferingBar(one_video, buffering_bar) // Updates The Video Buffering Bar
            
            one_video.addEventListener("canplaythrough", function():void {
                updateBufferingBar(this, buffering_bar) // Updates The Video Buffering Bar
            })

            one_video.addEventListener("progress", function():void {
                updateBufferingBar(this, buffering_bar) // Updates The Video Buffering Bar
            })

            // Video Loading Functionalities
            one_video.addEventListener("waiting", () => {
                showVideoLoader(loading) // Shows The Video Loader
            })
            
            one_video.addEventListener("playing", () => {
                hideVideoLoader(loading) // Hides The Video Loader
            })

            one_video.addEventListener("seeking", () => {
                showVideoLoader(loading) // Shows The Video Loader
            })

            one_video.addEventListener("seeked", () => {
                hideVideoLoader(loading) // Hides The Video Loader
            })

            one_video.addEventListener("stalled", () => {
                showVideoLoader(loading) // Shows The Video Loader
            })

            one_video.addEventListener("click", function():void {
                const play_pause_icon:HTMLElement = video_container.querySelector(".controls .buttons .play_pause i") as HTMLElement // Gets The Play / Pause Icon
                const play_pause_indicator:HTMLDivElement = video_container.querySelector(".play_pause_indicator") as HTMLDivElement // Gets The Play / Pause Indicator
                const video:HTMLVideoElement = video_container.querySelector(".video") as HTMLVideoElement // Gets The Video

                playPauseVideo(play_pause_icon, play_pause_indicator, video) // Plays Or Pauses The Video
            })

            // Scrubber Hitbox Mouse Move Functionalities
            scrubber_hitbox.addEventListener("mousemove", function(event:MouseEvent):void {
                const scrubber_rect = scrubber_hitbox.getBoundingClientRect() // Gets The Scrubber Rect
                const scrubber_width:number = scrubber_hitbox.offsetWidth // Gets The Scrubber Width
                const hovered_scrubber_position:number = event.clientX - scrubber_rect.left // Gets Current Hovered Scrubber Position
                const scrubber_progress:number = Math.min(Math.max((hovered_scrubber_position / scrubber_width) * 100, 0), 100) // Calculates The Current Scrubber Progress
                const hovered_video_time:number = (scrubber_progress / 100) * one_video.duration || 0 // Gets The Hovered Video Time

                is_hovered_scrubber = true
                scrubber.style.setProperty("--progress", `${scrubber_progress}%`) // Shows The Progress In Scrubber
                elapsed_timer.textContent = `${getFormattedTime("minutes", hovered_video_time)}:${getFormattedTime("seconds", hovered_video_time, true)}` // Sets The Elapsed Timer
            })

            // Scrubber Hitbox Mouse Out Functionalities
            scrubber_hitbox.addEventListener("mouseout", function():void {
                is_hovered_scrubber = false
                scrubber.style.setProperty("--progress", previous_scrubber_progress) // Shows The Progress In Scrubber
                elapsed_timer.textContent = `${getFormattedTime("minutes", previous_elapsed_time)}:${getFormattedTime("seconds", previous_elapsed_time, true)}` // Sets The Elapsed Timer
            })

            // Scrubber Hitbox Click Functionalities
            scrubber_hitbox.addEventListener("click", function(event:PointerEvent):void {
                // if(one_video.duration === 0 || isNaN(one_video.duration)) return;

                const scrubber_rect = scrubber_hitbox.getBoundingClientRect() // Gets The Scrubber Rect
                const scrubber_width:number = scrubber_hitbox.offsetWidth // Gets The Scrubber Width
                const clicked_scrubber_position:number = event.clientX - scrubber_rect.left // Gets Current Clicked Scrubber Position
                const scrubber_progress:number = Math.min(Math.max((clicked_scrubber_position / scrubber_width) * 100, 0), 100) // Calculates The Current Scrubber Progress
                const clicked_video_time:number = (scrubber_progress / 100) * one_video.duration || 0 // Gets The Clicked Video Time

                if(one_video.readyState === 4) {
                    one_video.currentTime = clicked_video_time // Sets The New Current Video Time Position
                    updateVideoTimer(one_video.currentTime, one_video.duration, elapsed_timer, scrubber) // Updates The Video Timer
                    previous_scrubber_progress = scrubber.style.getPropertyValue("--progress") || "0%"// Updates The Previous Scrubber Progress
                    previous_elapsed_time = one_video.currentTime // Updates The Previous Elapsed Time
                }
            })
        }
    })

    return post_container_template_clone // Returns The Post Container Template Clone
}

// Function For Check The Searched Posts History
export function checkSearchedPostsHistory(history_container:HTMLDivElement, search_bar:HTMLInputElement):void {
    let searched_posts_history:string[] = JSON.parse(localStorage.getItem("searched_posts_history") || "[]") as string[] // Gets The Searched Posts History From The Local Storage

    searched_posts_history.length > 0 ? renderSearchedPostsHistory(history_container, search_bar) : hideHistoryContainer(search_bar, history_container) // Renders The Searched Posts History If There Is Any Previous Searched Post
}

// Function For Render The Searched Posts History
function renderSearchedPostsHistory(history_container:HTMLDivElement, search_bar:HTMLInputElement):void {
    history_container.innerHTML = "" // Deletes The History Container

    let searched_posts_history:string[] = JSON.parse(localStorage.getItem("searched_posts_history") || "[]") as string[] // Gets The Searched Posts History From The Local Storage

    searched_posts_history.forEach(function(one_searched_post:string):void {
        const searched_post:HTMLDivElement = document.createElement("div") // Creates The Searched Post
        searched_post.classList.add("searched_post") // Adds The Searched Post Class
        history_container.appendChild(searched_post) // Appends The Searched Post To The History Container

        const delete_from_history:HTMLElement = document.createElement("i") // Creates The History Icon
        delete_from_history.classList.add("delete_from_history", "fa-solid", "fa-clock-rotate-left") // https://fontawesome.com/icons/clock-rotate-left
        delete_from_history.ariaHidden = "true"
        searched_post.appendChild(delete_from_history) // Appends The History Icon To The Searched Post

        const delete_from_history_hidden:HTMLElement = document.createElement("i") // Creates The Delete From History Icon
        delete_from_history_hidden.classList.add("delete_from_history", "hidden", "fa-solid", "fa-xmark") // https://fontawesome.com/icons/xmark
        delete_from_history_hidden.ariaHidden = "true"
        searched_post.appendChild(delete_from_history_hidden) // Appends The Delete From History Icon To The Searched Post

        const paragraph:HTMLParagraphElement = document.createElement("p") // Creates The Paragraph
        paragraph.dataset["searched_post"] = one_searched_post // Stores The Index
        paragraph.textContent = one_searched_post // Sets The Searched Post To Text
        paragraph.tabIndex = -1 // Makes The Element Focusable
        searched_post.appendChild(paragraph) // Appends The Paragraph To The Searched Post
    })

    showHistoryContainer(search_bar, history_container)
}

// Function For Store The Searched Post To The History
function storeSearchedPostToHistory(searched_text:string):void {
    let searched_posts_history:string[] = JSON.parse(localStorage.getItem("searched_posts_history") || "[]") as string[] // Gets The Searched Posts History From The Local Storage

    // Stores The New Result
    if(!searched_posts_history.includes(searched_text)) {
        searched_posts_history.unshift(searched_text) // Updates The Searched Posts History
        if(searched_posts_history.length > feed_state.MAX_HISTORY_LENGTH) searched_posts_history = searched_posts_history.slice(0, feed_state.MAX_HISTORY_LENGTH) // Shows Maximum Of 3 Results From The Searched Posts History, Others Will Be Deleted From The Searched Posts History
        localStorage.setItem("searched_posts_history", JSON.stringify(searched_posts_history)) // Saves Updated Searched Posts History To The Local Storage
    }

    // Updates The Order
    else {
        const searched_post_index = searched_posts_history.indexOf(searched_text)

        if(searched_post_index !== -1) searched_posts_history.splice(searched_post_index, 1) // Deletes The Previous Searched Post From The Searched Posts History
        searched_posts_history.unshift(searched_text) // Updates Searched Posts History
        if(searched_posts_history.length > feed_state.MAX_HISTORY_LENGTH) searched_posts_history = searched_posts_history.slice(0, feed_state.MAX_HISTORY_LENGTH) // Shows Maximum Of 3 Results From The Searched Posts History, Others Will Be Deleted From The Searched Posts History

        localStorage.setItem("searched_posts_history", JSON.stringify(searched_posts_history)) // Saves Updated Searched Posts History To The Local Storage
    }
}

// Function For Show The History Container
function showHistoryContainer(search_bar:HTMLInputElement, history_container:HTMLDivElement):void {
    search_bar.focus() // Focuses To Search Bar

    // Sets Search Bar Styles
    search_bar.style.borderRadius = "5px 5px 0px 0px"
    search_bar.style.borderBottom = "none"

    // Sets History Container Container Styles
    history_container.style.borderBottom = "1px solid rgb(75, 75, 250, 0.5)"
    history_container.style.borderLeft = "1px solid rgb(75, 75, 250, 0.5)"
    history_container.style.borderRight = "1px solid rgb(75, 75, 250, 0.5)"

    history_container.classList.add("active") // Adds Active Class To History Container
}

// Function For Hide The History Container
export function hideHistoryContainer(search_bar:HTMLInputElement, history_container:HTMLDivElement):void {
    // Sets Search Bar Styles
    search_bar.style.border = "1px solid rgb(75, 75, 250, 0.5)"
    search_bar.style.borderRadius = "5px"

    // Sets History Container Container Styles
    history_container.style.border = "none"

    history_container.classList.remove("active") // Removes Active Class From History Container
}

// Function For Change The Focused Searched Post
export function changeFocusedSearchedPost(index:number, all_searched_posts:NodeListOf<HTMLDivElement>, search_bar:HTMLInputElement):void {
    feed_state.focused_searched_post_index = index // Updates Focused Searched Post Index

    if(index > all_searched_posts.length - 1) feed_state.focused_searched_post_index = 0 // Sets Focused Searched Post Index To Minimum
    if(index < 0) feed_state.focused_searched_post_index = all_searched_posts.length - 1 // Sets Focused Searched Post Index To Maximum

    const searched_post:HTMLParagraphElement = ((all_searched_posts[feed_state.focused_searched_post_index] as HTMLDivElement).querySelector("p") as HTMLParagraphElement) // Gets The Searched Post

    searched_post.focus() // Focuses Searched Post
    search_bar.blur() // Removes Focus From The Search Bar
}

// Function For Load Posts
export async function loadPosts(feed:HTMLDivElement, feed_report:HTMLParagraphElement, search_bar?:HTMLInputElement, history_container?:HTMLDivElement):Promise<void> {
    if(feed_state.is_loading || !feed_state.has_more_posts) return

    feed_state.is_loading = true // Sets The Is Loading To True
    feed_report.style.display = "block" // Shows The Feed Report

    try {
        const params:URLSearchParams = new URLSearchParams({
            page: String(feed_state.current_page),
            searched_text: search_bar?.value || ""
        })

        // Gets Full Loaded Posts Response
        const full_loaded_posts_response:Response = await fetch(`/api/load-posts?${params.toString()}`, {
            method: "GET",

            headers: {
                "X-Requested-With": "XMLHttpRequest",
            }
        })

        // If The Response Isn't Success
        if(!full_loaded_posts_response.ok) {
            feed_report.textContent = gettext("Pri hľadaní príspevkov došlo k chybe.")
            return
        }

        const loaded_posts_response:searchedPostsResponse = await full_loaded_posts_response.json() // Gets Loaded Posts Response

        // If The Response Isn't Success
        if(!loaded_posts_response.success) {
            feed_report.textContent = loaded_posts_response.message
            return
        }

        const all_post_containers:NodeListOf<HTMLDivElement> = feed.querySelectorAll<HTMLDivElement>(".post_container") // Gets All Post Containers

        // Gets Only The Posts Data Of Posts Which Aren't Already Rendered
        const no_already_rendered_posts_data:searchedPost[] = loaded_posts_response.posts.filter(function(one_searched_post:searchedPost):boolean {
            return (
                ![...all_post_containers].some(function(one_post_container:HTMLDivElement):boolean {
                    return one_searched_post.id === Number(one_post_container.dataset["post_id"]) // If The Post ID Is Equal To Data In The Rendered Post In The DOM
                })
            )
        })

        no_already_rendered_posts_data.forEach(one_post => feed.insertBefore(createPostHTML(one_post, feed, loaded_posts_response.logged_in_user?.logged_in_user_id, loaded_posts_response.logged_in_user?.profile_picture_name, loaded_posts_response.logged_in_user?.saved_posts), feed_report)) // Appends The Post To The Feed
        feed_state.has_more_posts = loaded_posts_response.has_next || false // Sets The Has More Posts
        feed_state.has_more_posts ? feed_state.current_page++ : feed_report.textContent = gettext("Videli ste všetky príspevky.") // Shows The Message If The User Has Already Viewed All Posts
    }
    
    catch {
        feed_report.textContent = gettext("Pri hľadaní príspevkov došlo k chybe.")
    }
    
    finally {
        seenPostObserver(feed) // Initializes The Post Observation

        feed_state.is_loading = false // Sets The Is Loading To False
        const all_post_containers:NodeListOf<HTMLDivElement> = feed.querySelectorAll<HTMLDivElement>(".post_container") // Gets All Post Containers

        if(all_post_containers.length === 0) {
            feed_report.textContent = gettext("Nenašli sa žiadne príspevky.")
        }

        else {
            if(search_bar && history_container && search_bar.value.trim() !== "") {
                storeSearchedPostToHistory(search_bar.value) // Stores The Searched Text To The Searched Posts History
                renderSearchedPostsHistory(history_container, search_bar) // Renders The Searched Posts History
            }
        }
    }
}

// Function For Initialize The Seen Post Observer
export function seenPostObserver(feed:HTMLDivElement):void {
    const SEEN_TIME:number = 1000 // Sets The Maximum Time A Post Can Be Viewed Before It Is Marked As Seen (1 Second)
    const SEEN_VISIBILITY:number = 0.8 // Sets The Minimum Percentage Of Visibility Of The Post To Be Marked As Seen (80%) 
    const seen_posts_timeouts:Record<string, number> = {}

    const seen_post_observer:IntersectionObserver = new IntersectionObserver(function(entries:IntersectionObserverEntry[]):void {
        entries.forEach(function(one_entry:IntersectionObserverEntry):void {
            const post_id:number|null = Number(one_entry.target.getAttribute("data-post_id")) || null // Gets The Post ID If Is Available
            
            if(!post_id) return

            // If The User Is Viewing The Post
            if(one_entry.isIntersecting) {
                // Marks The Post As Seen When The Timeout Elapses
                seen_posts_timeouts[post_id] = window.setTimeout(function():void {
                    markPostAsSeen(post_id) // Marks The Post As Seen
                    seen_post_observer.unobserve(one_entry.target) // Stops The Observation Of The Post When It Has Been Marked As Seen
                }, SEEN_TIME)
            }
            
            // Resets The Timeout If The User Has Left The Post
            else {
                if(seen_posts_timeouts[post_id]) {
                    clearTimeout(seen_posts_timeouts[post_id]) // Clears The Timeout
                    delete seen_posts_timeouts[post_id] // Deletes The Post Record From The Seen Posts Timeouts
                }
            }
        })
    }, {
        root: null,
        threshold: SEEN_VISIBILITY
    })

    const all_post_containers:NodeListOf<HTMLDivElement> = feed.querySelectorAll<HTMLDivElement>(".post_container") // Gets All Post Containers

    // Starts The Seen Post Observer On Every Post Container In The Feed
    all_post_containers.forEach(function(one_post_container:HTMLDivElement):void {
        seen_post_observer.observe(one_post_container)
    })
}

// Function For Mark The Post As Already Seen
async function markPostAsSeen(id:number):Promise<void> {
    try {
        const mark_post_as_seen_response:response = await sendPOST(window.location.pathname, id, "mark-post-as-seen") // Sends Post ID As A POST Data

        // If The Response Isn't Success
        if(!mark_post_as_seen_response.success) {
            displayMessage(mark_post_as_seen_response.message, "error") // Displays The Error Message
            return
        }
    }

    catch {
        displayMessage(gettext('Pri označovaní príspevku za "už videný" došlo k chybe.'), "error") // Displays The Error Message
    }
}

// Function For Get The Upload Progress
export function getUploadProgress(task_id:number, post_id:number, upload_progress:HTMLDivElement, processing_post_report:HTMLParagraphElement):void {
    const MAX_RED:number = 255
    const MIN_RED:number = 82

    // Checks The Upload Progress Every 3 Seconds
    const upload_progress_interval = setInterval(async function() {
        try {
            // Gets Full Upload Progress Response
            const full_upload_progress_response:Response = await fetch(`/api/compression-status/${task_id}/`)

            // If The Response Isn't Success
            if(!full_upload_progress_response.ok) {
                processing_post_report.textContent = gettext("Pri spracovávaní príspevku došlo k chybe!") // Shows The Error Message
            }

            // Gets Upload Progress Response
            const upload_progress_response:uploadProgressResponse = await full_upload_progress_response.json()

            if(upload_progress_response.state === "PROGRESS") {
                let red:number = MAX_RED - (upload_progress_response.progress / 100) * (MAX_RED - MIN_RED) // Makes Color Transition For Progress Bar From rgb(255, 207, 32) To rgb(82, 207, 32)

                upload_progress.dataset["progress"] = `${upload_progress_response.progress}%` // Updates The Progress Percentage Label
                upload_progress.style.setProperty("--progress", `${upload_progress_response.progress}%`) // Updates The Width Of The Progress Bar
                upload_progress.style.setProperty("--progress-color", `rgb(${red}, 207, 32)`) // Updates The Color Of The Progress Bar
            }
            
            else if(upload_progress_response.state === "SUCCESS") {
                clearInterval(upload_progress_interval) // Deletes The Upload Progress Interval
                removeProcessingPost(task_id) // Removes Current Processing Post Data From The Local Storage
                checkProcessingPosts(post_id, processing_post_report) // Checks If There Is Any Other Media From Selected Post In The Processing Posts
                setCompletedUploadProgress(upload_progress) // Sets The State For The Completed Upload Progress
            }
            
            else if(upload_progress_response.state === "FAILURE") {
                clearInterval(upload_progress_interval) // Deletes The Upload Progress Interval
                removeProcessingPost(task_id) // Removes Current Processing Post Data From The Local Storage
                processing_post_report.textContent = gettext("Pri spracovávaní príspevku došlo k chybe!") // Shows The Error Message
            }
        }
        
        catch {
            processing_post_report.textContent = gettext("Pri spracovávaní príspevku došlo k chybe!") // Shows The Error Message
        }
    }, 1000)
}

// Function For Check If There Is Any Other Media From Selected Post In The Processing Posts
export function checkProcessingPosts(post_id:number, processing_post_report:HTMLParagraphElement):void {
    const processing_posts:compressTask[] = JSON.parse(localStorage.getItem("processing_posts") || "[]") // Gets The Processing Posts From The Local Storage
    const processing_posts_post_ids:number[] = processing_posts.map((one_task:compressTask) => one_task.post_id) // Gets All Current Post IDs From The Local Storage

    if(!processing_posts_post_ids.includes(post_id)) processing_post_report.textContent = gettext("Príspevok bol úspešne pridaný.") // Shows The Success Message
}

// Function For Set The State Of Completed Upload Progress
export function setCompletedUploadProgress(upload_progress:HTMLDivElement):void {
    upload_progress.dataset["progress"] = `100%` // Updates The Progress Percentage Label
    upload_progress.style.setProperty("--progress", `100%`) // Updates The Width Of The Progress Bar
    upload_progress.style.setProperty("--progress-color", `rgb(82, 207, 32)`) // Updates The Color Of The Progress Bar
}

// Function For Remove The Current Processing Post Data From The Local Storage
function removeProcessingPost(task_id:number):void {
    // Gets All Processing Posts From The Local Storage
    let processing_posts:compressTask[] = JSON.parse(localStorage.getItem("processing_posts") || "[]") // Gets The Processing Posts From The Local Storage

    // Gets The Current Processing Post From The Local Storage
    const processing_post:compressTask|undefined = processing_posts.find(function(one_task:compressTask) {
        return one_task.task_id === task_id
    })

    if(processing_post) {
        const processing_post_index:number = processing_posts.indexOf(processing_post) // Gets The Index Of The Current Processing Post In The Local Storage

        if(processing_post_index !== -1) processing_posts.splice(processing_post_index, 1) // Deletes The Current Processing Post From The Processing Posts In The Local Storage
        localStorage.setItem("processing_posts", JSON.stringify(processing_posts)) // Saves Updated Processing Posts To The Local Storage
    }
}

// Function For Play Or Pause The Video
export function playPauseVideo(play_pause_icon:HTMLElement, play_pause_indicator:HTMLDivElement, video:HTMLVideoElement):void {
    const is_playing:boolean = !video.paused && !video.ended && video.readyState > 2

    // Play
    if(!is_playing) {
        play_pause_icon.classList.replace("fa-play", "fa-pause"); // Shows The Pause Icon

        const video_play_pause_indicator_icon:HTMLElement = play_pause_indicator.querySelector("i") as HTMLElement // Gets The Video Play / Pause Indicator Icon

        video_play_pause_indicator_icon.classList.replace("fa-pause", "fa-play") // Shows The Play Icon

        // Play / Pause Indicator
        play_pause_indicator.classList.add("hidden")
        void play_pause_indicator.offsetWidth
        play_pause_indicator.classList.remove("hidden")

        setTimeout(() => {
            play_pause_indicator.classList.add("hidden")
        }, 300)

        video.play() // Plays The Video
    }

    // Pause
    else {
        play_pause_icon.classList.replace("fa-pause", "fa-play"); // Shows The Play Icon

        const video_play_pause_icon:HTMLElement = play_pause_indicator.querySelector("i") as HTMLElement // Gets The Video Play Pause Icon

        video_play_pause_icon.classList.replace("fa-play", "fa-pause") // Shows The Pause Icon

        // Play / Pause Indicator
        play_pause_indicator.classList.add("hidden")
        void play_pause_indicator.offsetWidth
        play_pause_indicator.classList.remove("hidden")

        setTimeout(() => {
            play_pause_indicator.classList.add("hidden")
        }, 300)

        video.pause() // Pauses The Video
    }
}

// Function For Rewind The Video 5 Seconds
export function stepBack(step_back_indicator:HTMLDivElement, video:HTMLVideoElement, step:number = 5):void {
    let new_time:number = video.currentTime - step // Gets The New Video Time

    if(new_time < 0) new_time = 0 // Caps The Minimum Time To 0

    // Step Back Indicator
    step_back_indicator.classList.add("hidden")
    void step_back_indicator.offsetWidth
    step_back_indicator.classList.remove("hidden")

    setTimeout(() => {
        step_back_indicator.classList.add("hidden")
    }, 300)

    video.currentTime = new_time // Sets The New Current Video Time Position
}

// Function For Fast Forward The Video 5 Seconds
export function stepFurther(step_further_indicator:HTMLDivElement, video:HTMLVideoElement, step:number = 5):void {
    let new_time:number = video.currentTime + step // Gets The New Video Time

    if(new_time > video.duration) new_time = video.duration // Caps The Maximum Time To The Duration Of The Video

    // Step Further Indicator
    step_further_indicator.classList.add("hidden")
    void step_further_indicator.offsetWidth
    step_further_indicator.classList.remove("hidden")

    setTimeout(() => {
        step_further_indicator.classList.add("hidden")
    }, 300)

    video.currentTime = new_time // Sets The New Current Video Time Position
}

// Function For Mute Or Unmute The Video
export function muteUnmuteVideo(volume_icon:HTMLElement, volume_input:HTMLInputElement, video:HTMLVideoElement):void {
    // Unmute
    if(volume_icon.classList.contains("fa-volume-xmark")) {
        volume_icon.classList.replace("fa-volume-xmark", "fa-volume-high") // Shows The High Volume Icon
        video.muted = false // Unmutes The Video
        volume_input.value = "0.5" // Sets The Volume Input To 0.5
        volume_input.style.setProperty("--volume", '"50%"') // Shows The Volume Percentage
    }

    // Mute
    else {
        volume_icon.classList.replace("fa-volume-high", "fa-volume-xmark") // Shows The Muted Icon
        volume_icon.classList.replace("fa-volume-low", "fa-volume-xmark") // Shows The Muted Icon
        video.muted = true // Mutes The Video
        volume_input.value = "0" // Sets The Volume Input To 0
        volume_input.style.setProperty("--volume", '"0%"') // Shows The Volume Percentage
    }
}

// Function For Change The Video Volume
export function changeVideoVolume(volume_input:HTMLInputElement, volume_icon:HTMLElement, video:HTMLVideoElement):void {
    const volume:number = Number(volume_input.value) // Gets The Volume Value

    volume_input.style.setProperty("--volume", `"${Math.round(volume * 100)}%"`) // Shows The Volume Percentage

    // Mute
    if(volume === 0) {
        volume_icon.classList.replace("fa-volume-low", "fa-volume-xmark") // Shows The Muted Icon
        video.muted = true // Mutes The Video
    }

    // Low Volume
    else if(volume > 0 && volume <= 0.5) {
        volume_icon.classList.replace("fa-volume-xmark", "fa-volume-low") // Shows The Low Volume Icon
        volume_icon.classList.replace("fa-volume-high", "fa-volume-low") // Shows The Low Volume Icon
        video.muted = false // Unmutes The Video
        video.volume = volume // Sets The Volume
    }

    // High Volume
    else {
        volume_icon.classList.replace("fa-volume-low", "fa-volume-high") // Shows The High Volume Icon
        video.muted = false // Unmutes The Video
        video.volume = volume // Sets The Volume
    }
}

// Function For Play Or Pause The Video
export function toogleVideoFullscreen(toggle_fullscreen_icon:HTMLElement, video_container:HTMLDivElement):void {
    // Fullscreen Mode
    if(toggle_fullscreen_icon.classList.contains("fa-expand")) {
        if(!document.fullscreenElement) {
            toggle_fullscreen_icon.classList.replace("fa-expand", "fa-compress") // Shows The Compress Icon
            video_container.requestFullscreen() // Makes The Video Full Screen Sized
        }
    }

    // Exit The Fullscreen Mode
    if(toggle_fullscreen_icon.classList.contains("fa-compress")) {
        if(document.fullscreenElement) {
            toggle_fullscreen_icon.classList.replace("fa-compress", "fa-expand") // Shows The Expand Icon
            document.exitFullscreen() // Makes The Video Normal Screen Sized
        }
    }
}

// Function For Set The Video Duration
export function setVideoDuration(duration:number, total_time:HTMLSpanElement):void {
    total_time.textContent = `${getFormattedTime("minutes", duration)}:${getFormattedTime("seconds", duration, true)}` // Sets The Total Time
}

// Function For Update The Video Timer
export function updateVideoTimer(elapsed_time:number, duration:number, elapsed_timer:HTMLSpanElement, scrubber:HTMLDivElement) {
    elapsed_timer.textContent = `${getFormattedTime("minutes", elapsed_time)}:${getFormattedTime("seconds", elapsed_time, true)}` // Sets The Elapsed Timer

    const progress:number = (elapsed_time / duration) * 100 // Calculates The Progress

    scrubber.style.setProperty("--progress", `${progress}%`) // Shows The Progress In Scrubber
}

// Function For Update The Video Buffering Bar
export function updateBufferingBar(video:HTMLVideoElement, buffering_bar:HTMLDivElement):void {
    if(video.duration > 0 && video.buffered.length > 0) {
        let current_buffered_end:number = 0

        for(let i:number = 0; i < video.buffered.length; i++) {
            if(video.currentTime >= video.buffered.start(i) && video.currentTime <= video.buffered.end(i)) {
                current_buffered_end = video.buffered.end(i)
                break
            }
        }

        if(current_buffered_end === 0 && video.buffered.length > 0) {
            current_buffered_end = video.buffered.end(0)
        }

        const duration:number = video.duration
        const buffer_percentage:number = (current_buffered_end / duration) * 100
        
        buffering_bar.style.setProperty("--progress", `${buffer_percentage}%`)
    }
}

// Function For Show The Video Loader
export function showVideoLoader(loading:HTMLDivElement):void {
    loading.classList.remove("hidden") // Shows The Loading
}

// Function For Hide The Video Loader
export function hideVideoLoader(loading:HTMLDivElement):void {
    loading.classList.add("hidden") // Hides The Loading
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