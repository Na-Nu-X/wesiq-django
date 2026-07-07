import {
    playPauseVideo,
    setVideoDuration,
    updateVideoTimer,
    updateBufferingBar,
    showVideoLoader,
    hideVideoLoader,
    loadVttData,
    initializeVideoPreview
} from "../functions/customVideoPlayback.js"

import { getFormattedTime } from "../../../utils/timer.js"

export interface vtt {
    start:number,
    end:number,
    image:string,
    x:number,
    y:number,
    w:number,
    h:number
}

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Custom Video Playback

    // Variables

    const feed:HTMLDivElement = document.querySelector(".feed") as HTMLDivElement // Gets The Feed Container
    const all_videos:NodeListOf<HTMLVideoElement> = feed.querySelectorAll<HTMLVideoElement>(".post_container .media .one_post .video_container .video") // Gets All Videos From The Feed

    all_videos.forEach(function(one_video:HTMLVideoElement):void {
        // Functionalities For Every Video

        // Variables

        const video_container:HTMLDivElement = one_video.closest(".video_container") as HTMLDivElement // Gets The Video Container

        const controls:HTMLDivElement = video_container.querySelector(".controls") as HTMLDivElement // Gets The Controls Container

        const timer:HTMLParagraphElement = video_container.querySelector(".buttons .timer") as HTMLParagraphElement // Gets The Timer
        const total_time:HTMLSpanElement = timer.querySelector(".total") as HTMLSpanElement // Gets The Total Duration
        const elapsed_time:HTMLSpanElement = timer.querySelector(".elapsed") as HTMLSpanElement // Gets The Elapsed Time

        const scrubber_hitbox:HTMLDivElement = controls.querySelector(".scrubber_hitbox") as HTMLDivElement // Gets The Scrubber Hitbox
        const scrubber:HTMLDivElement = scrubber_hitbox.querySelector(".scrubber") as HTMLDivElement // Gets The Scrubber
        const buffering_bar:HTMLDivElement = scrubber.querySelector(".buffering_bar") as HTMLDivElement // Gets The Buffering Bar

        const one_post:HTMLDivElement = one_video.closest(".one_post") as HTMLDivElement // Gets The One Post Container
        const loading:HTMLDivElement = one_post.querySelector(".loading") as HTMLDivElement // Gets The Loading

        let is_hovered_scrubber:boolean = false // Checks If The Scrubber Is Hovered
        let previous_scrubber_progress:string = scrubber.style.getPropertyValue("--progress") || "0%"// Gets The Previous Scrubber Progress
        let previous_elapsed_time:number = one_video.currentTime // Gets The Previous Elapsed Time

        // Events

        one_video.addEventListener("loadedmetadata", () => setVideoDuration(one_video.duration, total_time)) // Sets The Video Duration
        one_video.addEventListener("canplaythrough", () => updateBufferingBar(one_video, buffering_bar)) // Updates The Video Buffering Bar
        one_video.addEventListener("progress", () => updateBufferingBar(one_video, buffering_bar)) // Updates The Video Buffering Bar
        one_video.addEventListener("waiting", () => showVideoLoader(loading)) // Shows The Video Loader
        one_video.addEventListener("playing", () => hideVideoLoader(loading)) // Hides The Video Loader
        one_video.addEventListener("seeking", () => showVideoLoader(loading)) // Shows The Video Loader
        one_video.addEventListener("seeked", () => hideVideoLoader(loading)) // Hides The Video Loader
        one_video.addEventListener("stalled", () => showVideoLoader(loading)) // Shows The Video Loader

        // Video Time Update Functionality
        one_video.addEventListener("timeupdate", function():void {
            const is_playing:boolean = !one_video.paused && !one_video.ended && one_video.readyState > 2 // Checks If The Video Is Playing

            if(!is_hovered_scrubber) updateVideoTimer(this.currentTime, this.duration, elapsed_time, scrubber) // Updates The Video Timer
            if(!is_playing) elapsed_time.textContent = `${getFormattedTime("minutes", this.currentTime)}:${getFormattedTime("seconds", this.currentTime, true)}` // Sets The Elapsed Time
            previous_scrubber_progress = scrubber.style.getPropertyValue("--progress") || "0%"// Updates The Previous Scrubber Progress
            previous_elapsed_time = one_video.currentTime // Updates The Previous Elapsed Time
        })

        // Video Click Functionality
        one_video.addEventListener("click", function():void {
            const video:HTMLVideoElement = video_container.querySelector(".video") as HTMLVideoElement // Gets The Video
            const play_pause_icon:HTMLElement = video_container.querySelector(".controls .buttons .play_pause i") as HTMLElement // Gets The Play / Pause Icon
            const play_pause_indicator:HTMLDivElement = video_container.querySelector(".play_pause_indicator") as HTMLDivElement // Gets The Play / Pause Indicator

            playPauseVideo(play_pause_icon, play_pause_indicator, video) // Plays Or Pauses The Video
        })

        // Scrubber Hitbox Mouse Move Functionality
        scrubber_hitbox.addEventListener("mousemove", async function(event:MouseEvent):Promise<void> {
            const scrubber_rect:DOMRect = scrubber_hitbox.getBoundingClientRect() // Gets The Scrubber Rect
            const scrubber_width:number = scrubber_hitbox.offsetWidth // Gets The Scrubber Width
            const hovered_scrubber_position:number = event.clientX - scrubber_rect.left // Gets Current Hovered Scrubber Position
            const scrubber_progress:number = Math.min(Math.max((hovered_scrubber_position / scrubber_width) * 100, 0), 100) // Calculates The Current Scrubber Progress
            const hovered_video_time:number = (scrubber_progress / 100) * one_video.duration || 0 // Gets The Hovered Video Time

            is_hovered_scrubber = true // Marks The Scrubber As Hovered
            scrubber.style.setProperty("--progress", `${scrubber_progress}%`) // Shows The Progress In Scrubber
            elapsed_time.textContent = `${getFormattedTime("minutes", hovered_video_time)}:${getFormattedTime("seconds", hovered_video_time, true)}` // Sets The Elapsed Timer

            // Video Scrubber Preview

            const post_container = this.closest(".post_container") as HTMLDivElement // Gets The Post Container
            const video_scrubber_preview:HTMLDivElement = post_container.querySelector(".video_scrubber_preview") as HTMLDivElement // Gets The Video Scrubber Preview Container
            const sprite_sheet:string|null = video_container.dataset["sprite_sheet"] || null // Gets The Sprite Sheet Path
            const vtt_file:string|null = video_container.dataset["vtt_file"] || null // Gets The VTT File Path
            
            let vtt_video_previews:vtt[] = [] // Stores The VTT Video Previews

            if(vtt_file && sprite_sheet) {
                await loadVttData(vtt_file, vtt_video_previews) // Loads The VTT File Data
                initializeVideoPreview(hovered_video_time, vtt_video_previews, sprite_sheet, video_scrubber_preview, hovered_scrubber_position, scrubber_rect, post_container) // Initializes The Video Preview
            }
        })

        // Scrubber Hitbox Mouse Out Functionality
        scrubber_hitbox.addEventListener("mouseout", function():void {
            const post_container = this.closest(".post_container") as HTMLDivElement // Gets The Post Container
            const video_scrubber_preview:HTMLDivElement = post_container.querySelector(".video_scrubber_preview") as HTMLDivElement // Gets The Video Scrubber Preview Container
            
            is_hovered_scrubber = false // Marks The Scrubber As No Hovered
            scrubber.style.setProperty("--progress", previous_scrubber_progress) // Shows The Progress In Scrubber
            elapsed_time.textContent = `${getFormattedTime("minutes", previous_elapsed_time)}:${getFormattedTime("seconds", previous_elapsed_time, true)}` // Sets The Elapsed Timer
            video_scrubber_preview.style.display = "none" // Hides The Video Scrubber Preview
        })

        // Scrubber Hitbox Click Functionalities
        scrubber_hitbox.addEventListener("click", function(event:PointerEvent):void {
            const scrubber_rect = scrubber_hitbox.getBoundingClientRect() // Gets The Scrubber Rect
            const scrubber_width:number = scrubber_hitbox.offsetWidth // Gets The Scrubber Width
            const clicked_scrubber_position:number = event.clientX - scrubber_rect.left // Gets Current Clicked Scrubber Position
            const scrubber_progress:number = Math.min(Math.max((clicked_scrubber_position / scrubber_width) * 100, 0), 100) // Calculates The Current Scrubber Progress
            const clicked_video_time:number = (scrubber_progress / 100) * one_video.duration || 0 // Gets The Clicked Video Time

            if(one_video.readyState === 4) {
                one_video.currentTime = clicked_video_time // Sets The New Current Video Time Position
                updateVideoTimer(one_video.currentTime, one_video.duration, elapsed_time, scrubber) // Updates The Video Timer
                previous_scrubber_progress = scrubber.style.getPropertyValue("--progress") || "0%"// Updates The Previous Scrubber Progress
                previous_elapsed_time = one_video.currentTime // Updates The Previous Elapsed Time
            }
        })

        // Initialization

        if(!isNaN(one_video.duration)) setVideoDuration(one_video.duration, total_time) // Sets The Video Duration
        updateBufferingBar(one_video, buffering_bar) // Updates The Video Buffering Bar
    })
})