import { initializeChangeVideoQuality } from "../../community/functions/posts.js"

const feed:HTMLDivElement = document.querySelector(".feed") as HTMLDivElement // Gets The Feed Container
const post_container:HTMLDivElement = feed.querySelector(".post_container") as HTMLDivElement // Gets The Post Container
const media_container:HTMLDivElement = post_container.querySelector(".media") as HTMLDivElement // Gets The Media Container
const all_media:NodeListOf<HTMLDivElement> = media_container.querySelectorAll<HTMLDivElement>(".one_post") // Gets All Media From The Posts

all_media.forEach(function(one_post:HTMLDivElement) {
    const video_container:HTMLDivElement|null = one_post.querySelector(".video_container") as HTMLDivElement || null // Gets The Video Container If Is Available

    if(video_container) {
        const video:HTMLVideoElement = video_container.querySelector(".video") as HTMLVideoElement // Gets The Video
        const user_id:number|null = Number(video.dataset["user_id"]) || null // Gets The User ID
        const media_id:number|null = Number(video.dataset["media_id"]) || null // Gets The Media ID

        if(user_id && media_id) {
            const video_src:string = interpolate(gettext("/sk/stream-video/%s/%s/%s"), [user_id, media_id, "index.m3u8"], false) // Sets The File Path
            initializeChangeVideoQuality(video, video_src, video_container) // Initializes The Change Video Quality Buttons
        }
    }
})