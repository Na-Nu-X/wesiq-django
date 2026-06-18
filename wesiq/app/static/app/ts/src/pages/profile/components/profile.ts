import { sendPOST } from "../../../services/sendPOST.js"
import { displayMessage } from "../../../utils/displayMessage.js"
import { toggleFollow } from "../../community/functions/toggleFollow.js"

import type { response } from "../../../services/sendPOST.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Account Properties Menu

    // Variables

    const profile_container:HTMLDivElement = document.querySelector(".profile_container") as HTMLDivElement // Gets The Profile Container
    const report_profile:HTMLDivElement = profile_container.querySelector(".options_container .report_profile") as HTMLDivElement // Gets The Report Profile

    // Functions

    // Function For Report The User
    async function reportUser(id:number, reason:string):Promise<void> {
        try {
            const report_user_data:{
                reported_user_id:number,
                reason:string
            } = {
                reported_user_id: id,
                reason
            }

            const report_user_response:response = await sendPOST(window.location.pathname, report_user_data, "report-user") // Sends Reported User Data As A POST Data

            // If The Response Isn't Success
            if(!report_user_response.success) {
                displayMessage(report_user_response.message, "error") // Displays The Error Message
                return
            }

            displayMessage(report_user_response.message, "success") // Displays The Success Message
        }

        catch {
            displayMessage(gettext("Pri odosielaní nahlásenia došlo k chybe."), "error") // Displays The Error Message
        }
    }

    // Events

    // Report Profile Click Functionality
    report_profile.addEventListener("click", function(event:PointerEvent):void {
        const report_button:HTMLButtonElement = event.target as HTMLButtonElement // Gets The Report Button
        const report_reason:string|null = report_button.dataset["reason"] || null // Gets The Report Reason

        if(profile_container.dataset["user_id"] && report_reason) reportUser(Number(profile_container.dataset["user_id"]), report_reason) // Reports The User
    })

    // Toggle Follow

    // Variables

    const follow_button:HTMLButtonElement|null = document.querySelector(".profile_container .profile .middle .follow_container .follow_button") as HTMLButtonElement || null // Gets The Follow Button If Is Available

    // Events

    // Follow Button Click Functionalities
    if(follow_button) {
        follow_button.addEventListener("click", function():void {
            const clicked_user_id:number|null = Number(follow_button.dataset["id"]) || null // Gets Clicked User ID
            toggleFollow(null, follow_button, clicked_user_id) // Adds Or Removes The Follow
        })
    }
})