import { 
    getCursorPosition, 
    focusAtEnd 
} from "../functions/customTextarea.js"

import { add_hashtag_state } from "../state.js"
import { highlightTagsInText } from "./tagUsers.js"

import type { hashtag } from "../state.js"

// Function For Check Hashtags
export function checkHashtags(description:HTMLDivElement, added_hashtags_input:HTMLInputElement):void {
    const text:string = description.innerText // Gets The Text
    const cursor_position:number = getCursorPosition(description) // Gets The Cursor Position
    const hashtag_start_index:number = getHashtagStartIndex(text, cursor_position) // Gets The Hashtag Start Index

    if(hashtag_start_index === -1) return

    // If The Spacebar Was Pressed
    if(text[cursor_position - 1]?.charCodeAt(0) === 160) {
        const cleaned_added_hashtag:string = `#${add_hashtag_state.added_hashtag}` // Cleans The Added Hashtag (For Example From workout -> #workout)
        
        // Checks Validity Of Entered Hashtag
        if(isValidHashtag(cleaned_added_hashtag) && ![...add_hashtag_state.added_hashtag].some(one_character => one_character.charCodeAt(0) === 160)) {
            addHashtag(cleaned_added_hashtag, description, added_hashtags_input) // Adds The Hashtag
        }

        add_hashtag_state.added_hashtag = "" // Deletes Added Hashtag Value
    }

    // If The User Is Currently Typing A Hashtag
    else {
        add_hashtag_state.added_hashtag = "" // Deletes Added Hashtag Value

        // Reads Characters After Hash Sign
        for(let i:number = hashtag_start_index + 1; i < cursor_position; i++) {
            add_hashtag_state.added_hashtag += text[i]
        }
    }
}

// Function To Check If The Cursor Is In The Hashtag
function isCursorInHashtag(cursor_position:number, hashtag_start_index:number, hashtag_end_index:number):boolean {
    return cursor_position >= hashtag_start_index && cursor_position <= hashtag_end_index
}

// Function For Update A Collided Hashtag
function updateCollidedHashtag(collided_hashtag:string, added_hashtags_input:HTMLInputElement, description:HTMLDivElement, cursor_position:number):void {
    const matching_hashtag:hashtag|undefined = add_hashtag_state.hashtags.find(one_hashtag => one_hashtag.added_hashtag === collided_hashtag) // Gets The Matching Hashtag From Hashtags

    if(matching_hashtag && matching_hashtag.added_hashtag) {
        const matching_hashtag_index:number = add_hashtag_state.hashtags.indexOf(matching_hashtag) // Gets Matching Hashtag Index From Array Of Hashtags
        const added_hashtag_index:number = add_hashtag_state.added_hashtags.indexOf(matching_hashtag.added_hashtag)  // Gets The Added Hashtag Index
        const cropped_length:number = matching_hashtag.position.hashtag_end_index - cursor_position + 1 // Gets The Cropped Length Of Collided Hashtag
        const new_hashtag:string = collided_hashtag.slice(0, -cropped_length) // Gets The New Hashtag Value
        
        if(add_hashtag_state.hashtags[matching_hashtag_index] && add_hashtag_state.hashtags[matching_hashtag_index].added_hashtag) {
            // Delete Hashtag
            if(add_hashtag_state.hashtags[matching_hashtag_index].added_hashtag.length === 2 || isExistingHashtagInHashtags(new_hashtag) === true) {
                removeHashtagFromHashtags(matching_hashtag_index)
                removeAddedHashtagFromAddedHashtags(added_hashtag_index)
                added_hashtags_input.value = JSON.stringify(add_hashtag_state.added_hashtags) // Stores Added Hashtags To The Hidden Input

                const styled_hashtags_in_text:NodeListOf<HTMLSpanElement> = description.querySelectorAll<HTMLSpanElement>(".hashtag") // Gets All Styled Hashtags From Text

                styled_hashtags_in_text.forEach(function(one_hashtag:HTMLSpanElement) {
                    if(one_hashtag.textContent === new_hashtag) {
                        const text:string = description.innerText // Gets The Text
                        const styled_tags_in_text:NodeListOf<HTMLSpanElement> = description.querySelectorAll<HTMLSpanElement>(".tag") // Gets All Styled Tags From Text

                        description.innerHTML = highlightTagsInText(highlightHashtagsInText(text), styled_tags_in_text) // Sets The New Value

                        focusAtEnd(description) // Adds Focus Into The Input
                    }
                })

                const description_input:HTMLInputElement = description.nextElementSibling as HTMLInputElement // Gets The Description Hidden Input

                description_input.value = description.textContent.trim() // Sets The Description Input Value

                return
            }
            
            // Update Hashtag
            updateHashtagInHashtags(matching_hashtag_index, new_hashtag) // Updates The Hashtag In Hashtags
            add_hashtag_state.hashtags[matching_hashtag_index].position.hashtag_end_index -= cropped_length // Updates Hashtag End Position Of The Matching Hashtag
    
            updateAddedHashtagInAddedHashtags(added_hashtag_index, new_hashtag) // Updates The Added Hashtag In Added Hashtags
            added_hashtags_input.value = JSON.stringify(add_hashtag_state.added_hashtags) // Stores Added Hashtags To The Hidden Input
        }
    }
}

