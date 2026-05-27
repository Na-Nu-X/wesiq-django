import { sendPOST } from "../../../services/sendPOST.js"
import { displayMessage } from "../../../utils/displayMessage.js"
import { activity_summary } from "../state.js"

interface completedOfficialTaskResponse {
    success: boolean,
    progress_percentage:number,
    is_completed:boolean,
    first_completion:boolean,
    gained_xp: number,
    message: string
}

// Function For Initialize The Completion Progress Of The Official Tasks
export function initializeOfficialTasksProgression():void {
    const MAX_RED:number = 255
    const MIN_RED:number = 82

    const todo:HTMLDivElement = document.querySelector(".todo") as HTMLDivElement // Gets The TODO Container
    const official_tasks:HTMLDivElement = todo.querySelector(".official_tasks") as HTMLDivElement // Gets The Official Tasks Container
    const tasks:HTMLDivElement = official_tasks.querySelector(".tasks") as HTMLDivElement // Gets The Tasks Container
    const all_tasks:NodeListOf<HTMLDivElement> = tasks.querySelectorAll(".task") // Gets All Tasks

    all_tasks.forEach(function(one_task:HTMLDivElement):void {
        const progress_percentage:number = Number(one_task.dataset["progress_percentage"]) || 0 // Gets The Progress Percentage Of The Task
        let red:number = MAX_RED - (progress_percentage / 100) * (MAX_RED - MIN_RED) // Makes Color Transition For Progress Bar From rgb(255, 207, 32) To rgb(82, 207, 32)

        one_task.style.setProperty("--progress", String(progress_percentage)) // Sets The Progress
        one_task.style.setProperty("--progress-color", `rgba(${red}, 207, 32, 0.1)`) // Sets The Progress Color
    })
}

