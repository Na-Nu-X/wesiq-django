import { 
    global_state, 
    new_training_plan_state 
} from "./state.js"

import { 
    addExercise, 
    changeExercises, 
    changeExercisePosition, 
    removeExercise
} from "./functions/exercises.js"

import { 
    addPeriod, 
    changeReps, 
    changeSets, 
    updateUnitTypes 
} from "./functions/periods.js"

import { 
    startHold, 
    stopHold 
} from "./functions/holdButton.js"

import { changeWarmUpTime } from "./functions/changeWarmUpTime.js"
import { saveTrainingPlan } from "./functions/saveTrainingPlan.js"

"use strict"

document.addEventListener("DOMContentLoaded", function() {
    // Variables

    let dragged_exercise = null // Gets Dragged Exercise From The Training Plan
    let dragged_bar = null // Gets Dragged Bar From The Training Plan

    const content = document.querySelector(".content") // Gets Content Container

    const new_training_plan = content.querySelector(".new_training_plan") // Gets New Training Plan
    const training_plan = new_training_plan.querySelector(".training_plan") // Gets Training Plan

    const drop_zone = training_plan.querySelector(".drop_zone") // Gets Training Plan Drop Zone

    const day_select_menu = new_training_plan.querySelector(".additional_info .day_select_menu") // Gets Day Select Menu
    const day_select = day_select_menu.querySelector(".select") // Gets Selected Option Print
    const day_options_list = day_select_menu.querySelector(".options_list") // Gets Day Options List
    const day_options = day_options_list.querySelectorAll(".option") // Gets All Day Options

    const save = new_training_plan.querySelector(".save") // Gets Training Plan Save Button

    // Global Event Delegations

    // Document Drop Events (Remove The Exercise From The Training Plan Functionality)
    document.addEventListener("dragover", function(event) {
        // If There Is Dragged Exercise And Dragover Element Isn't Inside The Training Plan
        if(dragged_exercise && !training_plan.contains(event.target)) {
            event.preventDefault() // Makes The Drop Zone Functional
        }
    })

    document.addEventListener("drop", function(event) {
        // If There Is Dragged Exercise And Drop Element Isn't Inside The Training Plan
        if(dragged_exercise && !training_plan.contains(event.target)) {
            removeExercise(dragged_exercise, training_plan, new_training_plan_state) // Removes Dragged Exercise From The Training Plan
        }
    })

    // Training Plan Drag & Drop Events
    training_plan.addEventListener("dragstart", function(event) {
        // Training Plan Exercises Drag Functionality
        if(event.target.classList.contains("exercise")) {
            dragged_exercise = event.target // Sets Training Plan Dragged Exercise
        }

        // Training Plan Bars Drag Functionality
        if(event.target.classList.contains("bar")) {
            dragged_bar = event.target // Sets Training Plan Dragged Bar

            const bar_container = training_plan.querySelector(".bar_container") // Gets Bar Container

            // Animates All Of The Bars Except Of The Dragged One
            bar_container.querySelectorAll(".bar").forEach(function(one_bar) {
                if(one_bar !== dragged_bar) {
                    one_bar.classList.add("animate") // Adds Drag Animation
                }
            })
        }
    })

    training_plan.addEventListener("dragend", function() {
        dragged_exercise = null // Deletes Training Plan Dragged Exercise
        dragged_bar = null // Deletes Training Plan Dragged Bar

        const bar_container = training_plan.querySelector(".bar_container") // Gets Bar Container

        bar_container.querySelectorAll(".bar").forEach(function(one_bar) {
            one_bar.classList.remove("animate") // Removes Drag Animation
        })
    })

    training_plan.addEventListener("dragover", function(event) {
        // Drop Zone For The First Exercise
        if(event.target === drop_zone) {
            event.preventDefault() // Makes The Drop Zone Functional
        }

        // Drop Zone On Active Exercise In The Training Plan
        if(event.target === training_plan.querySelectorAll(".exercise")[new_training_plan_state.active_exercise_index]) {
            event.preventDefault() // Makes The Drop Zone Functional
        }

        // Executes Only If The Dragged Element Is Selection Dragged Exercise
        if(global_state.selection_dragged_exercise) {
            training_plan.classList.add("animate") // Adds Drag Animation
        }

        // Drop Zone On Bars In The Bar Container
        if(event.target.classList.contains("bar")) {
            event.preventDefault() // Makes The Drop Zone Functional
        }
    })

    training_plan.addEventListener("drop", function(event) {
        // Drop Zone For The First Exercise
        if(event.target === drop_zone) {
            addExercise(training_plan, new_training_plan_state) // Adds Dragged Exercise From Exercise Selection To The Training Plan
        }

        // Drop Zone On Active Exercise In The Training Plan
        if(event.target === training_plan.querySelectorAll(".exercise")[new_training_plan_state.active_exercise_index]) {
            addExercise(training_plan, new_training_plan_state) // Adds Dragged Exercise From Exercise Selection To The Training Plan
        }

        // Executes Only If The Dragged Element Is Selection Dragged Exercise
        if(global_state.selection_dragged_exercise) {
            training_plan.classList.remove("animate") // Removes Drag Animation
        }

        // Drop Zone On Bars In The Bar Container
        if(event.target.classList.contains("bar")) {
            const bar_container = training_plan.querySelector(".bar_container") // Gets Bar Container

            // Removes Animation From All Of The Bars Except Of The Dragged One
            bar_container.querySelectorAll(".bar").forEach(function(one_bar) {
                if(one_bar !== dragged_bar) {
                    one_bar.classList.remove("animate") // Removes Drag Animation
                }
            })

            const dropped_bar_index = [...event.target.parentNode.querySelectorAll(".bar")].indexOf(event.target) // Gets Index Of The Bar From The Bar Container Where The Dragged Bar Was Dropped
            changeExercisePosition(dropped_bar_index, dragged_bar, training_plan, new_training_plan_state) // Changes Training Plan Exercise Position By Position Of Bars In The Bar Container
        }
    })

    training_plan.addEventListener("dragleave", function() {
        // Executes Only If The Dragged Element Is Selection Dragged Exercise
        if(global_state.selection_dragged_exercise) {
            training_plan.classList.remove("animate") // Removes Drag Animation
        }
    })

    // Training Plan Click Events
    training_plan.addEventListener("click", function(event) {
        // Change Exercise In Training Plan With Bars Functionality
        if(event.target.classList.contains("bar")) {
            const clicked_bar_index = [...event.target.parentNode.querySelectorAll(".bar")].indexOf(event.target) // Gets Index Of The Clicked Bar
            changeExercises(clicked_bar_index, training_plan, new_training_plan_state) // Changes Training Plan Exercises
        }

        // Add Sets & Reps Period Of Exercises In The Training Plan Functionality
        if(event.target.classList.contains("add_period")) {
            const clicked_add_period_exercise = event.target.closest(".exercise") // Gets Exercise From Training Plan Of Clicked Add Period Button
            addPeriod(clicked_add_period_exercise) // Adds Period For Given Exercise
        }

        // Unit Select Menu
        if(event.target.closest(".unit_select_menu")) {
            const unit_select_menu = event.target.closest(".unit_select_menu") // Gets Unit Select Menu
            const unit_select = unit_select_menu.querySelector(".select") // Gets Selected Option Print
            const unit_options_list = unit_select_menu.querySelector(".options_list") // Gets Unit Options List
            const unit_options = unit_options_list.querySelectorAll(".option") // Gets All Unit Options

            unit_options_list.classList.toggle("active") // Shows / Hides Options List
		    unit_select.querySelector(".fa-angle-down").classList.toggle("fa-angle-up") // Toggle Icons

            if(event.target.closest(".option")) {
                const clicked_option = event.target.closest(".option") // Gets Clicked Option
                unit_select_menu.closest(".exercise").dataset.unit = clicked_option.dataset.unit_option // Sets Unit Data To The Exercise

                // Removes Selected Class From Options
                unit_options.forEach(function(one_option) {
                    one_option.classList.remove("selected")
                })

                if(clicked_option.dataset.unit_option === unit_select_menu.closest(".exercise").dataset.unit) {
                    unit_select.querySelector("span").textContent = clicked_option.querySelector("span").textContent // Shows Current Selected Option From List Without Icon
                    clicked_option.classList.add("selected") // Adds Selected Class To Selected Option
                }

                updateUnitTypes(clicked_option.dataset.unit_option, training_plan, new_training_plan_state) // Updates Unit Type For Every Reps Container
            }
        }

        // Subtract Warm Up Time Functionality
        if(event.target.classList.contains("subtract_time") || event.target.parentNode.classList.contains("subtract_time")) {
            const warm_up = event.target.closest(".exercise") // Gets Warm Up From The Training Plan
            changeWarmUpTime(warm_up, "subtract") // Subtracts Time
        }

        // Add Warm Up Time Functionality
        if(event.target.classList.contains("add_time") || event.target.parentNode.classList.contains("add_time")) {
            const warm_up = event.target.closest(".exercise") // Gets Warm Up From The Training Plan
            changeWarmUpTime(warm_up, "add") // Adds Time
        }
    })

    // Training Plan Double Click Events
    training_plan.addEventListener("dblclick", function(event) {
        // Removes Exercise From The Training Plan On Double Click
        if(event.target.classList.contains("exercise")) {
            dragged_exercise = event.target // Sets Training Plan Dragged Exercise
            removeExercise(dragged_exercise, training_plan, new_training_plan_state) // Removes Dragged Exercise From The Training Plan
            dragged_exercise = null // Deletes Training Plan Dragged Exercise
        }
    })

    // Training Plan Hold Events
    training_plan.addEventListener("pointerdown", function(event) {
        // Add Decrease Exercise Reps Functionality
        if(event.target.classList.contains("decrease_reps")) {
            changeReps(event.target, "decrease") // Decreases Amount Of Reps
            startHold(() => changeReps(event.target, "decrease")) // Decreases Amount Of Reps On Hold
        }

        // Add Increase Exercise Reps Functionality
        if(event.target.classList.contains("increase_reps")) {
            changeReps(event.target, "increase") // Increases Amount Of Reps
            startHold(() => changeReps(event.target, "increase")) // Increases Amount Of Reps On Hold
        }

        // Add Decrease Exercise Sets Functionality
        if(event.target.classList.contains("decrease_sets")) {
            changeSets(event.target, "decrease") // Decreases Amount Of Sets
            startHold(() => changeSets(event.target, "decrease")) // Decreases Amount Of Sets On Hold
        }

        // Add Increase Exercise Sets Functionality
        if(event.target.classList.contains("increase_sets")) {
            changeSets(event.target, "increase") // Increases Amount Of Sets
            startHold(() => changeSets(event.target, "increase")) // Increases Amount Of Sets On Hold
        }
    })

    training_plan.addEventListener("pointerup", stopHold)
    training_plan.addEventListener("pointercancel", stopHold)
    training_plan.addEventListener("pointerleave", stopHold)

    // Events

    // Sets Focused Element
    new_training_plan.addEventListener("focus", function() {
        global_state.focused_element = "new_training_plan"
    })

    // Key Events
    new_training_plan.addEventListener("mouseover", function(event) {
        // Sets Hovered Element For Bar Container
        if(event.target.classList.contains("bar_container") || event.target.parentNode.classList.contains("bar_container")) {
            global_state.hovered_element = "new_training_plan_exercises_bars"
        }
    })

    new_training_plan.addEventListener("mouseout", function() {
        global_state.hovered_element = null
    })

    document.addEventListener("keydown", function(event) {
        // Shows Previous Exercise
        if(event.key === "ArrowLeft" && global_state.hovered_element === "new_training_plan_exercises_bars") {
            changeExercises(new_training_plan_state.active_exercise_index - 1, training_plan, new_training_plan_state) // Changes Training Plan Exercises
        }

        // Shows Next Exercise
        else if(event.key === "ArrowRight" && global_state.hovered_element === "new_training_plan_exercises_bars") {
            changeExercises(new_training_plan_state.active_exercise_index + 1, training_plan, new_training_plan_state) // Changes Training Plan Exercises
        }
    })

    // Day Select Menu
    day_select.addEventListener("click", function() {
        day_options_list.classList.toggle("active") // Shows / Hides Options List
        day_select.querySelector(".fa-angle-down").classList.toggle("fa-angle-up") // Toggle Icons
    })

    day_options.forEach(function(option) {
        option.addEventListener("click", function() {
            sessionStorage.setItem("new_training_plan_day", option.dataset.day) // Stores New Training Plan Day To Session Storage

            day_options_list.classList.toggle("active") // Shows / Hides Options List
            day_select.querySelector(".fa-angle-down").classList.toggle("fa-angle-up") // Toggle Icons

            // Removes Selected Class From Options
            day_options.forEach(function(remove_selected) {
                remove_selected.classList.remove("selected")
            })

            // Shows Current Selected Option From List Without Icon
            if(option.dataset.day === sessionStorage.getItem("new_training_plan_day")) {
                day_select.querySelector("span").textContent = option.querySelector("span").textContent // Shows Current Selected Option From List Without Icon
                option.classList.add("selected") // Adds Selected Class To Selected Option
            }
        })
    })

    // Save New Training Plan
    save.addEventListener("click", function() {
        saveTrainingPlan(new_training_plan, new_training_plan_state)
    })
})