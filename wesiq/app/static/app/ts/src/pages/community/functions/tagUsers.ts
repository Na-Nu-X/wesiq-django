import { 
    getCursorPosition, 
    focusAtEnd 
} from "../community.js"

import { tag_user_state } from "../state.js"
import { sendPOST } from "../../../services/sendPOST.js"
import { highlightHashtagsInText } from "./addHashtags.js"

import type { tag } from "../state.js"

interface taggedUser {
    id:number,
    first_name:string,
    last_name:string,
    username:string,
    profile_picture_name:string
}

interface searchedTagsResponse {
    success:boolean,
    users:taggedUser[]
}

// Function For Get Users For Tag
export async function getUsersForTag(description:HTMLDivElement, users_for_tag_container:HTMLDivElement) {
    const text:string = description.innerText // Gets The Text
    const cursor_position:number = getCursorPosition(description) // Gets The Cursor Position
    const tag_start_index:number = getTagStartIndex(text, cursor_position) // Gets The Tag Start Index

    if(tag_start_index === -1) return

    tag_user_state.tagged_user = "" // Deletes Tagged User Value

    // Reads Characters After At Sign
    for(let i:number = tag_start_index + 1; i < cursor_position; i++) {
        // Adds Characters To Tag Until Hitting Space
        if(!tag_user_state.tagged_user.includes(" ")) tag_user_state.tagged_user += text[i]
        else tag_user_state.tagged_user = "" // Resets Tagged User Value
    }

    // Sends The POST Only If The User Is Currently Tagging Someone
    if(tag_user_state.tagged_user) {
        try {
            const searched_tags_response:searchedTagsResponse = await sendPOST(window.location.pathname, tag_user_state.tagged_user.toLowerCase(), "tag-user") // Sends The Data With POST

            if(searched_tags_response.success) {
                // Checks If Searched Tag Exists
                if(isExistingTag(users_for_tag_container, tag_user_state.tagged_user)) {
                    tagUser(users_for_tag_container, tag_user_state.tagged_user, description) // Tags The User
                }

                users_for_tag_container.innerHTML = "" // Deletes All Previous Data From The Container
                
                // Checks If There Were Any Tags Found And User Didn't Ended Typing The Tag
                if(searched_tags_response.users.length > 0 && !tag_user_state.tagged_user.includes(" ")) {
                    searched_tags_response.users.forEach(one_user_data => renderUsersForTag(one_user_data, users_for_tag_container)) // Renders Each User For Tag
                }

                else {
                    hideUsersForTag(users_for_tag_container) // Hides Users For Tag Container

                    if(tag_user_state.tagged_user.includes(" ")) {
                        const nearest_space_index:number = text.indexOf(" ", tag_start_index + 1) // Gets The Index Of The Nearest Space

                        const at:tag = {
                            position: {
                                tag_start_index,
                                tag_end_index: nearest_space_index - 1
                            }
                        }

                        storeAtSignPosition(at) // Stores The At Sign Position
                    }
                }
            }
        }

        catch(error) {
            console.error(gettext("Pri hľadaní užívateľov došlo k chybe."), error)
        }
    }
}

