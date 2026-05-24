import { sendPOST } from "../../../services/sendPOST.js"
import { displayMessage } from "../../../utils/displayMessage.js"

import type { response } from "../../../services/sendPOST.js"

// Function For Toggle Completion Of The User's Custom Task
export async function toggleCompleteCustomTask(id:number):Promise<void> {
    try {
        const toggle_complete_custom_task_response:response = await sendPOST(window.location.pathname, id, "toggle-complete-custom-task") // Sends The Custom Task ID As A POST Data

        // If The Response Isn't Success
        if(!toggle_complete_custom_task_response.success) {
            displayMessage(toggle_complete_custom_task_response.message, "error") // Displays The Error Message
            return
        }
    }

    catch {
        displayMessage(gettext("Pri zmene stavu úlohy došlo k chybe."), "error") // Displays The Error Message
    }
}

export async function deleteCustomTask(id:number, task:HTMLDivElement):Promise<void> {
    try {
        const delete_custom_task_response:response = await sendPOST(window.location.pathname, id, "delete-custom-task") // Sends The Custom Task ID As A POST Data

        // If The Response Isn't Success
        if(!delete_custom_task_response.success) {
            displayMessage(delete_custom_task_response.message, "error") // Displays The Error Message
            return
        }
    }

    catch {
        displayMessage(gettext("Pri odstraňovaní úlohy došlo k chybe."), "error") // Displays The Error Message
    }

    finally {
        task.remove() // Removes The Task From The DOM
    }
}