function isExistingHashtagInHashtags(hashtag:string):boolean {
    const matching_hashtag:boolean = add_hashtag_state.hashtags.some(function(one_hashtag:hashtag) {
        return one_hashtag.added_hashtag === hashtag
    })

    return matching_hashtag ? true : false
}

// Function For Remove The Added Hashtag From Added Hashtags
function removeAddedHashtagFromAddedHashtags(index:number|undefined):void {
    if(index !== undefined && index !== -1) add_hashtag_state.added_hashtags.splice(index, 1) // Removes Only One Hashtag From Added Hashtags
}

// Function For Update The Added Hashtag In Added Hashtags
function updateAddedHashtagInAddedHashtags(index:number|undefined, new_hashtag:string):void {
    if(index !== undefined && index !== -1) add_hashtag_state.added_hashtags[index] = new_hashtag // Updates Only One Hashtag From Added Hashtags
}

// Function For Remove The Hashtag From Hashtags
function removeHashtagFromHashtags(index:number|undefined):void {
    if(index !== undefined && index !== -1) add_hashtag_state.hashtags.splice(index, 1) // Removes Only One Hashtag From Hashtags
}

// Function For Update The Hashtag In Hashtags
function updateHashtagInHashtags(index:number|undefined, new_hashtag:string):void {
    if(index !== undefined && index !== -1) add_hashtag_state.hashtags[index]!.added_hashtag = new_hashtag // Updates Only One Hashtag In Hashtags
}

