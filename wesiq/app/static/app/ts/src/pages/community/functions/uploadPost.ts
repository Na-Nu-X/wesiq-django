declare var grecaptcha:any

import type {
    compressTask,
    uploadPostResponse
} from "../functions/processingPosts.js"

import { getCsrfToken } from "../../../services/sendPOST.js"

import type { uploadStepsController } from "./uploadPostSteps.js"

// Function For Send The Post With Upload Progress (XMLHttpRequest Reports The Upload Progress, fetch Doesn't)
function sendWithProgress(form_data:FormData, onProgress:(percentage:number) => void, onAbortReady:(abort:() => void) => void):Promise<uploadPostResponse|null> {
    return new Promise(function(resolve):void {
        const request:XMLHttpRequest = new XMLHttpRequest()

        request.open("POST", window.location.pathname)
        request.setRequestHeader("X-CSRFToken", getCsrfToken())
        request.setRequestHeader("Accept", "application/json")
        request.withCredentials = true

        request.upload.addEventListener("progress", function(event:ProgressEvent):void {
            if(event.lengthComputable) onProgress(event.loaded / event.total * 100)
        })

        request.addEventListener("load", function():void {
            const content_type:string = request.getResponseHeader("Content-Type") || "" // Gets The Content Type

            // Non-JSON Answers (E.g. A CSRF 403 Page) Are Reported As A Failure
            if(!content_type.includes("application/json")) {
                console.error(`Uploading the post returned HTTP ${request.status} without JSON`)
                resolve({ success: false, message: gettext("Niečo sa pokazilo") } as uploadPostResponse)
                return
            }

            try {
                resolve(JSON.parse(request.responseText) as uploadPostResponse)
            }

            catch {
                resolve({ success: false, message: gettext("Niečo sa pokazilo") } as uploadPostResponse)
            }
        })

        request.addEventListener("error", () => resolve({ success: false, message: gettext("Chyba spojenia") } as uploadPostResponse))
        request.addEventListener("abort", () => resolve(null)) // Null Means The User Canceled The Upload

        onAbortReady(() => request.abort())
        request.send(form_data)
    })
}

// Function For Upload The Post
export async function uploadPost(form_data:FormData, steps:uploadStepsController):Promise<void> {
    steps.goTo("uploading") // Shows The Upload Progress

    let token:string

    try {
        token = await grecaptcha.execute("6Lfwh7osAAAAAExnZsXUSNJrACg7WX0guO88lCw1", { action: "upload_post_form" }) // Gets The reCAPTCHA Token
    }

    catch(error) {
        console.error("reCAPTCHA failed", error)
        steps.showError(gettext("Overenie reCaptcha zlyhalo"))
        return
    }

    form_data.set("g-recaptcha-response", token) // Adds The reCAPTCHA Response To The Form Data

    const upload_post_response:uploadPostResponse|null = await sendWithProgress(
        form_data,
        (percentage:number) => steps.setProgress(percentage),
        (abort:() => void) => steps.onCancelUpload(abort)
    )

    // Canceled By The User
    if(upload_post_response === null) {
        steps.goTo("audience")
        return
    }

    if(!upload_post_response.success) {
        steps.showError(upload_post_response.message || gettext("Niečo sa pokazilo"))
        return
    }

    // Lets The Feed Show The Processing Posts After The Reload (Videos And Images Are Compressed In The Background)
    if(upload_post_response.compress_tasks && upload_post_response.compress_tasks.length > 0) {
        const processing_posts:compressTask[] = JSON.parse(localStorage.getItem("processing_posts") || "[]") // Gets The Processing Posts From The Local Storage

        upload_post_response.compress_tasks.forEach(function(one_task:compressTask):void {
            processing_posts.push({ "task_id": one_task.task_id, "post_media_id": one_task.post_media_id, "post_id": one_task.post_id })
        })

        localStorage.setItem("processing_posts", JSON.stringify(processing_posts)) // Saves Updated Processing Posts To The Local Storage
    }

    steps.setProgress(100)
    steps.goTo("done")
}
