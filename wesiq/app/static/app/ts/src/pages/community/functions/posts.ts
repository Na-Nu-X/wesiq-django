declare const Hls:any

import { 
    storeSearchedPostToHistory,
    renderSearchedPostsHistory
} from "./searchPostsHistory.js"

import { sendPOST } from "../../../services/sendPOST.js"
import { feed_state } from "../state.js"
import { createPostHTML } from "./createPostHTML.js"
import { changeVideoQuality } from "./customVideoPlayback.js"

import type { response } from "../../../services/sendPOST.js"
import type { searchedPost } from "./createPostHTML.js"

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
            return
        }
    }

    catch {
        return
    }
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
            bar.tabIndex = 0 // Makes The Bar Focusable

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

// Function For Generate Change Buttons (Previous / Next)
function generateButtons(index:number, all_media:NodeListOf<HTMLDivElement>):void {
    if(index === 0) ((all_media[index] as HTMLDivElement).querySelector(".next") as HTMLDivElement).classList.remove("hidden") // Shows The Next Button In The First Post
    if(index === all_media.length - 1) ((all_media[index] as HTMLDivElement).querySelector(".previous") as HTMLDivElement).classList.remove("hidden") // Shows The Previous Button In The Last Post

    if(index !== 0 && index !== all_media.length - 1) {
        ((all_media[index] as HTMLDivElement).querySelector(".previous") as HTMLDivElement).classList.remove("hidden"); // Shows The Previous Button In The Last Post
        ((all_media[index] as HTMLDivElement).querySelector(".next") as HTMLDivElement).classList.remove("hidden") // Shows The Next Button In The First Post
    }
}

// Function For Initialize The Change Video Quality Buttons
export function initializeChangeVideoQuality(video:HTMLVideoElement, video_src:string, video_container:HTMLDivElement):void {
    // HLS Format
    if(Hls.isSupported()) {
        const hls = new Hls()

        hls.loadSource(video_src)
        hls.attachMedia(video)
        
        // If The Video Is Ready
        hls.on(Hls.Events.MANIFEST_PARSED, function():void {
            const video_quality:HTMLDivElement = video_container.querySelector(".controls .buttons .video_quality") as HTMLDivElement // Gets The Video Quality Menu
            const all_quality_buttons:NodeListOf<HTMLButtonElement> = video_quality.querySelectorAll<HTMLButtonElement>(".quality_button") // Gets All Quality Buttons

            // All Quality Buttons Functionalities
            all_quality_buttons.forEach(function(one_button:HTMLButtonElement):void {
                one_button.addEventListener("click", function():void {
                    const selected_quality:number|null = Number(one_button.dataset["quality"]) || null // Gets The Selected Quality
                    if(selected_quality) changeVideoQuality(selected_quality, hls, one_button, all_quality_buttons) // Changes The Video Quality
                })
            })
        })
    }

    else if(video.canPlayType("application/x-mpegURL")) video.src = video_src // Fallback For Safari (Mac / iOS), Which Support HLS Format Without An Additional Library
}