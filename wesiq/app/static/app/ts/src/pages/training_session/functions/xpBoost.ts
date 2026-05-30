import { sendPOST } from "../../../services/sendPOST.js"
import { displayMessage } from "../../../utils/displayMessage.js"
import { xp_boost_interval } from "../state.js"
import { getRemainingSecondsFromDate } from "./getRemainingSecondsFromDate.js"

interface XPBoostResponse {
    success: boolean,
    xp_boost_expiration_time:string,
    message: string
}

// Function For Use The Available XP Boost
export async function useXPBoost(current_activity_info:HTMLParagraphElement):Promise<void> {
    try {
        const xp_boost_response:XPBoostResponse = await sendPOST(window.location.pathname, "", "use-xp-boost")

        // If The Response Isn't Success
        if(!xp_boost_response.success) {
            displayMessage(xp_boost_response.message, "error") // Displays The Error Message
            return
        }

        // Initializes The Update Of The XP Boost Progress
        xp_boost_interval.interval = setInterval(function():void {
            xp_boost_interval.remaining_time = getRemainingSecondsFromDate(xp_boost_response.xp_boost_expiration_time) // Updates The Remaining Time

            const xp_boost_progress = 100 - ((xp_boost_interval.remaining_time / xp_boost_interval.max_remaining_time) * 100) // Gets Current Percentage Of Remaining Time Of XP Boost Progress
            current_activity_info.style.setProperty("--progress", `${xp_boost_progress}%`)
            current_activity_info.innerHTML = `<i class="fa-solid fa-bolt"></i> ${xp_boost_interval.amount}x` // https://fontawesome.com/icons/bolt

            // Stops XP Boost Timer When Remaining Time Pass
            if(xp_boost_interval.remaining_time === 0) {
                if(xp_boost_interval.interval) {
                    clearInterval(xp_boost_interval.interval)
                    xp_boost_interval.interval = null
                }

                xp_boost_interval.amount = 1 // Resets XP Boost Amount
                current_activity_info.innerHTML = gettext("<span>Žiadne aktívne navýšenie XP</span>")
            }
        }, xp_boost_interval.SPEED)
    }

    catch {
        displayMessage(gettext("Pri uplatňovaní navýšenia XP došlo k chybe."), "error") // Displays The Error Message
    }
}