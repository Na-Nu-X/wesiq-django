import { sendPOST } from "../../../services/sendPOST.js"
import { displayMessage } from "../../../utils/displayMessage.js"

import type { response } from "../../../services/sendPOST.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Rating

    // Variables

    const article_content:HTMLDivElement = document.querySelector(".article_content") as HTMLDivElement // Gets The Article Content
    const article_id:number|null = Number(article_content.dataset["article_id"]) || null // Gets The Article ID
    const stars:NodeListOf<HTMLButtonElement> = document.querySelectorAll<HTMLButtonElement>(".rating button")
    const rating:HTMLInputElement = document.querySelector(".rating input") as HTMLInputElement
    let selected_rating:number = parseInt(rating.value) || 0

    // Functions

    function updateStars(hover_value:number = 0):void {
        stars.forEach(function(one_star:HTMLElement, index:number):void {
            const icon:HTMLElement = one_star.querySelector(".fa-star") as HTMLElement // Gets The Star Icon

            if(hover_value > 0) {
                index < hover_value ? icon.classList.replace("empty", "full") : one_star.classList.replace("full", "empty")
            }

            else {
                index < selected_rating ? icon.classList.replace("empty", "full") : icon.classList.replace("full", "empty")
            }
        })
    }

    // Function For Add Article Rating
    async function addArticleRating(id:number, rating:number):Promise<void> {
        try {
            const article_rating_data:{
                article_id:number,
                rating:number
            } = {
                article_id:id,
                rating
            }

            const toggle_article_comment_like_response:response = await sendPOST(window.location.pathname, article_rating_data, "add-article-rating") // Sends Article Rating Data As A POST Data
    
            // If The Response Isn't Success
            if(!toggle_article_comment_like_response.success) {
                displayMessage(toggle_article_comment_like_response.message, "error") // Displays The Error Message
                return
            }
        }
    
        catch {
            displayMessage(gettext("Pri pridávaní hodnotenia došlo k chybe."), "error") // Displays The Error Message
        }
    }

    // Events

    stars.forEach(function(one_star:HTMLElement, index:number):void {
        const rating_number:number = index + 1

        one_star.addEventListener("mouseover", () => updateStars(rating_number))
        one_star.addEventListener("mouseout", () => updateStars())

        one_star.addEventListener("click", function():void {
            selected_rating = rating_number
            rating.value = String(rating_number)
            updateStars()
            if(article_id) addArticleRating(article_id, rating_number) // Adds The Article Rating
        })
    })

    // Initialization

    updateStars()
})