// Function For Check The Official Tasks
export function checkOfficialTasksCompletion():void {
    const MAX_RED:number = 255
    const MIN_RED:number = 82

    const todo:HTMLDivElement = document.querySelector(".todo") as HTMLDivElement // Gets The TODO Container
    const official_tasks:HTMLDivElement = todo.querySelector(".official_tasks") as HTMLDivElement // Gets The Official Tasks Container
    const tasks:HTMLDivElement = official_tasks.querySelector(".tasks") as HTMLDivElement // Gets The Tasks Container

    const _30_minutes_activity:HTMLDivElement|null = tasks.querySelector("[data-task='30_minutes_activity']") || null // Gets The "30 Minutes Activity" Official Task If Is Available
    const _1_hour_activity:HTMLDivElement|null = tasks.querySelector("[data-task='1_hour_activity']") || null // Gets The "1 Hour Activity" Official Task If Is Available
    const _2_hours_activity:HTMLDivElement|null = tasks.querySelector("[data-task='2_hours_activity']") || null // Gets The "2 Hours Activity" Official Task If Is Available
    const _3_hours_activity:HTMLDivElement|null = tasks.querySelector("[data-task='3_hours_activity']") || null // Gets The "3 Hours Activity" Official Task If Is Available
    const beat_average_activity_time:HTMLDivElement|null = tasks.querySelector("[data-task='beat_average_activity_time']") || null // Gets The "Beat Average Activity Time" Official Task If Is Available

    const average_activity_time:number = Number((document.querySelector(".activity .previous_activity .top .average_activity_time_container p .average_activity_time") as HTMLSpanElement).dataset["average_activity_time"]) || 0 // Gets The Weekly Average Activity Time

    // 30 Minutes Activity
    if(_30_minutes_activity) {
        const checkbox:HTMLDivElement = _30_minutes_activity.querySelector(".checkbox") as HTMLDivElement // Gets The Custom Checkbox Container

        // If The Task Isn't Already Completed
        if(!checkbox.classList.contains("checked")) {
            const progress:number = (activity_summary.elapsed_time / (3600 / 2)) * 100 // Calculates The Progress
    
            if(progress <= 100) {
                let red:number = MAX_RED - (progress / 100) * (MAX_RED - MIN_RED) // Makes Color Transition For Progress Bar From rgb(255, 207, 32) To rgb(82, 207, 32)
        
                _30_minutes_activity.style.setProperty("--progress", String(progress)) // Sets The Progress
                _30_minutes_activity.style.setProperty("--progress-color", `rgba(${red}, 207, 32, 0.1)`) // Sets The Progress Color
    
                // 100% Completed
                if(progress === 100) {
                    completeOfficialTask("30_minutes_activity", _30_minutes_activity) // Completes The "30 Minutes Activity" Official Task
                }
            }
        }
    }

    // 1 Hour Activity
    if(_1_hour_activity) {
        const checkbox:HTMLDivElement = _1_hour_activity.querySelector(".checkbox") as HTMLDivElement // Gets The Custom Checkbox Container

        // If The Task Isn't Already Completed
        if(!checkbox.classList.contains("checked")) {
            const progress:number = (activity_summary.elapsed_time / 3600) * 100 // Calculates The Progress

            if(progress <= 100) {
                let red:number = MAX_RED - (progress / 100) * (MAX_RED - MIN_RED) // Makes Color Transition For Progress Bar From rgb(255, 207, 32) To rgb(82, 207, 32)

                _1_hour_activity.style.setProperty("--progress", String(progress)) // Sets The Progress
                _1_hour_activity.style.setProperty("--progress-color", `rgba(${red}, 207, 32, 0.1)`) // Sets The Progress Color

                // 100% Completed
                if(progress === 100) {
                    completeOfficialTask("1_hour_activity", _1_hour_activity) // Completes The "1 Hour Activity" Official Task
                }
            }
        }
    }

    // 2 Hours Activity
    if(_2_hours_activity) {
        const checkbox:HTMLDivElement = _2_hours_activity.querySelector(".checkbox") as HTMLDivElement // Gets The Custom Checkbox Container

        // If The Task Isn't Already Completed
        if(!checkbox.classList.contains("checked")) {
            const progress:number = (activity_summary.elapsed_time / (3600 * 2)) * 100 // Calculates The Progress

            if(progress <= 100) {
                let red:number = MAX_RED - (progress / 100) * (MAX_RED - MIN_RED) // Makes Color Transition For Progress Bar From rgb(255, 207, 32) To rgb(82, 207, 32)

                _2_hours_activity.style.setProperty("--progress", String(progress)) // Sets The Progress
                _2_hours_activity.style.setProperty("--progress-color", `rgba(${red}, 207, 32, 0.1)`) // Sets The Progress Color

                // 100% Completed
                if(progress === 100) {
                    completeOfficialTask("2_hours_activity", _2_hours_activity) // Completes The "2 Hours Activity" Official Task
                }
            }
        }
    }

    // 3 Hours Activity
    if(_3_hours_activity) {
        const checkbox:HTMLDivElement = _3_hours_activity.querySelector(".checkbox") as HTMLDivElement // Gets The Custom Checkbox Container

        // If The Task Isn't Already Completed
        if(!checkbox.classList.contains("checked")) {
            const progress:number = (activity_summary.elapsed_time / (3600 * 3)) * 100 // Calculates The Progress

            if(progress <= 100) {
                let red:number = MAX_RED - (progress / 100) * (MAX_RED - MIN_RED) // Makes Color Transition For Progress Bar From rgb(255, 207, 32) To rgb(82, 207, 32)

                _3_hours_activity.style.setProperty("--progress", String(progress)) // Sets The Progress
                _3_hours_activity.style.setProperty("--progress-color", `rgba(${red}, 207, 32, 0.1)`) // Sets The Progress Color

                // 100% Completed
                if(progress === 100) {
                    completeOfficialTask("3_hours_activity", _3_hours_activity) // Completes The "3 Hours Activity" Official Task
                }
            }
        }
    }

    // Longer Activity Than The Weekly Average Activity
    if(beat_average_activity_time) {
        const checkbox:HTMLDivElement = beat_average_activity_time.querySelector(".checkbox") as HTMLDivElement // Gets The Custom Checkbox Container

        // If The Task Isn't Already Completed
        if(!checkbox.classList.contains("checked")) {
            const progress:number = (activity_summary.elapsed_time / average_activity_time) * 100 // Calculates The Progress

            if(progress <= 100) {
                let red:number = MAX_RED - (progress / 100) * (MAX_RED - MIN_RED) // Makes Color Transition For Progress Bar From rgb(255, 207, 32) To rgb(82, 207, 32)

                beat_average_activity_time.style.setProperty("--progress", String(progress)) // Sets The Progress
                beat_average_activity_time.style.setProperty("--progress-color", `rgba(${red}, 207, 32, 0.1)`) // Sets The Progress Color

                // 100% Completed
                if(progress === 100) {
                    completeOfficialTask("beat_average_activity_time", beat_average_activity_time) // Completes The "Beat Average Activity Time" Official Task
                }
            }
        }
    }
}

