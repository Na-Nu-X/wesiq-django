import {
    getCursorPosition,
    setCursorPosition
} from "./customTextarea.js"

import {
    highlightTaggedUsersInPlainText,
    matchTaggedUserFromResults,
    resolveTaggedUserFromDom,
    searchUsersForTag
} from "./tagUsers.js"

import { tag_user_state } from "../state.js"
import { add_hashtag_state } from "../state.js"
import { highlightHashtagsInText } from "./addHashtags.js"
import { renderAllTaggedUsers } from "./tagUsers.js"

import type { tag } from "../state.js"
import type { hashtag } from "../state.js"

interface taggedUser {
    id:number,
    first_name:string,
    last_name:string,
    username:string,
    profile_picture_name:string
}

const MENTION_REGEX:RegExp = /@([a-z0-9._-]+)(?![a-z0-9._-])/gi
const HASHTAG_REGEX:RegExp = /#([\p{L}\p{N}_]{1,29})(?![\p{L}\p{N}_])/gu
const HASHTAG_VALIDATION_REGEX:RegExp = /^#([\p{L}\p{N}_]{1,29})(?![\p{L}\p{N}_])$/u

interface parsedMention {
    username:string,
    tagged_user:string,
    tag_start_index:number,
    tag_end_index:number
}

interface parsedHashtag {
    added_hashtag:string,
    hashtag_start_index:number,
    hashtag_end_index:number
}

// Validates That The Username Exists (Exact Match — Same Rules As Manual Tagging)
async function resolveTaggedUser(username:string):Promise<string|null> {
    const trimmed_username:string = username.replace(/^@/, "").trim()
    const dom_match:string|null = resolveTaggedUserFromDom(trimmed_username)

    if(dom_match) return dom_match

    const search_terms:string[] = [
        trimmed_username,
        trimmed_username.toLowerCase()
    ]

    for(const search_term of search_terms) {
        const users:taggedUser[]|null = await searchUsersForTag(search_term)

        if(!users?.length) continue

        const tagged_user:string|null = matchTaggedUserFromResults(users, trimmed_username)

        if(tagged_user) return tagged_user
    }

    return null
}

function parseHashtags(text:string):parsedHashtag[] {
    const parsed:parsedHashtag[] = []
    const seen:Set<string> = new Set<string>()

    for(const match of text.matchAll(HASHTAG_REGEX)) {
        const added_hashtag:string = match[0]

        if(!HASHTAG_VALIDATION_REGEX.test(added_hashtag) || seen.has(added_hashtag)) continue

        seen.add(added_hashtag)

        const hashtag_start_index:number = match.index ?? 0

        parsed.push({
            added_hashtag,
            hashtag_start_index,
            hashtag_end_index: hashtag_start_index + added_hashtag.length - 1
        })
    }

    return parsed.slice(0, add_hashtag_state.MAX_ADDED_HASHTAGS)
}

function parseMentions(text:string):parsedMention[] {
    const parsed:parsedMention[] = []

    for(const match of text.matchAll(MENTION_REGEX)) {
        const username:string|undefined = match[1]

        if(!username) continue

        const tagged_user:string = `@${username}`
        const tag_start_index:number = match.index ?? 0

        parsed.push({
            username,
            tagged_user,
            tag_start_index,
            tag_end_index: tag_start_index + tagged_user.length - 1
        })
    }

    return parsed
}

// Function For Check If String Arrays Are Equal
function areStringArraysEqual(first_array:string[], second_array:string[]):boolean {
    if(first_array.length !== second_array.length) return false

    return first_array.every(function(one_value:string, index:number):boolean {
        return one_value === second_array[index]
    })
}

