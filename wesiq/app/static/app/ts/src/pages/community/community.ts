declare var grecaptcha:any

import { 
    posts_preview_state,
    tag_user_state,
    location_state,
    feed_state
} from "./state.js"

import { 
    getSearchedUsers,
    resetSearchedUsers
} from "./functions/searchUsers.js"

import {
    getUsersForTag,
    checkTagsPositions,
    tagUser,
    storeAtSignPosition,
    removeTag,
    hideUsersForTag,
    changeFocusedUserForTag,
    deleteUserFromHistory
} from "./functions/tagUsers.js"

import { 
    checkHashtags,
    checkHashtagsPositions
} from "./functions/addHashtags.js"

import { 
    getLocation,
    changeFocusedPlace
} from "./functions/location.js"

import { 
    generateStyledDescription,
    generatePostBars,
    changePost,
    togglePostLike,
    sharePost,
    togglePostSave,
    addComment,
    toggleCommentLike,
    reportComment,
    replyOnComment,
    checkSearchedPostsHistory,
    hideHistoryContainer,
    changeFocusedSearchedPost,
    loadPosts,
    getUploadProgress,
    setCompletedUploadProgress,
    checkProcessingPosts,
    playPauseVideo,
    muteUnmuteVideo,
    changeVideoVolume,
    toogleVideoFullscreen,
    updateVideoTimer
} from "./functions/feed.js"

import type { 
    compressTask,
    uploadPostResponse
} from "./functions/feed.js"

import { sendPOST } from "../../services/sendPOST.js"
import { syncFiles } from "./functions/postPreview.js"

import type { response } from "../../services/sendPOST.js"
import type { tag } from "./state.js"

// Function For Get Cursor Position Of The Description
export function getCursorPosition(description:HTMLDivElement):number {
    const selection:Selection|null = window.getSelection() // Gets The Selection

    if(selection!.rangeCount !== 0) {
        const range:Range = selection!.getRangeAt(0)
        const pre_caret_range:Range = range.cloneRange()

        pre_caret_range.selectNodeContents(description)
        pre_caret_range.setEnd(range.endContainer, range.endOffset);

        return pre_caret_range.toString().length
    }

    return 0
}

// Function For Add Focus At End Of The Description
export function focusAtEnd(description:HTMLDivElement):void {
    description.focus()

    if(typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
        const range:Range = document.createRange()

        range.selectNodeContents(description) // Selects All Content
        range.collapse(false) // End Of The Content
        
        const selection:Selection|null = window.getSelection() || null // Gets The Selection

        if(selection) {
            selection.removeAllRanges() // Removes All Selections
            selection.addRange(range) // Applies Selection At The End
        }
    }
}

// Function For Add Follow
async function follow(event:PointerEvent, user_to_follow_id:number|null):Promise<void> {
    event.preventDefault() // Prevents Redirect To The User's Profile

    if(user_to_follow_id) {
        try {
            const follow_response:response = await sendPOST(window.location.pathname, user_to_follow_id, "follow"); // Sends Clicked User ID As A POST Data

            // If The Response Isn't Success
            if(!follow_response.success) {
                console.error(follow_response.message)
                return
            }

            (event.target as HTMLElement).classList.replace("fa-user-plus", "fa-user-minus") // Shows The Unfollow Icon
    
            const followers_counter:HTMLParagraphElement = ((event.target as HTMLElement).parentNode as HTMLDivElement).querySelector(".followers") as HTMLParagraphElement // Gets The Followers Counter
    
            followers_counter.textContent = String(parseInt(followers_counter.textContent) + 1) // Increases The Followers Counter
        }

        catch {
            console.error(gettext("Pri pridávaní sledovania došlo k chybe."))
        }
    }
}

