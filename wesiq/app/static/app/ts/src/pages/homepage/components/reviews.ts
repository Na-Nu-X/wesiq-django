import { customSelectMenu } from "../../../components/customSelectMenu.js"
import { setObserverAnimation } from "../../../utils/setObserverAnimation.js"
import { reviewsInfoAnimation } from "../functions/reviewsInfoAnimation.js"

import { 
    deleteReview, 
    hideLoadedReviews, 
    loadReviews, 
    reportReview 
} from "../functions/reviews.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Custom Select Menus - Reviews

    const sort_select_menu:HTMLDivElement = document.querySelector(".reviews .select_menus .sort_select_menu") as HTMLDivElement // Gets Sort Select Menu
    const rating_select_menu:HTMLDivElement = document.querySelector(".reviews .select_menus .rating_select_menu") as HTMLDivElement // Gets Rating Select Menu

    customSelectMenu(sort_select_menu, "sort") // Adds Functionality For Sort Select Menu That Sets The Sort URL Parameter
    customSelectMenu(rating_select_menu, "rating", true) // Adds Functionality For Rating Select Menu That Sets The Rating URL Parameter

    // Reviews

    // Variables

    const all_reviews_container:HTMLDivElement = document.querySelector(".reviews .all_reviews") as HTMLDivElement // Gets The All Reviews Container

    // Global Event Delegations

    // Review Properties Menu
    all_reviews_container.addEventListener("click", function(event:PointerEvent):void {
        // Report Review
        if(((event.target as HTMLButtonElement).parentElement as HTMLDivElement).classList.contains("report_review")) {
            const report_button:HTMLButtonElement = event.target as HTMLButtonElement // Gets The Report Button
            const one_review:HTMLDivElement = report_button.closest(".one_review") as HTMLDivElement // Gets The One Review Container
            const report_reason:string|null = report_button.dataset["reason"] || null // Gets The Report Reason

            if(one_review.dataset["review_id"] && report_reason) reportReview(Number(one_review.dataset["review_id"]), report_reason) // Reports The Review
        }

        // Delete Review
        if(((event.target as HTMLButtonElement).parentElement as HTMLDivElement).classList.contains("delete_review")) {
            const option:HTMLButtonElement = event.target as HTMLButtonElement // Gets The Clicked Option (Yes / No)
            const one_review:HTMLDivElement = option.closest(".one_review") as HTMLDivElement // Gets The One Review Container
            const action:string|null = option.dataset["action"] || null // Gets The Action Of The Clicked Option

            if(one_review.dataset["review_id"] && action && action === "delete") deleteReview(Number(one_review.dataset["review_id"]), one_review) // Deletes The Review
        }
    })
    
    // Load Reviews

    // Variables
    
    const load_reviews_buttons:HTMLDivElement|null = document.querySelector(".reviews .load_reviews_buttons") as HTMLDivElement // Gets The Load Reviews Buttons Container

    // If There Are Some More Reviews
    if(load_reviews_buttons) {
        const first_reviews:NodeListOf<HTMLDivElement> = all_reviews_container.querySelectorAll<HTMLDivElement>(".one_review") // Stores All First Showed Reviews

        // Global Event Delegations

        // Load More Reviews Button Click Functionality
        load_reviews_buttons.addEventListener("click", async function(event:PointerEvent):Promise<void> {
            // Load More Reviews
            if((event.target as HTMLButtonElement).classList.contains("load_more_reviews")) {
                loadReviews(load_reviews_buttons, all_reviews_container) // Loads More Reviews
            }

            // Hide Loaded Reviews
            else if((event.target as HTMLButtonElement).classList.contains("hide_loaded_reviews")) {
                const hide_loaded_reviews:HTMLButtonElement = event.target as HTMLButtonElement // Gets The Hide Loaded Reviews Button
                hideLoadedReviews(hide_loaded_reviews, load_reviews_buttons, all_reviews_container, first_reviews) // Hides Loaded Reviews
            }
        })
    }

    // Animate Reviews

    const reviews_info_container:HTMLDivElement = document.querySelector(".reviews .reviews_info_container") as HTMLDivElement // Gets Reviews Info
    setObserverAnimation(reviews_info_container, 1, reviewsInfoAnimation) // Animates Reviews Info

    const all_reviews:NodeListOf<HTMLDivElement> = all_reviews_container.querySelectorAll<HTMLDivElement>(".one_review") // Gets All Reviews
    setObserverAnimation(all_reviews) // Animates Each Review From All Reviews
})