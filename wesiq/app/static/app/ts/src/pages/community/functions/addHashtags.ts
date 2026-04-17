import { 
    getCursorPosition, 
    focusAtEnd 
} from "../community.js"

import { add_hashtag_state } from "../state.js"
import { highlightTagsInText } from "./tagUsers.js"

// Function For Check Hashtags
export function checkHashtags(description:HTMLDivElement, added_hashtags:HTMLInputElement):void {
    const text:string = description.innerText // Gets The Text
    const cursor_position:number = getCursorPosition(description) // Gets The Cursor Position
    const hashtag_start_index:number = getHashtagStartIndex(text, cursor_position) // Gets The Hashtag Start Index

    if(hashtag_start_index === -1) return

    // If The Spacebar Was Pressed
    if(text[cursor_position - 1]?.charCodeAt(0) === 160) {
        const cleaned_added_hashtag:string = `#${add_hashtag_state.added_hashtag}` // Cleans The Added Hashtag (For Example From workout -> #workout)
    
        if(isValidHashtag(cleaned_added_hashtag)) addHashtag(cleaned_added_hashtag, description, added_hashtags) // Adds The Hashtag

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

// Function For Add The Hashtag
export function addHashtag(added_hashtag:string, description:HTMLDivElement, added_hashtags:HTMLInputElement):void {
    // Checks The Maximum Amount Of Added Hashtags
    if(add_hashtag_state.added_hashtags.length < add_hashtag_state.MAX_ADDED_HASHTAGS) {
        // Prevents Adding Multiple Times The Same Hashtag
        if(!add_hashtag_state.added_hashtags.includes(added_hashtag)) {
            add_hashtag_state.added_hashtags.push(added_hashtag) // Pushes Added Hashtag To The Array Of All Added Hashtags

            placeHashtagToText(description, added_hashtag) // Places The Hashtag

            added_hashtags.value = JSON.stringify(add_hashtag_state.added_hashtags) // Stores Added Hashtags To The Hidden Input
        }

        else {
            // Hashtag Is Already Added
        }
    }
}

// Function For Highlight Hashtags In Text (Format Them With Styled Span Elements)
export function highlightHashtagsInText(text:string):string {
    let text_with_formatted_hashtags = text // Stores Text With Formatted Hashtags

    add_hashtag_state.added_hashtags.forEach(one_hashtag => text_with_formatted_hashtags = text_with_formatted_hashtags.replace(one_hashtag, `<span class="hashtag">${one_hashtag}</span>`)) // Puts Every Hashtag To The Styled Span Element

    return text_with_formatted_hashtags // Returns Text With Formatted Hashtags
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

    focusAtEnd(description) // Adds Focus Into The Input
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