// Function For Remove Follow
async function unfollow(event:PointerEvent, user_to_unfollow_id:number|null):Promise<void> {
    event.preventDefault() // Prevents Redirect To The User's Profile

    if(user_to_unfollow_id) {
        try {
            const unfollow_response:response = await sendPOST(window.location.pathname, user_to_unfollow_id, "unfollow"); // Sends Clicked User ID As A POST Data

            // If The Response Isn't Success
            if(!unfollow_response.success) {
                console.error(unfollow_response.message)
                return
            }
            
            (event.target as HTMLElement).classList.replace("fa-user-minus", "fa-user-plus") // Shows The Follow Icon

            const followers_counter:HTMLParagraphElement = ((event.target as HTMLElement).parentNode as HTMLDivElement).querySelector(".followers") as HTMLParagraphElement // Gets The Followers Counter

            followers_counter.textContent = String(parseInt(followers_counter.textContent) - 1) // Decreases The Followers Counter
        }

        catch {
            console.error(gettext("Pri rušení sledovania došlo k chybe."))
        }
    }
}

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Search Users

    // Variables

    const search_bar_container:HTMLDivElement|null = document.querySelector(".search_bar_container") as HTMLDivElement || null // Gets Search Bar Container

    if(search_bar_container) {
        const search_bar:HTMLInputElement = search_bar_container.querySelector(".search_bar") as HTMLInputElement // Gets The Search Bar Input
        const delete_search_bar:HTMLElement = search_bar_container.querySelector(".fa-xmark") as HTMLElement // Gets The Delete Search Bar Icon

        const all_users_container:HTMLDivElement = document.querySelector(".all_users") as HTMLDivElement // Gets The All Users Container

        let all_users:NodeListOf<HTMLAnchorElement> = all_users_container.querySelectorAll<HTMLAnchorElement>(".one_user") // Gets All Users
        const first_users:NodeListOf<HTMLAnchorElement> = all_users // Stores First Loaded Users

        const users_loading:HTMLDivElement = document.querySelector(".search_result_container .loading") as HTMLDivElement // Gets The Loading

        let previous_search_bar_length:number = 0 // Stores The Previous Search Bar Input Length
        let search_users_timeout:number // Debounce Timeout Between Requests

        // Global Event Delegations

        all_users_container.addEventListener("click", function(event:PointerEvent):void {
            if((event.target as HTMLElement).classList.contains("fa-user-plus")) {
                const clicked_user_id:number|null = Number(((event.target as HTMLElement).parentNode as HTMLDivElement).dataset["id"]) || null // Gets Clicked User ID
                follow(event, clicked_user_id) // Follow
            }

            else if((event.target as HTMLElement).classList.contains("fa-user-minus")) {
                const clicked_user_id:number|null = Number(((event.target as HTMLElement).parentNode as HTMLDivElement).dataset["id"]) || null // Gets Clicked User ID
                unfollow(event, clicked_user_id) // Unfollow
            }
        })

        // Events

        // Search Bar Input Functionalities
        search_bar.addEventListener("input", async function() {
            if(this.value.trim() !== "") {
                all_users.forEach(one_user => one_user.classList.remove("hidden")) // Shows All Hidden Users
                
                // Gets Users From The DB If The First Character Is Entered
                if(this.value.length === 1 && previous_search_bar_length !== 2) {
                    users_loading.classList.remove("hidden") // Shows The Loader

                    if(search_users_timeout) clearTimeout(search_users_timeout) // Deletes The Previous Search Users Timeout

                    // Gets The Users After 1 Second Of Delay
                    search_users_timeout = window.setTimeout(function() {
                        getSearchedUsers(search_bar.value, all_users_container, users_loading) // Gets The Searched Users
                    }, 1000)
                }

                // Filters Users From Already Obtained Users
                else {
                    all_users = all_users_container.querySelectorAll<HTMLAnchorElement>(".one_user") // Gets All Users

                    // Gets Unmatched Users
                    const filtered_users:HTMLAnchorElement[] = [...all_users].filter(function(one_user:HTMLAnchorElement):boolean {
                        // Filters By Full Name, Username And By Friend Code
                        const full_name:string = one_user.dataset["full_name"]?.toLowerCase() || ""
                        const username:string = one_user.dataset["username"]?.toLowerCase() || ""
                        const friend_code:string = one_user.dataset["friend_code"]?.toLowerCase() || ""
                        const text:string = search_bar.value.toLowerCase() || ""

                        return (
                            !full_name.includes(text) && 
                            !username.includes(text) && 
                            !friend_code.includes(text)
                        )
                    })

                    filtered_users.forEach(one_user => one_user.classList.add("hidden")) // Hides Unmatched Users
                }

                previous_search_bar_length = this.value.length // Sets The Previous Search Bar Length
            }

            else resetSearchedUsers(search_bar, all_users_container, first_users) // Resets The Searched Users
        })

        // Delete Search Bar Icon Click Functionality
        delete_search_bar.addEventListener("click", function():void {
            resetSearchedUsers(search_bar, all_users_container, first_users) // Resets The Searched Users
        })
    }

    // Upload Post Form Dialog

    // Variables

    const upload_post_icon:HTMLElement|null = document.querySelector(".upload_post .fa-photo-film") as HTMLElement || null // Gets The Upload Post Icon

    if(upload_post_icon) {
        const upload_post_form_dialog:HTMLDialogElement = document.querySelector(".upload_post_form_dialog") as HTMLDialogElement // Gets The Upload Post Form Dialog
        const upload_post_form:HTMLFormElement = upload_post_form_dialog.querySelector(".upload_post_form") as HTMLFormElement // Gets The Upload Post Form

        const select_posts:HTMLInputElement = upload_post_form.querySelector("#select_posts") as HTMLInputElement // Gets The Select Posts Input
        const posts_preview:HTMLDivElement = upload_post_form.querySelector(".posts_preview") as HTMLDivElement // Gets The Posts Preview

        const post_info_container:HTMLDivElement = upload_post_form.querySelector(".post_info_container") as HTMLDivElement // Gets The Post Info Container

        const public_visibility:HTMLElement = post_info_container.querySelector(".icons .settings .public_visibility") as HTMLElement // Gets The Public Visibility Icon
        const allow_comments:HTMLElement = post_info_container.querySelector(".icons .settings .allow_comments") as HTMLElement // Gets The Allow Comments Icon
        const hide_likes:HTMLElement = post_info_container.querySelector(".icons .settings .hide_likes") as HTMLElement // Gets The Hide Likes Icon

        // Events

        upload_post_icon.addEventListener("click", function():void {
            upload_post_form_dialog.showModal() // Shows The Upload Post Form Dialog
        })

        upload_post_form_dialog.addEventListener("click", function(event:PointerEvent):void {
            const upload_post_form_dimensions:DOMRect = upload_post_form.getBoundingClientRect() // Gets The Upload Post Form Dimensions

            if (
                event.clientX < upload_post_form_dimensions.left ||
                event.clientX > upload_post_form_dimensions.right ||
                event.clientY < upload_post_form_dimensions.top ||
                event.clientY > upload_post_form_dimensions.bottom ||
                (event.target as HTMLAnchorElement).classList.contains("back") ||
                ((event.target as HTMLElement).parentNode as HTMLAnchorElement).classList.contains("back")
            ) {
                this.close() // Hides The Upload Post Form Dialog
            }
        })

        // Upload Post Form Submit
        upload_post_form.addEventListener("submit", async function(event:SubmitEvent):Promise<void> {
            event.preventDefault() // Prevents Default Behaviour

            const upload_post_form_submit:HTMLInputElement = upload_post_form.querySelector(".upload_post_form_submit") as HTMLInputElement // Gets The Upload Post Form Submit Button

            upload_post_form_submit.disabled = true // Disables The Upload Post Form Submit Button
            upload_post_form_submit.value = gettext("Overuje sa...")

            try {
                const token:string = await grecaptcha.execute("6Lfwh7osAAAAAExnZsXUSNJrACg7WX0guO88lCw1", { action: "upload_post_form" }) // Gets The reCAPTCHA token
                const form_data:FormData = new FormData(event.target as HTMLFormElement) // Gets The Form Data
                
                form_data.append("g-recaptcha-response", token) // Appends The reCAPTCHA Response To The Form Data
                upload_post_form_submit.value = gettext("Spracuváva sa...")

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
                    upload_post_form_submit.disabled = false // Enables The Upload Post Form Submit Button
                    upload_post_form_submit.value = gettext("Uverejniť príspevok")
                }
            } 
            
            // Error
            catch {
                upload_post_form_submit.disabled = false // Enables The Upload Post Form Submit Button
                upload_post_form_submit.value = gettext("Uverejniť príspevok")
            }
        })

        // Public Visibility Click Functionalities
        public_visibility.addEventListener("click", function(event:PointerEvent):void {
            // Sets The Private Visibility
            if((event.target as HTMLElement).classList.contains("fa-eye")) {
                (event.target as HTMLElement).classList.replace("fa-eye", "fa-eye-low-vision");
                (event.target as HTMLElement).title = gettext("Vypnúť viditeľnosť len pre sledovateľov")
            }

            // Sets The Public Visibility
            else if((event.target as HTMLElement).classList.contains("fa-eye-low-vision")) {
                (event.target as HTMLElement).classList.replace("fa-eye-low-vision", "fa-eye");
                (event.target as HTMLElement).title = gettext("Zapnúť viditeľnosť len pre sledovateľov")
            }
        })
        
        // Allow Comments Click Functionalities
        allow_comments.addEventListener("click", function(event:PointerEvent):void {
            // Disables The Comments
            if((event.target as HTMLElement).classList.contains("fa-comment")) {
                (event.target as HTMLElement).classList.replace("fa-comment", "fa-comment-slash");
                (event.target as HTMLElement).title = gettext("Zapnúť komentáre")
            }
            
            // Enables The Comments
            else if((event.target as HTMLElement).classList.contains("fa-comment-slash")) {
                (event.target as HTMLElement).classList.replace("fa-comment-slash", "fa-comment");
                (event.target as HTMLElement).title = gettext("Vypnúť komentáre")
            }
        })

        // Hide Likes Click Functionalities
        hide_likes.addEventListener("click", function(event:PointerEvent):void {
            // Hides The Like Counter
            if((event.target as HTMLElement).classList.contains("fa-solid")) {
                (event.target as HTMLElement).classList.replace("fa-solid", "fa-regular");
                (event.target as HTMLElement).title = gettext("Zobraziť počet označení páči sa mi to")
            }

            // Shows The Like Counter
            else if((event.target as HTMLElement).classList.contains("fa-regular")) {
                (event.target as HTMLElement).classList.replace("fa-regular", "fa-solid");
                (event.target as HTMLElement).title = gettext("Skryť počet označení páči sa mi to")
            }
        })

        // Select Posts Change Functionalities
        select_posts.addEventListener("change", function():void {
            if(!this.files) return
            
            const new_files = [...this.files] // Gets New Selected Files

            posts_preview_state.current_files = [...posts_preview_state.current_files, ...new_files] // Updates An Array of Current Files
            syncFiles(this, posts_preview) // Synchronizes Files
        })

        // Posts Preview Drag & Drop Functionalities (Drag Files From Local Storage)
        posts_preview.addEventListener("dragover", function(event:DragEvent):void {
            event.preventDefault() // Prevents Default Behaviour

            const is_reorder:boolean|undefined = event.dataTransfer?.types.includes("sourceindex") // Checks If The Dragged File Is Only From Reordering Their Positions

            if(!is_reorder) {
                this.classList.add("drag_active") // Adds Drag Animation Only When Moving a File From Local Storage
                posts_preview.querySelectorAll<HTMLDivElement>(".post").forEach(one_post => one_post.style.pointerEvents = "none") // Allows File Drop To All Posts
            }
        })

        posts_preview.addEventListener("dragleave", function():void {
            this.classList.remove("drag_active") // Removes Drag Animation
        })

        posts_preview.addEventListener("drop", function(event:DragEvent):void {
            event.preventDefault() // Prevents Default Behaviour

            this.classList.remove("drag_active") // Removes Drag Animation

            const is_reorder:boolean|undefined = event.dataTransfer?.types.includes("sourceindex") // Checks If The Dragged File Is Only From Reordering Their Positions
            const has_files:boolean|undefined = event.dataTransfer?.files && event.dataTransfer.files.length > 0 // Checks If There Are Any Dragged Files

            // Adds Dragged File Only When Moving at Least One File From Local Storage
            if(!is_reorder && has_files) {
                const new_files = Array.from(event.dataTransfer!.files) // Gets New Dragged Files
                posts_preview_state.current_files.push(...new_files) // Updates An Array of Current Files
                syncFiles(select_posts, this) // Synchronizes Files
            }
        })

        // Tag Users

        // Variables

        const tag_user:HTMLElement = post_info_container.querySelector(".icons .tags .tag_user") as HTMLElement // Gets The Tag User Icon
        const description:HTMLDivElement = upload_post_form.querySelector(".description") as HTMLDivElement // Gets The Description
        const description_input:HTMLInputElement = upload_post_form.querySelector(".description_input") as HTMLInputElement // Gets The Description Hidden Input
        const users_for_tag_container:HTMLDivElement = upload_post_form.querySelector(".users_for_tag_container") as HTMLDivElement // Gets The Users For Tag Container
        const tagged_users_container:HTMLDivElement = upload_post_form.querySelector(".tagged_users_container") as HTMLDivElement // Gets The Tagged Users Container
        const tagged_users:HTMLInputElement = upload_post_form.querySelector(".tagged_users") as HTMLInputElement // Gets The Hidden Input Of Tagged Users

        const MAX_DESCRIPTION_LENGTH:number = 500 // Sets The Max Description Length

        let previous_description_length:number = description.innerText.length // Stores The Length Of The Previous Written Description To Check Whether The Last Operation Was A Write Or An Erase

        const added_hashtags_input:HTMLInputElement = upload_post_form.querySelector(".added_hashtags") as HTMLInputElement // Gets The Hidden Input Of Added Hashtags

        // Events

        // Adds At Sign To The Description After Clicking On The Tag User Icon
        tag_user.addEventListener("click", function():void {
            // Checks For The Maximum Input Length
            if(description.innerText.length < MAX_DESCRIPTION_LENGTH - 1) {
                const previous_character:string|null = description.innerText[description.innerText.length - 1] || null // Gets The Last Entered Character (Null If There Hasn't Been Any Yet)

                previous_character?.charCodeAt(0) === 160 || previous_character === " " || previous_character === null ? description.innerHTML += "@" : description.innerHTML += " @" // Adds At Sign At The End With Additional Spacing (If There Isn't Already)

                const at:tag = {
                    position: {
                        tag_start_index: description.innerText.length - 1,
                        tag_end_index: description.innerText.length - 1
                    }
                }

                storeAtSignPosition(at) // Stores The At Sign Position
                hideUsersForTag(users_for_tag_container) // Hides Users For Tag Container
                focusAtEnd(description) // Adds Focus To The Description

                description_input.value = description.textContent.trim() // Sets The Description Input Value
            }
        })

        // Searches For Users For Tag If There Is At Sign In The Description
        description.addEventListener("input", function():void {
            description_input.value = this.textContent.trim() // Sets The Description Input Value

            // Tag Users

            const cursor_position:number = getCursorPosition(this) ?? this.innerText.length // Gets The Cursor Position
            const nearest_at_before_cursor:number = this.innerText.lastIndexOf("@", Math.max(cursor_position - 1, 0)) // Gets The Nearest At Sign Before Cursor
            const text_between_at_and_cursor:string = nearest_at_before_cursor !== -1 ? this.innerText.slice(nearest_at_before_cursor + 1, cursor_position) : "" // Gets The Text Between The At Sign And The Cursor
            const is_typing_tag_at_cursor:boolean = nearest_at_before_cursor !== -1 && !text_between_at_and_cursor.includes(" ") // Checks If Is Typing Tag At The Cursor
            
            // Starts Getting Users For Tag Only If Cursor Is In Active Tag Area Or The User Already Starts Tagging
            if(is_typing_tag_at_cursor || tag_user_state.tagged_user) getUsersForTag(this, users_for_tag_container) // Gets Users For Tag
            else hideUsersForTag(users_for_tag_container) // Hides Users For Tag Container

            checkTagsPositions(this, getCursorPosition(this), previous_description_length, tagged_users_container, tagged_users) // Checks The Position Of Tags (If There Is Any)

            // Add Hashtags

            checkHashtags(this, added_hashtags_input)

            checkHashtagsPositions(this, getCursorPosition(this), previous_description_length, added_hashtags_input) // Checks The Position Of Hashtags (If There Is Any)

            previous_description_length = this.innerText.length // Updates The Previous Description Length
        })

        // Users For Tag Container Click Functionalities
        users_for_tag_container.addEventListener("click", function(event:PointerEvent):void {
            // Tags The User
            if((event.target as HTMLDivElement).classList.contains("one_user")) {
                const clicked_username:string|null = (event.target as HTMLDivElement).dataset["username"] || null // Gets The Clicked Username

                if(clicked_username) {
                    tagUser(users_for_tag_container, clicked_username, description) // Tags The User
                    previous_description_length = description.innerText.length // Updates The Previous Description Length
                }
            }

            // Deletes Tagged User From The History
            else if((event.target as HTMLDivElement).classList.contains("delete_from_history")) {
                const clicked_user:HTMLDivElement = (event.target as HTMLDivElement).closest(".one_user") as HTMLDivElement // Gets The Clicked User
                const clicked_username:string|null = clicked_user.dataset["username"] || null // Gets The Clicked Username

                if(clicked_username) {
                    deleteUserFromHistory(clicked_username) // Deletes User From The History
                    clicked_user.blur(); // Removes Focus From The Clicked User
                    clicked_user.querySelectorAll<HTMLElement>(".delete_from_history").forEach(one_icon => one_icon.remove()) // Removes The Delete From History Icon From The DOM
                }
            }
        })

        // Users For Tag Container Mouse Over Functionality
        users_for_tag_container.addEventListener("mouseover", function(event:MouseEvent):void {
            // Change Appearance Of Delete From History Icon (Shows The X Icon)
            if((event.target as HTMLElement).classList.contains("delete_from_history")) {
                const delete_from_history:HTMLElement = event.target as HTMLElement // Gets The Delete From History Icon

                // Shows The X Icon
                if(delete_from_history.classList.contains("fa-clock-rotate-left")) {
                    delete_from_history.classList.add("hidden");
                    (delete_from_history.nextSibling as HTMLElement).classList.remove("hidden")
                }
            }
        })

        // Users For Tag Container Mouse Out Functionality
        users_for_tag_container.addEventListener("mouseout", function(event:MouseEvent):void {
            // Change Appearance Of Delete From History Icon (Shows The Clock Icon)
            if((event.target as HTMLElement).classList.contains("delete_from_history")) {
                const delete_from_history:HTMLElement = event.target as HTMLElement // Gets The Delete From History Icon

                // Shows The Clock Icon
                if(delete_from_history.classList.contains("fa-xmark")) {
                    delete_from_history.classList.add("hidden");
                    (delete_from_history.previousSibling as HTMLElement).classList.remove("hidden")
                }
            }
        })

        // Removes Tag
        tagged_users_container.addEventListener("click", function(event:PointerEvent):void {
            if((event.target as HTMLElement).classList.contains("fa-xmark")) {
                const tag:HTMLDivElement = (event.target as HTMLElement).parentElement as HTMLDivElement // Gets The Tag
                removeTag(tag, description, tagged_users) // Removes Tag
            }
        })

        // Change Focused User For Tag In The Users For Tag Container
        post_info_container.addEventListener("keydown", function(event:KeyboardEvent):void {
            if(event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "Enter") event.preventDefault() // Prevents Default Behaviour

            if(event.key === "ArrowUp") changeFocusedUserForTag(tag_user_state.focused_user_for_tag_index - 1, users_for_tag_container) // Changes Focused User For Tag (Shows The Previous User For Tag)
            else if(event.key === "ArrowDown") changeFocusedUserForTag(tag_user_state.focused_user_for_tag_index + 1, users_for_tag_container) // Changes Focused User For Tag (Shows The Next User For Tag)

            else if(event.key === "Enter" && users_for_tag_container.classList.contains("active")) {
                const all_users_for_tag:NodeListOf<HTMLDivElement> = users_for_tag_container.querySelectorAll(".one_user") // Gets All Users For Tag

                const clicked_username:string|null = (all_users_for_tag[tag_user_state.focused_user_for_tag_index] as HTMLDivElement).dataset["username"] || null // Gets The Clicked User ID

                if(clicked_username) {
                    tagUser(users_for_tag_container, clicked_username, description) // Tags The User

                    previous_description_length = description.innerText.length // Updates The Previous Description Length
                    tag_user_state.focused_user_for_tag_index = 0 // Resets Focused User For Tag Index
                }
            }
        })

        // Add Hashtags

        // Variables

        const add_hashtag:HTMLElement = post_info_container.querySelector(".icons .tags .add_hashtag") as HTMLElement // Gets The Add Hashtag Icon

        // Events

        // Add Hashtag Functionality
        add_hashtag.addEventListener("click", function():void {
            // Checks For The Maximum Input Length
            if(description.innerText.length < MAX_DESCRIPTION_LENGTH - 1) {
                const previous_character:string|null = description.innerText[description.innerText.length - 1] || null // Gets The Last Entered Character (Null If There Hasn't Been Any Yet)
        
                previous_character?.charCodeAt(0) === 160 || previous_character === " " || previous_character === null ? description.innerHTML += "#" : description.innerHTML += " #" // Adds Hashtag Sign At The End With Additional Spacing (If There Isn't Already)

                hideUsersForTag(users_for_tag_container) // Hides Users For Tag Container
                focusAtEnd(description) // Adds Focus To The Description

                description_input.value = description.textContent.trim() // Sets The Description Input Value
            }
        })

        // Location

        // Variables

        const location_container:HTMLDivElement = upload_post_form.querySelector(".location_container") as HTMLDivElement // Gets The Location Container
        const location_input:HTMLInputElement = location_container.querySelector(".location_input_container .location") as HTMLInputElement // Gets The Location Input
        const latitude:HTMLInputElement = location_container.querySelector(".location_input_container .latitude") as HTMLInputElement // Gets The Latitude Hidden Input
        const longitude:HTMLInputElement = location_container.querySelector(".location_input_container .longitude") as HTMLInputElement // Gets The Longitude Hidden Input
        const location_results:HTMLDivElement = location_container.querySelector(".location_results_container .location_results") as HTMLDivElement // Gets The Location Results
        const location_loading:HTMLDivElement = location_container.querySelector(".location_results_container .loading") as HTMLDivElement // Gets The Location Loading

        let debounce_timeout:number // Debounce Timeout Between API Requests

        // Events

        // Location Input Functionality
        location_input.addEventListener("input", function():void {
            clearTimeout(debounce_timeout) // Clears The Debounce Timeout

            const searched_location = location_input.value // Gets The Searched Location

            if(searched_location.length < 3) {
                const all_places:NodeListOf<HTMLDivElement> = location_results.querySelectorAll<HTMLDivElement>(".place") // Gets All Places

                if(location_results.querySelectorAll(".place").length > 0) {
                    all_places.forEach(function(one_place:HTMLDivElement):void {
                        one_place.remove() // Removes The Place From The DOM
                    })
                }

                location_loading.classList.add("hidden") // Hides The Loader
                location_results.classList.add("hidden") // Hides The Location Results
                return
            }

            location_loading.classList.remove("hidden") // Shows The Loader

            // Gets Location After 1000 MS Delay (Because of The Nominatim Usage Policy - 1 Request per Second)
            debounce_timeout = window.setTimeout(function() {
                getLocation(searched_location, location_results, location_input, latitude, longitude)
            }, 1000)
        })

        // Location Focus Functionality
        location_input.addEventListener("focus", function():void {
            if(location_results.querySelectorAll(".place").length > 0) location_results.classList.remove("hidden") // Shows The Location Results (If There Are Any)
        })

        // Location Blur Functionality
        location_input.addEventListener("blur", function(event:FocusEvent):void {
            if(
                !(event.relatedTarget as HTMLDivElement).classList.contains("place") && 
                !(event.relatedTarget as HTMLDivElement).classList.contains("location_results") &&
                !location_results.classList.contains("hidden")
            ) {
                location_results.classList.add("hidden") // Hides The Location Results And Prevents Hiding The Places Before Selection (If The User Clicks On The Place In The Location Results In Order To Select)
            }
        })

        // Change Focused Place In The Location Results
        location_container.addEventListener("keydown", function(event:KeyboardEvent):void {
            if(event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "Enter") event.preventDefault() // Prevents Default Behaviour

            if(event.key === "ArrowUp") changeFocusedPlace(location_state.focused_place_index - 1, location_results) // Changes Focused Place (Shows The Previous Place)
            else if(event.key === "ArrowDown") changeFocusedPlace(location_state.focused_place_index + 1, location_results) // Changes Focused Place (Shows The Next Place)

            else if(event.key === "Enter") {
                const all_places:NodeListOf<HTMLDivElement> = location_results.querySelectorAll(".place"); // Gets All Places

                (all_places[location_state.focused_place_index] as HTMLDivElement).click() // Adds The Location Name To The Location Input Value After Click
                upload_post_form_dialog.showModal() // Shows The Upload Post Form Dialog
            }
        })
    }

    // Feed

    // Variables

    const feed:HTMLDivElement|null = document.querySelector(".feed") as HTMLDivElement || null // Gets The Feed Container If Exists

    if(feed) {
        const search_posts_container:HTMLDivElement|null = feed.querySelector(".search_posts_container") as HTMLDivElement || null // Gets The Search Posts Container
        const all_post_containers:NodeListOf<HTMLDivElement> = feed.querySelectorAll<HTMLDivElement>(".post_container") // Gets All Post Containers
        const all_videos:NodeListOf<HTMLVideoElement> = feed.querySelectorAll<HTMLVideoElement>(".post_container .media .one_post .video_container .video") // Gets All Videos

        if(search_posts_container) {
            const search_posts_input:HTMLInputElement = search_posts_container.querySelector(".search_bar") as HTMLInputElement // Gets The Search Posts Input
            const delete_search_posts_input:HTMLElement = search_posts_container.querySelector(".fa-xmark") as HTMLElement // Gets The Delete Search Posts Input Icon
            const history_container:HTMLDivElement = search_posts_container.querySelector(".history_container") as HTMLDivElement // Gets The History Container
            let search_posts_timeout:number // Debounce Timeout Between Requests

            // Events

            // Search Posts Input Focus Functionality
            search_posts_input.addEventListener("focus", function():void {
                checkSearchedPostsHistory(history_container, search_posts_input) // Checks Searched Posts History
            })

            // Search Posts Input Functionality
            search_posts_input.addEventListener("input", function():void {
                if(search_posts_timeout) clearTimeout(search_posts_timeout) // Deletes The Previous Search Posts Timeout
                feed_state.is_loading = true
                feed_report.textContent = gettext("Načítavam...")

                const all_post_containers:NodeListOf<HTMLDivElement> = feed.querySelectorAll<HTMLDivElement>(".post_container") // Gets All Post Containers
                all_post_containers.forEach(one_post_container => (one_post_container.querySelector(".loading") as HTMLDivElement).classList.remove("hidden")) // Shows The Loader

                // Gets The Posts After 2 Seconds Of Delay
                search_posts_timeout = window.setTimeout(function() {
                    feed_state.current_page = 1
                    feed_state.is_loading = false
                    feed_state.has_more_posts = true
                    all_post_containers.forEach(one_post_container => one_post_container.remove()) // Removes Every Post Container From The DOM
                    loadPosts(feed, feed_report, search_posts_input, history_container) // Loads The Posts
                }, 2000)
            })

            // Search Post Input Key Functionalities
            search_posts_input.addEventListener("keydown", function(event:KeyboardEvent):void {
                const all_searched_posts:NodeListOf<HTMLDivElement> = history_container.querySelectorAll(".searched_post") // Gets All Searched Posts

                if(event.key === "ArrowUp" || event.key === "ArrowDown") event.preventDefault() // Allows Ordinary Typing To The Input

                if(event.key === "ArrowUp") changeFocusedSearchedPost(feed_state.focused_searched_post_index - 1, all_searched_posts, search_posts_input) // Changes Focused Searched Post (Shows The Previous Searched Post)
                else if(event.key === "ArrowDown") changeFocusedSearchedPost(feed_state.focused_searched_post_index + 1, all_searched_posts, search_posts_input) // Changes Focused Searched Post (Shows The Next Searched Post)

                else if(event.key === "Enter") {
                    const searched_post:HTMLParagraphElement = ((all_searched_posts[feed_state.focused_searched_post_index] as HTMLDivElement).querySelector("p") as HTMLParagraphElement) // Gets The Searched Post
                    let searched_posts_history:string[] = JSON.parse(localStorage.getItem("searched_posts_history") || "[]") as string[] // Gets The Searched Posts History From The Local Storage
                    const searched_post_index = searched_posts_history.indexOf(searched_post.textContent)

                    if(searched_post_index !== -1) searched_posts_history.splice(searched_post_index, 1) // Deletes The Previous Searched Post From The Searched Posts History
                    searched_posts_history.unshift(searched_post.textContent) // Updates Searched Posts History
                    if(searched_posts_history.length > feed_state.MAX_HISTORY_LENGTH) searched_posts_history = searched_posts_history.slice(0, feed_state.MAX_HISTORY_LENGTH) // Shows Maximum Of 3 Results From The Searched Posts History, Others Will Be Deleted From The Searched Posts History

                    localStorage.setItem("searched_posts_history", JSON.stringify(searched_posts_history)) // Saves Updated Searched Posts History To The Local Storage

                    search_posts_input.value = searched_post.textContent // Sets The Search Posts Input Value

                    if(search_posts_timeout) clearTimeout(search_posts_timeout) // Deletes The Previous Search Posts Timeout
                    feed_state.is_loading = true
                    feed_report.textContent = gettext("Načítavam...")

                    const all_post_containers:NodeListOf<HTMLDivElement> = feed.querySelectorAll<HTMLDivElement>(".post_container") // Gets All Post Containers
                    all_post_containers.forEach(one_post_container => (one_post_container.querySelector(".loading") as HTMLDivElement).classList.remove("hidden")) // Shows The Loader

                    // Gets The Posts After 2 Seconds Of Delay
                    search_posts_timeout = window.setTimeout(function() {
                        feed_state.current_page = 1
                        feed_state.is_loading = false
                        feed_state.has_more_posts = true
                        all_post_containers.forEach(one_post_container => one_post_container.remove()) // Removes Every Post Container From The DOM
                        loadPosts(feed, feed_report, search_posts_input, history_container) // Loads The Posts
                    }, 2000)
                }
            })

            // Delete Search Posts Input Icon Click Functionality
            delete_search_posts_input.addEventListener("click", function():void {
                if(search_posts_input.value !== "") {
                    search_posts_input.value = "" // Deletes Search Posts Input Value

                    if(search_posts_timeout) clearTimeout(search_posts_timeout) // Deletes The Previous Search Posts Timeout
                    feed_state.is_loading = true
                    feed_report.textContent = gettext("Načítavam...")

                    const all_post_containers:NodeListOf<HTMLDivElement> = feed.querySelectorAll<HTMLDivElement>(".post_container") // Gets All Post Containers
                    all_post_containers.forEach(one_post_container => (one_post_container.querySelector(".loading") as HTMLDivElement).classList.remove("hidden")) // Shows The Loader

                    // Gets The Posts After 2 Seconds Of Delay
                    search_posts_timeout = window.setTimeout(function() {
                        feed_state.current_page = 1
                        feed_state.is_loading = false
                        feed_state.has_more_posts = true
                        all_post_containers.forEach(one_post_container => one_post_container.remove()) // Removes Every Post Container From The DOM
                        loadPosts(feed, feed_report, search_posts_input, history_container) // Loads The Posts
                    }, 2000)
                }
            })

            // Global Event Delegations

            // Document Click Functionality
            document.addEventListener("click", function(event:PointerEvent):void {
                // When The User Clicks Outside The Search Bar, History Container Or Delete From History Icon
                if(!(event.target as HTMLInputElement).classList.contains("search_bar") && !(event.target as HTMLDivElement).classList.contains("history_container") && !(event.target as HTMLElement).classList.contains("delete_from_history")) {
                    hideHistoryContainer(search_posts_input, history_container) // Hides The History Container
                    return
                }
            })

            // History Container Click Functionalities
            history_container.addEventListener("click", function(event:PointerEvent):void {
                let searched_posts_history:string[] = JSON.parse(localStorage.getItem("searched_posts_history") || "[]") as string[] // Gets The Searched Posts History From The Local Storage

                // Click On The Searched Post
                if(event.target instanceof HTMLParagraphElement) {
                    const clicked_searched_post:string|null = (event.target as HTMLParagraphElement).dataset["searched_post"] || null // Gets The Searched Post For Deletion

                    if(clicked_searched_post) {
                        const clicked_searched_post_index = searched_posts_history.indexOf(clicked_searched_post)

                        if(clicked_searched_post_index !== -1) searched_posts_history.splice(clicked_searched_post_index, 1) // Deletes The Previous Searched Post From The Searched Posts History
                        searched_posts_history.unshift(clicked_searched_post) // Updates Searched Posts History
                        if(searched_posts_history.length > feed_state.MAX_HISTORY_LENGTH) searched_posts_history = searched_posts_history.slice(0, feed_state.MAX_HISTORY_LENGTH) // Shows Maximum Of 3 Results From The Searched Posts History, Others Will Be Deleted From The Searched Posts History

                        localStorage.setItem("searched_posts_history", JSON.stringify(searched_posts_history)) // Saves Updated Searched Posts History To The Local Storage

                        search_posts_input.value = clicked_searched_post // Sets The Search Posts Input Value

                        if(search_posts_timeout) clearTimeout(search_posts_timeout) // Deletes The Previous Search Posts Timeout
                        feed_state.is_loading = true
                        feed_report.textContent = gettext("Načítavam...")

                        const all_post_containers:NodeListOf<HTMLDivElement> = feed.querySelectorAll<HTMLDivElement>(".post_container") // Gets All Post Containers
                        all_post_containers.forEach(one_post_container => (one_post_container.querySelector(".loading") as HTMLDivElement).classList.remove("hidden")) // Shows The Loader

                        // Gets The Posts After 2 Seconds Of Delay
                        search_posts_timeout = window.setTimeout(function() {
                            feed_state.current_page = 1
                            feed_state.is_loading = false
                            feed_state.has_more_posts = true
                            all_post_containers.forEach(one_post_container => one_post_container.remove()) // Removes Every Post Container From The DOM
                            loadPosts(feed, feed_report, search_posts_input, history_container) // Loads The Posts
                        }, 2000)
                    }
                }

                // Click On The Delete From History Icon
                if((event.target as HTMLElement).classList.contains("delete_from_history")) {
                    const searched_post_for_deletion:string|null = ((event.target as HTMLElement).nextSibling as HTMLParagraphElement).dataset["searched_post"] || null // Gets The Searched Post For Deletion

                    if(searched_post_for_deletion) {
                        searched_posts_history = searched_posts_history.filter(one_item => one_item !== searched_post_for_deletion) // Removes The Clicked Item From The Searched Posts History
        
                        localStorage.setItem("searched_posts_history", JSON.stringify(searched_posts_history)) // Saves Updated Searched Posts History To The Local Storage
        
                        checkSearchedPostsHistory(history_container, search_posts_input) // Checks Searched Posts History
                    }
                }
            })

            // History Container Mouse Over Functionality
            history_container.addEventListener("mouseover", function(event:MouseEvent):void {
                // Change Appearance Of Delete From History Icon (Shows The X Icon)
                if((event.target as HTMLElement).classList.contains("delete_from_history")) {
                    const delete_from_history:HTMLElement = event.target as HTMLElement // Gets The Delete From History Icon

                    // Shows The X Icon
                    if(delete_from_history.classList.contains("fa-clock-rotate-left")) {
                        delete_from_history.classList.add("hidden");
                        (delete_from_history.nextSibling as HTMLElement).classList.remove("hidden")
                    }
                }
            })

            // History Container Mouse Out Functionality
            history_container.addEventListener("mouseout", function(event:MouseEvent):void {
                // Change Appearance Of Delete From History Icon (Shows The Clock Icon)
                if((event.target as HTMLElement).classList.contains("delete_from_history")) {
                    const delete_from_history:HTMLElement = event.target as HTMLElement // Gets The Delete From History Icon

                    // Shows The Clock Icon
                    if(delete_from_history.classList.contains("fa-xmark")) {
                        delete_from_history.classList.add("hidden");
                        (delete_from_history.previousSibling as HTMLElement).classList.remove("hidden")
                    }
                }
            })

            // History Container Key Functionalities
            history_container.addEventListener("keydown", function(event:KeyboardEvent):void {
                const all_searched_posts:NodeListOf<HTMLDivElement> = history_container.querySelectorAll(".searched_post") // Gets All Searched Posts

                if(event.key === "ArrowUp" || event.key === "ArrowDown") event.preventDefault()

                if(event.key === "ArrowUp") changeFocusedSearchedPost(feed_state.focused_searched_post_index - 1, all_searched_posts, search_posts_input) // Changes Focused Searched Post (Shows The Previous Searched Post)
                else if(event.key === "ArrowDown") changeFocusedSearchedPost(feed_state.focused_searched_post_index + 1, all_searched_posts, search_posts_input) // Changes Focused Searched Post (Shows The Next Searched Post)

                else if(event.key === "Enter") {
                    const searched_post:HTMLParagraphElement = ((all_searched_posts[feed_state.focused_searched_post_index] as HTMLDivElement).querySelector("p") as HTMLParagraphElement) // Gets The Searched Post
                    let searched_posts_history:string[] = JSON.parse(localStorage.getItem("searched_posts_history") || "[]") as string[] // Gets The Searched Posts History From The Local Storage
                    const searched_post_index = searched_posts_history.indexOf(searched_post.textContent)

                    if(searched_post_index !== -1) searched_posts_history.splice(searched_post_index, 1) // Deletes The Previous Searched Post From The Searched Posts History
                    searched_posts_history.unshift(searched_post.textContent) // Updates Searched Posts History
                    if(searched_posts_history.length > feed_state.MAX_HISTORY_LENGTH) searched_posts_history = searched_posts_history.slice(0, feed_state.MAX_HISTORY_LENGTH) // Shows Maximum Of 3 Results From The Searched Posts History, Others Will Be Deleted From The Searched Posts History

                    localStorage.setItem("searched_posts_history", JSON.stringify(searched_posts_history)) // Saves Updated Searched Posts History To The Local Storage

                    search_posts_input.value = searched_post.textContent // Sets The Search Posts Input Value

                    if(search_posts_timeout) clearTimeout(search_posts_timeout) // Deletes The Previous Search Posts Timeout
                    feed_state.is_loading = true
                    feed_report.textContent = gettext("Načítavam...")

                    const all_post_containers:NodeListOf<HTMLDivElement> = feed.querySelectorAll<HTMLDivElement>(".post_container") // Gets All Post Containers
                    all_post_containers.forEach(one_post_container => (one_post_container.querySelector(".loading") as HTMLDivElement).classList.remove("hidden")) // Shows The Loader

                    // Gets The Posts After 2 Seconds Of Delay
                    search_posts_timeout = window.setTimeout(function() {
                        feed_state.current_page = 1
                        feed_state.is_loading = false
                        feed_state.has_more_posts = true
                        all_post_containers.forEach(one_post_container => one_post_container.remove()) // Removes Every Post Container From The DOM
                        loadPosts(feed, feed_report, search_posts_input, history_container) // Loads The Posts
                    }, 2000)
                }
            })

            // Infinite Feed Scroll
    
            const feed_report:HTMLParagraphElement = feed.querySelector(".feed_report") as HTMLParagraphElement // Gets The Feed Report
            
            const observer:IntersectionObserver = new IntersectionObserver((entries:IntersectionObserverEntry[]) => {
                if(entries[0] && entries[0].isIntersecting) {
                    loadPosts(feed, feed_report) // Loads The Posts
                }
            }, {
                root: null,
                rootMargin: "250px",
                threshold: 0.1
            })
            
            loadPosts(feed, feed_report) // Loads The Posts
            observer.observe(feed_report) // Starts The Observation
        }

        // Feed Click Functionalities
        feed.addEventListener("click", function(event:PointerEvent):void {
            // Post Container
            if((event.target as HTMLElement).closest(".post_container") as HTMLDivElement) {
                // Follow Button Click Functionalities
                if((event.target as HTMLDivElement).classList.contains("follow_button")) {
                    const follow_button:HTMLDivElement = event.target as HTMLDivElement // Gets The Follow Button
                    const clicked_user_id:number|null = Number(follow_button.dataset["id"]) || null // Gets Clicked User ID
    
                    if(follow_button.dataset["action"]?.trim() === "follow") {
                        follow(event, clicked_user_id); // Follow
                        follow_button.textContent = "Prestať sledovať"
                        follow_button.dataset["action"] = "unfollow"
                    }
        
                    else if(follow_button.dataset["action"]?.trim() === "unfollow") {
                        unfollow(event, clicked_user_id); // Unfollow
                        follow_button.textContent = "Začať sledovať"
                        follow_button.dataset["action"] = "follow"
                    }
                }

                // Toggle Post Like Click Functionality
                if(
                    (event.target as HTMLElement).classList.contains("fa-heart") &&
                    (((event.target as HTMLElement).parentElement as HTMLDivElement).parentElement as HTMLDivElement).classList.contains("society")
                ) {
                    const toggle_like:HTMLElement = event.target as HTMLElement // Gets The Heart Icon
                    const likes_counter:HTMLParagraphElement|null = (toggle_like.parentElement as HTMLDivElement).querySelector(".likes_counter") as HTMLParagraphElement || null // Gets The Likes Counter
                    const post_container:HTMLDivElement = toggle_like.closest(".post_container") as HTMLDivElement // Gets The Post Container
                    const particles:HTMLDivElement = post_container.querySelector(".media .particles") as HTMLDivElement // Gets The Particles Container

                    if(post_container.dataset["post_id"]) togglePostLike(toggle_like, likes_counter, post_container.dataset["post_id"], particles) // Adds Or Removes Like From The Post
                }

                // Comment Forum

                // Toggle Show / Hide Comment Forum
                if(
                    (event.target as HTMLElement).classList.contains("fa-comment") &&
                    ((event.target as HTMLElement).parentElement as HTMLDivElement).classList.contains("comments")
                ) {
                    const comment_forum:HTMLDivElement = (((event.target as HTMLElement).closest(".society") as HTMLDivElement).parentElement as HTMLDivElement).querySelector(".comment_forum") as HTMLDivElement // Gets The Comment Forum

                    !comment_forum.classList.contains("hidden") ? comment_forum.classList.add("hidden") : comment_forum.classList.remove("hidden") // Shows or Hides The Comment Forum
                }

                // Send Comment
                if((event.target as HTMLImageElement).classList.contains("send")) {
                    const send_comment:HTMLImageElement = event.target as HTMLImageElement // Gets The Send Comment Icon
                    const post_container:HTMLDivElement = send_comment.closest(".post_container") as HTMLDivElement // Gets The Post Container
                    const comment:HTMLDivElement = post_container.querySelector(".comment_forum .write_comment_form .comment") as HTMLDivElement // Gets The Comment Input
                    const all_comments:HTMLDivElement = post_container.querySelector(".comment_forum .all_comments") as HTMLDivElement // Gets All Comments Container

                    if(post_container.dataset["post_id"]) addComment(post_container.dataset["post_id"], comment.textContent, all_comments) // Adds Comment To The Post
                }

                // Toggle Comment Like Click Functionality
                if(
                    (event.target as HTMLElement).classList.contains("fa-heart") &&
                    (((event.target as HTMLElement).parentElement as HTMLDivElement).parentElement as HTMLDivElement).classList.contains("interactions")
                ) {
                    const one_comment:HTMLDivElement = (event.target as HTMLElement).closest(".one_comment") as HTMLDivElement // Gets The One Comment Container
                    const comment_likes_counter:HTMLParagraphElement = ((event.target as HTMLElement).parentElement as HTMLDivElement).querySelector(".likes_counter") as HTMLParagraphElement // Gets The Likes Counter

                    if(one_comment.dataset["comment_id"]) toggleCommentLike(event.target as HTMLElement, comment_likes_counter, one_comment.dataset["comment_id"]) // Adds Or Removes Like From The Comment
                }

                // Report Comment
                if((event.target as HTMLElement).classList.contains("fa-flag")) {
                    const one_comment:HTMLDivElement = (event.target as HTMLElement).closest(".one_comment") as HTMLDivElement // Gets The One Comment Container

                    if(one_comment.dataset["comment_id"]) reportComment(event.target as HTMLElement, one_comment.dataset["comment_id"]) // Reports The Comment
                }

                // Reply On Comment
                if( 
                    (((event.target as HTMLElement).parentElement as HTMLDivElement).parentElement as HTMLDivElement).classList.contains("interactions") &&
                    ((event.target as HTMLElement).classList.contains("fa-comment") || 
                    (event.target as HTMLElement).classList.contains("fa-xmark"))
                ) {
                    const one_comment:HTMLDivElement = (event.target as HTMLElement).closest(".one_comment") as HTMLDivElement // Gets The One Comment Container
                    const reply_container:HTMLDivElement = one_comment.querySelector(".reply_container") as HTMLDivElement // Gets The Reply Container
                    const write_comment_form:HTMLDivElement = ((one_comment.parentElement as HTMLDivElement).parentElement as HTMLDivElement).querySelector(".write_comment_form") as HTMLDivElement // Gets The Write Comment Form

                    if(one_comment.dataset["comment_id"]) replyOnComment(write_comment_form, reply_container, event.target as HTMLElement, one_comment.dataset["comment_id"]) // Replies On The Comment
                }

                // Share Post
                if((event.target as HTMLElement).classList.contains("fa-share-nodes")) {
                    const share_icon:HTMLElement = event.target as HTMLElement // Gets The Share Icon
                    const share:HTMLDivElement = share_icon.closest(".share") as HTMLDivElement // Gets The Share Container
                    const post_container:HTMLDivElement = share_icon.closest(".post_container") as HTMLDivElement // Gets The Post Container

                    if(post_container.dataset["post_id"] && share.dataset["author"]) sharePost(post_container.dataset["post_id"], share.dataset["author"]) // Shares The Post
                }

                // Save Post
                if((event.target as HTMLElement).classList.contains("fa-bookmark")) {
                    const save_icon:HTMLElement = event.target as HTMLElement // Gets The Save Icon
                    const post_container:HTMLDivElement = save_icon.closest(".post_container") as HTMLDivElement // Gets The Post Container

                    if(post_container.dataset["post_id"]) togglePostSave(save_icon, post_container.dataset["post_id"]) // Saves Or Unsaves The Post
                }
            }
            
            // Post Bars Click Functionalities
            if((event.target as HTMLDivElement).classList.contains("bar")) {
                const clicked_bar:HTMLDivElement = event.target as HTMLDivElement // Gets The Clicked Bar
                const media_container:HTMLDivElement = clicked_bar.closest(".media") as HTMLDivElement // Gets The Media Container
                const post_bars:HTMLDivElement = clicked_bar.parentElement as HTMLDivElement // Gets The Post Bars Container
                const clicked_bar_index:number = [...post_bars.querySelectorAll<HTMLDivElement>(".bar")].indexOf(clicked_bar) // Gets The Clicked Bar Index

                changePost(clicked_bar_index, media_container, post_bars) // Changes The Post
            }

            // Previous Post
            if(
                (event.target as HTMLDivElement).classList.contains("previous") && 
                !(event.target as HTMLDivElement).classList.contains("hidden")
            ) {
                const previous:HTMLDivElement = event.target as HTMLDivElement // Gets The Previous Button
                const media_container:HTMLDivElement = previous.closest(".media") as HTMLDivElement // Gets The Media Container
                const post_bars:HTMLDivElement = ((previous.parentElement as HTMLDivElement).parentElement as HTMLDivElement).querySelector(".post_bars") as HTMLDivElement // Gets The Post Bars Container
                const all_media:NodeListOf<HTMLDivElement> = media_container.querySelectorAll<HTMLDivElement>(".one_post") // Gets All Media From The Posts
                const post_index:number = [...all_media].indexOf(previous.parentElement as HTMLDivElement) - 1 // Gets The Previous Post Index

                changePost(post_index, media_container, post_bars) // Changes The Post
            }

            // Next Post
            if(
                (event.target as HTMLDivElement).classList.contains("next") && 
                !(event.target as HTMLDivElement).classList.contains("hidden")
            ) {
                const next:HTMLDivElement = event.target as HTMLDivElement // Gets The Next Button
                const media_container:HTMLDivElement = next.closest(".media") as HTMLDivElement // Gets The Media Container
                const post_bars:HTMLDivElement = ((next.parentElement as HTMLDivElement).parentElement as HTMLDivElement).querySelector(".post_bars") as HTMLDivElement // Gets The Post Bars Container
                const all_media:NodeListOf<HTMLDivElement> = media_container.querySelectorAll<HTMLDivElement>(".one_post") // Gets All Media From The Posts
                const post_index:number = [...all_media].indexOf(next.parentElement as HTMLDivElement) + 1 // Gets The Next Post Index

                changePost(post_index, media_container, post_bars) // Changes The Post
            }

            // Play / Pause Video
            if((event.target as HTMLButtonElement).classList.contains("play_pause")) {
                const play_pause_icon:HTMLElement = (event.target as HTMLButtonElement).querySelector("i") as HTMLElement // Gets The Play / Pause Icon
                const video:HTMLVideoElement = ((event.target as HTMLButtonElement).closest(".video_container") as HTMLDivElement).querySelector(".video") as HTMLVideoElement // Gets The Video

                playPauseVideo(play_pause_icon, video) // Plays Or Pauses The Video
            }

            // Mute / Unmute Video
            if((event.target as HTMLDivElement).classList.contains("mute_unmute")) {
                const volume_icon:HTMLElement = event.target as HTMLElement // Gets The Volume Icon
                const volume_input:HTMLInputElement = (volume_icon.closest(".volume_container") as HTMLDivElement).querySelector(".volume") as HTMLInputElement // Gets the Volume Input
                const video:HTMLVideoElement = (volume_icon.closest(".video_container") as HTMLDivElement).querySelector(".video") as HTMLVideoElement // Gets The Video

                muteUnmuteVideo(volume_icon, volume_input, video) // Mutes Or Unmutes The Video
            }

            // Toogle Video Fullscreen
            if((event.target as HTMLButtonElement).classList.contains("fullscreen")) {
                const toggle_fullscreen_icon:HTMLElement = (event.target as HTMLButtonElement).querySelector("i") as HTMLElement // Gets The Toggle Fullscreen Icon
                const video_container:HTMLDivElement = (event.target as HTMLButtonElement).closest(".video_container") as HTMLDivElement // Gets The Video Container

                toogleVideoFullscreen(toggle_fullscreen_icon, video_container) // Plays Or Pauses The Video
            }

            return
        })

        // Feed Mouse Over Functionality
        feed.addEventListener("mouseover", function(event:MouseEvent):void {
            // Save Icon
            if((event.target as HTMLElement).classList.contains("fa-bookmark") && !(event.target as HTMLElement).classList.contains("active")) {
                const save_icon:HTMLElement = event.target as HTMLElement // Gets The Save Icon

                save_icon.classList.replace("fa-regular", "fa-solid")
            }
        })

        // Feed Mouse Out Functionality
        feed.addEventListener("mouseout", function(event:MouseEvent):void {
            // Save Icon
            if((event.target as HTMLElement).classList.contains("fa-bookmark") && !(event.target as HTMLElement).classList.contains("active")) {
                const save_icon:HTMLElement = event.target as HTMLElement // Gets The Save Icon

                save_icon.classList.replace("fa-solid", "fa-regular")
            }
        })

        // Feed Key Functionalities
        feed.addEventListener("keydown", function(event:KeyboardEvent):void {
            const post_container:HTMLDivElement = (event.target as HTMLElement).closest(".post_container") as HTMLDivElement // Gets The Post Container
            const media_container:HTMLDivElement = post_container.querySelector(".media") as HTMLDivElement // Gets The Media Container
            const post_bars:HTMLDivElement = media_container.querySelector(".post_bars") as HTMLDivElement // Gets The Post Bars Container

            if(event.key === "ArrowLeft" || event.key === "ArrowRight") event.preventDefault() // Prevents Default Behaviour

            if(event.key === "ArrowLeft") {
                const post_index:number = Number(media_container.dataset["active_index"]) - 1 // Gets The Previous Post Index
                changePost(post_index, media_container, post_bars) // Changes The Post (Shows The Previous Post)
            }

            else if(event.key === "ArrowRight") {
                const post_index:number = Number(media_container.dataset["active_index"]) + 1 // Gets The Next Post Index
                changePost(post_index, media_container, post_bars) // Changes The Post (Shows The Next Post)
            }
        })

        // Feed Input Functionalities
        feed.addEventListener("input", function(event:Event):void {
            // Change Video Volume
            if((event.target as HTMLDivElement).classList.contains("volume")) {
                const volume_input:HTMLInputElement = event.target as HTMLInputElement // Gets The Volume Input
                const volume_icon:HTMLElement = (volume_input.closest(".volume_container") as HTMLDivElement).querySelector(".mute_unmute") as HTMLElement // Gets the Volume Icon
                const video:HTMLVideoElement = (volume_input.closest(".video_container") as HTMLDivElement).querySelector(".video") as HTMLVideoElement // Gets The Video

                changeVideoVolume(volume_input, volume_icon, video) // Changes The Video Volume
            }
        })

        // All Post Containers Functionalities
        all_post_containers.forEach(function(one_post_container:HTMLDivElement):void {
            // Description
            const description:HTMLParagraphElement|null = one_post_container.querySelector(".description") as HTMLParagraphElement || null // Gets The Description

            if(description) {
                const tagged_users:string|null = description.dataset["tagged_users"] || null // Gets The Tagged Users Data
                const added_hashtags:string|null = description.dataset["added_hashtags"] || null // Gets The Added Hashtags
            
                if(tagged_users || added_hashtags) description.innerHTML = generateStyledDescription(description.textContent, tagged_users, added_hashtags) // Generates The Styled Description
            }

            // Bars
            const media_container:HTMLDivElement = one_post_container.querySelector(".media") as HTMLDivElement // Gets The Media Container
            const all_media:NodeListOf<HTMLDivElement> = media_container.querySelectorAll<HTMLDivElement>(".one_post") // Gets All Media From The Posts
            const post_bars:HTMLDivElement = one_post_container.querySelector(".post_bars") as HTMLDivElement // Gets The Post Bars Container
            
            generatePostBars(all_media, post_bars) // Generates The Post Bars
        })

        // All Processing Post Containers Functionalities
        const all_processing_post_containers:NodeListOf<HTMLDivElement> = feed.querySelectorAll<HTMLDivElement>(".processing_post_container") // Gets All Processing Post Containers
        let processing_posts:compressTask[] = JSON.parse(localStorage.getItem("processing_posts") || "[]") // Gets The Processing Posts From The Local Storage
        const processing_posts_media_ids:number[] = processing_posts.map((one_task:compressTask) => one_task.post_media_id) // Gets All Current Media IDs From The Local Storage
        
        all_processing_post_containers.forEach(function(one_post_container:HTMLDivElement):void {
            // Description
            const description:HTMLParagraphElement|null = one_post_container.querySelector(".description") as HTMLParagraphElement || null // Gets The Description

            if(description) {
                const tagged_users:string|null = description.dataset["tagged_users"] || null // Gets The Tagged Users Data
                const added_hashtags:string|null = description.dataset["added_hashtags"] || null // Gets The Added Hashtags
            
                if(tagged_users || added_hashtags) description.innerHTML = generateStyledDescription(description.textContent, tagged_users, added_hashtags) // Generates The Styled Description
            }

            // Bars
            const media_container:HTMLDivElement = one_post_container.querySelector(".media") as HTMLDivElement // Gets The Media Container
            const all_media:NodeListOf<HTMLDivElement> = media_container.querySelectorAll<HTMLDivElement>(".one_post") // Gets All Media From The Posts
            const post_bars:HTMLDivElement = one_post_container.querySelector(".post_bars") as HTMLDivElement // Gets The Post Bars Container
            
            generatePostBars(all_media, post_bars) // Generates The Post Bars

            // Upload Progress Generation
            const processing_post_report:HTMLParagraphElement = one_post_container.querySelector(".processing_post_report") as HTMLParagraphElement // Gets The Processing Post Report
            const post_id:number|undefined = Number(one_post_container.dataset["post_id"]) // Gets The Post ID Of The Post Container

            processing_posts.forEach(function(one_task:compressTask) {
                const one_post:HTMLDivElement|undefined = [...all_media].find(function(one_post:HTMLDivElement) {
                    return one_post.dataset["post_media_id"] === String(one_task.post_media_id)
                })

                if(one_post) {
                    const upload_progress:HTMLDivElement = one_post.querySelector(".upload_progress") as HTMLDivElement // Gets The Upload Progress Container
                    getUploadProgress(one_task.task_id, one_task.post_id, upload_progress, processing_post_report) // Gets The Upload Progress
                }
            })

            const all_processing_posts_media:NodeListOf<HTMLDivElement> = media_container.querySelectorAll<HTMLDivElement>(".one_post") // Gets All Media From The Posts

            all_processing_posts_media.forEach(function(one_post:HTMLDivElement):void {
                const media_id:string|undefined = one_post.dataset["post_media_id"] // Gets The Media ID From The Dataset

                // Shows The Completed Upload Progress For Already Completed Media In The Post
                if(media_id && !processing_posts_media_ids.includes(Number(media_id))) {
                    const upload_progress:HTMLDivElement = one_post.querySelector(".upload_progress") as HTMLDivElement // Gets The Upload Progress Container
                    setCompletedUploadProgress(upload_progress) // Sets The State For The Completed Upload Progress
                }
            })

            if(post_id) checkProcessingPosts(post_id, processing_post_report) // Checks If There Is Any Other Media From Selected Post In The Processing Posts
        })

        // All Videos Functionalities
        all_videos.forEach(function(one_video:HTMLVideoElement):void {
            // Video Time Update Functionality
            one_video.addEventListener("timeupdate", function():void {
                const video_container:HTMLDivElement = this.closest(".video_container") as HTMLDivElement // Gets The Video Container
                const elapsed_timer:HTMLParagraphElement = video_container.querySelector(".controls .buttons .timer .elapsed") as HTMLParagraphElement // Gets The Elapsed Timer
                const scrubber:HTMLDivElement = video_container.querySelector(".controls .scrubber") as HTMLDivElement // Gets The Scrubber
                
                updateVideoTimer(this.currentTime, elapsed_timer, scrubber) // Updates The Video Timer
            })
        })
    }
})