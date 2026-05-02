import { sendPOST } from "../../../services/sendPOST.js"
import { generateNumberRange } from "../../../utils/generateNumberRange.js"

import { getFormattedDate } from "../../../utils/getFormattedDate.js"
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

// Function For Get The Searched Posts
export async function getSearchedPosts(searched_text:string, all_post_containers:NodeListOf<HTMLDivElement>, feed:HTMLDivElement):Promise<void> {
    try {
        const searched_posts_response:searchedPostsResponse = await sendPOST(window.location.pathname, searched_text, "search-posts") // Sends The Data With POST

        // If The Response Isn't Success
        if(!searched_posts_response.success) {
            console.error(searched_posts_response.message)
            return
        }

        // Gets Only The Posts Data Of Posts Which Aren't Already Rendered
        const no_already_rendered_posts_data:searchedPost[] = searched_posts_response.posts.filter(function(one_searched_post:searchedPost):boolean {
            return (
                ![...all_post_containers].some(function(one_post_container:HTMLDivElement):boolean {
                    return one_searched_post.id === Number(one_post_container.dataset["post_id"]) // If The Post ID Is Equal To Data In The Rendered Post In The DOM
                })
            )
        })

        // Gets Inappropriate Post Containers From The DOM
        const inappropriate_post_containers:HTMLDivElement[] = [...all_post_containers].filter(function(one_post_container:HTMLDivElement):boolean {
            return (
                !searched_posts_response.posts.some(function(one_searched_post:searchedPost):boolean {
                    return one_searched_post.id === Number(one_post_container.dataset["post_id"]) // If The Post ID Is Equal To Data In The Rendered Post In The DOM
                })
            )
        })
        
        deleteInappropriatePosts(inappropriate_post_containers) // Deletes The Inappropriate Post
        renderSearchedPosts(no_already_rendered_posts_data, feed, searched_posts_response.logged_in_user_id, searched_posts_response.profile_picture_name) // Renders The Searched Posts

        // No Posts Message
        const no_posts:HTMLParagraphElement = feed.querySelector(".no_posts") as HTMLParagraphElement // Gets The No Posts Paragraph
        feed.querySelectorAll<HTMLDivElement>(".post_container").length === 0 ? no_posts.classList.remove("hidden") : no_posts.classList.add("hidden") // Shows / Hides The No Posts Message
    }

    catch {
        console.error(gettext("Pri hľadaní príspevkov došlo k chybe."))
    }
    
    finally {
        all_post_containers.forEach(one_post_container => (one_post_container.querySelector(".loading") as HTMLDivElement).classList.add("hidden")) // Hides The Loader
    }
}

// Function For Delete The Inappropriate Posts
function deleteInappropriatePosts(inappropriate_post_containers:HTMLDivElement[]):void {
    inappropriate_post_containers.forEach(one_post_container => one_post_container.remove()) // Removes The Post Container From The DOM
}

