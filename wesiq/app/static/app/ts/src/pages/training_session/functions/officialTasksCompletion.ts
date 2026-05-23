import { sendPOST } from "../../../services/sendPOST.js"
import { displayMessage } from "../../../utils/displayMessage.js"
import { activity_summary } from "../state.js"

interface completedOfficialTaskResponse {
    success: boolean,
    gained_xp: number,
    message: string
}

// Function For Check The Official Tasks
export function checkOfficialTasksCompletion():void {
    const todo:HTMLDivElement = document.querySelector(".todo") as HTMLDivElement // Gets The TODO Container
    const official_tasks:HTMLDivElement = todo.querySelector(".official_tasks") as HTMLDivElement // Gets The Official Tasks Container
    const tasks:HTMLDivElement = official_tasks.querySelector(".tasks") as HTMLDivElement // Gets The Tasks Container
    const all_tasks = tasks.querySelectorAll<HTMLDivElement>(".task") // Gets All Tasks

    all_tasks.forEach(function(one_task:HTMLDivElement):void {
        const task_data:string|null = one_task.dataset["task"] || null // Gets The Task Data

        // 30 Minutes Activity
        if(activity_summary.elapsed_time === 3600 / 2) {
            if(task_data === "30_minutes_activity") {
                completeOfficialTask(task_data) // Completes The "30 Minutes Activity" Official Task
            }
        }

        // 1 Hour Activity
        if(activity_summary.elapsed_time === 3600) {
            if(task_data === "1_hour_activity") {
                completeOfficialTask(task_data) // Completes The "1 Hour Activity" Official Task
            }
        }

        // 2 Hours Activity
        else if(activity_summary.elapsed_time === 3600 * 2) {
            if(task_data === "2_hours_activity") {
                completeOfficialTask(task_data) // Completes The "2 Hours Activity" Official Task
            }
        }

        // 3 Hours Activity
        else if(activity_summary.elapsed_time === 3600 * 3) {
            if(task_data === "3_hours_activity") {
                completeOfficialTask(task_data) // Completes The "3 Hours Activity" Official Task
            }
        }
    })
}

// Function For Complete Official Task
export async function completeOfficialTask(task:string):Promise<void> {
    try {
        const completed_official_task_response:completedOfficialTaskResponse = await sendPOST(window.location.pathname, task, "complete-official-task") // Sends The Completed Task As A POST Data

        // If The Response Isn't Success
        if(!completed_official_task_response.success) {
            displayMessage(completed_official_task_response.message, "error") // Displays The Error Message
            return
        }

        activity_summary.gained_xp += completed_official_task_response.gained_xp // Increases The Gained XP For The Activity
        displayMessage(`+${completed_official_task_response.gained_xp} XP`, "success") // Displays The Amount Of Gained XP For The Completed Task
    }

    catch {
        displayMessage(gettext("Pri označovaní úlohy za dokončenú došlo k chybe."), "error") // Displays The Error Message
    }
}