// Function For Complete Official Task
export async function completeOfficialTask(task:string, task_container:HTMLDivElement):Promise<void> {
    try {
        const completed_official_task_response:completedOfficialTaskResponse = await sendPOST(window.location.pathname, task, "complete-official-task") // Sends The Completed Task As A POST Data

        // If The Response Isn't Success
        if(!completed_official_task_response.success) {
            displayMessage(completed_official_task_response.message, "error") // Displays The Error Message
            return
        }

        // If The User's Daily Official Task Wasn't Previously Completed
        if(completed_official_task_response.first_completion) {
            // If The Task Was Completed
            if(completed_official_task_response.is_completed) {
                const checkbox:HTMLDivElement = task_container.querySelector(".checkbox") as HTMLDivElement // Gets The Custom Checkbox Container

                // activity_summary.gained_xp += completed_official_task_response.gained_xp // Increases The Gained XP For The Activity

                window.setTimeout(function() {
                    displayMessage(`+${completed_official_task_response.gained_xp} XP`, "success") // Displays The Amount Of Gained XP For The Completed Task
                }, 100)

                checkbox.classList.add("checked") // Marks The Checkbox As Checked
            }

            task_container.dataset["progress_percentage"] = String(completed_official_task_response.progress_percentage) // Updates The Progress Percentage Of The Task
            initializeOfficialTasksProgression() // Initializes The Completion Progress Of The Official Tasks

            // Completes The "Complete All Official Tasks" Official Task

            const tasks:HTMLDivElement = task_container.parentElement as HTMLDivElement // Gets The Tasks Container
            const complete_all_official_tasks:HTMLDivElement|null = tasks.querySelector("[data-task='complete_all_official_tasks']") || null; // Gets The "Complete All Official Tasks" Official Task If Is Available

            // Checks If All Official Tasks Were Completed
            if(complete_all_official_tasks) {
                const checkbox:HTMLDivElement = complete_all_official_tasks.querySelector(".checkbox") as HTMLDivElement // Gets The Custom Checkbox Container

                // If The Task Isn't Already Completed
                if(!checkbox.classList.contains("checked")) {
                    const all_tasks:NodeListOf<HTMLDivElement> = tasks.querySelectorAll(".task"); // Gets All Tasks
                    const all_tasks_except_complete_all_official_tasks = [...all_tasks].filter(one_task => one_task.dataset["task"] !== "complete_all_official_tasks")

                    const has_completed_all_official_tasks:boolean = [...all_tasks_except_complete_all_official_tasks].every(function(one_task:HTMLDivElement) {
                        if(one_task.dataset["task"] !== "complete_all_official_tasks") {
                            const checkbox:HTMLDivElement = one_task.querySelector(".checkbox") as HTMLDivElement // Gets The Custom Checkbox Container
                            return checkbox.classList.contains("checked")
                        }
                    })
        
                    if(has_completed_all_official_tasks) completeOfficialTask("complete_all_official_tasks", complete_all_official_tasks)
                }
            }
        }
    }

    catch {
        displayMessage(gettext("Pri označovaní úlohy za dokončenú došlo k chybe."), "error") // Displays The Error Message
    }
}