// Function For Check Hashtags Positions
export function checkHashtagsPositions(description:HTMLDivElement, cursor_position:number, previous_description_length:number, added_hashtags_input:HTMLInputElement):void {
    // Checks If The User Isn't Editing At The End Of The Text
    if(cursor_position < description.innerText.length) {
        const description_length:number = description.innerText.length // Gets The Description Length
        const difference:number = Math.abs(previous_description_length - description_length) // Gets The Total Amount Of Added Or Removed Characters
        const added_hashtags:hashtag[] = add_hashtag_state.hashtags.filter(one_hashtag => one_hashtag.added_hashtag) // Gets Every Added Hashtag
        const added_hashtags_after_edited_area:hashtag[] = added_hashtags.filter(one_hashtag => one_hashtag.position.hashtag_start_index > cursor_position) // Gets Only Added Hashtag After Edited Area (Behind The Position Of A Cursor)
        
        // Text Deletion (Removes The Collided Tag)
        if(previous_description_length > description_length) {
            // Gets The Collided Hashtag
            const collided_tag:hashtag|undefined = added_hashtags.find(function(one_hashtag:hashtag):boolean {
                return isCursorInHashtag(cursor_position, one_hashtag.position.hashtag_start_index, one_hashtag.position.hashtag_end_index) // Checks If The Cursor Is In Any Hashtag
            })

            if(collided_tag?.added_hashtag) {
                updateCollidedHashtag(collided_tag.added_hashtag, added_hashtags_input, description, cursor_position) // Removes The Collided Hashtag If There Is Any
                // removeCollidedHashtag(collided_tag.added_hashtag, added_hashtags_input) // Removes The Collided Hashtag If There Is Any
            }
        }
        
        // Checks If There Are Any Added Hashtags After The Edited Area (Updates Their Positions)
        if(added_hashtags_after_edited_area.length > 0 && added_hashtags_after_edited_area[0]) {
            const first_added_hashtag_after_edit_area_index:number = add_hashtag_state.hashtags.indexOf(added_hashtags_after_edited_area[0]) // Gets Index Of The First Added Hashtag After Edit Area
            
            // Text Writing
            if(previous_description_length < description_length) {
                updateHashtagsPositions(first_added_hashtag_after_edit_area_index - 1, difference, "add") // Updates Position Of The Hashtags (Adds The Deleted Area Length)
            }

            // Text Deletion
            else if(previous_description_length > description_length) {
                updateHashtagsPositions(first_added_hashtag_after_edit_area_index - 1, difference, "sub") // Updates Position Of The Hashtags (Subtracts The Deleted Area Length)
            }
        }
    }

    // Checks If The User Is Editing At The End Of The Text
    else {
        // If There Are Any Hashtags
        if(add_hashtag_state.hashtags.length > 0) {
            // Gets The Collided Hashtag
            const collided_tag:hashtag|undefined = add_hashtag_state.hashtags.find(function(one_hashtag:hashtag):boolean {
                return !!one_hashtag.added_hashtag && isCursorInHashtag(cursor_position, one_hashtag.position.hashtag_start_index, one_hashtag.position.hashtag_end_index)
            })

            // If There Is Any Collided Hashtag
            if(collided_tag?.added_hashtag) {
                // removeCollidedHashtag(collided_tag.added_hashtag, added_hashtags_input)
                updateCollidedHashtag(collided_tag.added_hashtag, added_hashtags_input, description, cursor_position) // Removes The Collided Hashtag If There Is Any
            }
        }
    }
}

// Function For Add The Hashtag
export function addHashtag(added_hashtag:string, description:HTMLDivElement, added_hashtags_input:HTMLInputElement):void {
    // Checks The Maximum Amount Of Added Hashtags
    if(add_hashtag_state.added_hashtags.length < add_hashtag_state.MAX_ADDED_HASHTAGS) {
        // Prevents Adding Multiple Times The Same Hashtag
        if(!add_hashtag_state.added_hashtags.includes(added_hashtag)) {
            add_hashtag_state.added_hashtags.push(added_hashtag) // Pushes Added Hashtag To The Array Of All Added Hashtags

            placeHashtagToText(description, added_hashtag) // Places The Hashtag

            added_hashtags_input.value = JSON.stringify(add_hashtag_state.added_hashtags) // Stores Added Hashtags To The Hidden Input
        }

        else {
            // Hashtag Is Already Added
        }
    }
}

// Function For Highlight Hashtags In Text (Format Them With Styled Span Elements)
export function highlightHashtagsInText(text:string):string {
    const regex:RegExp = /#([\p{L}\p{N}_]{1,29})(?![\p{L}\p{N}_])/gu // Regex (Instagram Like) For Hashtags
    const unique_hashtags:Set<string> = new Set<string>() // Stores Only Unique Hashtags

    return text.replace(regex, (one_hashtag) => {
        if(add_hashtag_state.added_hashtags.includes(one_hashtag) && !unique_hashtags.has(one_hashtag)) {
            unique_hashtags.add(one_hashtag) // Adds The Unique Hashtag

            return `<span class="hashtag">${one_hashtag}</span>` // Puts The Unique Hashtag To The Styled Span Element
        }

        return one_hashtag // Returns Unstyled Hashtag (If Doesn't Match Or Isn't Unique)
    })
}

