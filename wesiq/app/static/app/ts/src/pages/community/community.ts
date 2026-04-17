import { 
    posts_preview_state,
    tag_user_state
} from "./state.js"

import { 
    follow,
    unfollow,
    renderUsers,
    resetSearchedUsers
} from "./functions/searchUsers.js"

import {
    getUsersForTag,
    checkTagsPositions,
    tagUser,
    storeAtSignPosition,
    removeTag,
    hideUsersForTag
} from "./functions/tagUsers.js"

import { sendPOST } from "../../services/sendPOST.js"
import { syncFiles } from "./functions/postPreview.js"
import { getLocation } from "./functions/location.js"
import { checkHashtags } from "./functions/addHashtags.js"

import type { searchedUsersResponse } from "./functions/searchUsers.js"
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

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Search Users

    // Variables

    const search_bar_container:HTMLDivElement = document.querySelector(".search_bar_container") as HTMLDivElement // Gets Search Bar Container
    const search_bar:HTMLInputElement = search_bar_container.querySelector(".search_bar") as HTMLInputElement // Gets The Search Bar Input
    const delete_search_bar:HTMLElement = search_bar_container.querySelector(".fa-xmark") as HTMLElement // Gets The Delete Search Bar Icon

    const all_users_container:HTMLDivElement = document.querySelector(".all_users") as HTMLDivElement // Gets The All Users Container

    let all_users:NodeListOf<HTMLAnchorElement> = all_users_container.querySelectorAll<HTMLAnchorElement>(".one_user") // Gets All Users
    const first_users:NodeListOf<HTMLAnchorElement> = all_users // Stores First Loaded Users

    const users_loading:HTMLDivElement = document.querySelector(".search_result_container .loading") as HTMLDivElement // Gets The Loading

    let previous_search_bar_length:number = 0 // Stores The Previous Search Bar Input Length

    // Global Event Delegations

    all_users_container.addEventListener("click", function(event:PointerEvent):void {
        if((event.target as HTMLElement).classList.contains("fa-user-plus")) follow(event) // Follow
        else if((event.target as HTMLElement).classList.contains("fa-user-minus")) unfollow(event) // Unfollow
    })

    // Events

    // Search Bar Input Functionalities
    search_bar.addEventListener("input", async function() {
        if(this.value.trim() !== "") {
            all_users.forEach(one_user => one_user.classList.remove("hidden")) // Shows All Hidden Users
            
            // Gets Users From The DB If The First Character Is Entered
            if(this.value.length === 1 && previous_search_bar_length !== 2) {
                users_loading.classList.remove("hidden") // Shows The Loader

                try {
                    const search_bar_response:searchedUsersResponse = await sendPOST(window.location.pathname, this.value, "search-users") // Sends The Data With POST

                    if(search_bar_response.success) {
                        all_users_container.innerHTML = "" // Deletes All Users Container
                        search_bar_response.users.forEach(one_user_data => renderUsers(one_user_data, search_bar_response.logged_in_user_id, all_users_container)) // Renders Users
                    }
                }

                catch(error) {
                    console.error(gettext("Pri hľadaní užívateľov došlo k chybe."), error)
                }
                
                finally {
                    users_loading.classList.add("hidden") // Hides The Loader
                }
            }

            // Filters Users From Already Obtained Users
            else {
                all_users = all_users_container.querySelectorAll<HTMLAnchorElement>(".one_user") // Gets All Users

                // Gets Unmatched Users
                const filtered_users:HTMLAnchorElement[] = [...all_users].filter(function(one_user:HTMLAnchorElement):boolean {
                    // Filters By Full Name And By Friend Code
                    return (
                        !(one_user.querySelector(".full_name") as HTMLParagraphElement).textContent.toLowerCase().includes(search_bar.value.toLowerCase()) && 
                        !(one_user.dataset["friend_code"]!.includes(search_bar.value))
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

    // Upload Post Form Dialog

    // Variables

    const upload_post_icon:HTMLElement = document.querySelector(".upload_post .fa-photo-film") as HTMLElement // Gets The Upload Post Icon
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
    const users_for_tag_container:HTMLDivElement = upload_post_form.querySelector(".users_for_tag_container") as HTMLDivElement // Gets The Users For Tag Container
    const tagged_users_container:HTMLDivElement = upload_post_form.querySelector(".tagged_users_container") as HTMLDivElement // Gets The Tagged Users Container
    const tagged_users:HTMLInputElement = upload_post_form.querySelector(".tagged_users") as HTMLInputElement // Gets The Hidden Input Of Tagged Users

    const MAX_DESCRIPTION_LENGTH:number = 500 // Sets The Max Description Length

    let previous_description_length:number = description.innerText.length // Stores The Length Of The Previous Written Description To Check Whether The Last Operation Was A Write Or An Erase

    const added_hashtags:HTMLInputElement = upload_post_form.querySelector(".added_hashtags") as HTMLInputElement // Gets The Hidden Input Of Added Hashtags

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
        }
    })

    // Searches For Users For Tag If There Is At Sign In The Description
    description.addEventListener("input", function():void {
        // Tag Users

        const cursor_position:number = getCursorPosition(this) ?? this.innerText.length // Gets The Cursor Position
        const nearest_at_before_cursor:number = this.innerText.lastIndexOf("@", Math.max(cursor_position - 1, 0)) // Gets The Nearest At Sign Before Cursor
        const text_between_at_and_cursor:string = nearest_at_before_cursor !== -1 ? this.innerText.slice(nearest_at_before_cursor + 1, cursor_position) : "" // Gets The Text Between The At Sign And The Cursor
        const is_typing_tag_at_cursor:boolean = nearest_at_before_cursor !== -1 && !text_between_at_and_cursor.includes(" ") // Checks If Is Typing Tag At The Cursor
        
        // Starts Getting Users For Tag Only If Cursor Is In Active Tag Area Or The User Already Starts Tagging
        if(is_typing_tag_at_cursor || tag_user_state.tagged_user) getUsersForTag(this, users_for_tag_container) // Gets Users For Tag
        else hideUsersForTag(users_for_tag_container) // Hides Users For Tag Container

        checkTagsPositions(this, getCursorPosition(this), previous_description_length, tagged_users_container, tagged_users) // Checks The Position Of Tags (If There Is Any)

        previous_description_length = this.innerText.length // Updates The Previous Description Length

        // Add Hashtags

        checkHashtags(this, added_hashtags)
    })

    // Tags User
    users_for_tag_container.addEventListener("click", function(event:PointerEvent):void {
        if((event.target as HTMLDivElement).classList.contains("one_user")) {
            const clicked_username:string|null = (event.target as HTMLDivElement).dataset["username"] || null // Gets The Clicked User ID

            if(clicked_username) {
                tagUser(users_for_tag_container, clicked_username, description) // Tags The User

                previous_description_length = description.innerText.length // Updates The Previous Description Length
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
        }
    })

    // Location

    // Variables

    const location:HTMLInputElement = upload_post_form.querySelector(".location_container .location_input_container .location") as HTMLInputElement // Gets The Location Input
    const latitude:HTMLInputElement = upload_post_form.querySelector(".location_container .location_input_container .latitude") as HTMLInputElement // Gets The Latitude Hidden Input
    const longitude:HTMLInputElement = upload_post_form.querySelector(".location_container .location_input_container .longitude") as HTMLInputElement // Gets The Longitude Hidden Input
    const location_results:HTMLDivElement = upload_post_form.querySelector(".location_container .location_results_container .location_results") as HTMLDivElement // Gets The Location Results
    const location_loading:HTMLDivElement = upload_post_form.querySelector(".location_container .location_results_container .loading") as HTMLDivElement // Gets The Location Loading

    let debounce_timeout:number // Debounce Timeout Between API Requests

    // Events

    // Location Input Functionality
    location.addEventListener("input", function():void {
        clearTimeout(debounce_timeout) // Clears The Debounce Timeout

        const searched_location = location.value // Gets The Searched Location

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
            getLocation(searched_location, location_results, location, latitude, longitude)
        }, 1000)
    })

    // Location Focus Functionality
    location.addEventListener("focus", function():void {
        if(location_results.querySelectorAll(".place").length > 0) location_results.classList.remove("hidden") // Shows The Location Results (If There Are Any)
    })

    // Location Blur Functionality
    location.addEventListener("blur", function(event:FocusEvent):void {
        if(!(event.relatedTarget as HTMLDivElement).classList.contains("place") && !(event.relatedTarget as HTMLDivElement).classList.contains("location_results")) location_results.classList.add("hidden") // Hides The Location Results And Prevents Hiding The Places Before Selection (If The User Clicks On The Place In The Location Results In Order To Select)
    })
})