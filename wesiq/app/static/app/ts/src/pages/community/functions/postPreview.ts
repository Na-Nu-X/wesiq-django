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
    posts_preview.querySelectorAll<HTMLDivElement>(".post").forEach(one_post => one_post.remove()) // Deletes All Posts From The DOM

    posts_preview_state.current_files.forEach(function(one_file:File, index:number):void {
        // Accepts Only 5 Files And Only The Image And Video Formats
        if(
            posts_preview_state.current_files.indexOf(one_file) < 5 && 
            (one_file.type.startsWith("image/") || one_file.type.startsWith("video/"))
        ) {
            const post:HTMLDivElement = document.createElement("div") // Creates The Post Container

            post.classList.add("post") // Adds The Post Class
            post.draggable = true // Allows Dragging

            // Post Drag & Drop Functionalities (Change The Order of The Posts)
            post.addEventListener("dragstart", function(event:DragEvent):void {
                event.dataTransfer?.setData("sourceIndex", index.toString())

                post.style.opacity = "0.5" // Adds Transparency To The Dragged Post
                post.style.transform = "scale(1)" // Adds Normal Scale To The Dragged Post

                posts_preview.querySelectorAll<HTMLDivElement>(".post").forEach(function(one_post:HTMLDivElement):void {
                    if(one_post !== post) one_post.classList.add("drag_active") // Adds Drag Active Class To All Posts Except The One That Was Dragged
                })
            })

            post.addEventListener("dragend", function():void {
                post.style.opacity = "1" // Removes Transparency From The Dragged Post
                post.removeAttribute("style") // Removes Hardcoded Style (style="transform: scale(1)) From The Dragged Post

                posts_preview.querySelectorAll<HTMLDivElement>(".post").forEach(one_post => one_post.classList.remove("drag_active")) // Removes Drag Active Class From All Posts
            })

            post.addEventListener("dragover", (event:DragEvent) => event.preventDefault())

            post.addEventListener("drop", function(event:DragEvent):void {
                event.preventDefault()
                event.stopPropagation()

                posts_preview.classList.remove("drag_active") // Removes Drag Animation From The Post Preview

                const from_index = parseInt(event.dataTransfer?.getData("sourceIndex") || "-1")
                const to_index = index

                if(from_index !== -1 && from_index !== to_index) changePostOrder(from_index, to_index, select_posts, posts_preview) // Changes Post Order
            })

            const post_loading:HTMLDivElement = document.createElement("div") // Creates The Loading
            post_loading.classList.add("loading") // Adds Loading Class

            const post_loading_progress:HTMLParagraphElement = document.createElement("p") // Creates The Loading Progress
            post_loading_progress.classList.add("loading_progress") // Adds The Loading Progress Class
            post_loading_progress.textContent = "0%"

            post.innerHTML += "<i class='fa-solid fa-xmark'></i>" // https://fontawesome.com/icons/xmark
            post.appendChild(post_loading) // Appends Loading To The Post
            post.appendChild(post_loading_progress) // Appends The Loading Progress To The Post
            posts_preview.appendChild(post) // Appends The Post To The Post Preview

            const file_reader:FileReader = new FileReader() // Reads The Content of The File

            file_reader.addEventListener("load", function():void {
                const file_data:string = file_reader.result as string // Gets The File Data

                if(!file_data) return

                let element:HTMLImageElement|HTMLVideoElement|undefined // Stores The Created Element (Image / Video)

                // Image
                if(one_file.type.startsWith("image/")) {
                    element = document.createElement("img") // Creates The Image
                    
                    element.src = file_data // Sets The Source

                    // Checks The Image Size
                    if(one_file.size > posts_preview_state.MAX_IMAGE_SIZE) {
                        const tooltip:HTMLDivElement = document.createElement("div") // Creates The Tooltip

                        tooltip.classList.add("tooltip") // Adds Tooltip Class
                        tooltip.dataset["tooltip"] = gettext("Obrázok je príliš veľký") // Adds Tooltip Message

                        tooltip.innerHTML += "<i class='fa-solid fa-triangle-exclamation'></i>" // https://fontawesome.com/icons/triangle-exclamation

                        post.appendChild(tooltip) // Appends The Tooltip With A Warning To The Post
                    }
                }

                // Video
                else if(one_file.type.startsWith("video/")) {
                    element = document.createElement("video") // Creates The Video

                    element.src = file_data // Sets The Source
                    element.controls = false // Disables The Controls
                    element.muted = true // Mutes The Video

                    // Checks The Video Size
                    if(one_file.size > posts_preview_state.MAX_VIDEO_SIZE) {
                        const tooltip:HTMLDivElement = document.createElement("div") // Creates The Tooltip

                        tooltip.classList.add("tooltip") // Adds Tooltip Class
                        tooltip.dataset["tooltip"] = gettext("Video je príliš veľké") // Adds Tooltip Message

                        tooltip.innerHTML += "<i class='fa-solid fa-triangle-exclamation'></i>" // https://fontawesome.com/icons/triangle-exclamation

                        post.appendChild(tooltip) // Appends The Tooltip With A Warning To The Post
                    }
                }

                if(element) {
                    post.appendChild(element) // Appends The Element To The Post

                    // If Image is Fully Loaded
                    if(element instanceof HTMLImageElement) {
                        element.addEventListener("load", function() {
                            const post:HTMLDivElement = element.closest(".post") as HTMLDivElement // Gets The Post Container
                            post.dataset["filename"] = one_file.name // Stores The Filename

                            element.style.filter = "blur(0px)" // Sharpens The Image
                            post_loading.classList.add("hidden") // Hides The Loading
                            post_loading_progress.classList.add("hidden") // Hides The Loading Progress
                        })
                    }

                    // If Video is Fully Loaded
                    else if(element instanceof HTMLVideoElement) {
                        element.addEventListener("loadeddata", function() {
                            const post:HTMLDivElement = element.closest(".post") as HTMLDivElement // Gets The Post Container
                            post.dataset["filename"] = one_file.name // Stores The Filename

                            element.style.filter = "blur(0px)" // Sharpens The Image
                            post_loading.classList.add("hidden") // Hides The Loading
                            post_loading_progress.classList.add("hidden") // Hides The Loading Progress
                        })

                        element.addEventListener("loadedmetadata", function() {
                            // Checks The Video Duration
                            if(this.duration > posts_preview_state.MAX_VIDEO_DURATION) {
                                const tooltip:HTMLDivElement = document.createElement("div") // Creates The Tooltip

                                tooltip.classList.add("tooltip") // Adds Tooltip Class
                                tooltip.dataset["tooltip"] = gettext("Video je príliš dlhé") // Adds Tooltip Message

                                tooltip.innerHTML += "<i class='fa-solid fa-triangle-exclamation'></i>" // https://fontawesome.com/icons/triangle-exclamation

                                post.appendChild(tooltip) // Appends The Tooltip With A Warning To The Post
                            }

                            else if(this.duration < posts_preview_state.MIN_VIDEO_DURATION) {
                                const tooltip:HTMLDivElement = document.createElement("div") // Creates The Tooltip

                                tooltip.classList.add("tooltip") // Adds Tooltip Class
                                tooltip.dataset["tooltip"] = gettext("Video je príliš krátke") // Adds Tooltip Message

                                tooltip.innerHTML += "<i class='fa-solid fa-triangle-exclamation'></i>" // https://fontawesome.com/icons/triangle-exclamation

                                post.appendChild(tooltip) // Appends The Tooltip With A Warning To The Post
                            }
                        })
                    }

                    // Remove File By Clicking On X Mark Functionality
                    ((element.parentNode as HTMLDivElement).querySelector(".fa-xmark") as HTMLElement).addEventListener("click", function():void {
                        removeFile(index, select_posts, posts_preview)
                    })
                }
            })

            file_reader.onprogress = function(event:ProgressEvent<FileReader>):void {
                if(event.lengthComputable) {
                    const progress_percentage:number = (event.loaded / event.total) * 100 // Calculates The Loading Progress Percentage
                    post_loading_progress.textContent = `${Math.round(progress_percentage)}%` // Displays The Loading Progress Percentage
                }
            }

            file_reader.readAsDataURL(one_file) // Renders The Preview

            const all_posts:NodeListOf<HTMLDivElement> = posts_preview.querySelectorAll<HTMLDivElement>(".post") // Gets All Posts From The Post Preview
            const post_index:number = [...all_posts].indexOf(post) // Gets The Post Index

            if(all_posts[post_index]) all_posts[post_index].dataset["order"] = String(post_index) // Stores The Order Of The Post
        }
    })
}

// Function For Remove File
function removeFile(index:number, select_posts:HTMLInputElement, posts_preview:HTMLDivElement):void {
    posts_preview_state.current_files.splice(index, 1) // Removes The File From The Current Files
    syncFiles(select_posts, posts_preview) // Synchronizes Files
}

// Function For Change The Post Order
function changePostOrder(from_index:number, to_index:number, select_posts:HTMLInputElement, posts_preview:HTMLDivElement):void {
    const item_to_move:File = posts_preview_state.current_files.splice(from_index, 1)[0] as File // Gets The Item To Move
    posts_preview_state.current_files.splice(to_index, 0, item_to_move) // Sets The New Position For The Moved Item
    syncFiles(select_posts, posts_preview) // Synchronizes Files
}