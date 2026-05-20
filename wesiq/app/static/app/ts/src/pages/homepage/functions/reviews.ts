import { sendPOST } from "../../../services/sendPOST.js"
import { displayMessage } from "../../../utils/displayMessage.js"

import type { response } from "../../../services/sendPOST.js"

interface loadReviewsResponse {
    success:boolean,
    has_next:boolean,
    reviews_html:string,
    message:string
}

// Function For Load Reviews
export async function loadReviews(load_reviews_buttons:HTMLDivElement, all_reviews_container:HTMLDivElement):Promise<void> {
    const load_more_reviews:HTMLButtonElement = load_reviews_buttons.querySelector(".load_more_reviews") as HTMLButtonElement // Gets The Load More Reviews Button
    const next_page:number = Number(load_more_reviews.dataset["page"]) // Gets The Number Of The Next Page

    load_more_reviews.textContent = gettext("Načítavam...")
    load_more_reviews.disabled = true // Disables The Button

    try {
        const url_parameters:URLSearchParams = new URLSearchParams(window.location.search) // Gets The Current URL Parameters (For Example Filters For Reviews)
        url_parameters.set("reviews-page", String(next_page)) // Adds The Reviews Page To URL Parameters

        const load_reviews_response:loadReviewsResponse = await sendPOST(`${window.location.pathname}?${url_parameters.toString()}`, null, "load-reviews")

        // If The Response Isn't Success
        if(!load_reviews_response.success) {
            displayMessage(load_reviews_response.message, "error") // Displays The Error Message
            load_more_reviews.textContent = gettext("Zobraziť viac")
            load_more_reviews.disabled = false // Enables The Button
            return
        }

        all_reviews_container.insertAdjacentHTML("beforeend", load_reviews_response.reviews_html) // Appends The HTML With Loaded Reviews To The All Reviews Container

        // Creates The Hide Loaded Reviews Button If Isn't Already In The DOM
        if(!load_reviews_buttons.querySelector(".hide_loaded_reviews")) {
            const hide_loaded_reviews = document.createElement("button") // Creates The Hide Loaded Reviews Button
            hide_loaded_reviews.classList.add("hide_loaded_reviews") // Adds The Hide Loaded Reviews Class
            hide_loaded_reviews.textContent = gettext("Skryť recenzie")
            load_reviews_buttons.appendChild(hide_loaded_reviews) // Appends The Hide Loaded Reviews Button To The Load Reviews Buttons Container
        }

        const all_reviews:NodeListOf<HTMLDivElement> = all_reviews_container.querySelectorAll<HTMLDivElement>(".one_review") // Gets All Reviews
        all_reviews.forEach(one_review => one_review.classList.add("animate")) // Shows New Loaded Reviews

        if(load_reviews_response.has_next) {
            load_more_reviews.dataset["page"] = String(next_page + 1) // Updates The Number Of The Next Page
            load_more_reviews.textContent = gettext("Zobraziť viac")
            load_more_reviews.disabled = false // Enables The Button
        }
        
        else load_more_reviews.remove() // Removes The Load More Reviews Button From The DOM If There Is No More Reviews To Load
    }

    catch {
        displayMessage("Pri hľadaní recenzií došlo k chybe.", "error") // Displays The Error Message
        load_more_reviews.textContent = gettext("Zobraziť viac")
        load_more_reviews.disabled = false // Enables The Button
    }
}

// Function For Hide Loaded Reviews
export function hideLoadedReviews(hide_loaded_reviews:HTMLButtonElement, load_reviews_buttons:HTMLDivElement, all_reviews_container:HTMLDivElement, first_reviews:NodeListOf<HTMLDivElement>):void {
    const all_reviews:NodeListOf<HTMLDivElement> = all_reviews_container.querySelectorAll<HTMLDivElement>(".one_review") // Gets All Reviews

    // Gets All Loaded Reviews
    const all_loaded_reviews:HTMLDivElement[] = [...all_reviews].filter(function(one_review:HTMLDivElement):HTMLDivElement|undefined {
        if(![...first_reviews].includes(one_review)) {
            return one_review
        }
    })

    all_loaded_reviews.forEach(one_review => one_review.remove()) // Removes All Loaded Reviews From The DOM
    hide_loaded_reviews.remove() // Removes The Hide Loaded Reviews Button From The DOM

    // Creates The Load More Reviews Button If Isn't Already In The DOM
    if(!load_reviews_buttons.querySelector(".load_more_reviews")) {
        const load_more_reviews = document.createElement("button") // Creates The Load More Reviews Button
        load_more_reviews.classList.add("load_more_reviews") // Adds The Load More Reviews Class
        load_more_reviews.textContent = gettext("Zobraziť viac")
        load_reviews_buttons.appendChild(load_more_reviews) // Appends The Load More Reviews Button To The Load Reviews Buttons Container
    }

    (load_reviews_buttons.querySelector(".load_more_reviews") as HTMLButtonElement).dataset["page"] = "2" // Stores And Sets The Number Of The Next Page Back To Default
}

// Function For Report The Review
export async function reportReview(id:number, reason:string):Promise<void> {
    try {
        const report_review_data:{
            review_id:number,
            reason:string
        } = {
            review_id: id,
            reason
        }

        const report_review_response:response = await sendPOST(window.location.pathname, report_review_data, "report-review") // Sends Reported Review Data As A POST Data

        // If The Response Isn't Success
        if(!report_review_response.success) {
            displayMessage(report_review_response.message, "error") // Displays The Error Message
            return
        }

        displayMessage(report_review_response.message, "success") // Displays The Success Message
    }

    catch {
        displayMessage(gettext("Pri odosielaní nahlásenia došlo k chybe."), "error") // Displays The Error Message
    }
}

// Function For Delete The Review
export async function deleteReview(id:number, review:HTMLDivElement):Promise<void> {
    try {
        const delete_review_response:response = await sendPOST(window.location.pathname, id, "delete-review") // Sends Review ID As A POST Data

        // If The Response Isn't Success
        if(!delete_review_response.success) {
            displayMessage(delete_review_response.message, "error") // Displays The Error Message
            return
        }

        review.remove() // Deletes The Review Container From DOM
        displayMessage(delete_review_response.message, "success") // Displays The Success Message
    }

    catch {
        displayMessage(gettext("Pri odstraňovaní recenzie došlo k chybe."), "error") // Displays The Error Message
    }
}