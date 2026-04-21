import { 
    posts_preview_state,
    tag_user_state,
    location_state
} from "./state.js"

import { 
    renderUsers,
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
    changePost
} from "./functions/feed.js"

import { sendPOST } from "../../services/sendPOST.js"
import { syncFiles } from "./functions/postPreview.js"

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

// Function For Add Follow
function follow(event:PointerEvent, user_to_follow_id:number|null):void {
    event.preventDefault() // Prevents Redirect To The User's Profile

    if(user_to_follow_id) {
        sendPOST(`/follow/${user_to_follow_id}/`); // Sends Clicked User ID As A POST Data To Follow Page
        (event.target as HTMLElement).classList.replace("fa-user-plus", "fa-user-minus") // Shows The Unfollow Icon

        console.log((event.target as HTMLButtonElement).dataset["action"])

        const followers_counter:HTMLParagraphElement = ((event.target as HTMLElement).parentNode as HTMLDivElement).querySelector(".followers") as HTMLParagraphElement // Gets The Followers Counter

        followers_counter.textContent = String(parseInt(followers_counter.textContent) + 1) // Increases The Followers Counter
    }
}

// Function For Remove Follow
function unfollow(event:PointerEvent, user_to_follow_id:number|null):void {
    event.preventDefault() // Prevents Redirect To The User's Profile

    if(user_to_follow_id) {
        sendPOST(`/unfollow/${user_to_follow_id}/`); // Sends Clicked User ID As A POST Data To Unfollow Page
        (event.target as HTMLElement).classList.replace("fa-user-minus", "fa-user-plus") // Shows The Follow Icon

        const followers_counter:HTMLParagraphElement = ((event.target as HTMLElement).parentNode as HTMLDivElement).querySelector(".followers") as HTMLParagraphElement // Gets The Followers Counter

        followers_counter.textContent = String(parseInt(followers_counter.textContent) - 1) // Decreases The Followers Counter
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
                (clicked_user.querySelector(".delete_from_history") as HTMLDivElement).remove() // Removes The Delete From History Icon From The DOM
            }
        }
    })

    // Users For Tag Container Mouse Over Functionality
    users_for_tag_container.addEventListener("mouseover", function(event:MouseEvent):void {
        // Change Appearance Of Delete From History Icon (Shows The X Icon)
        if((event.target as HTMLElement).classList.contains("delete_from_history")) {
            const delete_from_history:HTMLElement = event.target as HTMLElement // Gets The Delete From History Icon

            delete_from_history.classList.replace("fa-clock-rotate-left", "fa-xmark") // Shows The X Icon
        }
    })

    // Users For Tag Container Mouse Out Functionality
    users_for_tag_container.addEventListener("mouseout", function(event:MouseEvent):void {
        // Change Appearance Of Delete From History Icon (Shows The Clock Icon)
        if((event.target as HTMLElement).classList.contains("delete_from_history")) {
            const delete_from_history:HTMLElement = event.target as HTMLElement // Gets The Delete From History Icon

            delete_from_history.classList.replace("fa-xmark", "fa-clock-rotate-left") // Shows The Clock Icon
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
    const location:HTMLInputElement = location_container.querySelector(".location_input_container .location") as HTMLInputElement // Gets The Location Input
    const latitude:HTMLInputElement = location_container.querySelector(".location_input_container .latitude") as HTMLInputElement // Gets The Latitude Hidden Input
    const longitude:HTMLInputElement = location_container.querySelector(".location_input_container .longitude") as HTMLInputElement // Gets The Longitude Hidden Input
    const location_results:HTMLDivElement = location_container.querySelector(".location_results_container .location_results") as HTMLDivElement // Gets The Location Results
    const location_loading:HTMLDivElement = location_container.querySelector(".location_results_container .loading") as HTMLDivElement // Gets The Location Loading

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

    // Feed

    // Variables

    const feed:HTMLDivElement = document.querySelector(".feed") as HTMLDivElement // Gets The Feed Container
    const all_post_containers:NodeListOf<HTMLDivElement> = feed.querySelectorAll<HTMLDivElement>(".post_container") // Gets All Post Containers

    // Events

    // All Post Containers Functionalities
    all_post_containers.forEach(function(one_post_container:HTMLDivElement):void {
        const media_container:HTMLDivElement = one_post_container.querySelector(".media") as HTMLDivElement // Gets The Media Container
        const all_media:NodeListOf<HTMLDivElement> = media_container.querySelectorAll<HTMLDivElement>(".one_post") // Gets All Media From The Posts
        const post_bars:HTMLDivElement = one_post_container.querySelector(".post_bars") as HTMLDivElement // Gets The Post Bars Container

        const description:HTMLParagraphElement = one_post_container.querySelector(".details_container .details .description") as HTMLParagraphElement // Gets The Description
        const tagged_users:string|null = description.dataset["tagged_users"] || null // Gets The Tagged Users Data
        const added_hashtags:string|null = description.dataset["added_hashtags"] || null // Gets The Added Hashtags
        const followers_container:HTMLDivElement = one_post_container.querySelector(".author .followers_container") as HTMLDivElement // Gets The Followers Container

        followers_container.addEventListener("click", function(event:PointerEvent):void {
            if((event.target as HTMLButtonElement).classList.contains("follow_button")) {
                const follow_button:HTMLButtonElement = event.target as HTMLButtonElement // Gets The Follow Button
                const clicked_user_id:number|null = Number((event.target as HTMLElement).dataset["id"]) || null // Gets Clicked User ID

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
        })

        description.innerHTML = generateStyledDescription(description.textContent, tagged_users, added_hashtags) // Generates The Styled Description
        generatePostBars(all_media, post_bars) // Generates The Post Bars

        // Post Bars Click Functionalities
        post_bars.addEventListener("click", function(event:PointerEvent):void {
            if((event.target as HTMLDivElement).classList.contains("bar")) {
                const bar:HTMLDivElement = event.target as HTMLDivElement // Gets The Bar
                const clicked_bar_index:number = [...post_bars.querySelectorAll<HTMLDivElement>(".bar")].indexOf(bar) // Gets The Clicked Bar Index

                changePost(clicked_bar_index, post_bars, bar, all_media) // Changes The Post
            }
        })

        // Post Change Buttons (Previous / Next) Click Functionalities
        all_media.forEach(function(one_post:HTMLDivElement):void {
            const previous:HTMLDivElement = one_post.querySelector(".previous") as HTMLDivElement // Gets The Previous Button
            const next:HTMLDivElement = one_post.querySelector(".next") as HTMLDivElement // Gets The Next Button

            // Previous Post
            if(!previous.classList.contains("hidden")) {
                previous.addEventListener("click", function():void {
                    const post_index:number = [...all_media].indexOf(one_post) - 1 // Gets The Previous Post Index
                    const all_bars:NodeListOf<HTMLDivElement> = post_bars.querySelectorAll<HTMLDivElement>(".bar") // Gets All Bars
                    const bar:HTMLDivElement = all_bars[post_index] as HTMLDivElement // Gets The Bar
                    
                    changePost(post_index, post_bars, bar, all_media) // Changes The Post
                })
            }

            // Next Post
            if(!next.classList.contains("hidden")) {
                next.addEventListener("click", function():void {
                    const post_index:number = [...all_media].indexOf(one_post) + 1 // Gets The Next Post Index
                    const all_bars:NodeListOf<HTMLDivElement> = post_bars.querySelectorAll<HTMLDivElement>(".bar") // Gets All Bars
                    const bar:HTMLDivElement = all_bars[post_index] as HTMLDivElement // Gets The Bar
                    
                    changePost(post_index, post_bars, bar, all_media) // Changes The Post
                })
            }
        })
    })
})