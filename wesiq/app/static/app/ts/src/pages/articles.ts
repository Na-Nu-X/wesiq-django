import { commentFunctionality } from "../components/forum.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Articles

    // Variables

    const comments:NodeListOf<HTMLDivElement> = document.querySelectorAll<HTMLDivElement>(".one_comment") // Gets All Comments
    const replies:NodeListOf<HTMLDivElement> = document.querySelectorAll<HTMLDivElement>(".one_reply") // Gets All Replies

    // Initialization

    comments.forEach(one_comment => commentFunctionality(one_comment)) // Adds Comment Functionality To Every Comment
    replies.forEach(one_reply => commentFunctionality(one_reply)) // Adds Comment Functionality To Every Reply
})