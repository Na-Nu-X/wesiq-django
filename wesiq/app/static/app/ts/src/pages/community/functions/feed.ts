import { sendPOST } from "../../../services/sendPOST.js"
import { generateNumberRange } from "../../../utils/generateNumberRange.js"
import { getFormattedDate } from "../../../utils/getFormattedDate.js"
import { feed_state } from "../state.js"

import type { response } from "../../../services/sendPOST.js"

export interface searchedPost {
    user:{
        id:number,
        first_name:string,
        last_name:string,
        username:string,
        profile_picture_name:string|null,
        following:string[],
        followers:string[]
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
    likes_from_users:string[],
    created_at:string,

    media:{
        file:string,
        is_video:boolean
    }[],

    visible_comments:{
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
        likes_from_users:string[],
        creation_time:string,
        parent_id:number|null,
        reports_from_users:string[]
    }[]
}

export interface searchedPostsResponse {
    success:boolean,
    has_next?:boolean,
    logged_in_user_id?:number,
    profile_picture_name?:string,
    posts:searchedPost[],
    message:string
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
export function changePost(clicked_bar_index:number, post_bars:HTMLDivElement, bar:HTMLDivElement, all_media:NodeListOf<HTMLDivElement>):void {
    if(clicked_bar_index >= 0 && clicked_bar_index <= all_media.length - 1) {
        all_media.forEach(function(one_post:HTMLDivElement, index:number):void {
            if(index !== clicked_bar_index) {
                one_post.style.display = "none"

                const all_bars:NodeListOf<HTMLDivElement> = post_bars.querySelectorAll<HTMLDivElement>(".bar") // Gets All Bars

                all_bars.forEach(one_bar => one_bar.classList.remove("active")) // Removes The Active Class From All Bars
                bar.classList.add("active") // Adds The Active Class
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
export async function togglePostLike(icon:HTMLElement, counter:HTMLParagraphElement|null, id:string, particles:HTMLDivElement):Promise<void> {
    // If The Heart Is Empty
    if(icon.classList.contains("fa-regular")) {
        try {
            const like_post_response:response = await sendPOST(window.location.pathname, id, "like-post") // Sends Liked Post ID As A POST Data

            // If The Response Isn't Success
            if(!like_post_response.success) {
                console.error(like_post_response.message)
                return
            }

            generateHeartParticles(particles) // Generates The Heart Particles
            icon.classList.replace("fa-regular", "fa-solid") // Adds Filled Heart Image
            if(counter) counter.textContent = String(parseInt(counter.textContent) + 1) // Adds 1 Like To The Counter By Clicking On The Empty Heart
        }

        catch {
            console.error(gettext("Pri pridávaní označenia páči sa mi to došlo k chybe."))
        }
    }

    // If The Heart Is Already Clicked
    else if(icon.classList.contains("fa-solid")) {
        try {
            const cancel_like_post_response:response = await sendPOST(window.location.pathname, id, "cancel-like-post") // Sends Liked Post ID As A POST Data

            // If The Response Isn't Success
            if(!cancel_like_post_response.success) {
                console.error(cancel_like_post_response.message)
                return
            }

            icon.classList.replace("fa-solid", "fa-regular") // Adds Empty Heart Image
            if(counter) counter.textContent = String(parseInt(counter.textContent) - 1) // Subtracts 1 Like To The Counter By Clicking On The Already Clicked Heart
        }

        catch {
            console.error(gettext("Pri rušení označenia páči sa mi to došlo k chybe."))
        }
    }
}

// Function For Add Comment
export async function addComment(post_id:string, comment:string, all_comments:HTMLDivElement):Promise<void> {
    try {
        const comment_data:{
            post_id:string,
            comment:string
        } = {
            post_id,
            comment
        }

        const searched_tags_response:response = await sendPOST(window.location.pathname, comment_data, "add-comment") // Sends The Data With POST

        // If The Response Isn't Success
        if(!searched_tags_response.success) {
            console.error(searched_tags_response.message)
            return
        }
    }

    catch {
        console.error(gettext("Pri odosielaní komentáru došlo k chybe."))
    }
}

// Function For Toggle Comment Like
export async function toggleCommentLike(icon:HTMLElement, counter:HTMLParagraphElement, id:string):Promise<void> {
    // If The Heart Is Empty
    if(icon.classList.contains("fa-regular")) {
        try {
            const like_comment_response:response = await sendPOST(window.location.pathname, id, "like-comment") // Sends Liked Comment ID As A POST Data

            // If The Response Isn't Success
            if(!like_comment_response.success) {
                console.error(like_comment_response.message)
                return
            }

            icon.classList.replace("fa-regular", "fa-solid") // Adds Filled Heart Image
            counter.textContent = String(parseInt(counter.textContent) + 1) // Adds 1 Like To The Counter By Clicking On The Empty Heart
        }

        catch {
            console.error(gettext("Pri pridávaní označenia páči sa mi to došlo k chybe."))
        }
    }

    // If The Heart Is Already Clicked
    else if(icon.classList.contains("fa-solid")) {
        try {
            const cancel_like_comment_response:response = await sendPOST(window.location.pathname, id, "cancel-like-comment") // Sends Liked Comment ID As A POST Data

            // If The Response Isn't Success
            if(!cancel_like_comment_response.success) {
                console.error(cancel_like_comment_response.message)
                return
            }

            icon.classList.replace("fa-solid", "fa-regular") // Adds Empty Heart Image
            if(counter) counter.textContent = String(parseInt(counter.textContent) - 1) // Subtracts 1 Like To The Counter By Clicking On The Already Clicked Heart
        }

        catch {
            console.error(gettext("Pri rušení označenia páči sa mi to došlo k chybe."))
        }
    }
}

// Function For Report The Comment
export async function reportComment(icon:HTMLElement, id:string):Promise<void> {
    try {
        const report_comment_response:response = await sendPOST(window.location.pathname, id, "report-comment") // Sends Liked Comment ID As A POST Data

        // If The Response Isn't Success
        if(!report_comment_response.success) {
            console.error(report_comment_response.message)
            return
        }

        icon.classList.add("active") // Adds The Active Class
    }

    catch {
        console.error(gettext("Pri odosielaní nahlásenia došlo k chybe."))
    }
}

// Function For Reply On The Comment
export async function replyOnComment(write_comment_form:HTMLDivElement, reply_container:HTMLDivElement, icon:HTMLElement, id:string):Promise<void> {
    if(!reply_container.querySelector(".write_comment_form")) {
        const write_comment_form_clone:DocumentFragment = write_comment_form.cloneNode(true) as DocumentFragment // Clones The Write Comment Form
    
        reply_container.appendChild(write_comment_form_clone) // Appends The Write Comment Form To The Reply Container
        icon.classList.remove("fa-regular", "fa-comment") // https://fontawesome.com/icons/comment
        icon.classList.add("fa-solid", "fa-xmark") // https://fontawesome.com/icons/xmark
    }
    
    else {
        reply_container.innerHTML = "" // Deletes The Reply Container
        icon.classList.remove("fa-solid", "fa-xmark") // https://fontawesome.com/icons/xmark
        icon.classList.add("fa-regular", "fa-comment") // https://fontawesome.com/icons/comment
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
function createPostHTML(post_data:searchedPost, feed:HTMLDivElement, logged_in_user_id:number|undefined, profile_picture_name:string|undefined):DocumentFragment {
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
        follow_button.dataset["action"] = !post_data.user.followers.includes(String(logged_in_user_id)) ? "follow" : "unfollow"
        follow_button.textContent = !post_data.user.followers.includes(String(logged_in_user_id)) ? gettext("Začať sledovať") : gettext("Prestať sledovať")

        top.appendChild(follow_button) // Appends The Follow Button To The Top Container
    }

    // Triple Dots Icon
    else {
        const icon:HTMLElement = document.createElement("i") // Creates The Icon

        icon.classList.add("fa-solid", "fa-ellipsis-vertical") // https://fontawesome.com/icons/ellipsis-vertical

        top.appendChild(icon) // Appends The Icon To The Top Container
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
            image.alt = interpolate(gettext('Príspevok užívateľa %s'), [`${post_data.user.first_name} ${post_data.user.last_name}`]) // Sets The Alternative Text For The Image

            one_post_container.appendChild(image) // Appends The Image To The One Post Container
            media.appendChild(one_post_container)
        }

        // Video
        else if(one_post_media.is_video) {
            const video:HTMLVideoElement = document.createElement("video") // Creates The Video

            video.classList.add("video") // Adds The Video Class
            video.controls = true
            video.autoplay = true
            video.loop = true
            video.muted = true
            video.textContent = interpolate(gettext('Príspevok užívateľa %s'), [`${post_data.user.first_name} ${post_data.user.last_name}`]) // Sets The Alternative Text For The Video

            const source:HTMLSourceElement = document.createElement("source") // Creates The Source Element

            source.src = `/../media/${one_post_media.file}` // Sets The File Path

            video.appendChild(source) // Appends The Source To The Video
            one_post_container.appendChild(video) // Appends The Video To The One Post Container
            media.appendChild(one_post_container)
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
    logged_in_user_id && post_data.likes_from_users.includes(String(logged_in_user_id)) ? like_icon.classList.add("fa-solid") : like_icon.classList.add("fa-regular") // Shows The Empty Or Filled Heart Icon - https://fontawesome.com/icons/heart

    // Likes Counter
    if(!post_data.hide_likes) {
        const likes_counter:HTMLParagraphElement = document.createElement("p") // Creates The Likes Counter
        likes_counter.classList.add("likes_counter") // Adds The Likes Counter
        likes_counter.textContent = String(post_data.likes) // Sets The Likes Counter
        likes.appendChild(likes_counter) // Appends The Likes Counter To The Likes
    }

    // Hidden Likes Counter
    else {
        const hidden_likes_counter:HTMLParagraphElement = document.createElement("p") // Creates The Hidden Likes Counter
        hidden_likes_counter.classList.add("hidden_likes_counter") // Adds The Hidden Likes Counter
        hidden_likes_counter.textContent = gettext("Skryté")
        likes.appendChild(hidden_likes_counter) // Appends The Hidden Likes Counter To The Likes
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

    post_data.visible_comments.forEach(function(one_visible_comment:{
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
        likes_from_users:string[],
        creation_time:string,
        parent_id:number|null,
        reports_from_users:string[]
    }):void {
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
        const comment_author_username:HTMLParagraphElement = one_comment_container.querySelector(".comment_container .username") as HTMLParagraphElement // Gets The Comment Author Username
        comment_author_username.classList.add("username") // Adds The Username Class
        comment_author_username.textContent = one_visible_comment.user.username // Sets The Comment Author Username Text

        // Comment
        const comment:HTMLParagraphElement = one_comment_container.querySelector(".comment_container .comment") as HTMLParagraphElement // Gets The Comment Paragraph
        comment.textContent = one_visible_comment.comment // Sets The Comment Text

        all_comments.appendChild(one_comment_container)

        // Interactions
        const interactions:HTMLDivElement = one_comment_container.querySelector(".interactions") as HTMLDivElement // Gets The Comment Interactions Container

        // Likes
        const likes:HTMLDivElement = interactions.querySelector(".likes") as HTMLDivElement // Gets The Likes Container

        const like_icon:HTMLElement = likes.querySelector(".fa-heart") as HTMLElement // Gets The Heart Icon
        logged_in_user_id && one_visible_comment.likes_from_users.includes(String(logged_in_user_id)) ? like_icon.classList.add("fa-solid") : like_icon.classList.add("fa-regular") // Shows The Empty Or Filled Heart Icon - https://fontawesome.com/icons/heart

        // Likes Counter
        const likes_counter:HTMLParagraphElement = likes.querySelector(".likes_counter") as HTMLParagraphElement // Gets The Likes Counter
        likes_counter.textContent = String(one_visible_comment.likes) // Sets The Likes Counter
        likes.appendChild(likes_counter) // Appends The Likes Counter To The Likes

        // Report
        if(logged_in_user_id && one_visible_comment.reports_from_users.includes(String(logged_in_user_id))) {
            const report:HTMLDivElement = interactions.querySelector(".report") as HTMLDivElement // Gets The Report Container

            const report_icon:HTMLElement = report.querySelector(".fa-flag") as HTMLElement // Gets The Report Icon
            report_icon.classList.add("active") // Adds The Active Class
        }

        // Date
        const date:HTMLDivElement = interactions.querySelector(".date") as HTMLDivElement // Gets The Date Container

        const date_paragraph:HTMLParagraphElement = date.querySelector("p") as HTMLParagraphElement // Gets The Date Paragraph
        date_paragraph.textContent = getFormattedDate(one_visible_comment.creation_time)
    })

    // Bars
    const media_container:HTMLDivElement = post_container.querySelector(".media") as HTMLDivElement // Gets The Media Container
    const all_media:NodeListOf<HTMLDivElement> = media_container.querySelectorAll<HTMLDivElement>(".one_post") // Gets All Media From The Posts
    
    generatePostBars(all_media, post_bars) // Generates The Post Bars

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

        console.log(loaded_posts_response)

        const all_post_containers:NodeListOf<HTMLDivElement> = feed.querySelectorAll<HTMLDivElement>(".post_container") // Gets All Post Containers

        // Gets Only The Posts Data Of Posts Which Aren't Already Rendered
        const no_already_rendered_posts_data:searchedPost[] = loaded_posts_response.posts.filter(function(one_searched_post:searchedPost):boolean {
            return (
                ![...all_post_containers].some(function(one_post_container:HTMLDivElement):boolean {
                    return one_searched_post.id === Number(one_post_container.dataset["post_id"]) // If The Post ID Is Equal To Data In The Rendered Post In The DOM
                })
            )
        })

        no_already_rendered_posts_data.forEach(one_post => feed.insertBefore(createPostHTML(one_post, feed, loaded_posts_response.logged_in_user_id, loaded_posts_response.profile_picture_name), feed_report)) // Appends The Post To The Feed
        feed_state.has_more_posts = loaded_posts_response.has_next || false // Sets The Has More Posts
        feed_state.has_more_posts ? feed_state.current_page++ : feed_report.textContent = gettext("Videli ste všetky príspevky.") // Shows The Message If The User Has Already Viewed All Posts
    }
    
    catch {
        feed_report.textContent = gettext("Pri hľadaní príspevkov došlo k chybe.")
    }
    
    finally {
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

// Function For Get The Upload Progress
export function getUploadProgress(task_id:number):void {
    // Checks The Upload Progress Every Second
    const upload_progress_interval = setInterval(async function() {
        try {
            // Gets Full Upload Progress Response
            const full_upload_progress_response:Response = await fetch(`/api/compression-status/${task_id}/`)

            // If The Response Isn't Success
            if(!full_upload_progress_response.ok) {
                // feed_report.textContent = gettext("Pri hľadaní príspevkov došlo k chybe.")
                return
            }

            // Gets Upload Progress Response
            const upload_progress_response:{
                task_id:number,
                state:"PENDING"|"PROGRESS"|"SUCCESS"|"FAILURE",
                progress:number
            } = await full_upload_progress_response.json()

            if(upload_progress_response.state === 'PROGRESS') {
                console.log(upload_progress_response.progress)
            } 
            
            else if(upload_progress_response.state === 'SUCCESS') {
                clearInterval(upload_progress_interval) // Deletes The Upload Progress Interval
                console.log("SUCCESS")
            } 
            
            else if(upload_progress_response.state === 'FAILURE') {
                clearInterval(upload_progress_interval) // Deletes The Upload Progress Interval
                console.log("FAILURE")
            }
        }
        
        catch(error) {
            console.error("Chyba pri kontrole stavu:", error)
        }
    }, 1000)
}