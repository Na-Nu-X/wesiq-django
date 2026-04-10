import { posts_preview_state } from "../state.js"

// Function For Update Stored File Data And Synchronization Between Stored File Data And Selected Files In Input
export function syncFiles(select_posts:HTMLInputElement, posts_preview:HTMLDivElement):void {
    const data_transfer:DataTransfer = new DataTransfer() // Creates New Data Transfer

    posts_preview_state.current_files.forEach(one_file => data_transfer.items.add(one_file)) // Adds Each File To The Stored File Data
    select_posts.files = data_transfer.files // Synchronizes Selected Files With Stored File Data

    renderPostPreview(posts_preview, select_posts)
}

// Function For Render Post Preview
function renderPostPreview(posts_preview:HTMLDivElement, select_posts:HTMLInputElement):void {
    posts_preview.innerHTML = "" // Deletes The Post Preview

    posts_preview_state.current_files.forEach(function(one_file:File, index:number):void {
        const post:HTMLDivElement = document.createElement("div") // Creates The Post Container
        post.classList.add("post") // Adds The Post Class

        const loading:HTMLDivElement = document.createElement("div") // Creates The Loading
        loading.classList.add("loading") // Adds Loading Class

        post.appendChild(loading) // Appends Loading To The Post
        posts_preview.appendChild(post) // Appends The Post To The Post Preview

        const file_reader:FileReader = new FileReader() // Reads The Content of The File

        file_reader.onload = function():void {
            const file_data:string = file_reader.result as string // Gets The File Data

            if(!file_data) return

            let element:HTMLImageElement|HTMLVideoElement|undefined // Stores The Created Element (Image / Video)

            // Image
            if(one_file.type.startsWith("image/")) {
                element = document.createElement("img") // Creates The Image
                
                element.src = file_data // Sets The Source
            }

            // Video
            else if(one_file.type.startsWith("video/")) {
                element = document.createElement("video") // Creates The Video

                element.src = file_data // Sets The Source
                element.controls = false // Disables The Controls
                element.muted = true // Mutes The Video
            }

            if(element) {
                element.addEventListener("click", function():void {
                    removeFile(index, select_posts, posts_preview)
                })

                post.appendChild(element) // Appends The Element To The Post

                // If Image is Fully Loaded
                if(element instanceof HTMLImageElement) {
                    element.onload = function():void {
                        element.style.filter = "blur(0px)" // Sharpens The Image
                        loading.classList.add("hidden") // Hides The Loading
                    }
                }

                // If Video is Fully Loaded
                else if(element instanceof HTMLVideoElement) {
                    element.onloadeddata = function():void {
                        element.style.filter = "blur(0px)" // Sharpens The Image
                        loading.classList.add("hidden") // Hides The Loading
                    }
                }
            }
        }

        file_reader.onprogress = function(event:ProgressEvent<FileReader>):void {
            if(event.lengthComputable) {
                const progress_percentage:number = (event.loaded / event.total) * 100

                console.log(progress_percentage)
            }
        }

        file_reader.readAsDataURL(one_file) // Renders The Preview
    })
}

// Function For Remove File
function removeFile(index:number, select_posts:HTMLInputElement, posts_preview:HTMLDivElement):void {
    posts_preview_state.current_files.splice(index, 1) // Removes The File From The Current Files
    syncFiles(select_posts, posts_preview) // Synchronizes Files
}