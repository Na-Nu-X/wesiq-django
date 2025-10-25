"use strict"

document.addEventListener("DOMContentLoaded", function() {
    // Write Review

    const stars = document.querySelectorAll(".write_review_form .stars img")
    const rating = document.querySelector(".write_review_form .rating input")
    let selected_rating = 0

    function updateStars(hover_value = 0) {
        stars.forEach(function(star, index) {
            if(hover_value > 0) {
                if(index < hover_value) {
                    star.src = "../../static/images/star.png"
                }

                else {
                    star.src = "../../static/images/empty_star.png"
                }
            }

            else {
                if(index < selected_rating) {
                    star.src = "../../static/images/star.png"
                }

                else {
                    star.src = "../../static/images/empty_star.png"
                }
            }
        })
    }

    stars.forEach(function(star, index) {
        const rating_number = index + 1

        star.addEventListener("mouseover", function() {
            updateStars(rating_number)
        })

        star.addEventListener("mouseout", function() {
            updateStars()
        })

        star.addEventListener("click", function() {
            selected_rating = rating_number
            rating.value = rating_number
            updateStars()
        })
    })
})