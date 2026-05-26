import { sendPOST } from "../../../services/sendPOST.js"
import { displayMessage } from "../../../utils/displayMessage.js"
import { getFormattedDate } from "../../../utils/getFormattedDate.js"

import type { response } from "../../../services/sendPOST.js"

interface addCustomTaskResponse {
    success: boolean,
    custom_task:customTask,
    message: string
}

interface customTask {
    id:number,
    title:string,
    created_at:string
}

// Function For Add The Custom Task
export async function addCustomTask(new_task:HTMLInputElement, task_container:HTMLDivElement, tasks:HTMLDivElement):Promise<void> {
    try {
        const add_custom_task_response:addCustomTaskResponse = await sendPOST(window.location.pathname, new_task.value, "add-custom-task") // Sends The Custom Task Title As A POST Data

        // If The Response Isn't Success
        if(!add_custom_task_response.success) {
            displayMessage(add_custom_task_response.message, "error") // Displays The Error Message
            return
        }

        tasks.appendChild(createCustomTaskHTML(task_container, add_custom_task_response.custom_task)) // Appends The New Custom Task To The Tasks Container
    }

    catch {
        displayMessage(gettext("Pri pridávaní úlohy došlo k chybe."), "error") // Displays The Error Message
    }

    finally {
        new_task.value = "" // Deletes The New Task Input Value
    }
}

// Function For Create The Custom Task HTML
function createCustomTaskHTML(task_container:HTMLDivElement, data:customTask):HTMLDivElement {
    task_container.dataset["task_id"] = String(data.id) // Stores The Task ID

    // Title
    const title_label:HTMLLabelElement = task_container.querySelector(".title") as HTMLLabelElement // Gets The Title Label
    title_label.htmlFor = `custom_task_${data.id}` // Links The Label To The Checkbox
    title_label.textContent = data.title // Shows The Title

    // Date
    const date:HTMLParagraphElement = task_container.querySelector(".date") as HTMLParagraphElement // Gets The Date Paragraph
    date.textContent = getFormattedDate(data.created_at, false) // Shows The Formatted Date

    // Checkbox
    const checkbox_input:HTMLInputElement = task_container.querySelector("input[type='checkbox']") as HTMLInputElement // Gets The Checkbox Input
    checkbox_input.id = `custom_task_${data.id}` // Sets The ID

    // Show Custom Task Properties Button
    const show_custom_task_properties_button:HTMLButtonElement = task_container.querySelector(".show_custom_task_properties_button") as HTMLButtonElement // Gets The Show Custom Task Properties Button
    show_custom_task_properties_button.setAttribute("popovertarget", `custom_task_properties_${data.id}`) // Links The Pop Over
    show_custom_task_properties_button.style = `anchor-name: --show_custom_task_properties_button_${data.id}` // Creates The Anchor

    // Custom Task Properties Menu
    const custom_task_properties:HTMLDivElement = task_container.querySelector(".custom_task_properties") as HTMLDivElement // Gets The Custom Task Properties Menu
    custom_task_properties.id = `custom_task_properties_${data.id}` // Sets The ID
    custom_task_properties.style = `position-anchor: --show_custom_task_properties_button_${data.id}`; // Links The Anchor

    // Hide Custom Task Properties Button
    const hide_custom_task_properties_button:HTMLButtonElement = custom_task_properties.querySelector(".hide_custom_task_properties_button") as HTMLButtonElement // Gets The Hide Custom Task Properties Button
    hide_custom_task_properties_button.setAttribute("popovertarget", `custom_task_properties_${data.id}`) // Links The Pop Over

    return task_container // Returns The Task Container
}

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