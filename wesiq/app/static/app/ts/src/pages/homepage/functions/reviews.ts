import { sendPOST } from "../../../services/sendPOST.js"
import { displayMessage } from "../../../utils/displayMessage.js"

import type { response } from "../../../services/sendPOST.js"

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