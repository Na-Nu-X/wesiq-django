"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Write Review

    const stars:NodeListOf<HTMLImageElement> = document.querySelectorAll<HTMLImageElement>(".write_review_form .stars img, .edit_review_form .stars img")
    const rating:HTMLInputElement = document.querySelector(".write_review_form .rating input, .edit_review_form .rating input") as HTMLInputElement
    let selected_rating:number = parseInt(rating.value) || 0

    function updateStars(hover_value:number = 0):void {
        stars.forEach(function(star:HTMLImageElement, index:number):void {
            if(hover_value > 0) index < hover_value ? star.src = "../../static/images/star.png" : star.src = "../../static/images/empty_star.png"
            else index < selected_rating ? star.src = "../../static/images/star.png" : star.src = "../../static/images/empty_star.png"
        })
    }

    stars.forEach(function(star:HTMLImageElement, index:number):void {
        const rating_number:number = index + 1

        star.addEventListener("mouseover", function():void {
            updateStars(rating_number)
        })

        star.addEventListener("mouseout", function():void {
            updateStars()
        })

        star.addEventListener("click", function():void {
            selected_rating = rating_number
            rating.value = String(rating_number)
            updateStars()
        })
    })

    updateStars()
})