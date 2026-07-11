import { sendPOST } from "../../../services/sendPOST.js"
import { displayMessage } from "../../../utils/displayMessage.js"

import type { response } from "../../../services/sendPOST.js"

// Function For Remove The Follower
export async function removeFollower(id:number):Promise<void> {
    try {
        const remove_follower_response:response = await sendPOST(window.location.pathname, id, "remove-follower") // Sends Follower ID As A POST Data

        // If The Response Isn't Success
        if(!remove_follower_response.success) {
            displayMessage(remove_follower_response.message, "error") // Displays The Error Message
            return
        }
    }

    catch {
        displayMessage(gettext("Pri odstraňovaní sledovateľa došlo k chybe."), "error") // Displays The Error Message
    }
}