declare const Hls:any

import { initializeChangeVideoQuality } from "../../community/functions/posts.js"
import { changeVideoQuality } from "../../community/functions/customVideoPlayback.js"

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
        const data_saving_mode:boolean = post_container.dataset["data_saving_mode"] === "True" ? true : false // Gets The Value If The User Has Data Saving Mode Enabled

        if(user_id && media_id) {
            const video_src:string = interpolate(gettext("/api/stream-video/%s/%s/%s"), [user_id, media_id, "index.m3u8"], false) // Sets The File Path
            initializeChangeVideoQuality(video, video_src, video_container) // Initializes The Change Video Quality Buttons

            // If The Data Saving Mode Is Enabled (Sets The Video Quality To 480p By Default)
            if(data_saving_mode) {
                (video_container.querySelector(".play_pause_indicator") as HTMLDivElement).classList.remove("hidden") // Shows The Play Pause Indicator
                
                // HLS Format
                if(Hls.isSupported()) {
                    const hls:any = new Hls({
                        autoStartLoad: false // Disables Video Preload
                    })

                    hls.loadSource(video_src)
                    hls.attachMedia(video)

                    // Only Starts Downloading A Video If The User Manually First Time Plays It
                    video.addEventListener("play", function():void {
                        hls.startLoad()
                    }, { once: true })
                    
                    // If The Video Is Ready
                    hls.on(Hls.Events.MANIFEST_PARSED, function():void {
                        const video_quality:HTMLDivElement = video_container.querySelector(".controls .buttons .video_quality") as HTMLDivElement // Gets The Video Quality Menu
                        const all_quality_buttons:NodeListOf<HTMLButtonElement> = video_quality.querySelectorAll<HTMLButtonElement>(".quality_button") // Gets All Quality Buttons
                        const quality_480p_button:HTMLButtonElement = video_quality.querySelector(".quality_480p") as HTMLButtonElement // Gets The Quality 480p Button

                        changeVideoQuality(480, hls, quality_480p_button, all_quality_buttons) // Changes The Video Quality
                    })
                }

                else if(video.canPlayType("application/x-mpegURL")) video.src = video_src // Fallback For Safari (Mac / iOS), Which Support HLS Format Without An Additional Library
            }
        }
    }
})