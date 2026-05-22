declare var grecaptcha:any

import { sendPOST } from "../../../services/sendPOST.js"

import type { 
    compressTask,
    uploadPostResponse
} from "../functions/processingPosts.js"

// Function For Upload The Post
export async function uploadPost(submit_button:HTMLInputElement, form_data:FormData):Promise<void> {
    submit_button.disabled = true // Disables The Upload Post Form Submit Button
    submit_button.value = gettext("Overuje sa...")

    try {
        const token:string = await grecaptcha.execute("6Lfwh7osAAAAAExnZsXUSNJrACg7WX0guO88lCw1", { action: "upload_post_form" }) // Gets The reCAPTCHA token
        
        form_data.append("g-recaptcha-response", token) // Appends The reCAPTCHA Response To The Form Data
        submit_button.value = gettext("Spracuváva sa...")

        const upload_post_response:uploadPostResponse = await sendPOST(window.location.pathname, form_data)

        if(upload_post_response.success && upload_post_response.compress_tasks && upload_post_response.compress_tasks.length > 0) {
            upload_post_response.compress_tasks.forEach(function(one_task:compressTask):void {

                let processing_posts:compressTask[] = JSON.parse(localStorage.getItem("processing_posts") || "[]") // Gets The Processing Posts From The Local Storage

                processing_posts.push({"task_id": one_task.task_id, "post_media_id": one_task.post_media_id, "post_id": one_task.post_id})
                localStorage.setItem("processing_posts", JSON.stringify(processing_posts)) // Saves Updated Processing Posts To The Local Storage

            })

            // Reloads The Page After 1 Second Timeout
            window.setTimeout(function() {
                window.location.reload()
            }, 1000)
        }
        
        // Error
        else {
            submit_button.disabled = false // Enables The Upload Post Form Submit Button
            submit_button.value = gettext("Skúste znovu")
        }
    } 
    
    // Error
    catch {
        submit_button.disabled = false // Enables The Upload Post Form Submit Button
        submit_button.value = gettext("Uverejniť príspevok")
    }
}