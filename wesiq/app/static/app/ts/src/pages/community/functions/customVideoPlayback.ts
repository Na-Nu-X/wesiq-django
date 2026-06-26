declare const Hls: any

import { getFormattedTime } from "../../../utils/timer.js"

// Function For Play Or Pause The Video
export function playPauseVideo(play_pause_icon:HTMLElement, play_pause_indicator:HTMLDivElement, video:HTMLVideoElement):void {
    const is_playing:boolean = !video.paused && !video.ended && video.readyState > 2
    const play_pause:HTMLButtonElement = play_pause_icon.closest(".play_pause") as HTMLButtonElement // Gets The Play Pause Button

    // Play
    if(!is_playing) {
        play_pause_icon.classList.replace("fa-play", "fa-pause") // Shows The Pause Icon
        play_pause.title = gettext("Pozastaviť...")
        play_pause.ariaLabel = gettext("Pozastaviť...")

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
        play_pause.title = gettext("Prehrať...")
        play_pause.ariaLabel = gettext("Prehrať...")

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
export function changeVideoVolume(volume_input:HTMLInputElement, volume_icon:HTMLElement, video:HTMLVideoElement, step?:number):void {
    let volume:number = Number(volume_input.value) // Gets The Volume Value

    if(step) {
        volume += step // Updates The Volume By Step Amount
        volume_input.value = String(volume) // Updates The Volume Input

        if(volume < 0) volume = 0 // Sets Back To The Mininum Volume
        if(volume > 1) volume = 1 // Sets Back To The Maximum Volume
    }

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

// Function For Change The Video Quality
export function changeVideoQuality(quality:number, hls:any, button:HTMLButtonElement, all_buttons:NodeListOf<HTMLButtonElement>):void {
    // Auto Video Quality
    if(quality === -1) {
        hls.currentLevel = -1
    }

    // 1080p, 720p, 480p Video Quality
    else {
        const level_index: number = hls.levels.findIndex((level: any) => Math.abs(level.height - quality) <= 4) // Finds The Index Of The Selected Video Quality With Some Toleration From FFmpeg Compression (For Example: 720p Can Be Between 718p And 722p)
        
        if(level_index !== -1) {
            hls.currentLevel = level_index // Changes The Quality Of New Loaded Segments
            hls.startLevel = level_index // Changes The Quality When Stream Restarts
        }
        
        else {
            // Unsupported Video Quality
        }
    }

    all_buttons.forEach(one_button => one_button.classList.remove("active")) // Removes The Active Class From Every Quality Button
    button.classList.add("active") // Adds The Active Class To The Clicked Quality Button
}

// Function For Change The Video Speed
export function changeVideoSpeed(speed:number, video:HTMLVideoElement, button:HTMLButtonElement, all_buttons:NodeListOf<HTMLButtonElement>):void {
    // Checks The Validity Of The Video Speed Range
    if(speed >= 0.25 && speed <= 16) {
        video.playbackRate = speed
        all_buttons.forEach(one_button => one_button.classList.remove("active")) // Removes The Active Class From Every Speed Button
        button.classList.add("active") // Adds The Active Class To The Clicked Speed Button
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