// Function For Render Searched Posts
function renderSearchedPosts(no_already_rendered_posts_data:searchedPost[], feed:HTMLDivElement, logged_in_user_id:number|undefined, profile_picture_name:string|undefined):void {
    // Renders Only No Already Rendered Posts
    no_already_rendered_posts_data.forEach(function(one_post:searchedPost):void {
        const post_container_template:HTMLTemplateElement = feed.querySelector(".post_container_template") as HTMLTemplateElement // Gets The Post Container Template
        const post_container_template_clone:DocumentFragment = post_container_template.content.cloneNode(true) as DocumentFragment // Clones The Post Container Template Content
    
        // Post Container
        const post_container:HTMLDivElement = post_container_template_clone.querySelector(".post_container") as HTMLDivElement // Creates The Post Container
        post_container.dataset["post_id"] = String(one_post.id) // Stores The Post ID

        // Post Author Profile Picture Link
        const post_author_profile_picture_link:HTMLAnchorElement = post_container.querySelector(".header .left a") as HTMLAnchorElement // Gets The Post Author Profile Picture Link
        post_author_profile_picture_link.href = interpolate(gettext("/sk/profil/%s"), [one_post.user.username]) // Sets The Link To The User's Profile
        post_author_profile_picture_link.title = gettext("Zobraziť užívateľa")

        // Post Author Profile Picture
        const post_author_profile_picture:HTMLImageElement = post_author_profile_picture_link.querySelector(".profile_picture") as HTMLImageElement // Gets The Post Author Profile Picture 
        post_author_profile_picture.src = one_post.user.profile_picture_name ? `/../media/images/${one_post.user.id}/${one_post.user.profile_picture_name}` : "/../static/images/profile_picture.png" // Sets Profile Picture - https://www.flaticon.com/free-icon/user_3177440

        const right:HTMLDivElement = post_container.querySelector(".header .right") as HTMLDivElement // Gets The Right Container Of The Header
        const top:HTMLDivElement = right.querySelector(".top") as HTMLDivElement // Gets The Top Container Of The Right Container

        // Post Author Username
        const post_author_username:HTMLParagraphElement = top.querySelector(".username") as HTMLParagraphElement // Gets The Post Author Username
        post_author_username.textContent = one_post.user.username // Sets The Username

        // Post Author Followers
        const post_author_followers:HTMLParagraphElement = top.querySelector(".followers_container .followers") as HTMLParagraphElement // Gets The Post Author Followers
        post_author_followers.textContent = String(one_post.user.followers.length) // Sets The Amount Of Post Author Followers

        // Follow Button
        if(logged_in_user_id && logged_in_user_id !== one_post.user.id) {
            const follow_button:HTMLButtonElement = document.createElement("button") // Creates The Follow Button

            follow_button.classList.add("follow_button") // Adds The Follow Button Class
            follow_button.dataset["id"] = String(one_post.user.id) // Stores The User ID
            follow_button.dataset["action"] = !one_post.user.followers.includes(String(logged_in_user_id)) ? "follow" : "unfollow"
            follow_button.textContent = !one_post.user.followers.includes(String(logged_in_user_id)) ? gettext("Začať sledovať") : gettext("Prestať sledovať")

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
        if(one_post.location) {
            if(one_post.coordinates) {
                const location:HTMLAnchorElement = document.createElement("a") // Creates The Location Link

                location.classList.add("location") // Adds The Location Class
                location.href = `https://www.google.com/maps?q=${one_post.coordinates.latitude},${one_post.coordinates.longitude}` // Creates The Link For Google Maps
                location.title = gettext("Otvoriť mapy") // Sets The Title
                location.target = "_blank"
                location.innerHTML = one_post.location // Sets The Styled Location Text

                bottom.prepend(location) // Appends The Location To The Bottom Container
            }

            else {
                const location:HTMLParagraphElement = document.createElement("p") // Creates The Location Paragraph

                location.classList.add("location") // Adds The Location Class
                location.textContent = one_post.location // Sets The Location Text

                bottom.prepend(location) // Appends The Location To The Bottom Container
            }
        }

        // Created At
        const created_at:HTMLParagraphElement = bottom.querySelector(".created_at") as HTMLParagraphElement // Gets The Created At Paragraph
        created_at.textContent = getFormattedDate(one_post.created_at) // Sets The Formatted Date Text

        // Media
        const media:HTMLDivElement = post_container_template_clone.querySelector(".media") as HTMLDivElement // Gets The Media Container

        one_post.media.forEach(function(one_post_media:{
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
                image.alt = interpolate(gettext('Príspevok užívateľa %s'), [`${one_post.user.first_name} ${one_post.user.last_name}`]) // Sets The Alternative Text For The Image

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
                video.textContent = interpolate(gettext('Príspevok užívateľa %s'), [`${one_post.user.first_name} ${one_post.user.last_name}`]) // Sets The Alternative Text For The Video

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
        logged_in_user_id && one_post.likes_from_users.includes(String(logged_in_user_id)) ? like_icon.classList.add("fa-solid") : like_icon.classList.add("fa-regular") // Shows The Empty Or Filled Heart Icon - https://fontawesome.com/icons/heart

        // Likes Counter
        if(!one_post.hide_likes) {
            const likes_counter:HTMLParagraphElement = document.createElement("p") // Creates The Likes Counter
            likes_counter.classList.add("likes_counter") // Adds The Likes Counter
            likes_counter.textContent = String(one_post.likes) // Sets The Likes Counter
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
        if(one_post.allow_comments) {
            const comments_counter:HTMLParagraphElement = document.createElement("p") // Creates The Comments Counter
            comments_counter.classList.add("comments_counter") // Adds The Comments Counter
            comments_counter.textContent = String(one_post.visible_comments.length) // Sets The Comments Counter
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

        const tagged_users:string[] = one_post.tagged_users.map(one_tagged_user => one_tagged_user.username)
        const added_hashtags:string[] = one_post.added_hashtags
        description.dataset["tagged_users"] = JSON.stringify(tagged_users) // Stores The Tagged Users
        description.dataset["added_hashtags"] = JSON.stringify(added_hashtags) // Stores The Added Hashtags
        description.textContent = one_post.description // Sets The Description Text
        post_container.appendChild(description) // Appends The Description To The Post Container

        if(tagged_users.length > 0 || added_hashtags.length > 0) description.innerHTML = generateStyledDescription(description.textContent, JSON.stringify(tagged_users), JSON.stringify(added_hashtags)) // Generates The Styled Description

        const comment_forum_template:HTMLTemplateElement = feed.querySelector(".comment_forum_template") as HTMLTemplateElement // Gets The Comment Forum Template
        const comment_forum_template_clone:DocumentFragment = comment_forum_template.content.cloneNode(true) as DocumentFragment // Clones The Comment Forum Template Content

        // Write Comment Form Profile Picture
        const write_comment_form_profile_picture:HTMLImageElement = comment_forum_template_clone.querySelector(".comment_forum .write_comment_form .profile_picture") as HTMLImageElement // Gets The Write Comment Form Profile Picture
        write_comment_form_profile_picture.src = profile_picture_name ? `/../media/images/${logged_in_user_id}/${profile_picture_name}` : "/../static/images/profile_picture.png" // Sets Profile Picture - https://www.flaticon.com/free-icon/user_3177440

        const all_comments:HTMLDivElement = comment_forum_template_clone.querySelector(".comment_forum .all_comments") as HTMLDivElement // Gets The All Comments Container

        post_container.appendChild(comment_forum_template_clone) // Appends The Comment Forum Template Clone To The Post Container

        one_post.visible_comments.forEach(function(one_visible_comment:{
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
            comment_author_profile_picture_link.href = interpolate(gettext("/sk/profil/%s"), [one_post.user.username]) // Sets The Link To The User's Profile
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

        feed.appendChild(post_container_template_clone) // Appends The Post Container Template Clone To The Feed
    })
}