// Removes Tags And Hashtags That Are No Longer In The Text (Selection Delete, Cut, Etc.)
export function pruneDescriptionMetadata(
    description:HTMLDivElement,
    description_input:HTMLInputElement,
    tagged_users_container:HTMLDivElement,
    tagged_users_input:HTMLInputElement,
    added_hashtags_input:HTMLInputElement,
    cursor_position?:number
):void {
    const text:string = description.innerText
    const new_tagged_users:string[] = []
    const new_tags:tag[] = []

    for(const one_mention of parseMentions(text)) {
        const stored_tagged_user:string|undefined = tag_user_state.tagged_users.find(function(one_tagged_user:string):boolean {
            return one_tagged_user.toLowerCase() === `@${one_mention.username}`.toLowerCase()
        })

        if(!stored_tagged_user) continue

        if(!new_tagged_users.includes(stored_tagged_user)) new_tagged_users.push(stored_tagged_user)

        new_tags.push({
            tagged_user: stored_tagged_user,
            position: {
                tag_start_index: one_mention.tag_start_index,
                tag_end_index: one_mention.tag_end_index
            }
        })
    }

    const new_added_hashtags:string[] = []
    const new_hashtags:hashtag[] = []
    const seen_hashtags:Set<string> = new Set<string>()

    for(const one_hashtag of parseHashtags(text)) {
        if(
            !add_hashtag_state.added_hashtags.includes(one_hashtag.added_hashtag) ||
            seen_hashtags.has(one_hashtag.added_hashtag)
        ) {
            continue
        }

        seen_hashtags.add(one_hashtag.added_hashtag)
        new_added_hashtags.push(one_hashtag.added_hashtag)
        new_hashtags.push({
            added_hashtag: one_hashtag.added_hashtag,
            position: {
                hashtag_start_index: one_hashtag.hashtag_start_index,
                hashtag_end_index: one_hashtag.hashtag_end_index
            }
        })
    }

    const tagged_users_changed:boolean = !areStringArraysEqual(tag_user_state.tagged_users, new_tagged_users)
    const hashtags_changed:boolean = !areStringArraysEqual(add_hashtag_state.added_hashtags, new_added_hashtags)

    tag_user_state.tagged_users = new_tagged_users
    tag_user_state.tags = new_tags
    tag_user_state.tagged_user = ""
    add_hashtag_state.added_hashtags = new_added_hashtags
    add_hashtag_state.hashtags = new_hashtags
    add_hashtag_state.added_hashtag = ""

    tagged_users_input.value = JSON.stringify(tag_user_state.tagged_users)
    added_hashtags_input.value = JSON.stringify(add_hashtag_state.added_hashtags)

    renderAllTaggedUsers(tagged_users_container)
    description_input.value = description.textContent.trim()

    // Rebuilds HTML Only When Tags/Hashtags Were Added Or Removed (Keeps Cursor On Plain Text Edits)
    if(tagged_users_changed || hashtags_changed) {
        const next_cursor_position:number = Math.min(
            cursor_position ?? getCursorPosition(description) ?? text.length,
            description.innerText.length
        )

        description.innerHTML = highlightTaggedUsersInPlainText(highlightHashtagsInText(text))
        description_input.value = description.textContent.trim()

        setCursorPosition(description, next_cursor_position)
    }
}

