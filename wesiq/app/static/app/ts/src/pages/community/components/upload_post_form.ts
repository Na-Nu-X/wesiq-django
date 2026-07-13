import { 
    posts_preview_state,
    tag_user_state,
    location_state
} from "../state.js"

import { 
    getCursorPosition,
    focusAtEnd 
} from "../functions/customTextarea.js"

import {
    getUsersForTag,
    checkTagsPositions,
    tagUser,
    storeAtSignPosition,
    removeTag,
    hideUsersForTag,
    changeFocusedUserForTag,
    deleteUserFromHistory
} from "../functions/tagUsers.js"

import { 
    checkHashtags,
    checkHashtagsPositions
} from "../functions/addHashtags.js"

import { 
    getLocation,
    changeFocusedPlace
} from "../functions/location.js"

import {
    handleDescriptionPaste,
    pruneDescriptionMetadata,
    syncDescriptionFromText
} from "../functions/syncDescription.js"

import { syncFiles } from "../functions/postPreview.js"
import { uploadPost } from "../functions/uploadPost.js"

import type { tag } from "../state.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Upload Post Form

    // Variables

    const upload_post_button:HTMLElement = document.querySelector(".upload_post") as HTMLButtonElement // Gets The Upload Post Button
    const upload_post_form_dialog:HTMLDialogElement = document.querySelector(".upload_post_form_dialog") as HTMLDialogElement // Gets The Upload Post Form Dialog
    const upload_post_form:HTMLFormElement = upload_post_form_dialog.querySelector(".upload_post_form") as HTMLFormElement // Gets The Upload Post Form

    const select_posts:HTMLInputElement = upload_post_form.querySelector("#select_posts") as HTMLInputElement // Gets The Select Posts Input
    const posts_preview:HTMLDivElement = upload_post_form.querySelector(".posts_preview") as HTMLDivElement // Gets The Posts Preview
    const select_posts_container:HTMLDivElement = upload_post_form.querySelector(".select_posts_container") as HTMLDivElement // Gets The Select Posts Container

    const post_info_container:HTMLDivElement = upload_post_form.querySelector(".post_info_container") as HTMLDivElement // Gets The Post Info Container

    const public_visibility:HTMLButtonElement|null = post_info_container.querySelector(".icons .settings label .public_visibility") as HTMLButtonElement || null // Gets The Public Visibility Icon
    const allow_comments:HTMLButtonElement = post_info_container.querySelector(".icons .settings label .allow_comments") as HTMLButtonElement // Gets The Allow Comments Icon
    const hide_likes:HTMLButtonElement = post_info_container.querySelector(".icons .settings label .hide_likes") as HTMLButtonElement // Gets The Hide Likes Icon

    const description:HTMLDivElement = upload_post_form.querySelector(".description") as HTMLDivElement // Gets The Description
    const add_emoji:HTMLButtonElement = post_info_container.querySelector(".icons .tags .add_emoji") as HTMLButtonElement // Gets The Add Emoji Icon
    const emoji_picker_container:HTMLDivElement = post_info_container.querySelector(".emoji_picker_container") as HTMLDivElement // Gets The Emoji Picker Container
    const picker:Element = emoji_picker_container.querySelector("emoji-picker") as Element // Gets The Emoji Picker

    const tag_user:HTMLButtonElement = post_info_container.querySelector(".icons .tags .tag_user") as HTMLButtonElement // Gets The Tag User Icon
    const description_input:HTMLInputElement = upload_post_form.querySelector(".description_input") as HTMLInputElement // Gets The Description Hidden Input
    const users_for_tag_container:HTMLDivElement = upload_post_form.querySelector(".users_for_tag_container") as HTMLDivElement // Gets The Users For Tag Container
    const tagged_users_container:HTMLDivElement = upload_post_form.querySelector(".tagged_users_container") as HTMLDivElement // Gets The Tagged Users Container
    const tagged_users:HTMLInputElement = upload_post_form.querySelector(".tagged_users") as HTMLInputElement // Gets The Hidden Input Of Tagged Users

    const MAX_DESCRIPTION_LENGTH:number = 500 // Defines The Maximum Description Length

    let previous_description_length:number = description.innerText.length // Stores The Length Of The Previous Written Description To Check Whether The Last Operation Was A Write Or An Erase
    let is_syncing_description_paste:boolean = false // Prevents Input Handler From Running During Paste Sync

    const added_hashtags_input:HTMLInputElement = upload_post_form.querySelector(".added_hashtags") as HTMLInputElement // Gets The Hidden Input Of Added Hashtags

    const add_hashtag:HTMLButtonElement = post_info_container.querySelector(".icons .tags .add_hashtag") as HTMLButtonElement // Gets The Add Hashtag Icon

    const location_container:HTMLDivElement = upload_post_form.querySelector(".location_container") as HTMLDivElement // Gets The Location Container
    const location_input:HTMLInputElement = location_container.querySelector(".location_input_container .location") as HTMLInputElement // Gets The Location Input
    const latitude:HTMLInputElement = location_container.querySelector(".location_input_container .latitude") as HTMLInputElement // Gets The Latitude Hidden Input
    const longitude:HTMLInputElement = location_container.querySelector(".location_input_container .longitude") as HTMLInputElement // Gets The Longitude Hidden Input
    const location_results:HTMLDivElement = location_container.querySelector(".location_results_container .location_results") as HTMLDivElement // Gets The Location Results
    const location_loading:HTMLDivElement = location_container.querySelector(".location_results_container .loading") as HTMLDivElement // Gets The Location Loading

    let debounce_timeout:number // Debounce Timeout Between API Requests

    // Events

    // Upload Post Form Click Functionality
    upload_post_button.addEventListener("click", () => upload_post_form_dialog.showModal()) // Shows The Upload Post Form Dialog

    // Upload Post Form Dialog Click Functionality
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

    // Upload Post Form Submit Functionality
    upload_post_form.addEventListener("submit", async function(event:SubmitEvent):Promise<void> {
        event.preventDefault() // Prevents Default Behaviour

        const upload_post_form_submit:HTMLInputElement = upload_post_form.querySelector(".upload_post_form_submit") as HTMLInputElement // Gets The Upload Post Form Submit Button
        const form_data:FormData = new FormData(event.target as HTMLFormElement) // Gets The Form Data

        const posts_preview:HTMLDivElement = this.querySelector(".posts_preview") as HTMLDivElement // Gets The Post Preview Container
        const all_posts:NodeListOf<HTMLDivElement> = posts_preview.querySelectorAll<HTMLDivElement>(".post") // Gets All Posts From The Post Preview

        const form_report:HTMLParagraphElement = upload_post_form.querySelector(".form_report") as HTMLParagraphElement // Gets The Form Report Paragraph

        // Stores The Data Of Every Media
        const media_data:{
            filename:string,
            order:string,
            is_muted:boolean,
            thumbnail_filename:string
        }[] = []

        // Maps The Posts And Saves Their Order And Is Muted Value
        all_posts.forEach(function(one_post:HTMLDivElement):void {
            media_data.push({
                filename: one_post.dataset["filename"] || "",
                order: one_post.dataset["order"] || "",
                is_muted: one_post.dataset["is_muted"] === "true" ? true : false || false,
                thumbnail_filename: one_post.dataset["thumbnail_filename"] || ""
            })
        })

        form_data.append("media_data", JSON.stringify(media_data)) // Appends The Media Order To The Form Data

        uploadPost(upload_post_form_submit, form_data, form_report) // Uploads The Post
    })

    // Select Posts Change Functionality
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

    add_emoji.addEventListener("mousedown", event => event.preventDefault()) // Prevents Default Behaviour
    // emoji_picker_container.addEventListener("mousedown", event => event.preventDefault()) // Prevents Default Behaviour

    // Add Emoji Icon Click Functionality
    add_emoji.addEventListener("click", function(event:PointerEvent):void {
        event.stopPropagation() // Prevents The Closing Of The Emoji Picker Container
        emoji_picker_container.classList.toggle("hidden") // Shows Or Hides The Emoji Picker Container
    })

    // Picker Emoji Click Functionality
    picker.addEventListener("emoji-click", function(event:Event):void {
        if(description.innerText.length >= MAX_DESCRIPTION_LENGTH) return

        const custom_event:CustomEvent<{
            unicode:string
        }> = event as CustomEvent<{ unicode: string }>
    
        const emoji:string = custom_event.detail.unicode // Gets The Clicked Emoji
        const selection:Selection|null = window.getSelection()
        const isInsideEditable:boolean|null = selection && selection.rangeCount > 0 && description.contains(selection.anchorNode)

        if(!isInsideEditable) focusAtEnd(description)

        const active_selection:Selection|null = window.getSelection()

        if(active_selection && active_selection.rangeCount > 0) {
            const range:Range = active_selection.getRangeAt(0)
        
            range.deleteContents() // Deletes The Selected Text

            // Inserts The Emoji To The Text
            const text_node:Text = document.createTextNode(emoji)
            range.insertNode(text_node)

            // Sets The Cursor Position Behind The Inserted Emoji
            range.setStartAfter(text_node)
            range.setEndAfter(text_node)
            
            // Updates The Cursor
            active_selection.removeAllRanges()
            active_selection.addRange(range)
        }
    })

    // Tag User Click Functionality
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

    // Paste Functionality (Syncs Tagged Users And Hashtags From Pasted Plain Text)
    description.addEventListener("paste", async function(event:ClipboardEvent):Promise<void> {
        is_syncing_description_paste = true

        await handleDescriptionPaste(
            event,
            description,
            description_input,
            tagged_users_container,
            tagged_users,
            added_hashtags_input,
            MAX_DESCRIPTION_LENGTH
        )

        previous_description_length = description.innerText.length

        requestAnimationFrame(function():void {
            is_syncing_description_paste = false
        })
    })

    // Searches For Users For Tag If There Is At Sign In The Description
    description.addEventListener("input", async function():Promise<void> {
        if(is_syncing_description_paste) return

        if(this.innerText.length > MAX_DESCRIPTION_LENGTH) {
            const cursor_position:number = getCursorPosition(this) ?? MAX_DESCRIPTION_LENGTH
            const truncated_text:string = this.innerText.slice(0, MAX_DESCRIPTION_LENGTH)

            is_syncing_description_paste = true

            await syncDescriptionFromText(
                this,
                description_input,
                tagged_users_container,
                tagged_users,
                added_hashtags_input,
                MAX_DESCRIPTION_LENGTH,
                Math.min(cursor_position, MAX_DESCRIPTION_LENGTH),
                truncated_text
            )

            previous_description_length = this.innerText.length

            requestAnimationFrame(function():void {
                is_syncing_description_paste = false
            })

            return
        }

        description_input.value = this.textContent.trim() // Sets The Description Input Value

        const cursor_position:number = getCursorPosition(this) ?? this.innerText.length // Gets The Cursor Position
        const is_text_deletion:boolean = previous_description_length > this.innerText.length // Checks If The Text Was Deleted

        // Text Deletion (Selection, Cut, Backspace, Etc.) — Syncs State With Actual Text Content
        if(is_text_deletion) {
            pruneDescriptionMetadata(
                this,
                description_input,
                tagged_users_container,
                tagged_users,
                added_hashtags_input,
                cursor_position
            )
        }

        else {
            // Tag Users

            const nearest_at_before_cursor:number = this.innerText.lastIndexOf("@", Math.max(cursor_position - 1, 0)) // Gets The Nearest At Sign Before Cursor
            const text_between_at_and_cursor:string = nearest_at_before_cursor !== -1 ? this.innerText.slice(nearest_at_before_cursor + 1, cursor_position) : "" // Gets The Text Between The At Sign And The Cursor
            const is_typing_tag_at_cursor:boolean = nearest_at_before_cursor !== -1 && !text_between_at_and_cursor.includes(" ") // Checks If Is Typing Tag At The Cursor

            // Starts Getting Users For Tag Only If Cursor Is In Active Tag Area Or The User Already Starts Tagging
            if(is_typing_tag_at_cursor || tag_user_state.tagged_user) getUsersForTag(this, users_for_tag_container) // Gets Users For Tag
            else hideUsersForTag(users_for_tag_container) // Hides Users For Tag Container

            checkTagsPositions(this, cursor_position, previous_description_length, tagged_users_container, tagged_users) // Checks The Position Of Tags (If There Is Any)

            // Add Hashtags

            checkHashtags(this, added_hashtags_input)
            checkHashtagsPositions(this, cursor_position, previous_description_length, added_hashtags_input) // Checks The Position Of Hashtags (If There Is Any)
        }

        previous_description_length = this.innerText.length // Updates The Previous Description Length
    })

    // Add Hashtag Click Functionality
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
        debounce_timeout = window.setTimeout(function():void {
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

    // Global Event Delegations

    // Select Posts Container Keydown Functionality
    select_posts_container.addEventListener("keydown", function(event:KeyboardEvent):void {
        if(event.key === "Enter") {
            select_posts.click() // Opens The Select Files Dialog
            upload_post_form_dialog.showModal() // Shows The Upload Post Form Dialog
        }
    })

    if(public_visibility) {
        // Public Visibility Click Functionality
        public_visibility.addEventListener("click", function(event:PointerEvent):void {
            const icon:HTMLElement = event.target as HTMLElement // Gets The Public Visibility Icon
    
            // Sets The Private Visibility
            if(icon.classList.contains("fa-eye")) {
                icon.classList.replace("fa-eye", "fa-eye-low-vision") // Changes The Icon
                this.title = gettext("Vypnúť viditeľnosť len pre sledovateľov")
                this.ariaLabel = gettext("Vypnúť viditeľnosť len pre sledovateľov")
            }
    
            // Sets The Public Visibility
            else if(icon.classList.contains("fa-eye-low-vision")) {
                icon.classList.replace("fa-eye-low-vision", "fa-eye") // Changes The Icon
                this.title = gettext("Zapnúť viditeľnosť len pre sledovateľov")
                this.ariaLabel = gettext("Zapnúť viditeľnosť len pre sledovateľov")
            }
        })

        // Public Visibility Keydown Functionality
        public_visibility.addEventListener("keydown", function(event:KeyboardEvent):void {
            if(event.key === "Enter") {
                const icon:HTMLElement = (event.target as HTMLButtonElement).querySelector("i") as HTMLElement // Gets The Public Visibility Icon
        
                // Sets The Private Visibility
                if(icon.classList.contains("fa-eye")) {
                    icon.classList.replace("fa-eye", "fa-eye-low-vision") // Changes The Icon
                    this.title = gettext("Vypnúť viditeľnosť len pre sledovateľov")
                    this.ariaLabel = gettext("Vypnúť viditeľnosť len pre sledovateľov")
                }
        
                // Sets The Public Visibility
                else if(icon.classList.contains("fa-eye-low-vision")) {
                    icon.classList.replace("fa-eye-low-vision", "fa-eye") // Changes The Icon
                    this.title = gettext("Zapnúť viditeľnosť len pre sledovateľov")
                    this.ariaLabel = gettext("Zapnúť viditeľnosť len pre sledovateľov")
                }
            }
        })
    }
    
    // Allow Comments Click Functionality
    allow_comments.addEventListener("click", function(event:PointerEvent):void {
        const icon:HTMLElement = event.target as HTMLElement // Gets The Allow Comments Icon

        // Disables The Comments
        if(icon.classList.contains("fa-comment")) {
            icon.classList.replace("fa-comment", "fa-comment-slash") // Changes The Icon
            this.title = gettext("Zapnúť komentáre")
            this.ariaLabel = gettext("Zapnúť komentáre")
        }
        
        // Enables The Comments
        else if(icon.classList.contains("fa-comment-slash")) {
            icon.classList.replace("fa-comment-slash", "fa-comment") // Changes The Icon
            this.title = gettext("Vypnúť komentáre")
            this.ariaLabel = gettext("Vypnúť komentáre")
        }
    })

    // Allow Comments Click Functionality
    allow_comments.addEventListener("keydown", function(event:KeyboardEvent):void {
        if(event.key === "Enter") {
            const icon:HTMLElement = (event.target as HTMLButtonElement).querySelector("i") as HTMLElement // Gets The Allow Comments Icon

            // Disables The Comments
            if(icon.classList.contains("fa-comment")) {
                icon.classList.replace("fa-comment", "fa-comment-slash") // Changes The Icon
                this.title = gettext("Zapnúť komentáre")
                this.ariaLabel = gettext("Zapnúť komentáre")
            }
            
            // Enables The Comments
            else if(icon.classList.contains("fa-comment-slash")) {
                icon.classList.replace("fa-comment-slash", "fa-comment") // Changes The Icon
                this.title = gettext("Vypnúť komentáre")
                this.ariaLabel = gettext("Vypnúť komentáre")
            }
        }
    })

    // Hide Likes Click Functionality
    hide_likes.addEventListener("click", function(event:PointerEvent):void {
        const icon:HTMLElement = event.target as HTMLElement // Gets The Hide Likes Icon

        // Hides The Like Counter
        if(icon.classList.contains("fa-solid")) {
            icon.classList.replace("fa-solid", "fa-regular") // Changes The Icon
            this.title = gettext("Zobraziť počet označení páči sa mi to")
            this.ariaLabel = gettext("Zobraziť počet označení páči sa mi to")
        }

        // Shows The Like Counter
        else if(icon.classList.contains("fa-regular")) {
            icon.classList.replace("fa-regular", "fa-solid") // Changes The Icon
            this.title = gettext("Skryť počet označení páči sa mi to")
            this.ariaLabel = gettext("Skryť počet označení páči sa mi to")
        }
    })

    // Allow Comments Click Functionality
    hide_likes.addEventListener("keydown", function(event:KeyboardEvent):void {
        if(event.key === "Enter") {
            const icon:HTMLElement = (event.target as HTMLButtonElement).querySelector("i") as HTMLElement // Gets The Hide Likes Icon
    
            // Hides The Like Counter
            if(icon.classList.contains("fa-solid")) {
                icon.classList.replace("fa-solid", "fa-regular") // Changes The Icon
                this.title = gettext("Zobraziť počet označení páči sa mi to")
                this.ariaLabel = gettext("Zobraziť počet označení páči sa mi to")
            }
    
            // Shows The Like Counter
            else if(icon.classList.contains("fa-regular")) {
                icon.classList.replace("fa-regular", "fa-solid") // Changes The Icon
                this.title = gettext("Skryť počet označení páči sa mi to")
                this.ariaLabel = gettext("Skryť počet označení páči sa mi to")
            }
        }
    })

    // Add Emoji Icon Keydown Functionality
    add_emoji.addEventListener("keydown", function(event:KeyboardEvent):void {
        if(event.key === "Enter") {
            emoji_picker_container.classList.toggle("hidden") // Shows Or Hides The Emoji Picker Container
        }
    })

    // Tag User Keydown Functionality
    tag_user.addEventListener("keydown", function(event:KeyboardEvent):void {
        if(event.key === "Enter") {
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
        }
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

    // Add Hashtag Keydown Functionality
    add_hashtag.addEventListener("keydown", function(event:KeyboardEvent):void {
        if(event.key === "Enter") {
            // Checks For The Maximum Input Length
            if(description.innerText.length < MAX_DESCRIPTION_LENGTH - 1) {
                const previous_character:string|null = description.innerText[description.innerText.length - 1] || null // Gets The Last Entered Character (Null If There Hasn't Been Any Yet)
        
                previous_character?.charCodeAt(0) === 160 || previous_character === " " || previous_character === null ? description.innerHTML += "#" : description.innerHTML += " #" // Adds Hashtag Sign At The End With Additional Spacing (If There Isn't Already)

                hideUsersForTag(users_for_tag_container) // Hides Users For Tag Container
                focusAtEnd(description) // Adds Focus To The Description

                description_input.value = description.textContent.trim() // Sets The Description Input Value
            }
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
})