declare const Hls:any

import { getFormattedTime } from "../../../utils/timer.js"

// Function For Initialize Record Video Watch Time
export function initializeRecordVideoWatchTime(post_media_id:number, start_time:number, total_watch_time:number):void {
    if(start_time > 0) {
        const elapsed_seconds:number = (Date.now() - start_time) / 1000 // Gets The Elapsed Seconds Of The Watched Sequence

        total_watch_time += elapsed_seconds // Increases The Total Watch Time
        start_time = 0 // Resets The Start Time

        // If The User Has Watched At Least For 1 Second
        if(total_watch_time >= 1) {
            recordVideoWatchTime(post_media_id, total_watch_time) // Records The Video Watch Time
            total_watch_time = 0 // Resets The Total Watch Time
        }
    }
}

// Function For Record The Video Watch Time
async function recordVideoWatchTime(post_media_id:number, watch_time:number):Promise<void> {
    const url:string = "/api/update-video-watch-time/" // Sets The URL
    const form_data:FormData = new FormData() // Creates The Form Data
    const csrf_input:HTMLInputElement|null = document.querySelector("[name=csrfmiddlewaretoken]") as HTMLInputElement | null // Gets The CSRF Token Input
    
    form_data.append("post_media_id", post_media_id.toString()) // Appends The Post Media ID To The Form Data
    form_data.append("watch_time", watch_time.toFixed(2)) // Appends The Watch Time To The Form Data
    if(csrf_input) form_data.append("csrfmiddlewaretoken", csrf_input.value) // Appends The CSRF Token To The Form Data If Is Available

    navigator.sendBeacon(url, form_data) // Sends The Data In The Background
}

// Function For Initialize Show Video Metrics Button
export function initializeShowVideoMetricsButton(one_post_container:HTMLDivElement):void {
    const post_container:HTMLDivElement = one_post_container.closest(".post_container") as HTMLDivElement // Gets The Post Container
    const video_container:HTMLDivElement|null = one_post_container.querySelector(".video_container") as HTMLDivElement || null // Gets The Video Container If Is Available
    const logged_in_user_id:number|null = Number(post_container.dataset["logged_in_user_id"]) || null // Gets The Logged In User ID If Is Available
    const user_id:number|null = Number(post_container.dataset["user_id"]) || null // Gets The User ID If Is Available

    // If The Post Belongs To The Logged In User
    if(logged_in_user_id && user_id && logged_in_user_id === user_id) {
        // If The Newly Selected Item Is Video (Creates The Show Video Metrics Button)
        if(video_container) {
            const show_video_metrics:HTMLButtonElement|null = post_container.querySelector(".society .show_video_metrics") as HTMLButtonElement || null // Gets The Show Video Metrics Button If Is Available

            if(!show_video_metrics) {
                const society:HTMLDivElement = post_container.querySelector(".society") as HTMLDivElement // Gets The Society Container
                const save:HTMLButtonElement = society.querySelector(".save") as HTMLButtonElement // Gets The Save Button

                society.insertBefore(generateShowVideoMetricsButton(), save) // Appends The Show Video Metrics Button To The Society
            }
        }

        // If The Newly Selected Item Is Image (Removes The Show Video Metrics Button If There Was Any)
        else {
            const show_video_metrics:HTMLButtonElement|null = post_container.querySelector(".society .show_video_metrics") as HTMLButtonElement || null // Gets The Show Video Metrics Button If Is Available
            if(show_video_metrics) show_video_metrics.remove() // Removes The Show Video Metrics Button From The DOM
        }
    }
}

// Function For Generate Show Video Metrics Button
export function generateShowVideoMetricsButton():HTMLButtonElement {
    const show_video_metrics:HTMLButtonElement = document.createElement("button") // Creates The Show Video Metrics Button
    show_video_metrics.classList.add("show_video_metrics") // Adds The Show Video Metrics Class
    show_video_metrics.title = gettext("Štatistiky...")
    show_video_metrics.ariaLabel = gettext("Štatistiky...")
    show_video_metrics.innerHTML = "<i class='fa-solid fa-chart-simple'></i>" // https://fontawesome.com/icons/chart-simple
    
    return show_video_metrics
}

