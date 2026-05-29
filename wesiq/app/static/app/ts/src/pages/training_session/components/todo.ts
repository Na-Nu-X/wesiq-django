import { 
    initializeOfficialTasksProgression,
    completeOfficialTask
} from "../functions/officialTasksCompletion.js"

import { 
    addCustomTask,
    toggleCompleteCustomTask,
    deleteCustomTask,
    initializeCustomTasksAmount,
    deleteAllCompletedCustomTasks,
    changeCustomTasksOrder
} from "../functions/customTasksCompletion.js"

import { custom_tasks_state } from "../state.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Official Tasks

    // Variables

    const todo:HTMLDivElement = document.querySelector(".todo") as HTMLDivElement // Gets The TODO Container
    const official_tasks_container:HTMLDivElement = todo.querySelector(".official_tasks") as HTMLDivElement // Gets The Official Tasks Container
    const official_tasks:HTMLDivElement = official_tasks_container.querySelector(".tasks") as HTMLDivElement // Gets The Tasks Container

    const add_custom_task:HTMLDivElement|null = official_tasks.querySelector("[data-task='add_custom_task']") || null // Gets The "Add Custom Task" Official Task If Is Available

    const success_sound:HTMLAudioElement = todo.querySelector(".success_sound") as HTMLAudioElement // Gets The Success Sound

    // Initialization

    initializeOfficialTasksProgression() // Initializes The Completion Progress Of The Official Tasks

    // Custom Tasks

    // Variables

    const custom_tasks_container:HTMLDivElement = todo.querySelector(".custom_tasks") as HTMLDivElement // Gets The Custom Tasks Container
    const custom_tasks:HTMLDivElement = custom_tasks_container.querySelector(".tasks") as HTMLDivElement // Gets The Tasks Container

    const add_task_container:HTMLDivElement = custom_tasks.querySelector(".add_task_container") as HTMLDivElement // Gets The Add Task Container
    const new_task:HTMLInputElement = add_task_container.querySelector(".new_task") as HTMLInputElement // Gets The New Task Input
    const add_task:HTMLButtonElement = add_task_container.querySelector(".add_task") as HTMLButtonElement // Gets The Add Task Button

    const custom_task_template:HTMLTemplateElement = custom_tasks.querySelector(".custom_task_template") as HTMLTemplateElement // Gets The Custom Task Template

    const delete_completed:HTMLButtonElement = custom_tasks_container.querySelector(".info .delete_completed") as HTMLButtonElement // Gets The Delete All Completed Custom Tasks Button
    const tasks_amount:HTMLParagraphElement = custom_tasks_container.querySelector(".info .tasks_amount") as HTMLParagraphElement // Gets The Tasks Amount Paragraph

    // Events

    // Add Task Click Functionality
    add_task.addEventListener("click", async function():Promise<void> {
        if(new_task.value !== "") {
            await addCustomTask(new_task, custom_task_template, custom_tasks) // Adds The Custom Task
            initializeCustomTasksAmount(tasks_amount, custom_tasks) // Updates The Total Custom Tasks Amount

            // "Add Custom Task" Official Task
            if(add_custom_task) {
                const checkbox:HTMLDivElement = add_custom_task.querySelector(".checkbox") as HTMLDivElement // Gets The Custom Checkbox Container

                // If The Task Isn't Already Completed
                if(!checkbox.classList.contains("checked")) {
                    completeOfficialTask("add_custom_task", add_custom_task, success_sound) // Completes The "Add Custom Task" Official Task
                }
            }
        }
    })

    // Delete All Completed Custom Tasks Click Functionality
    delete_completed.addEventListener("click", async function():Promise<void> {
        await deleteAllCompletedCustomTasks(custom_tasks) // Deletes All Completed Custom Tasks
        initializeCustomTasksAmount(tasks_amount, custom_tasks) // Updates The Remaining And Total Custom Tasks Amount
    })

    // Global Event Delegations

    // Custom Tasks Change Functionalities
    custom_tasks.addEventListener("change", function(event:Event):void {
        // Toggle Custom Task Completion
        if(event.target instanceof HTMLInputElement && (event.target as HTMLInputElement).type === "checkbox") {
            const checkbox:HTMLInputElement = event.target as HTMLInputElement // Gets The Clicked Checkbox
            const task:HTMLDivElement = checkbox.closest(".task") as HTMLDivElement // Gets The Custom Task
            const task_id:number|null = Number(task.dataset["task_id"]) || null // Gets The Task ID

            if(task_id) {
                toggleCompleteCustomTask(task_id) // Toggles Completion Of The User's Custom Task
                initializeCustomTasksAmount(tasks_amount, custom_tasks) // Updates The Remaining Custom Tasks Amount
            }
        }
    })

    // Custom Tasks Click Functionalities
    custom_tasks.addEventListener("click", async function(event:PointerEvent):Promise<void> {
        // Delete Custom Task
        if((event.target as HTMLButtonElement).closest(".custom_task_properties")) {
            const delete_button:HTMLButtonElement = event.target as HTMLButtonElement // Gets The Delete Button
            const action:string|null = delete_button.dataset["action"] || null // Gets The Action
            const task:HTMLDivElement = delete_button.closest(".task") as HTMLDivElement // Gets The Custom Task
            const task_id:number|null = Number(task.dataset["task_id"]) || null // Gets The Task ID

            if(action && action == "delete" && task_id) {
                await deleteCustomTask(task_id, task) // Deletes The User's Custom Task
                initializeCustomTasksAmount(tasks_amount, custom_tasks) // Updates The Remaining And Total Custom Tasks Amount
            }
        }
    })

    // Custom Tasks Drag Start Functionalities
    custom_tasks.addEventListener("dragstart", function(event:DragEvent):void {
        custom_tasks_state.dragged_task = event.target as HTMLDivElement
    })

    // Custom Tasks Drag End Functionalities
    custom_tasks.addEventListener("dragend", function():void {
        custom_tasks_state.dragged_task = null
    })

    // Custom Tasks Drag Over Functionalities
    custom_tasks.addEventListener("dragover", function(event:DragEvent):void {
        event.preventDefault() // Prevents Default Behaviour
    })

    // Custom Tasks Drop Functionalities
    custom_tasks.addEventListener("drop", function(event:DragEvent):void {
        const task:HTMLDivElement = (event.target as HTMLElement).closest(".task") as HTMLDivElement // Gets The Task
        if(custom_tasks_state.dragged_task) changeCustomTasksOrder(custom_tasks_state.dragged_task, task, this) // Changes The Order Of The Custom Tasks
    })

    // Initialization

    initializeCustomTasksAmount(tasks_amount, custom_tasks) // Initializes The Remaining Custom Tasks Amount
})