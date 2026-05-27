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
export async function addCustomTask(new_task:HTMLInputElement, custom_task_template:HTMLTemplateElement, tasks:HTMLDivElement):Promise<void> {
    const custom_task_template_clone:DocumentFragment = custom_task_template.content.cloneNode(true) as DocumentFragment // Clones The Custom Task Template Content
    const custom_task_container:HTMLDivElement = custom_task_template_clone.querySelector(".task") as HTMLDivElement // Gets The Custom Task Container

    try {
        const add_custom_task_response:addCustomTaskResponse = await sendPOST(window.location.pathname, new_task.value, "add-custom-task") // Sends The Custom Task Title As A POST Data

        // If The Response Isn't Success
        if(!add_custom_task_response.success) {
            displayMessage(add_custom_task_response.message, "error") // Displays The Error Message
            return
        }

        const latest_task:HTMLDivElement|null = tasks.querySelector(".task") as HTMLDivElement || null // Gets The Latest Task If There Is Any

        if(latest_task) tasks.insertBefore(createCustomTaskHTML(custom_task_container, add_custom_task_response.custom_task), latest_task) // Prepends The New Custom Task To The Tasks Container
        else tasks.appendChild(createCustomTaskHTML(custom_task_container, add_custom_task_response.custom_task)) // Appends The New Custom Task To The Tasks Container
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

// Function For Delete Custom Task
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

// Function For Initialize The Custom Tasks Amount
export function initializeCustomTasksAmount(tasks_amount:HTMLSpanElement, tasks:HTMLDivElement):void {
    const remaining:HTMLSpanElement = tasks_amount.querySelector(".remaining") as HTMLSpanElement // Gets The Remaining Part From The Tasks Amount Paragraph
    const total:HTMLSpanElement = tasks_amount.querySelector(".total") as HTMLSpanElement // Gets The Total Part From The Tasks Amount Paragraph
    const all_tasks:NodeListOf<HTMLDivElement> = tasks.querySelectorAll<HTMLDivElement>(".task") // Gets All Tasks
    const all_completed_tasks:HTMLDivElement[] = [...all_tasks].filter(one_task => (one_task.querySelector("input[type='checkbox']") as HTMLInputElement).checked) // Gets All Completed Tasks

    remaining.textContent = String(all_completed_tasks.length) // Sets The Remaining Amount
    total.textContent = String(all_tasks.length) // Sets The Total Amount
}

// Function For Delete All Completed Custom Tasks
export async function deleteAllCompletedCustomTasks(tasks:HTMLDivElement):Promise<void> {
    const all_tasks:NodeListOf<HTMLDivElement> = tasks.querySelectorAll<HTMLDivElement>(".task"); // Gets All Tasks
    const all_completed_tasks:HTMLDivElement[] = [...all_tasks].filter(one_task => (one_task.querySelector("input[type='checkbox']") as HTMLInputElement).checked) // Gets All Completed Tasks

    // If There Is Any Already Completed Custom Task
    if(all_completed_tasks.length > 0) {
        const completed_custom_tasks_ids:number[] = [] // Stores The Completed Custom Tasks IDs
        
        all_completed_tasks.forEach(function(one_task:HTMLDivElement):void {
            const task_id:number|null = Number(one_task.dataset["task_id"]) || null // Gets The Task ID
            if(task_id) completed_custom_tasks_ids.push(task_id) // Adds The Task ID To The Array Of The Completed Tasks IDs
        })
    
        try {
            const delete_completed_custom_tasks_response:response = await sendPOST(window.location.pathname, completed_custom_tasks_ids, "delete-completed-custom-tasks") // Sends The All Custom Task IDs For Deletion As A POST Data
    
            // If The Response Isn't Success
            if(!delete_completed_custom_tasks_response.success) {
                displayMessage(delete_completed_custom_tasks_response.message, "error") // Displays The Error Message
                return
            }
        }
    
        catch {
            displayMessage(gettext("Pri odstraňovaní úloh došlo k chybe."), "error") // Displays The Error Message
        }
    
        finally {
            all_completed_tasks.forEach(one_task => one_task.remove()) // Removes The Completed Tasks From The DOM
        }
    }
}

// Function For Change The Order Of The Custom Tasks
export async function changeCustomTasksOrder(dragged_task:HTMLDivElement, dropped_on_task:HTMLDivElement, tasks:HTMLDivElement):Promise<void> {
    const all_tasks:NodeListOf<HTMLDivElement> = tasks.querySelectorAll<HTMLDivElement>(".task") // Gets All Tasks
    const dragged_task_index:number = [...all_tasks].indexOf(dragged_task) // Gets The Task Index
    const dropped_on_task_index:number = [...all_tasks].indexOf(dropped_on_task) // Gets The Dropped On Task Index

    if(dragged_task_index === dropped_on_task_index) return // Do Nothing If The Task Postition Is The Same

    // Drag To Higher Position
    else if(dragged_task_index > dropped_on_task_index) {
        tasks.insertBefore(dragged_task, dropped_on_task)
    }
    
    // Drag To Lower Position
    else if(dragged_task_index < dropped_on_task_index) {
        tasks.insertBefore(dragged_task, dropped_on_task.nextSibling)
    }

    const new_all_tasks:NodeListOf<HTMLDivElement> = tasks.querySelectorAll<HTMLDivElement>(".task") // Gets All Tasks With New Orders

    const tasks_ids:number[] = [] // Stores The IDs Of All Custom Tasks

    new_all_tasks.forEach(function(one_task:HTMLDivElement):void {
        const task_id:number|null = Number(one_task.dataset["task_id"]) || null // Gets The Task ID
        if(task_id) tasks_ids.push(task_id) // Adds The Task ID To The Array Of The All Tasks IDs
    })

    try {
        const change_custom_tasks_order_response:response = await sendPOST(window.location.pathname, tasks_ids, "change-custom-tasks-order") // Sends The All Custom Task IDs For Deletion As A POST Data

        // If The Response Isn't Success
        if(!change_custom_tasks_order_response.success) {
            displayMessage(change_custom_tasks_order_response.message, "error") // Displays The Error Message
            return
        }
    }

    catch {
        displayMessage(gettext("Pri pokuse o zmenu poradia úloh došlo k chybe."), "error") // Displays The Error Message
    }
}