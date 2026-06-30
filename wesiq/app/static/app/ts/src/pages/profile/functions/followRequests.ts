import { sendPOST } from "../../../services/sendPOST.js"
import { displayMessage } from "../../../utils/displayMessage.js"

import type { response } from "../../../services/sendPOST.js"

// Function For Approve The Follow Request
export async function approveFollowRequest(id:number):Promise<void> {
    try {
        const approve_follow_request_response:response = await sendPOST(window.location.pathname, id, "approve-follow-request") // Sends Follow Request ID As A POST Data

        // If The Response Isn't Success
        if(!approve_follow_request_response.success) {
            displayMessage(approve_follow_request_response.message, "error") // Displays The Error Message
            return
        }
    }

    catch {
        displayMessage(gettext("Pri potvrdení žiadosti o sledovanie došlo k chybe."), "error") // Displays The Error Message
    }
}

// Function For Reject The Follow Request
export async function rejectFollowRequest(id:number):Promise<void> {
    try {
        const reject_follow_request_response:response = await sendPOST(window.location.pathname, id, "reject-follow-request") // Sends Follow Request ID As A POST Data

        // If The Response Isn't Success
        if(!reject_follow_request_response.success) {
            displayMessage(reject_follow_request_response.message, "error") // Displays The Error Message
            return
        }
    }

    catch {
        displayMessage(gettext("Pri zamietnutí žiadosti o sledovanie došlo k chybe."), "error") // Displays The Error Message
    }
}