// Function For Initialize Show Video Metrics
export function initializeShowVideoMetrics(post_container:HTMLDivElement):void {
    const one_post_container:HTMLDivElement = post_container.querySelector(".media .one_post.active") as HTMLDivElement // Gets The One Post Container
    const video_container:HTMLDivElement = one_post_container.querySelector(".video_container") as HTMLDivElement // Gets The Video Container
    const video:HTMLVideoElement = video_container.querySelector(".video") as HTMLVideoElement // Gets The Video
    const average_watch_time:number|null = isNaN(Number(video_container.dataset["average_watch_time"])) ? null : Number(video_container.dataset["average_watch_time"]) // Gets The Average Watch Time
    const video_views:number|null = isNaN(Number(video_container.dataset["video_views"])) ? null : Number(video_container.dataset["video_views"]) // Gets The Video Views

    // If Metadata Of The Video Are Loaded
    if(video.duration) {
        if(average_watch_time !== null && video_views !== null) showVideoMetrics(post_container, average_watch_time, video_views, video.duration) // Shows The Video Metrics Container
    }

    // If Metadata Of The Video Aren't Loaded Yet
    else {
        const post_media_id:number|null = Number(one_post_container.dataset["post_media_id"]) || null // Gets The Post Media ID
        const user_id:number|null = Number(post_container.dataset["user_id"]) || null // Gets The User ID If Is Available
        const video_src:string = interpolate(gettext("/api/stream-video/%s/%s/%s"), [user_id, post_media_id, "index.m3u8"], false) // Sets The File Path
        let video_duration:number = 0 // Stores The Video Duration
    
        // HLS Format
        if(Hls.isSupported()) {
            const hls: any = new Hls()
        
            hls.loadSource(video_src)
            hls.attachMedia(video)
            
            // Preloads The Video Duration Value And Shows The Video Metrics Container
            const onLevelLoaded = function(event:any, data:any):void {
                if(data.details && data.details.totalduration) {
                    video_duration = data.details.totalduration // Updates Stored Video Duration Value
                    if(average_watch_time !== null && video_views !== null) showVideoMetrics(post_container, average_watch_time, video_views, video_duration) // Shows The Video Metrics Container
                    hls.off(Hls.Events.LEVEL_LOADED, onLevelLoaded) // Stops The HLS Event
                }
            }
        
            hls.on(Hls.Events.LEVEL_LOADED, onLevelLoaded) // Calls The HLS Event
        }
    }
}

// Function For Show The Video Metrics
function showVideoMetrics(post_container:HTMLDivElement, average_watch_time:number, video_views:number, video_duration:number):void {
    if(average_watch_time !== null && video_views !== null) {
        const comment_forum:HTMLDivElement = post_container.querySelector(".comment_forum") as HTMLDivElement // Gets The Comment Forum
        const video_metrics:HTMLDivElement|null = post_container.querySelector(".video_metrics") as HTMLDivElement || null // Gets The Video Metrics Container If Is Available

        // Generates New Video Metrics Container
        if(!video_metrics) {
            post_container.insertBefore(createVideoMetricsHTML(video_views, video_duration, average_watch_time), comment_forum) // Appends The Video Metrics Container To The Post Container

            const video_metrics:HTMLDivElement = post_container.querySelector(".video_metrics") as HTMLDivElement // Gets The Video Metrics Container
            const duration_bar:HTMLDivElement = video_metrics.querySelector(".duration_container .duration_bar") as HTMLDivElement // Gets The Duration Bar
            const duration_label:HTMLDivElement = video_metrics.querySelector(".duration_container .duration_label") as HTMLDivElement // Gets The Duration Label
            const watch_time_bar:HTMLDivElement = video_metrics.querySelector(".watch_time_container .watch_time_bar") as HTMLDivElement // Gets The Watch Time Bar
            const watch_time_label:HTMLDivElement = video_metrics.querySelector(".watch_time_container .watch_time_label") as HTMLDivElement // Gets The Watch Time Label

            // If The Video Metrics Container Is Visible
            if(!video_metrics.classList.contains("hidden")) {
                duration_bar.style.setProperty("--width", "0")
                duration_label.style.setProperty("--right", "0")
                watch_time_bar.style.setProperty("--width", "0")
                watch_time_label.style.setProperty("--right", "0")

                window.setTimeout(function():void {
                    // Sets The Calculated Duration And Watch Time Width
                    duration_bar.style.setProperty("--width", String(100))
                    duration_label.style.setProperty("--right", String(100))
                    watch_time_bar.style.setProperty("--width", String(average_watch_time / video_duration * 100))
                    watch_time_label.style.setProperty("--right", String(average_watch_time / video_duration * 100))
                }, 10)
            }

            // If The Video Metrics Container Is Hidden
            else {
                // Sets The Duration And Watch Time Width Back To 0
                duration_bar.style.setProperty("--width", String(0))
                duration_label.style.setProperty("--right", String(0))
                watch_time_bar.style.setProperty("--width", String(0)) 
                watch_time_label.style.setProperty("--right", String(0))
            }
        }

        else {
            const duration_bar:HTMLDivElement = video_metrics.querySelector(".duration_container .duration_bar") as HTMLDivElement // Gets The Duration Bar
            const duration_label:HTMLDivElement = video_metrics.querySelector(".duration_container .duration_label") as HTMLDivElement // Gets The Duration Label
            const watch_time_bar:HTMLDivElement = video_metrics.querySelector(".watch_time_container .watch_time_bar") as HTMLDivElement // Gets The Watch Time Bar
            const watch_time_label:HTMLDivElement = video_metrics.querySelector(".watch_time_container .watch_time_label") as HTMLDivElement // Gets The Watch Time Label

            video_metrics.classList.toggle("hidden") // Shows Or Hides The Video Metrics Container

            // If The Video Metrics Container Is Visible
            if(!video_metrics.classList.contains("hidden")) {
                // Sets The Duration And Watch Time Width Back To 0
                duration_bar.style.setProperty("--width", String(0))
                duration_label.style.setProperty("--right", String(0))
                watch_time_bar.style.setProperty("--width", String(0)) 
                watch_time_label.style.setProperty("--right", String(0))

                window.setTimeout(function():void {
                    // Sets The Calculated Duration And Watch Time Width
                    duration_bar.style.setProperty("--width", String(100))
                    duration_label.style.setProperty("--right", String(100))
                    watch_time_bar.style.setProperty("--width", String(average_watch_time / video_duration * 100))
                    watch_time_label.style.setProperty("--right", String(average_watch_time / video_duration * 100))
                }, 10)
            }

            // If The Video Metrics Container Is Hidden
            else {
                // Sets The Duration And Watch Time Width Back To 0
                duration_bar.style.setProperty("--width", String(0))
                duration_label.style.setProperty("--right", String(0))
                watch_time_bar.style.setProperty("--width", String(0)) 
                watch_time_label.style.setProperty("--right", String(0))
            }
        }
    }
}