// Function For Check Tags Positions
export function checkTagsPositions(description:HTMLDivElement, cursor_position:number, previous_description_length:number, tagged_users_container:HTMLDivElement, tagged_users_input:HTMLInputElement):void {
    // Checks If The User Isn't Editing At The End Of The Text
    if(cursor_position < description.innerText.length) {
        const description_length:number = description.innerText.length // Gets The Description Length
        const difference:number = Math.abs(previous_description_length - description_length) // Gets The Total Amount Of Added Or Removed Characters
        const tagged_users:tag[] = tag_user_state.tags.filter(one_tag => one_tag.tagged_user) // Gets Every Tagged User
        const tagged_users_after_edited_area:tag[] = tagged_users.filter(one_tag => one_tag.position.tag_start_index > cursor_position) // Gets Only Tagged Users After Edited Area (Behind The Position Of A Cursor)
        
        // Text Deletion (Removes The Collided Tag)
        if(previous_description_length > description_length) {
            // Gets The Collided Tag
            const collided_tag:tag|undefined = tagged_users.find(function(one_tag:tag):boolean {
                return isCursorInTag(cursor_position, one_tag.position.tag_start_index, one_tag.position.tag_end_index) // Checks If The Cursor Is In Any Tag
            })

            if(collided_tag?.tagged_user) removeCollidedTag(collided_tag.tagged_user, tagged_users_container, tagged_users_input) // Removes The Collided Tag If There Is Any
        }
        
        // Checks If There Are Any Tagged Users After The Edited Area (Updates Their Positions)
        if(tagged_users_after_edited_area.length > 0 && tagged_users_after_edited_area[0]) {
            const first_tagged_user_after_edit_area_index:number = tag_user_state.tags.indexOf(tagged_users_after_edited_area[0]) // Gets Index Of The First Tagged User After Edit Area
            
            // Text Writing
            if(previous_description_length < description_length) {
                updateTagsPositions(first_tagged_user_after_edit_area_index - 1, difference, "add") // Updates Position Of The Tags (Adds The Deleted Area Length)
            }

            // Text Deletion
            else if(previous_description_length > description_length) {
                updateTagsPositions(first_tagged_user_after_edit_area_index - 1, difference, "sub") // Updates Position Of The Tags (Subtracts The Deleted Area Length)
            }
        }
    }

    // Checks If The User Is Editing At The End Of The Text
    else {
        // If There Are Any Tags
        if(tag_user_state.tags.length > 0) {
            // Gets The Collided Tag
            const collided_tag:tag|undefined = tag_user_state.tags.find(function(one_tag:tag):boolean {
                return !!one_tag.tagged_user && isCursorInTag(cursor_position, one_tag.position.tag_start_index, one_tag.position.tag_end_index)
            })

            // If There Is Any Collided Tag
            if(collided_tag?.tagged_user) removeCollidedTag(collided_tag.tagged_user, tagged_users_container, tagged_users_input)
        }
    }
}

// Function For Tag The User
export function tagUser(users_for_tag_container:HTMLDivElement, tagged_user:string, description:HTMLDivElement):void {
    // Checks The Maximum Amount Of Tagged Users
    if(tag_user_state.tagged_users.length < tag_user_state.MAX_TAGGED_USERS) {
        // Prevents Tagging Multiple Times The Same User
        if(
            !tag_user_state.tagged_users.includes(`@${tagged_user.trim()}`) &&
            !tag_user_state.tagged_users.includes(tagged_user)
        ) {
            !tagged_user.includes("@") ? tag_user_state.tagged_users.push(`@${tagged_user.trim()}`) : tag_user_state.tagged_users.push(tagged_user) // Pushes Tagged Person Without Ending Space To The Array Of All Tagged Persons

            placeTagToText(description, tagged_user, users_for_tag_container); // Places The Tag

            const tagged_users_input:HTMLInputElement = (description.parentElement as HTMLDivElement).querySelector(".tagged_users") as HTMLInputElement // Gets The Tagged Users Hidden Input

            tagged_users_input.value = JSON.stringify(tag_user_state.tagged_users) // Stores Tagged Users To The Hidden Input

            const tagged_users_container:HTMLDivElement = ((tagged_users_input.parentElement as HTMLDivElement).parentElement as HTMLFormElement).querySelector(".tagged_users_container") as HTMLDivElement // Gets The Tagged Users Container

            renderTag(tagged_users_container) // Renders Tag
        }

        else {
            // User Is Already Tagged
            console.log("Tento užívateľ už je označený")
        }
    }
}

// Function For Store At Sign Position
export function storeAtSignPosition(data:tag):void {
    if(data.position.tag_start_index === tag_user_state.tags[tag_user_state.tags.length - 1]?.position.tag_start_index) {
        tag_user_state.tags.pop() // Removes Last Entry
    }

    tag_user_state.tags.push(data) // Pushes The Data Into The Tags
}

// Function For Remove Tag
export function removeTag(tag:HTMLDivElement, description:HTMLDivElement, tagged_users_input:HTMLInputElement):void {
    const tagged_user:string = (tag.querySelector("p") as HTMLParagraphElement).textContent // Gets The Tagged User
    const tagged_user_index:number = tag_user_state.tagged_users.indexOf(tagged_user) // Gets The Position Of Tagged User
    const text:string = description.innerText // Gets The Text

    tag.classList.add("hidden") // Hides The Tag

    removeUserFromTaggedUsers(tagged_user_index) // Removes The User From Tagged Users

    const matching_tag:tag|undefined = tag_user_state.tags.find(one_tag => one_tag.tagged_user === tagged_user) // Gets The Matching Tag From Tags

    if(matching_tag) {
        const text_with_deleted_tag:string = text.slice(0, matching_tag.position.tag_start_index) + text.slice(matching_tag.position.tag_end_index + 2) // Deletes The Tag From The Text, Also Removes The Space After It

        const styled_tags_in_text:NodeListOf<HTMLSpanElement> = description.querySelectorAll<HTMLSpanElement>(".tag") // Gets All Styled Tags From Text

        description.innerHTML = highlightTagsInText(highlightHashtagsInText(text_with_deleted_tag), styled_tags_in_text) // Sets The New Value

        const description_input:HTMLInputElement = description.nextElementSibling as HTMLInputElement // Gets The Description Hidden Input

        description_input.value = description.innerText // Sets The Description Input Value

        const deleted_tag_index:number = tag_user_state.tags.indexOf(matching_tag) // Gets The Index Of The Deleted Tag In The All Tags Array

        if(matching_tag.tagged_user) updateTagsPositions(deleted_tag_index, matching_tag.tagged_user.length + 1, "sub") // Updates Position Of The Tags (Subtracts The Deleted Tag Length)

        removeTagFromTags(deleted_tag_index) // Removes The Tag From Tags

        tagged_users_input.value = JSON.stringify(tag_user_state.tagged_users) // Stores Tagged Users To The Hidden Input
    }
}

