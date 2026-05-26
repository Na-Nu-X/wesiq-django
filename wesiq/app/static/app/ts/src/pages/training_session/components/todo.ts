import { initializeOfficialTasksProgression } from "../functions/officialTasksCompletion.js"

import { 
    addCustomTask,
    toggleCompleteCustomTask,
    deleteCustomTask
} from "../functions/customTasksCompletion.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Official Tasks

    // Initialization

    initializeOfficialTasksProgression() // Initializes The Completion Progress Of The Official Tasks

    // Custom Tasks

    // Variables

    const todo:HTMLDivElement = document.querySelector(".todo") as HTMLDivElement // Gets The TODO Container
    const custom_tasks:HTMLDivElement = todo.querySelector(".custom_tasks") as HTMLDivElement // Gets The Custom Tasks Container
    const tasks:HTMLDivElement = custom_tasks.querySelector(".tasks") as HTMLDivElement // Gets The Tasks Container

    const add_task_container:HTMLDivElement = tasks.querySelector(".add_task_container") as HTMLDivElement // Gets The Add Task Container
    const new_task:HTMLInputElement = add_task_container.querySelector(".new_task") as HTMLInputElement // Gets The New Task Input
    const add_task:HTMLButtonElement = add_task_container.querySelector(".add_task") as HTMLButtonElement // Gets The Add Task Button

    const custom_task_template:HTMLTemplateElement = tasks.querySelector(".custom_task_template") as HTMLTemplateElement // Gets The Custom Task Template
    const custom_task_template_clone:DocumentFragment = custom_task_template.content.cloneNode(true) as DocumentFragment // Clones The Custom Task Template Content
    const custom_task_container:HTMLDivElement = custom_task_template_clone.querySelector(".task") as HTMLDivElement // Gets The Custom Task Container

    // Events

    // Add Task Click Functionality
    add_task.addEventListener("click", function():void {
        if(new_task.value !== "") {
            addCustomTask(new_task, custom_task_container, tasks) // Adds The Custom Task
        }
    })

    // Global Event Delegations

    // Tasks Change Functionalities
    tasks.addEventListener("change", function(event:Event):void {
        // Toggle Custom Task Completion
        if(event.target instanceof HTMLInputElement && (event.target as HTMLInputElement).type === "checkbox") {
            const checkbox:HTMLInputElement = event.target as HTMLInputElement // Gets The Clicked Checkbox
            const task:HTMLDivElement = checkbox.closest(".task") as HTMLDivElement // Gets The Custom Task
            const task_id:number|null = Number(task.dataset["task_id"]) || null // Gets The Task ID

            if(task_id) toggleCompleteCustomTask(task_id) // Toggles Completion Of The User's Custom Task
        }
    })

    // Tasks Click Functionalities
    tasks.addEventListener("click", function(event:PointerEvent):void {
        // Delete Custom Task
        if((event.target as HTMLButtonElement).closest(".custom_task_properties")) {
            const delete_button:HTMLButtonElement = event.target as HTMLButtonElement // Gets The Delete Button
            const action:string|null = delete_button.dataset["action"] || null // Gets The Action
            const task:HTMLDivElement = delete_button.closest(".task") as HTMLDivElement // Gets The Custom Task
            const task_id:number|null = Number(task.dataset["task_id"]) || null // Gets The Task ID

            if(action && action == "delete" && task_id) deleteCustomTask(task_id, task) // Deletes The User's Custom Task
        }
    })
})