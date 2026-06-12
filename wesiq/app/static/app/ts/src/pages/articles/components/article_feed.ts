import { focusAtEnd } from "../../community/functions/customTextarea.js"

import { 
    addComment,
    toggleShowReplies,
    toggleReplyOnComment
} from "../functions/articleForum.js"

import { 
    toggleArticleCommentLike,
    reportArticleComment,
    deleteArticleComment
} from "../functions/articleForumSocialInteractions.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Post Feed

    // Variables

    const article_content:HTMLDivElement = document.querySelector(".article_content") as HTMLDivElement // Gets The Article Content
    const article_id:number|null = Number(article_content.dataset["article_id"]) || null // Gets The Article ID

    const comment_forum:HTMLDivElement = document.querySelector(".comment_forum") as HTMLDivElement // Gets The Comment Forum
    const comments_counter:HTMLDivElement = comment_forum.querySelector(".comments_counter p") as HTMLDivElement // Gets The Comments Counter Paragraph
    const all_comments:HTMLDivElement = comment_forum.querySelector(".all_comments") as HTMLDivElement // Gets The All Comments Container
    const write_comment_form:HTMLDivElement = comment_forum.querySelector(".write_comment_form") as HTMLDivElement // Gets The Write Comment Form
    const comment:HTMLTextAreaElement = write_comment_form.querySelector(".comment") as HTMLTextAreaElement // Gets The Comment Input
    const emoji_picker_container:HTMLDivElement = write_comment_form.querySelector(".emoji_picker_container") as HTMLDivElement // Gets The Emoji Picker Container

    // Global Event Delegations

    // Comment Forum Click Functionalities
    comment_forum.addEventListener("click", function(event:PointerEvent):void {
        // Add Emoji To The Write Comment Input
        if(
            (event.target as HTMLButtonElement).classList.contains("add_emoji") &&
            (event.target as HTMLButtonElement).closest(".write_comment_form")
        ) {
            event.stopPropagation() // Prevents The Closing Of The Emoji Picker Container
            emoji_picker_container.classList.toggle("hidden") // Shows Or Hides The Emoji Picker Container
        }

        // Send Comment
        if((event.target as HTMLButtonElement).classList.contains("send")) {
            const parent_id:number|null = Number(write_comment_form.dataset["parent_id"]) || null // Gets The Parent ID If Is Available

            if(article_id && comment.value.length > 0) addComment(article_id, write_comment_form, all_comments, comment_forum, parent_id, comments_counter) // Adds Comment To The Post
        }

        // Toggle Reply On Comment
        if(
            (event.target as HTMLElement).closest(".interactions") &&
            ((event.target as HTMLElement).classList.contains("fa-comment") ||
            (event.target as HTMLElement).classList.contains("fa-comment-slash"))
        ) {
            const icon:HTMLElement = event.target as HTMLElement // Gets The Reply Icon
            const write_comment_form:HTMLDivElement = (icon.closest(".comment_forum") as HTMLDivElement).querySelector(".write_comment_form") as HTMLDivElement // Gets The Write Comment Form
            const one_comment:HTMLDivElement = icon.closest(".one_comment") as HTMLDivElement // Gets The One Comment

            toggleReplyOnComment(icon, write_comment_form, one_comment)
        }

        // Toggle Comment Like Click Functionality
        if(
            (event.target as HTMLElement).classList.contains("fa-heart") &&
            (event.target as HTMLElement).closest(".one_comment") as HTMLDivElement
        ) {
            const one_comment:HTMLDivElement = (event.target as HTMLElement).closest(".one_comment") as HTMLDivElement // Gets The One Comment Container
            const comment_likes_counter:HTMLParagraphElement = ((event.target as HTMLElement).parentElement as HTMLDivElement).querySelector(".likes_counter") as HTMLParagraphElement // Gets The Likes Counter

            if(one_comment.dataset["comment_id"]) toggleArticleCommentLike(event.target as HTMLElement, comment_likes_counter, Number(one_comment.dataset["comment_id"])) // Adds Or Removes Like From The Comment
        }

        // Show Replies
        if(((event.target as HTMLElement).parentElement as HTMLDivElement).classList.contains("show_replies")) {
            const show_replies_icon:HTMLElement = event.target as HTMLElement // Gets The Show Replies Icon
            const one_comment:HTMLDivElement = show_replies_icon.closest(".one_comment") as HTMLDivElement // Gets The One Comment Container
            const reply_container:HTMLDivElement = one_comment.querySelector(".reply_container") as HTMLDivElement // Gets The Reply Container
            
            toggleShowReplies(show_replies_icon, reply_container) // Toggles Visibility Of The Comment Replies
        }

        // Report Comment
        if(((event.target as HTMLButtonElement).parentElement as HTMLDivElement).classList.contains("report_comment")) {
            const report_button:HTMLButtonElement = event.target as HTMLButtonElement // Gets The Report Button
            const one_comment:HTMLDivElement = report_button.closest(".one_comment") as HTMLDivElement // Gets The One Comment Container
            const report_reason:string|null = report_button.dataset["reason"] || null // Gets The Report Reason

            if(one_comment.dataset["comment_id"] && report_reason) reportArticleComment(Number(one_comment.dataset["comment_id"]), report_reason) // Reports The Comment
        }

        // Delete Comment
        if(((event.target as HTMLButtonElement).parentElement as HTMLDivElement).classList.contains("delete_comment")) {
            const option:HTMLButtonElement = event.target as HTMLButtonElement // Gets The Clicked Option (Yes / No)
            const one_comment:HTMLDivElement = option.closest(".one_comment") as HTMLDivElement // Gets The One Comment Container
            const action:string|null = option.dataset["action"] || null // Gets The Action Of The Clicked Option

            if(one_comment.dataset["comment_id"] && action && action === "delete") deleteArticleComment(Number(one_comment.dataset["comment_id"]), one_comment, comments_counter) // Deletes The Comment
        }
    })

    // Feed Emoji Click Functionality
    emoji_picker_container.addEventListener("emoji-click", function(event:Event):void {
        // Add Emoji To The Write Comment Input
        if(
            (event.target as HTMLElement).tagName.toLowerCase() === "emoji-picker" &&
            (event.target as HTMLElement).closest(".write_comment_form")
        ) {
            const picker:Element = event.target as Element // Gets The Emoji Picker
            const comment:HTMLDivElement = (picker.closest(".write_comment_form") as HTMLDivElement).querySelector(".comment") as HTMLDivElement // Gets The Comment Input

            const custom_event:CustomEvent<{
                unicode:string
            }> = event as CustomEvent<{ unicode: string }>
        
            const emoji:string = custom_event.detail.unicode // Gets The Clicked Emoji
            const selection:Selection|null = window.getSelection()
            const isInsideEditable:boolean|null = selection && selection.rangeCount > 0 && comment.contains(selection.anchorNode)

            if(!isInsideEditable) focusAtEnd(comment)

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
        }
    })

    // Document Click Functionality
    document.addEventListener("click", function(event:PointerEvent):void {
        // When The User Clicks Outside The Emoji Picker Container
        if(
            !(event.target as HTMLDivElement).classList.contains("emoji_picker_container") &&
            !(event.target as HTMLDivElement).closest(".emoji_picker_container")
        ) {
            const all_emoji_picker_containers:NodeListOf<HTMLDivElement> = document.querySelectorAll<HTMLDivElement>(".emoji_picker_container") // Gets All Emoji Picker Containers
            all_emoji_picker_containers.forEach((one_emoji_picker_container) => one_emoji_picker_container.classList.add("hidden")) // Hides Every Emoji Picker Container
            return
        }
    })
})