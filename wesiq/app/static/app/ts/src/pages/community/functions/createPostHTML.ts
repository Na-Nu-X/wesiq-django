import {
    playPauseVideo,
    setVideoDuration,
    updateVideoTimer,
    updateBufferingBar,
    showVideoLoader,
    hideVideoLoader
} from "./customVideoPlayback.js"

import { 
    generatePostBars, 
    generateStyledDescription 
} from "./posts.js"

import { getFormattedDate } from "../../../utils/getFormattedDate.js"
import { getFormattedTime } from "../../../utils/timer.js"
import { createCommentPropertiesHTML } from "./createCommentPropertiesHTML.js"

import type { comment } from "./createCommentPropertiesHTML.js"

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

    views:number,

    visible_comments:comment[]
}

// Function For Create Post HTML Structure
export function createPostHTML(post_data:searchedPost, feed:HTMLDivElement, logged_in_user_id?:number, profile_picture_name?:string, saved_posts?:number[]):DocumentFragment {
    const post_container_template:HTMLTemplateElement = feed.querySelector(".post_container_template") as HTMLTemplateElement // Gets The Post Container Template
    const post_container_template_clone:DocumentFragment = post_container_template.content.cloneNode(true) as DocumentFragment // Clones The Post Container Template Content
    const post_container:HTMLDivElement = post_container_template_clone.querySelector(".post_container") as HTMLDivElement // Creates The Post Container

    const report_template:HTMLTemplateElement = feed.querySelector(".report_template") as HTMLTemplateElement // Gets The Report Template
    const report_template_clone:DocumentFragment = report_template.content.cloneNode(true) as DocumentFragment // Clones The Report Template Content
    const report_container:HTMLDivElement = report_template_clone.querySelector(".report") as HTMLDivElement // Gets The Report Container

    const post_settings_template:HTMLTemplateElement = feed.querySelector(".post_settings_template") as HTMLTemplateElement // Gets The Post Settings Template
    const post_settings_template_clone:DocumentFragment = post_settings_template.content.cloneNode(true) as DocumentFragment // Clones The Post Settings Template Content
    const post_settings:HTMLDivElement = post_settings_template_clone.querySelector(".post_settings") as HTMLDivElement // Gets The Post Settings Container

    // Post Container
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
        top.insertBefore(follow_button, top.querySelector(".show_post_properties_button") as HTMLButtonElement) // Appends The Follow Button To The Top Container
    }

    // Post Properties
    createPostPropertiesHTML(top, report_container, post_settings, post_data, logged_in_user_id) // Creates The Post Properties HTML

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
    share.title = gettext("Zdielať...")

    // Views
    const views:HTMLDivElement = society.querySelector(".views") as HTMLDivElement // Gets The Views Container
    views.title = gettext("Počet videní...")

    // Views Counter
    const views_counter:HTMLParagraphElement = document.createElement("p") // Creates The Views Counter
    views_counter.classList.add("views_counter") // Adds The Views Counter
    views_counter.textContent = String(post_data.views) // Sets The Views Counter
    views.appendChild(views_counter) // Appends The Views Counter To The Views

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
    if(post_data.description) {
        const description:HTMLParagraphElement = document.createElement("p") // Creates The Description Paragraph
        description.classList.add("description") // Adds The Description Class
    
        const tagged_users:string[] = post_data.tagged_users.map(one_tagged_user => one_tagged_user.username)
        const added_hashtags:string[] = post_data.added_hashtags
        description.dataset["tagged_users"] = JSON.stringify(tagged_users) // Stores The Tagged Users
        description.dataset["added_hashtags"] = JSON.stringify(added_hashtags) // Stores The Added Hashtags
        description.textContent = post_data.description // Sets The Description Text
        post_container.appendChild(description) // Appends The Description To The Post Container
    
        if(tagged_users.length > 0 || added_hashtags.length > 0) description.innerHTML = generateStyledDescription(description.textContent, JSON.stringify(tagged_users), JSON.stringify(added_hashtags)) // Generates The Styled Description
    }

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

            const report_template:HTMLTemplateElement = feed.querySelector(".report_template") as HTMLTemplateElement // Gets The Report Template
            const report_template_clone:DocumentFragment = report_template.content.cloneNode(true) as DocumentFragment // Clones The Report Template Content
            const report_container:HTMLDivElement = report_template_clone.querySelector(".report") as HTMLDivElement // Gets The Report Container

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
            if(logged_in_user_id) createCommentPropertiesHTML(one_comment_container, report_container, one_visible_comment, logged_in_user_id) // Creates The Comment Properties HTML

            // Comment
            const comment:HTMLParagraphElement = one_comment_container.querySelector(".comment_container .right .comment") as HTMLParagraphElement // Gets The Comment Paragraph
            comment.textContent = one_visible_comment.comment as string // Sets The Comment Text

            // Likes
            const likes:HTMLDivElement = one_comment_container.querySelector(".comment_container .right .likes") as HTMLDivElement // Gets The Likes Container

            const like_icon:HTMLElement = likes.querySelector(".fa-heart") as HTMLElement // Gets The Heart Icon
            logged_in_user_id && (one_visible_comment.likes_from_users as number[]).includes(logged_in_user_id) ? like_icon.classList.add("fa-solid") : like_icon.classList.add("fa-regular") // Shows The Empty Or Filled Heart Icon - https://fontawesome.com/icons/heart

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
                    new_parent_comment_interactions.insertBefore(show_replies, new_parent_comment_interactions.querySelector(".date") as HTMLDivElement) // Appends The Show Replies To The New Parent Comment
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