// Function For Hide Users For Tag Container
export function hideUsersForTag(users_for_tag_container:HTMLDivElement):void {
    // Checks If The Container Is Active
    if(users_for_tag_container.classList.contains("active")) {
        users_for_tag_container.classList.remove("active"); // Hides The Container
        (users_for_tag_container.parentElement as HTMLDivElement).removeAttribute("style") // Removes Hardcoded Style (style="border-bottom: none; border-bottom-right-radius: 0px; border-bottom-left-radius: 0px;") From The Container
    }
}

// Function For Change Focused Focused User For Tag
export function changeFocusedUserForTag(index:number, users_for_tag_container:HTMLDivElement):void {
    const all_users_for_tag:NodeListOf<HTMLDivElement> = users_for_tag_container.querySelectorAll(".one_user") // Gets All Users For Tag

    tag_user_state.focused_user_for_tag_index = index // Updates Focused User For Tag Index

    if(index > all_users_for_tag.length - 1) tag_user_state.focused_user_for_tag_index = 0 // Sets Focused User For Tag Index To Minimum
    if(index < 0) tag_user_state.focused_user_for_tag_index = all_users_for_tag.length - 1; // Sets Focused User For Tag Index To Maximum

    (all_users_for_tag[tag_user_state.focused_user_for_tag_index] as HTMLDivElement).focus() // Focuses The User
}

// Function For Render Users For Tag
function renderUsersForTag(data:taggedUser, users_for_tag_container:HTMLDivElement) {
    let tagged_users_history:string[] = JSON.parse(localStorage.getItem("tagged_users_history") || "[]") as string[] // Gets The Tagged Users History From The Local Storage

    const one_user:HTMLDivElement = document.createElement("div") // Creates One User Container
    const profile_picture:HTMLImageElement = document.createElement("img") // Creates Profile Picture Image
    const username:HTMLParagraphElement = document.createElement("p") // Creates Username Paragraph

    one_user.classList.add("one_user") // Adds One User Class
    one_user.dataset["username"] = data.username // Stores User's Username
    one_user.title = gettext("Označiť") // Adds The Title
    one_user.tabIndex = -1 // Makes The Element Focusable

    profile_picture.classList.add("profile_picture") // Adds Profile Picture Class
    data.profile_picture_name ? profile_picture.src = `/../media/images/${data.id}/${data.profile_picture_name}` : profile_picture.src = "/../static/images/profile_picture.png" // Sets Profile Picture Name
    one_user.appendChild(profile_picture) // Appends The Profile Picture To The One User Container

    username.classList.add("username") // Adds Username Class
    username.textContent = data.username // Sets The Username
    one_user.appendChild(username) // Appends The Username To The One User Container

    // If The User Is Already In The History
    if(tagged_users_history.includes(data.username)) {
        users_for_tag_container.prepend(one_user) // Prepends One User To The All Users Container

        const delete_from_history:HTMLElement = document.createElement("i") // Creates The Delete From History Icon

        delete_from_history.classList.add("delete_from_history", "fa-solid", "fa-clock-rotate-left") // https://fontawesome.com/icons/clock-rotate-left
        one_user.appendChild(delete_from_history) // Appends The Delete From History Icon
    }

    else {
        users_for_tag_container.appendChild(one_user) // Appends One User To The All Users Container
    }

    if(!tag_user_state.tagged_users.includes(`@${tag_user_state.tagged_user}`)) showUsersForTag(users_for_tag_container) // Shows Users For Tag Container
}

