import { 
    global_state,
    new_training_plan_state,
    edit_training_plan_state,
    exercise_selection_state
} from "./state.js"

import { 
    startHold, 
    stopHold 
} from "./functions/holdButton.js"

import { addExercise } from "./functions/exercises.js"

"use strict"

document.addEventListener("DOMContentLoaded", function() {
    // Variables

    const new_training_plan:HTMLDivElement = document.querySelector(".new_training_plan") as HTMLDivElement // Gets New Training Plan
    const edit_training_plan:HTMLDivElement = document.querySelector(".edit_training_plan") as HTMLDivElement // Gets Edit Training Plan

    const exercise_selection:HTMLDivElement = document.querySelector(".exercise_selection") as HTMLDivElement // Gets Exercise Selection
    const selection_exercises:NodeListOf<HTMLDivElement> = exercise_selection.querySelectorAll<HTMLDivElement>(".exercises .exercise") // Gets All Exercises From The Exercise Selection

    const search_bar:HTMLInputElement = exercise_selection.querySelector(".search_bar_menu .search_bar") as HTMLInputElement // Gets Search Bar Input
    const delete_search_bar:HTMLElement = exercise_selection.querySelector(".search_bar_menu .fa-xmark") as HTMLElement // Gets Delete Search Bar Button

    // Functions

    // Function For Search Bar
    function searchBar():void {
        // Gets Only Exercises In The Exercise Selection Which Are Not Already Put In The New Training Plan
        const not_used_selection_exercises:HTMLDivElement[] = [...selection_exercises].filter(function(one_exercise:HTMLDivElement):boolean {
            return !one_exercise.classList.contains("hidden")
        })

        // Exercises In The Exercise Selection Are Visible By Default
        not_used_selection_exercises.forEach(function(one_exercise:HTMLDivElement):void {
            one_exercise.style.display = "flex"
        })

        // Filters Exercises by Searched Bar Value (Returns Not Corresponding Exercises)
        const filtered_selection_exercises:HTMLDivElement[] = [...not_used_selection_exercises].filter(function(one_exercise:HTMLDivElement):boolean {
            return !(one_exercise.querySelector(".name") as HTMLParagraphElement).textContent.toLocaleLowerCase().includes(search_bar.value.toLocaleLowerCase())
        })

        // Hides Filtered Exercises Except Of Custom Exercise And Warm Up In The Exercise Selection
        filtered_selection_exercises.forEach(function(one_exercise:HTMLDivElement):void {
            if(!one_exercise.classList.contains("custom_exercise") && !one_exercise.classList.contains("warm_up")) one_exercise.style.display = "none"
        })
    }

    // Function For Delete Search Bar
    function deleteSearchBar():void {
        search_bar.value = "" // Deletes Search Bar Value
        searchBar() // Refreshes Exercise Selection Exercises (Refreshes Search Bar Results)
    }

    // Function For Change Weight In Exercise
    function changeWeight(exercise:HTMLDivElement, operation:string):void {
        const current_weight:string = exercise.dataset.weight || "0" // Gets Current Added Or Subtracted Weight
        const weight:HTMLSpanElement = exercise.querySelector(".weight_selection .weight span:first-child") as HTMLSpanElement // Gets Weight Print

        let current_weight_number:number = parseInt(current_weight) // Converts Current Weight Into Number Format

        if(exercise.dataset.requires_weight == "True" && operation === "decrease" && current_weight_number <= 0) return // Can't Get Negative Number If The Exercise Has Required Weight

        operation === "increase" ? current_weight_number += 1 : current_weight_number -= 1 // Increases Or Decreases Weight Value Based On The Operation

        exercise.dataset.weight = String(current_weight_number) // Updates Current Weight Value In Exercise
        weight.textContent = String(current_weight_number) // Shows Weight Value In The Input
    }

    // Events
    
    // Search Bar
    search_bar.addEventListener("input", searchBar)
    delete_search_bar.addEventListener("click", deleteSearchBar)

    // Selection Exercises
    selection_exercises.forEach(function(one_exercise:HTMLDivElement):void {
        one_exercise.addEventListener("dragstart", function():void {
            global_state.selection_dragged_exercise = this // Sets Selection Dragged Exercise
        })

        one_exercise.addEventListener("dragend", function():void {
            global_state.selection_dragged_exercise = null // Deletes Selection Dragged Exercise
        })
        
        // Add Exercise To The Training Plan On Double Click
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

        // Increase And Decrease Weight
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

        one_exercise.addEventListener("pointerup", stopHold)
        one_exercise.addEventListener("pointerup", stopHold)
        one_exercise.addEventListener("pointerup", stopHold)

        // Increase And Decrease Weight With Scroll Wheel
        one_exercise.addEventListener("wheel", function(event:WheelEvent):void {
            event.preventDefault() // Stop Scrolling

            if(event.deltaY < 0) {
                if(!this.classList.contains("custom_exercise") && !this.classList.contains("warm_up")) changeWeight(this, "increase") // Increases Weight (Except Of Custom Exercise And Warm Up)
            }

            if(event.deltaY > 0) {
                if(!this.classList.contains("custom_exercise") && !this.classList.contains("warm_up")) changeWeight(this, "decrease") // Increases Weight (Except Of Custom Exercise And Warm Up)
            }
        })

        // Sets And Deletes Hovered Exercise Selection Exercise Element
        one_exercise.addEventListener("mouseover", function(event:MouseEvent):void {
            if(!((event.target as HTMLDivElement).closest(".exercise") as HTMLDivElement).classList.contains("custom_exercise") && !((event.target as HTMLDivElement).closest(".exercise") as HTMLDivElement).classList.contains("warm_up")) exercise_selection_state.hovered_exercise = (event.target as HTMLDivElement).closest(".exercise") // Sets Hovered Exercise Selection Exercise Element (Except Of Custom Exercise And Warm Up)
        })

        one_exercise.addEventListener("mouseleave", function():void {
            exercise_selection_state.hovered_exercise = null // Deletes Hovered Exercise Selection Exercise Element
        })
    })

    // Increase And Decrease Weight With Keys
    document.addEventListener("keydown", function(event:KeyboardEvent):void {
        if(exercise_selection_state.hovered_exercise) {
            event.preventDefault() // Stop Scrolling

            if(event.key === "ArrowUp") changeWeight(exercise_selection_state.hovered_exercise, "increase") // Increases Weight
            else if(event.key === "ArrowDown") changeWeight(exercise_selection_state.hovered_exercise, "decrease") // Decreases Weight
        }
    })
})