// Rebuilds Tagged Users, Hashtags, Positions And Styled HTML From Plain Text
export async function syncDescriptionFromText(
    description:HTMLDivElement,
    description_input:HTMLInputElement,
    tagged_users_container:HTMLDivElement,
    tagged_users_input:HTMLInputElement,
    added_hashtags_input:HTMLInputElement,
    max_description_length:number,
    cursor_position_after_sync?:number,
    source_text?:string
):Promise<void> {
    let text:string = source_text ?? description.innerText

    if(text.length > max_description_length) {
        text = text.slice(0, max_description_length)
    }

    const parsed_mentions:parsedMention[] = parseMentions(text)
    const parsed_hashtags:parsedHashtag[] = parseHashtags(text)

    const usernames_to_resolve:Map<string, string> = new Map<string, string>()

    parsed_mentions.forEach(function(one_mention:parsedMention):void {
        const normalized_username:string = one_mention.username.toLowerCase()

        if(!usernames_to_resolve.has(normalized_username)) {
            usernames_to_resolve.set(normalized_username, one_mention.username)
        }
    })

    const username_to_tagged_user:Map<string, string> = new Map<string, string>()

    for(const [normalized_username, original_username] of usernames_to_resolve) {
        if(username_to_tagged_user.size >= tag_user_state.MAX_TAGGED_USERS) break

        const tagged_user:string|null = await resolveTaggedUser(original_username)

        if(tagged_user) username_to_tagged_user.set(normalized_username, tagged_user)
    }

    const new_tagged_users:string[] = []
    const new_tags:tag[] = []

    for(const one_mention of parsed_mentions) {
        const tagged_user:string|undefined = username_to_tagged_user.get(one_mention.username.toLowerCase())

        if(!tagged_user) continue

        if(!new_tagged_users.includes(tagged_user)) new_tagged_users.push(tagged_user)

        new_tags.push({
            tagged_user,
            position: {
                tag_start_index: one_mention.tag_start_index,
                tag_end_index: one_mention.tag_end_index
            }
        })
    }

    const new_added_hashtags:string[] = parsed_hashtags.map(one_hashtag => one_hashtag.added_hashtag)
    const new_hashtags:hashtag[] = parsed_hashtags.map(one_hashtag => ({
        added_hashtag: one_hashtag.added_hashtag,
        position: {
            hashtag_start_index: one_hashtag.hashtag_start_index,
            hashtag_end_index: one_hashtag.hashtag_end_index
        }
    }))

    tag_user_state.tagged_users = new_tagged_users
    tag_user_state.tags = new_tags
    tag_user_state.tagged_user = ""
    add_hashtag_state.added_hashtags = new_added_hashtags
    add_hashtag_state.hashtags = new_hashtags
    add_hashtag_state.added_hashtag = ""

    tagged_users_input.value = JSON.stringify(tag_user_state.tagged_users)
    added_hashtags_input.value = JSON.stringify(add_hashtag_state.added_hashtags)

    renderAllTaggedUsers(tagged_users_container)

    description.innerHTML = highlightTaggedUsersInPlainText(highlightHashtagsInText(text))

    description_input.value = description.textContent.trim()

    const cursor_position:number = Math.min(
        cursor_position_after_sync ?? getCursorPosition(description) ?? text.length,
        description.innerText.length
    )

    setCursorPosition(description, cursor_position)
}

// Inserts Plain Text At Cursor And Syncs Mentions / Hashtags
export async function handleDescriptionPaste(
    event:ClipboardEvent,
    description:HTMLDivElement,
    description_input:HTMLInputElement,
    tagged_users_container:HTMLDivElement,
    tagged_users_input:HTMLInputElement,
    added_hashtags_input:HTMLInputElement,
    max_description_length:number
):Promise<void> {
    event.preventDefault()

    const pasted_text:string = event.clipboardData?.getData("text/plain") ?? ""

    if(!pasted_text) return

    const cursor_position:number = getCursorPosition(description) ?? description.innerText.length
    const text_before_cursor:string = description.innerText.slice(0, cursor_position)
    const text_after_cursor:string = description.innerText.slice(cursor_position)
    let new_text:string = text_before_cursor + pasted_text + text_after_cursor

    if(new_text.length > max_description_length) {
        new_text = new_text.slice(0, max_description_length)
    }

    description.innerText = new_text

    const cursor_after_paste:number = Math.min(
        text_before_cursor.length + pasted_text.length,
        new_text.length
    )

    await syncDescriptionFromText(
        description,
        description_input,
        tagged_users_container,
        tagged_users_input,
        added_hashtags_input,
        max_description_length,
        cursor_after_paste,
        new_text
    )
}