// Function For Check If The Tag Exists
function isExistingTag(users_for_tag_container:HTMLDivElement, tagged_user:string):boolean {
    const current_users_for_tag:NodeListOf<HTMLDivElement> = users_for_tag_container.querySelectorAll<HTMLDivElement>(".one_user"); // Gets All Current Users For Tag From The Container

    // Checks If Tagged User Exists And Is Available In Current Users For Tag
    return [...current_users_for_tag].some(function(one_user:HTMLDivElement):boolean {
        return (
            one_user.dataset["username"] === `@${tagged_user.trim()}` ||
            one_user.dataset["username"] === tagged_user
        )
    })
}

// Function For Highlight Tags In Text (Format Them With Styled Span Elements)
export function highlightTagsInText(text:string, styled_tags_in_text:NodeListOf<HTMLSpanElement>):string {
    let tags_in_text:string[] = [] // Stores Tags In Text
    let text_with_formatted_tags = text // Stores Text With Formatted Tags

    styled_tags_in_text.forEach(one_span => tags_in_text.push(one_span.textContent)) // Gets Only Text From Span Elements
    tags_in_text.forEach(one_tag => text_with_formatted_tags = text_with_formatted_tags.replace(one_tag, `<span class="tag" contenteditable="false">${one_tag}</span>`)) // Puts Every Tag To The Styled Span Element

    return text_with_formatted_tags // Returns Text With Formatted Tags
}

// Function For Place The Tag To The Text
function placeTagToText(description:HTMLDivElement, tagged_user:string, users_for_tag_container:HTMLDivElement):void {
    if(!tagged_user.includes("@")) tagged_user = `@${tagged_user.trim()}`

    const text:string = description.innerText // Gets The Text
    const cursor_position:number = getCursorPosition(description) // Gets The Cursor Position
    const tag_start_index:number = getTagStartIndex(text, cursor_position) // Gets The Tag Start Index

    if(tag_start_index === -1) return

    const entered_tag_end_index:number = Math.max(cursor_position - 1, tag_start_index) // Gets The End Index Of The Entered Tag Until Cursor Position
    const tagged_user_length:number = tagged_user.length // Gets The Length Of The Tagged User

    const text_without_unfinished_tag:string = text.slice(0, tag_start_index) + text.slice(entered_tag_end_index + 1) // Deletes Unfinished Tag From The Text (For Example: Hello @us -> Hello )
    const text_with_finished_tag:string = text_without_unfinished_tag.slice(0, tag_start_index) + `<span class="tag" contenteditable="false">${tagged_user}</span>&nbsp;` + text_without_unfinished_tag.slice(tag_start_index + 1) // Sets Finished Tag To The Text (For Example: Hello  -> Hello @user)
    
    const styled_tags_in_text:NodeListOf<HTMLSpanElement> = description.querySelectorAll<HTMLSpanElement>(".tag") // Gets All Styled Tags From Text
    
    description.innerHTML = highlightTagsInText(highlightHashtagsInText(text_with_finished_tag), styled_tags_in_text) // Sets The New Value

    const description_input:HTMLInputElement = description.nextElementSibling as HTMLInputElement // Gets The Description Hidden Input

    description_input.value = description.innerText // Sets The Description Input Value

    focusAtEnd(description) // Adds Focus Into The Input
    hideUsersForTag(users_for_tag_container) // Hides Users For Tag Container
    storeTaggedUserToHistory(tagged_user) // Stores The Tagged User To The History

    // Stores The Tag With All Information
    const tag_end_index:number = tag_start_index + tagged_user_length - 1 // Gets The Tag End Index

    const tag:tag = {
        tagged_user: tagged_user,

        position: {
            tag_start_index,
            tag_end_index
        }
    }

    storeAtSignPosition(tag) // Stores The Tag Position
}

// Function For Render Tagged User On The Page
function renderTag(tagged_users_container:HTMLDivElement):void {
    const latest_tag:string|null = tag_user_state.tagged_users[tag_user_state.tagged_users.length - 1] || null // Gets The Latest Tag

    if(latest_tag) {
        const tag:HTMLDivElement = document.createElement("div") // Creates The Tag
        const paragraph:HTMLParagraphElement = document.createElement("p") // Creates The Paragraph
        
        tag.classList.add("tag") // Adds The Tag Class

        paragraph.textContent = latest_tag // Sets The Text In The Paragraph
        tag.appendChild(paragraph) // Appends The Paragrapg To The Tag

        tag.innerHTML += `<i class="fa-solid fa-xmark" title="${gettext('Odstrániť zmienku')}"></i>` // https://fontawesome.com/icons/xmark

        tagged_users_container.appendChild(tag) // Appends The Tag To The Container
    }
}

