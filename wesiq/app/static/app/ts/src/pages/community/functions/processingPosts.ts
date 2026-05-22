export interface compressTask {
    task_id:string,
    post_media_id:number,
    post_id:number
}

export interface uploadPostResponse {
    success:boolean,
    compress_tasks:compressTask[]
}

interface uploadProgressResponse {
    task_id:string,
    state:"PENDING"|"PROGRESS"|"SUCCESS"|"FAILURE",
    progress:number
}

// Function For Get The Upload Progress
export function getUploadProgress(task_id:string, post_id:number, upload_progress:HTMLDivElement, processing_post_report:HTMLParagraphElement):void {
    const MAX_RED:number = 255
    const MIN_RED:number = 82

    // Checks The Upload Progress Every 3 Seconds
    const upload_progress_interval = setInterval(async function() {
        try {
            // Gets Full Upload Progress Response
            const full_upload_progress_response:Response = await fetch(`/api/compression-status/${task_id}/`)

            // If The Response Isn't Success
            if(!full_upload_progress_response.ok) {
                processing_post_report.textContent = gettext("Pri spracovávaní príspevku došlo k chybe!") // Shows The Error Message
            }

            // Gets Upload Progress Response
            const upload_progress_response:uploadProgressResponse = await full_upload_progress_response.json()

            if(upload_progress_response.state === "PROGRESS") {
                let red:number = MAX_RED - (upload_progress_response.progress / 100) * (MAX_RED - MIN_RED) // Makes Color Transition For Progress Bar From rgb(255, 207, 32) To rgb(82, 207, 32)

                upload_progress.dataset["progress"] = `${upload_progress_response.progress}%` // Updates The Progress Percentage Label
                upload_progress.style.setProperty("--progress", `${upload_progress_response.progress}%`) // Updates The Width Of The Progress Bar
                upload_progress.style.setProperty("--progress-color", `rgb(${red}, 207, 32)`) // Updates The Color Of The Progress Bar
            }
            
            else if(upload_progress_response.state === "SUCCESS") {
                clearInterval(upload_progress_interval) // Deletes The Upload Progress Interval
                removeProcessingPost(task_id) // Removes Current Processing Post Data From The Local Storage
                checkProcessingPosts(post_id, processing_post_report) // Checks If There Is Any Other Media From Selected Post In The Processing Posts
                setCompletedUploadProgress(upload_progress) // Sets The State For The Completed Upload Progress
            }
            
            else if(upload_progress_response.state === "FAILURE") {
                clearInterval(upload_progress_interval) // Deletes The Upload Progress Interval
                removeProcessingPost(task_id) // Removes Current Processing Post Data From The Local Storage
                processing_post_report.textContent = gettext("Pri spracovávaní príspevku došlo k chybe!") // Shows The Error Message
            }
        }
        
        catch {
            processing_post_report.textContent = gettext("Pri spracovávaní príspevku došlo k chybe!") // Shows The Error Message
        }
    }, 1000)
}

// Function For Check If There Is Any Other Media From Selected Post In The Processing Posts
export function checkProcessingPosts(post_id:number, processing_post_report:HTMLParagraphElement):void {
    const processing_posts:compressTask[] = JSON.parse(localStorage.getItem("processing_posts") || "[]") // Gets The Processing Posts From The Local Storage
    const processing_posts_post_ids:number[] = processing_posts.map((one_task:compressTask) => one_task.post_id) // Gets All Current Post IDs From The Local Storage

    if(!processing_posts_post_ids.includes(post_id)) processing_post_report.textContent = gettext("Príspevok bol úspešne pridaný.") // Shows The Success Message
}

// Function For Set The State Of Completed Upload Progress
export function setCompletedUploadProgress(upload_progress:HTMLDivElement):void {
    upload_progress.dataset["progress"] = `100%` // Updates The Progress Percentage Label
    upload_progress.style.setProperty("--progress", `100%`) // Updates The Width Of The Progress Bar
    upload_progress.style.setProperty("--progress-color", `rgb(82, 207, 32)`) // Updates The Color Of The Progress Bar
}

// Function For Remove The Current Processing Post Data From The Local Storage
function removeProcessingPost(task_id:string):void {
    // Gets All Processing Posts From The Local Storage
    let processing_posts:compressTask[] = JSON.parse(localStorage.getItem("processing_posts") || "[]") // Gets The Processing Posts From The Local Storage

    // Gets The Current Processing Post From The Local Storage
    const processing_post:compressTask|undefined = processing_posts.find(function(one_task:compressTask):boolean {
        return one_task.task_id === task_id
    })

    if(processing_post) {
        const processing_post_index:number = processing_posts.indexOf(processing_post) // Gets The Index Of The Current Processing Post In The Local Storage

        if(processing_post_index !== -1) processing_posts.splice(processing_post_index, 1) // Deletes The Current Processing Post From The Processing Posts In The Local Storage
        localStorage.setItem("processing_posts", JSON.stringify(processing_posts)) // Saves Updated Processing Posts To The Local Storage
    }
}