// Function For Create The Video Metrics HTML
function createVideoMetricsHTML(video_views:number, video_duration:number, average_watch_time:number):HTMLDivElement {
    // Video Metrics Container
    const video_metrics:HTMLDivElement = document.createElement("div") // Creates The Video Metrics Container
    video_metrics.classList.add("video_metrics") // Adds The Video Metrics Class

    // Views Container
    const views:HTMLDivElement = document.createElement("div") // Creates The Views Container
    views.classList.add("views") // Adds The Views Container Class
    views.innerHTML = "<i class='fa-regular fa-eye'></i>" // https://fontawesome.com/icons/eye
    video_metrics.appendChild(views) // Appends The Views Container To The Video Metrics Container

    // Views Counter
    const views_counter:HTMLParagraphElement = document.createElement("p") // Creates The Views Counter Paragraph
    views_counter.classList.add("views_counter") // Adds The Video Counter Class
    views_counter.innerHTML = String(video_views)
    views.appendChild(views_counter) // Appends The Views Counter To The Views Container

    // Duration Container
    const duration_container:HTMLDivElement = document.createElement("div") // Creates The Duration Container
    duration_container.classList.add("duration_container") // Adds The Duration Container Class
    video_metrics.appendChild(duration_container) // Appends The Duration Container To The Video Metrics Container

    // Duration Bar
    const duration_bar:HTMLDivElement = document.createElement("div") // Creates The Duration Bar
    duration_bar.classList.add("duration_bar") // Adds The Duration Bar Class
    duration_container.appendChild(duration_bar) // Appends The Duration Bar To The Duration Container

    // Duration Label
    const duration_label:HTMLParagraphElement = document.createElement("p") // Creates The Duration Label
    duration_label.classList.add("duration_label") // Adds The Duration Label Class
    duration_label.textContent = `${getFormattedTime("minutes", video_duration)}:${getFormattedTime("seconds", video_duration, true)}` // Sets The Formatted Average Watch Time Text
    duration_container.appendChild(duration_label) // Appends The Duration Label To The Duration Container

    // Watch Time Container
    const watch_time_container:HTMLDivElement = document.createElement("div") // Creates The Watch Time Container
    watch_time_container.classList.add("watch_time_container") // Adds The Watch Time Container Class
    video_metrics.appendChild(watch_time_container) // Appends The Watch Time Container To The Video Metrics Container

    // Watch Time Bar
    const watch_time_bar:HTMLDivElement = document.createElement("div") // Creates The Watch Time Bar
    watch_time_bar.classList.add("watch_time_bar") // Adds The Watch Time Bar Class
    watch_time_container.appendChild(watch_time_bar) // Appends The Watch Time Bar To The Watch Time Container

    // Watch Time Label
    const watch_time_label:HTMLParagraphElement = document.createElement("p") // Creates The Watch Time Label
    watch_time_label.classList.add("watch_time_label") // Adds The Watch Time Label Class
    watch_time_label.textContent = `${getFormattedTime("minutes", average_watch_time)}:${getFormattedTime("seconds", average_watch_time, true)} - ${((average_watch_time / video_duration) * 100).toFixed(2)}%` // Sets The Formatted Average Watch Time Text
    watch_time_container.appendChild(watch_time_label) // Appends The Watch Time Label To The Watch Time Container

    return video_metrics
}