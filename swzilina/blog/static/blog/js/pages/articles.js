import { commentFunctionality } from "../components/forum.js"

"use strict"

document.addEventListener("DOMContentLoaded", function() {
    // Comments
    const comments = document.querySelectorAll(".one_comment") // Gets All Comments

    comments.forEach(function(one_comment) {
        commentFunctionality(one_comment) // Adds Comment Functionality To Every Comment
    })

    // Replies
    const replies = document.querySelectorAll(".one_reply") // Gets All Replies
    
    replies.forEach(function(one_reply) {
        commentFunctionality(one_reply) // Adds Comment Functionality To Every Reply
    })
})