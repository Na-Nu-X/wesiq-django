import { 
    global_state,
    new_training_plan_state,
    edit_training_plan_state
} from "./state.js"

import { 
    startHold, 
    stopHold 
} from "./functions/holdButton.js"

import { addExercise } from "./functions/exercises.js"

"use strict"

document.addEventListener("DOMContentLoaded", function() {
    // Variables

    const new_training_plan = document.querySelector(".new_training_plan") // Gets New Training Plan
    const edit_training_plan = document.querySelector(".edit_training_plan") // Gets Edit Training Plan

    const exercise_selection = document.querySelector(".exercise_selection") // Gets Exercise Selection
    const selection_exercises = exercise_selection.querySelectorAll(".exercises .exercise") // Gets All Exercises From The Exercise Selection

    const search_bar = exercise_selection.querySelector(".search_bar_menu .search_bar") // Gets Search Bar Input
    const delete_search_bar = exercise_selection.querySelector(".search_bar_menu .fa-xmark") // Gets Delete Search Bar Button

    // Functions

    // Function For Search Bar
    function searchBar() {
        // Gets Only Exercises In The Exercise Selection Which Are Not Already Put In The New Training Plan
        const not_used_selection_exercises = [...selection_exercises].filter(function(one_exercise) {
            return !one_exercise.classList.contains("hidden")
        })

        // Exercises In The Exercise Selection Are Visible By Default
        not_used_selection_exercises.forEach(function(one_exercise) {
            one_exercise.style.display = "flex"
        })

        // Filters Exercises by Searched Bar Value (Returns Not Corresponding Exercises)
        const filtered_selection_exercises = [...not_used_selection_exercises].filter(function(one_exercise) {
            return !one_exercise.querySelector(".name").textContent.toLocaleLowerCase().includes(search_bar.value.toLocaleLowerCase())
        })

        // Hides Filtered Exercises Except Of Custom Exercise And Warm Up In The Exercise Selection
        filtered_selection_exercises.forEach(function(one_exercise) {
            if(!one_exercise.classList.contains("custom_exercise") && !one_exercise.classList.contains("warm_up")) {
                one_exercise.style.display = "none"
            }
        })
    }

    // Function For Delete Search Bar
    function deleteSearchBar() {
        search_bar.value = "" // Deletes Search Bar Value
        searchBar() // Refreshes Exercise Selection Exercises (Refreshes Search Bar Results)
    }

    // Function For Change Weight In Exercise
    function changeWeight(exercise, operation) {
        const current_weight = exercise.dataset.weight // Gets Current Added Or Subtracted Weight
        const weight = exercise.querySelector(".weight_selection .weight span:first-child") // Gets Weight Print

        let current_weight_number = parseInt(current_weight) // Converts Current Weight Into Number Format

        if(exercise.dataset.requires_weight == "True" && operation === "decrease" && current_weight_number <= 0) return // Can't Get Negative Number If The Exercise Has Required Weight

        operation === "increase" ? current_weight_number += 1 : current_weight_number -= 1 // Increases Or Decreases Weight Value Based On The Operation

        exercise.dataset.weight = current_weight_number // Updates Current Weight Value In Exercise
        weight.textContent = current_weight_number // Shows Weight Value In The Input
    }

    // Events
    
    // Search Bar
    search_bar.addEventListener("input", searchBar)
    delete_search_bar.addEventListener("click", deleteSearchBar)

    // Selection Exercises
    selection_exercises.forEach(function(one_exercise) {
        one_exercise.addEventListener("dragstart", function() {
            global_state.selection_dragged_exercise = one_exercise // Sets Selection Dragged Exercise
        })

        one_exercise.addEventListener("dragend", function() {
            global_state.selection_dragged_exercise = null // Deletes Selection Dragged Exercise
        })
        
        // Add Exercise To The Training Plan On Double Click
        one_exercise.addEventListener("dblclick", function(event) {
            // Executes Only If The Click Is Outside The Increase Weight Button, Decrease Weight Button And Weight Print
            if(!event.target.classList.contains("increase_weight") && !event.target.classList.contains("decrease_weight") && !event.target.parentNode.classList.contains("weight")) {
                global_state.selection_dragged_exercise = one_exercise // Sets Selection Dragged Exercise

                // Adds Exercise To The New Training Plan
                if(global_state.focused_element === "new_training_plan") addExercise(new_training_plan.querySelector(".training_plan"), new_training_plan_state) // Adds Dragged Exercise From Exercise Selection To The Training Plan

                // Adds Exercise To The Edit Training Plan
                if(global_state.focused_element === "edit_training_plan") addExercise(edit_training_plan.querySelector(".training_plan"), edit_training_plan_state) // Adds Dragged Exercise From Exercise Selection To The Training Plan

                global_state.selection_dragged_exercise = null // Deletes Selection Dragged Exercise
            }
        })

        // Increase And Decrease Weight
        one_exercise.addEventListener("pointerdown", function(event) {
            // Increase Weight
            if(event.target.classList.contains("increase_weight")) {
                changeWeight(one_exercise, "increase") // Increases Weight
                startHold(() => changeWeight(one_exercise, "increase")) // Increases Weight On Hold
            }

            // Decrease Weight
            if(event.target.classList.contains("decrease_weight")) {
                changeWeight(one_exercise, "decrease") // Decreases Weight
                startHold(() => changeWeight(one_exercise, "decrease")) // Decreases Weight On Hold
            }
        })

        one_exercise.addEventListener("pointerup", stopHold)
        one_exercise.addEventListener("pointerup", stopHold)
        one_exercise.addEventListener("pointerup", stopHold)
    })
})