// Function For Create The Post Properties HTML
function createPostPropertiesHTML(container:HTMLDivElement, report_container:HTMLDivElement, post_settings:HTMLDivElement, post_data:searchedPost, logged_in_user_id:number|undefined):void {
    const show_post_properties_button:HTMLButtonElement = container.querySelector(".show_post_properties_button") as HTMLButtonElement // Gets The Show Post Properties Button
    const post_properties:HTMLDivElement = container.querySelector(".post_properties") as HTMLDivElement // Gets The Post Properties Menu
    const hide_post_properties_button:HTMLButtonElement = post_properties.querySelector(".hide_post_properties_button") as HTMLButtonElement // Gets The Hide Post Properties Button

    show_post_properties_button.setAttribute("popovertarget", `post_properties_${post_data.id}`) // Links The Pop Over
    show_post_properties_button.style = `anchor-name: --show_post_properties_button_${post_data.id}` // Creates The Anchor
    post_properties.id = `post_properties_${post_data.id}` // Sets The ID
    post_properties.style = `position-anchor: --show_post_properties_button_${post_data.id}` // Links The Anchor
    hide_post_properties_button.setAttribute("popovertarget", `post_properties_${post_data.id}`) // Links The Pop Over

    // If The Post Doesn't Belong To The Logged In User The Report Option Will Be Shown
    if(post_data.user.id !== logged_in_user_id) {
        // Show Report Post Button
        const show_report_post_button:HTMLButtonElement = document.createElement("button") // Creates The Show Report Post Button
        show_report_post_button.classList.add("show_report_post_button") // Adds The Show Report Post Button
        show_report_post_button.setAttribute("popovertarget", `report_post_${post_data.id}`) // Links The Pop Over
        show_report_post_button.style = `anchor-name: --show_report_post_button_${post_data.id}` // Creates The Anchor
        show_report_post_button.innerHTML = "<i class='fa-regular fa-flag'></i>" // https://fontawesome.com/icons/flag
        show_report_post_button.innerHTML += `<span>${gettext("Nahlásiť")}</span>`
        post_properties.insertBefore(show_report_post_button, hide_post_properties_button) // Appends The Show Report Post Button To The Post Properties Menu

        // Report Post Menu
        report_container.classList.add("report_post") // Adds The Report Comment Class
        report_container.id = `report_post_${post_data.id}` // Sets The ID
        report_container.style = `position-anchor: --show_report_post_button_${post_data.id}` // Links The Anchor
        container.appendChild(report_container) // Appends The Report Post Menu To The Post Container

        // Back Report Post Button
        const back_report_post_button:HTMLButtonElement = report_container.querySelector(".back_report_button") as HTMLButtonElement // Gets The Back Report Post Button
        back_report_post_button.setAttribute("popovertarget", `report_post_${post_data.id}`) // Links The Pop Over
    }

    // If The Post Belongs To The Logged In User The Settings And The Delete Option Will Be Shown
    else {
        // Show Post Settings Button
        const show_post_settings_button:HTMLButtonElement = document.createElement("button") // Creates The Show Post Settings Button
        show_post_settings_button.classList.add("show_post_settings_button") // Adds The Show Post Settings Button Class
        show_post_settings_button.setAttribute("popovertarget", `post_settings_${post_data.id}`) // Links The Pop Over
        show_post_settings_button.style = `anchor-name: --show_post_settings_button_${post_data.id}` // Creates The Anchor
        show_post_settings_button.innerHTML = "<i class='fa-solid fa-pen'></i>" // https://fontawesome.com/icons/pen
        show_post_settings_button.innerHTML += `<span>${gettext("Upraviť")}</span>`
        post_properties.insertBefore(show_post_settings_button, hide_post_properties_button) // Appends The Show Post Settings Button To The Post Properties Menu

        // Post Settings Menu
        post_settings.id = `post_settings_${post_data.id}` // Sets The ID
        post_settings.style = `position-anchor: --show_post_settings_button_${post_data.id}` // Links The Anchor
        
        // Visibility Container
        const public_visibility_container:HTMLDivElement = post_settings.querySelector(".public_visibility_container") as HTMLDivElement // Gets The Public Visibility Container
        const public_visibility_icon:HTMLElement = public_visibility_container.querySelector("i") as HTMLElement // Gets The Public Visibility Icon
        const public_visibility_checkbox:HTMLInputElement = public_visibility_container.querySelector(".public_visibility") as HTMLInputElement // Gets The Public Visibility Checkbox
        const public_visibility_label:HTMLLabelElement = public_visibility_container.querySelector("label") as HTMLLabelElement // Gets The Public Visibility Label
        
        if(post_data.public_visibility) {
            public_visibility_icon.classList.add("fa-solid", "fa-eye") // https://fontawesome.com/icons/eye
            public_visibility_checkbox.checked = true // Checks The Public Visibility Checkbox
        }
        
        else public_visibility_icon.classList.add("fa-solid", "fa-eye-low-vision") // https://fontawesome.com/icons/eye-low-vision

        public_visibility_checkbox.id = `public_visibility_${post_data.id}`
        public_visibility_label.htmlFor = `public_visibility_${post_data.id}`
        
        // Allow Comments Container
        const allow_comments_container:HTMLDivElement = post_settings.querySelector(".allow_comments_container") as HTMLDivElement // Gets The Allow Comments Container
        const allow_comments_icon:HTMLElement = allow_comments_container.querySelector("i") as HTMLElement // Gets The Allow Comments Icon
        const allow_comments_checkbox:HTMLInputElement = allow_comments_container.querySelector(".allow_comments") as HTMLInputElement // Gets The Allow Comments Checkbox
        const allow_comments_label:HTMLLabelElement = allow_comments_container.querySelector("label") as HTMLLabelElement // Gets The Allow Comments Label
        
        if(post_data.allow_comments) {
            allow_comments_icon.classList.add("fa-solid", "fa-comment") // https://fontawesome.com/icons/eye
            allow_comments_checkbox.checked = true // Checks The Allow Comments Checkbox
        }
        
        else allow_comments_icon.classList.add("fa-solid", "fa-comment-slash") // https://fontawesome.com/icons/eye-low-vision

        allow_comments_checkbox.id = `allow_comments_${post_data.id}`
        allow_comments_label.htmlFor = `allow_comments_${post_data.id}`

        // Hide Likes Container
        const hide_likes_container:HTMLDivElement = post_settings.querySelector(".hide_likes_container") as HTMLDivElement // Gets The Hide Likes Container
        const hide_likes_icon:HTMLElement = hide_likes_container.querySelector("i") as HTMLElement // Gets The Hide Likes Icon
        const hide_likes_checkbox:HTMLInputElement = hide_likes_container.querySelector(".hide_likes") as HTMLInputElement // Gets The Hide Likes Checkbox
        const hide_likes_label:HTMLLabelElement = hide_likes_container.querySelector("label") as HTMLLabelElement // Gets The Hide Likes Label
        
        if(!post_data.hide_likes) {
            hide_likes_icon.classList.add("fa-solid", "fa-heart") // https://fontawesome.com/icons/eye
            hide_likes_checkbox.checked = true // Checks The Hide Likes Checkbox
        }
        
        else hide_likes_icon.classList.add("fa-regular", "fa-heart") // https://fontawesome.com/icons/eye-low-vision

        hide_likes_checkbox.id = `hide_likes_${post_data.id}`
        hide_likes_label.htmlFor = `hide_likes_${post_data.id}`

        container.appendChild(post_settings) // Appends The Post Settings Menu To The Post Container

        // Back Post Settings Button
        const back_post_settings_button:HTMLButtonElement = post_settings.querySelector(".back_post_settings_button") as HTMLButtonElement // Gets The Back Post Settings Button
        back_post_settings_button.setAttribute("popovertarget", `post_settings_${post_data.id}`) // Links The Pop Over

        // Delete Post Button
        const delete_post_button:HTMLButtonElement = document.createElement("button") // Creates The Delete Post Button
        delete_post_button.classList.add("delete_post_button") // Adds The Delete Post Button
        delete_post_button.setAttribute("popovertarget", `delete_post_${post_data.id}`) // Links The Pop Over
        delete_post_button.style = `anchor-name: --delete_post_button_${post_data.id}` // Creates The Anchor
        delete_post_button.innerHTML = "<i class='fa-solid fa-eraser'></i>" // https://fontawesome.com/icons/eraser
        delete_post_button.innerHTML += `<span>${gettext("Vymazať")}</span>`
        post_properties.insertBefore(delete_post_button, hide_post_properties_button) // Appends The Delete Post Button To The Post Properties Menu

        // Delete Post Menu
        const delete_post:HTMLDivElement = document.createElement("div") // Creates The Delete Post Menu
        delete_post.classList.add("delete_post") // Adds The Delete Post Class
        delete_post.id = `delete_post_${post_data.id}` // Sets The ID
        delete_post.popover = "auto" // Sets The Popover Attribute
        delete_post.style = `position-anchor: --delete_post_button_${post_data.id}` // Links The Anchor
        container.appendChild(delete_post) // Appends The Delete Post To The Post Container

        // Question
        const question:HTMLParagraphElement = document.createElement("p") // Creates The Question Paragraph
        question.textContent = gettext("Naozaj chcete vymazať Váš komentár?")
        delete_post.appendChild(question) // Appends The Question To The Delete Post Menu

        // Yes
        const yes:HTMLButtonElement = document.createElement("button") // Creates The Yes Button
        yes.dataset["action"] = "delete" // Stores The Delete Action
        yes.innerHTML = "<i class='fa-solid fa-eraser'></i>" // https://fontawesome.com/icons/eraser
        yes.innerHTML += `<span>${gettext("Vymazať")}</span>`
        delete_post.appendChild(yes) // Appends The Yes Button To The Delete Post Menu
        
        // No
        const no:HTMLButtonElement = document.createElement("button") // Creates The No Button
        no.setAttribute("popovertarget", `delete_post_${post_data.id}`) // Links The Pop Over
        no.popoverTargetAction = "hide" // Sets The Hide Action
        no.innerHTML = "<i class='fa-solid fa-xmark'></i>" // https://fontawesome.com/icons/xmark
        no.innerHTML += `<span>${gettext("Zrušiť")}</span>`
        delete_post.appendChild(no) // Appends The No Button To The Delete Post Menu
    }
}