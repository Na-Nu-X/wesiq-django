"use strict"

document.addEventListener("DOMContentLoaded", function() {
    // Comments

    // Function For Get Cookie by Its Name
    function getCookie(cookie_name) {
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${cookie_name}=`)
        if (parts.length === 2) return parts.pop().split(";")[0]
    }

    const comments = document.querySelectorAll(".one_comment")

    comments.forEach(function(one_comment) {
        // Gets Data From HTML Tags
        const one_comment_id = one_comment.dataset.id // Gets Comment ID From Data Value

        // Gets Heart And Counter From Each Comment
        let heart = one_comment.querySelector(".interactions .likes .fa-heart")
        let likes_counter = one_comment.querySelector(".interactions .likes .likes_counter")

        // If User Already Liked The Comment
        if(heart.classList.contains("fa-solid")) {
            heart.style.color = "#df3535"
        }
        
        // Likes
        heart.addEventListener("click", function() {
            // If The Heart Is Empty
            if(heart.classList.contains("fa-regular")) {
                heart.classList.remove("fa-regular")
                heart.classList.add("fa-solid")
                heart.style.color = "#df3535"

                likes_counter.textContent = parseInt(likes_counter.textContent) + 1 // Adds 1 Like To The Counter By Clicking On The Empty Heart
                
                // Sends Liked Commet ID As A POST Data To Like Comment Page
                fetch(`/like-comment/${one_comment_id}`, {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": getCookie("csrftoken"),
                        "Accept": "application/json"
                    }
                }).then(
                    response => response.json()
                ).then(
                    data => {
                        likes_counter.innetText = data.likes
                    }
                ).catch(error => console.error(error))
            }

            // If The Heart Is Already Clicked
            else if(heart.classList.contains("fa-solid")) {
                heart.classList.remove("fa-solid")
                heart.classList.add("fa-regular")
                heart.style.color = "#999999"

                likes_counter.textContent = parseInt(likes_counter.textContent) - 1 // Subtracts 1 Like To The Counter By Clicking On The Already Clicked Heart

                // Sends Liked Commet ID As A POST Data To Cancel Like Comment Page
                fetch(`/cancel-like-comment/${one_comment_id}`, {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": getCookie("csrftoken"),
                        "Accept": "application/json"
                    }
                }).then(
                    response => response.json()
                ).then(
                    data => {
                        likes_counter.innetText = data.likes
                    }
                ).catch(error => console.error(error))
            }
        })

        // Replies
        const reply = one_comment.querySelector(".interactions .reply .fa-solid")
        const reply_comment_form = one_comment.querySelector(".reply_comment_form")

        reply.addEventListener("click", function() {
            reply_comment_form.classList.toggle("visible")

            if(reply_comment_form.classList.contains("visible")) {
                reply.classList.remove("fa-reply")
                reply.classList.add("fa-xmark")
            }

            else if(!reply_comment_form.classList.contains("visible")) {
                reply.classList.remove("fa-xmark")
                reply.classList.add("fa-reply")
            }
        })

        // Report Comment
        let flag = one_comment.querySelector(".interactions .report .fa-flag")

        flag.addEventListener("click", function() {
            // Sends Liked Commet ID As A POST Data To Like Comment Page
            fetch(`/report-comment/${one_comment_id}`, {
                method: "POST",
                headers: {
                    "X-CSRFToken": getCookie("csrftoken"),
                    "Accept": "application/json"
                }
            }).then(
                response => response.json()
            ).then(
                data => {
                    // likes_counter.innetText = data.likes
                }
            ).catch(error => console.error(error))
        })
    })

    const replies = document.querySelectorAll(".one_reply")
    
    replies.forEach(function(one_reply) {
        // Gets Data From HTML Tags
        const one_reply_id = one_reply.dataset.id // Gets Reply ID From Data Value

        // Gets Heart And Counter From Each Reply
        let heart = one_reply.querySelector(".interactions .likes .fa-heart")
        let likes_counter = one_reply.querySelector(".interactions .likes .likes_counter")

        // If User Already Liked The Reply
        if(heart.classList.contains("fa-solid")) {
            heart.style.color = "#df3535"
        }
        
        // Likes
        heart.addEventListener("click", function() {
            // If The Heart Is Empty
            if(heart.classList.contains("fa-regular")) {
                heart.classList.remove("fa-regular")
                heart.classList.add("fa-solid")
                heart.style.color = "#df3535"

                likes_counter.textContent = parseInt(likes_counter.textContent) + 1 // Adds 1 Like To The Counter By Clicking On The Empty Heart

                // Sends Liked Commet ID As A POST Data To Like Comment Page
                fetch(`/like-comment/${one_reply_id}`, {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": getCookie("csrftoken"),
                        "Accept": "application/json"
                    }
                }).then(
                    response => response.json()
                ).then(
                    data => {
                        likes_counter.innetText = data.likes
                    }
                ).catch(error => console.error(error))
            }

            // If The Heart Is Already Clicked
            else if(heart.classList.contains("fa-solid")) {
                heart.classList.remove("fa-solid")
                heart.classList.add("fa-regular")
                heart.style.color = "#999999"

                likes_counter.textContent = parseInt(likes_counter.textContent) - 1 // Subtracts 1 Like To The Counter By Clicking On The Already Clicked Heart

                // Sends Liked Commet ID As A POST Data To Like Comment Page
                fetch(`/cancel-like-comment/${one_reply_id}`, {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": getCookie("csrftoken"),
                        "Accept": "application/json"
                    }
                }).then(
                    response => response.json()
                ).then(
                    data => {
                        likes_counter.innetText = data.likes
                    }
                ).catch(error => console.error(error))
            }
        })

        // Replies
        const reply = one_reply.querySelector(".interactions .reply .fa-solid")
        const reply_comment_form = one_reply.querySelector(".reply_comment_form")

        reply.addEventListener("click", function() {
            reply_comment_form.classList.toggle("visible")

            if(reply_comment_form.classList.contains("visible")) {
                reply.classList.remove("fa-reply")
                reply.classList.add("fa-xmark")
            }

            else if(!reply_comment_form.classList.contains("visible")) {
                reply.classList.remove("fa-xmark")
                reply.classList.add("fa-reply")
            }
        })

        // Report Comment
        let flag = one_reply.querySelector(".interactions .report .fa-flag")

        flag.addEventListener("click", function() {
            // Sends Liked Commet ID As A POST Data To Like Comment Page
            fetch(`/report-comment/${one_reply_id}`, {
                method: "POST",
                headers: {
                    "X-CSRFToken": getCookie("csrftoken"),
                    "Accept": "application/json"
                }
            }).then(
                response => response.json()
            ).then(
                data => {
                    // likes_counter.innetText = data.likes
                }
            ).catch(error => console.error(error))
        })
    })
})