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