// Function For Place The Hashtag To The Text
function placeHashtagToText(description:HTMLDivElement, added_hashtag:string):void {
    const text:string = description.innerText // Gets The Text
    const cursor_position:number = getCursorPosition(description) // Gets The Cursor Position
    const hashtag_start_index:number = getHashtagStartIndex(text, cursor_position) // Gets The Hashtag Start Index
    const hashtag_end_index:number = hashtag_start_index + added_hashtag.length - 1 // Gets The Hashtag End Index

    if(hashtag_start_index === -1) return

    const styled_tags_in_text:NodeListOf<HTMLSpanElement> = description.querySelectorAll<HTMLSpanElement>(".tag") // Gets All Styled Tags From Text
    
    description.innerHTML = highlightTagsInText(highlightHashtagsInText(text), styled_tags_in_text) // Sets The New Value

    const description_input:HTMLInputElement = description.nextElementSibling as HTMLInputElement // Gets The Description Hidden Input

    description_input.value = description.textContent.trim() // Sets The Description Input Value

    focusAtEnd(description) // Adds Focus Into The Input

    // Stores The Hashtag With All Information
    const hashtag:hashtag = {
        added_hashtag,

        position: {
            hashtag_start_index,
            hashtag_end_index
        }
    }

    storeHashSignPosition(hashtag) // Stores The Hashtag Position
}

// Function For Store Hash Sign Position
function storeHashSignPosition(data:hashtag):void {
    if(data.position.hashtag_start_index === add_hashtag_state.hashtags[add_hashtag_state.hashtags.length - 1]?.position.hashtag_start_index) {
        add_hashtag_state.hashtags.pop() // Removes Last Entry
    }

    add_hashtag_state.hashtags.push(data) // Pushes The Data Into The Hashtags
}

// Function For Update Hashtags Positions
function updateHashtagsPositions(start_from:number, step:number, operation:"add"|"sub"):void {
    console.log(step)

    add_hashtag_state.hashtags.forEach(function(one_hashtag:hashtag, index:number) {
        if(index > start_from) {
            // Adds Positions
            if(operation === "add") {
                one_hashtag.position.hashtag_start_index += step // Increases Hashtag Start Index
                one_hashtag.position.hashtag_end_index += step // Increases Hashtag End Index
            }

            // Subtracts Positions
            else if(operation === "sub") {
                one_hashtag.position.hashtag_start_index -= step // Decreases Hashtag Start Index
                one_hashtag.position.hashtag_end_index -= step // Decreases Hashtag End Index
            }
        }
    })
}

// Function For Get Hashtag Start Index Of The Last Hashtag
function getHashtagStartIndex(text:string, cursor_position:number):number {
    const search_position:number = Math.max(cursor_position - 1, 0) // Gets The Search Position (Hashtag End Index)
    const hashtag_start_index:number = text.lastIndexOf("#", search_position) // Gets The Latest At Sign Before Cursor

    return hashtag_start_index
}

// Checks Validity Of The Hashtag By Regex Rules
function isValidHashtag(hashtag:string):boolean {
    const regex:RegExp = /#([\p{L}\p{N}_]{1,29})(?![\p{L}\p{N}_])/gu // Regex (Instagram Like) For Hashtags
    const hashtag_data:RegExpMatchArray|null = hashtag.match(regex) || null // Creates An Array Of Found Regex Match

    return hashtag_data ? true : false // Returns True If The Hashtag Is Valid
}