// Function For Get The Start Index Of The Last Tag
function getTagStartIndex(text:string, cursor_position:number):number {
    const search_position:number = Math.max(cursor_position - 1, 0) // Gets The Search Position (Tag End Index)
    const tag_start_index:number = text.lastIndexOf("@", search_position) // Gets The Latest At Sign Before Cursor

    return tag_start_index
}

// Function To Check If The Cursor Is In The Tag
function isCursorInTag(cursor_position:number, tag_start_index:number, tag_end_index:number):boolean {
    return cursor_position >= tag_start_index && cursor_position <= tag_end_index
}

// Function For Update Tags Positions
function updateTagsPositions(start_from:number, step:number, operation:"add"|"sub"):void {
    tag_user_state.tags.forEach(function(one_tag:tag, index:number) {
        if(index > start_from) {
            // Adds Positions
            if(operation === "add") {
                one_tag.position.tag_start_index += step // Increases Tag Start Index
                one_tag.position.tag_end_index += step // Increases Tag End Index
            }

            // Subtracts Positions
            else if(operation === "sub") {
                one_tag.position.tag_start_index -= step // Decreases Tag Start Index
                one_tag.position.tag_end_index -= step // Decreases Tag End Index
            }
        }
    })
}

// Function For Remove A Collided Tag
function removeCollidedTag(collided_tag:string, tagged_users_container:HTMLDivElement, tagged_users_input:HTMLInputElement):void {
    const tags:NodeListOf<HTMLDivElement> = tagged_users_container.querySelectorAll<HTMLDivElement>(".tag")

    tags.forEach(function(one_tag:HTMLDivElement) {
        const one_tagged_person:string = (one_tag.querySelector("p") as HTMLParagraphElement).textContent

        if(one_tagged_person === collided_tag) one_tag.classList.add("hidden")
    })

    const tagged_user_index:number = tag_user_state.tagged_users.indexOf(collided_tag)
    removeUserFromTaggedUsers(tagged_user_index)

    const matching_tag:tag|undefined = tag_user_state.tags.find(one_tag => one_tag.tagged_user === collided_tag)
    const tag_index:number|undefined = matching_tag ? tag_user_state.tags.indexOf(matching_tag) : undefined
    removeTagFromTags(tag_index)

    tagged_users_input.value = JSON.stringify(tag_user_state.tagged_users) // Stores Tagged Users To The Hidden Input
}

// Function For Remove The User From Tagged Users
function removeUserFromTaggedUsers(index:number|undefined):void {
    if(index !== undefined && index !== -1) tag_user_state.tagged_users.splice(index, 1) // Removes Only One User From Tagged Users
}

// Function For Remove The Tag From Tags
function removeTagFromTags(index:number|undefined):void {
    if(index !== undefined && index !== -1) tag_user_state.tags.splice(index, 1) // Removes Only One Tag From Tags
}

// Function For Show Users For Tag Container
function showUsersForTag(container:HTMLDivElement):void {
    container.classList.add("active"); // Shows The Container
    (container.parentElement as HTMLDivElement).style.borderBottom = "none"; // Removes The Border
    (container.parentElement as HTMLDivElement).style.borderBottomRightRadius = "0px"; // Removes The Border
    (container.parentElement as HTMLDivElement).style.borderBottomLeftRadius = "0px" // Removes The Border
}

// Function For Store The Tagged User To The History
function storeTaggedUserToHistory(tagged_user:string):void {
    let tagged_users_history:string[] = JSON.parse(localStorage.getItem("tagged_users_history") || "[]") as string[] // Gets The Tagged Users History From The Local Storage

    if(!tagged_users_history.includes(tagged_user)) {
        tagged_users_history.unshift(tagged_user) // Updates The Tagged Users History
        localStorage.setItem("tagged_users_history", JSON.stringify(tagged_users_history)) // Saves Updated Tagged Users History To The Local Storage
    }

    console.log(tagged_users_history)
}

// Function For Delete The User From The History
export function deleteUserFromHistory(user:string):void {
    let tagged_users_history:string[] = JSON.parse(localStorage.getItem("tagged_users_history") || "[]") as string[] // Gets The Tagged Users History From The Local Storage

    tagged_users_history = tagged_users_history.filter(one_item => one_item !== user) // Removes The Clicked Item From The Tagged Users History
    localStorage.setItem("tagged_users_history", JSON.stringify(tagged_users_history)) // Saves Updated Tagged Users History To The Local Storage
}