import { 
    global_state,
    new_training_plan_state,
    edit_training_plan_state,
    exercise_selection_state
} from "../state.js"

import { 
    startHold, 
    stopHold 
} from "../functions/holdButton.js"

import { 
    searchBar,
    deleteSearchBar,
    changeWeight
} from "../functions/exerciseSelection.js"

import { addExercise } from "../functions/exercises.js"

"use strict"

document.addEventListener("DOMContentLoaded", function() {
    // Variables

    const new_training_plan:HTMLDivElement = document.querySelector(".new_training_plan") as HTMLDivElement // Gets New Training Plan
    const edit_training_plan:HTMLDivElement = document.querySelector(".edit_training_plan") as HTMLDivElement // Gets Edit Training Plan

    const exercise_selection:HTMLDivElement = document.querySelector(".exercise_selection") as HTMLDivElement // Gets Exercise Selection
    const selection_exercises:NodeListOf<HTMLDivElement> = exercise_selection.querySelectorAll<HTMLDivElement>(".exercises .exercise") // Gets All Exercises From The Exercise Selection

    const search_bar:HTMLInputElement = exercise_selection.querySelector(".search_bar_menu .search_bar") as HTMLInputElement // Gets Search Bar Input
    const delete_search_bar:HTMLElement = exercise_selection.querySelector(".search_bar_menu .fa-xmark") as HTMLElement // Gets Delete Search Bar Button

    // Events
    
    search_bar.addEventListener("input", () => searchBar(search_bar, selection_exercises)) // Search Bar
    delete_search_bar.addEventListener("click", () => deleteSearchBar(search_bar, selection_exercises)) // Deletes The Search Bar

    // Selection Exercises Functionalities
    selection_exercises.forEach(function(one_exercise:HTMLDivElement):void {
        one_exercise.addEventListener("dragstart", () => global_state.selection_dragged_exercise = one_exercise) // Sets Selection Dragged Exercise
        one_exercise.addEventListener("dragend", () => global_state.selection_dragged_exercise = null) // Deletes Selection Dragged Exercise
        
        // Exercise Double Click Functionalities
        one_exercise.addEventListener("dblclick", function(event:MouseEvent):void {
            // Executes Only If The Click Is Outside The Increase Weight Button, Decrease Weight Button And Weight Print
            if((event.target instanceof Node) && !(event.target as HTMLDivElement).classList.contains("increase_weight") && !(event.target as HTMLDivElement).classList.contains("decrease_weight") && !(event.target.parentNode as HTMLDivElement).classList.contains("weight")) {
                global_state.selection_dragged_exercise = this // Sets Selection Dragged Exercise

                const page_url:URL = new URL(window.location.href) // Gets The Current URL Address
                
                if(page_url.searchParams.has("edit")) {
                    addExercise(edit_training_plan.querySelector(".training_plan") as HTMLDivElement, edit_training_plan_state) // Adds Dragged Exercise From Exercise Selection To The Training Plan (Edit Training Plan)
                }
                
                else {
                    addExercise(new_training_plan.querySelector(".training_plan") as HTMLDivElement, new_training_plan_state) // Adds Dragged Exercise From Exercise Selection To The Training Plan (New Training Plan)
                }
                
                global_state.selection_dragged_exercise = null // Deletes Selection Dragged Exercise
            }
        })

        // Exercise Pointer Down Functionalities
        one_exercise.addEventListener("pointerdown", function(event:PointerEvent):void {
            // Increase Weight
            if((event.target as HTMLDivElement).classList.contains("increase_weight")) {
                changeWeight(this, "increase") // Increases Weight
                startHold(() => changeWeight(this, "increase")) // Increases Weight On Hold
            }

            // Decrease Weight
            if((event.target as HTMLDivElement).classList.contains("decrease_weight")) {
                changeWeight(this, "decrease") // Decreases Weight
                startHold(() => changeWeight(this, "decrease")) // Decreases Weight On Hold
            }
        })

        one_exercise.addEventListener("pointerup", stopHold) // Stops The Hold Loop
        one_exercise.addEventListener("pointerup", stopHold) // Stops The Hold Loop
        one_exercise.addEventListener("pointerup", stopHold) // Stops The Hold Loop

        // Exercise Wheel Functionalities
        one_exercise.addEventListener("wheel", function(event:WheelEvent):void {
            event.preventDefault() // Stop Scrolling

            if(event.deltaY < 0) {
                if(!this.classList.contains("custom_exercise") && !this.classList.contains("warm_up")) changeWeight(this, "increase") // Increases Weight (Except Of Custom Exercise And Warm Up)
            }

            if(event.deltaY > 0) {
                if(!this.classList.contains("custom_exercise") && !this.classList.contains("warm_up")) changeWeight(this, "decrease") // Increases Weight (Except Of Custom Exercise And Warm Up)
            }
        })

        // Exercise Mouse Over Functionality
        one_exercise.addEventListener("mouseover", function(event:MouseEvent):void {
            if(!((event.target as HTMLDivElement).closest(".exercise") as HTMLDivElement).classList.contains("custom_exercise") && !((event.target as HTMLDivElement).closest(".exercise") as HTMLDivElement).classList.contains("warm_up")) exercise_selection_state.hovered_exercise = (event.target as HTMLDivElement).closest(".exercise") // Sets Hovered Exercise Selection Exercise Element (Except Of Custom Exercise And Warm Up)
        })

        // Exercise Mouse Leave Functionality
        one_exercise.addEventListener("mouseleave", function():void {
            exercise_selection_state.hovered_exercise = null // Deletes Hovered Exercise Selection Exercise Element
        })
    })

    // Document Keydown Functionalities
    document.addEventListener("keydown", function(event:KeyboardEvent):void {
        if(exercise_selection_state.hovered_exercise) {
            event.preventDefault() // Stop Scrolling

            if(event.key === "ArrowUp") changeWeight(exercise_selection_state.hovered_exercise, "increase") // Increases Weight
            else if(event.key === "ArrowDown") changeWeight(exercise_selection_state.hovered_exercise, "decrease") // Decreases Weight
        }
    })
})