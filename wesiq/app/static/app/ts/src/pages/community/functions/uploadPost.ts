declare var grecaptcha:any

import type { 
    compressTask,
    uploadPostResponse
} from "../functions/processingPosts.js"

import { sendPOST } from "../../../services/sendPOST.js"

import type { uploadProgressResponse } from "../functions/processingPosts.js"

// Function For Upload The Post
export async function uploadPost(submit_button:HTMLInputElement, form_data:FormData):Promise<void> {
    submit_button.disabled = true // Disables The Upload Post Form Submit Button
    submit_button.value = gettext("Overuje sa...")

    try {
        const token:string = await grecaptcha.execute("6Lfwh7osAAAAAExnZsXUSNJrACg7WX0guO88lCw1", { action: "upload_post_form" }) // Gets The reCAPTCHA token
        
        form_data.append("g-recaptcha-response", token) // Appends The reCAPTCHA Response To The Form Data

        const upload_post_response:uploadPostResponse = await sendPOST(window.location.pathname, form_data)

        if(upload_post_response.success && upload_post_response.compress_tasks && upload_post_response.compress_tasks.length > 0) {
            const all_task_ids:string[] = [] // Stores All UUIDs Of Tasks (Uploaded Files)

            upload_post_response.compress_tasks.forEach(function(one_task:compressTask):void {

                let processing_posts:compressTask[] = JSON.parse(localStorage.getItem("processing_posts") || "[]") // Gets The Processing Posts From The Local Storage

                processing_posts.push({"task_id": one_task.task_id, "post_media_id": one_task.post_media_id, "post_id": one_task.post_id})
                localStorage.setItem("processing_posts", JSON.stringify(processing_posts)) // Saves Updated Processing Posts To The Local Storage
            })

            submit_button.value = gettext("Spracuváva sa...")

            // Checks The Progress Of Uploaded Posts
            const check_upload_progress_interval = setInterval(async function() {
                try {
                    const upload_progress_response_promises:Promise<uploadProgressResponse>[] = all_task_ids.map(async function(one_task_id:string):Promise<uploadProgressResponse> {
                        const full_upload_progress_response:Response = await fetch(`/api/compression-status/${one_task_id}/`)
                        if(!full_upload_progress_response.ok) throw new Error("Chyba servera")
                        return full_upload_progress_response.json() as Promise<uploadProgressResponse>
                    })

                    const tasks_results:uploadProgressResponse[] = await Promise.all(upload_progress_response_promises)
        
                    const all_tasks_finished:boolean = tasks_results.every(one_task => one_task.state === "SUCCESS") // If Every Tasks Has Been Succeeded
                    const any_task_failed:boolean = tasks_results.some(one_task => one_task.state === "FAILURE") // If Any Task Has Failed
        
                    if(all_tasks_finished) {
                        clearInterval(check_upload_progress_interval) // Deletes The Upload Progress Interval

                        // Reloads The Page After 500 MS Timeout
                        setTimeout(function() {
                            window.location.reload()
                        }, 500)
                    }
                    
                    else if(any_task_failed) {
                        clearInterval(check_upload_progress_interval) // Deletes The Upload Progress Interval
                        submit_button.value = gettext("Chyba pri spracovaní") // Shows The Error Message
                        submit_button.disabled = false // Enables The Upload Post Form Submit Button
                    }
                } 
                
                catch(error) {
                    console.error("Chyba pri overovaní stavu videa", error)
                    clearInterval(check_upload_progress_interval) // Deletes The Upload Progress Interval
                    submit_button.value = gettext("Chyba spojenia") // Shows The Error Message
                    submit_button.disabled = false // Enables The Upload Post Form Submit Button
                }
            }, 1000)
        }
        
        // Error
        else {
            submit_button.value = gettext("Skúste znovu") // Shows The Error Message
            submit_button.disabled = false // Enables The Upload Post Form Submit Button
        }
    } 
    
    // Error
    catch {
        submit_button.value = gettext("Uverejniť príspevok")
        submit_button.disabled = false // Enables The Upload Post Form Submit Button
    }
}