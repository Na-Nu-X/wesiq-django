import { 
    toggleCompleteCustomTask,
    deleteCustomTask
 } from "../functions/customTasksCompletion.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Custom Tasks

    // Variables

    const todo:HTMLDivElement = document.querySelector(".todo") as HTMLDivElement // Gets The TODO Container
    const custom_tasks:HTMLDivElement = todo.querySelector(".custom_tasks") as HTMLDivElement // Gets The Custom Tasks Container
    const tasks:HTMLDivElement = custom_tasks.querySelector(".tasks") as HTMLDivElement // Gets The Tasks Container

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