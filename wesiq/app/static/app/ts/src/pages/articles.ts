import { commentFunctionality } from "../components/forum.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Comments
    const comments:NodeListOf<HTMLDivElement> = document.querySelectorAll<HTMLDivElement>(".one_comment") // Gets All Comments

    comments.forEach(function(one_comment:HTMLDivElement):void {
        commentFunctionality(one_comment) // Adds Comment Functionality To Every Comment
    })

    // Replies
    const replies:NodeListOf<HTMLDivElement> = document.querySelectorAll<HTMLDivElement>(".one_reply") // Gets All Replies
    
    replies.forEach(function(one_reply:HTMLDivElement):void {
        commentFunctionality(one_reply) // Adds Comment Functionality To Every Reply
    })
})