import { sendPOST } from "../services/sendPOST.js"

"use strict"

document.addEventListener("DOMContentLoaded", function() {
    // CREATE TRAINING PLAN

    // Variables

    const training_plan_container = document.querySelector(".training_plan_container") // Gets Training Plan Container
    const training_plan = training_plan_container.querySelector(".training_plan")

    let selection_dragged_exercise = null // Gets Dragged Exercise From Exercise Selection

    const training_plan_drop_zone = training_plan.querySelector(".add_exercise") // Gets Training Plan Drop Zone

    const exercise_template = training_plan.querySelector(".exercise_template") // Gets Training Plan Exercise Template

    let active_training_plan_exercise_index = 0 // Stores Index Of Active Exercise In Training Plan

    const bar_container = training_plan.querySelector(".progress_bar") // Gets Bar Container
    
    // Functions

    function addExerciseToTrainingPlan() {
        const exercise_template_clone = exercise_template.content.cloneNode(true) // Clones The Exercise Template Content

        exercise_template_clone.querySelector(".exercise .title").textContent = selection_dragged_exercise.querySelector(".exercise_name").textContent // Sets Exercise Name

        training_plan.appendChild(exercise_template_clone) // Appends Exercise To The Training Plan

        changeTrainingPlanSlides() // Changes Slides In The Training Plan
    }

    function removeExerciseFromTrainingPlan() {
        
    }

    function changeTrainingPlanSlides() {
        const training_plan_exercises = training_plan.querySelectorAll(".exercise") // Gets All Training Plan Exercises

        // First Exercise Change
        if(training_plan_drop_zone.classList.contains("active")) {
            training_plan_drop_zone.classList.remove("active") // Hides Training Plan Drop Zone
        }

        // Other Exercises Change
        else {
            training_plan_exercises[active_training_plan_exercise_index].classList.remove("active") // Hides Previous Active Exercise
            active_training_plan_exercise_index += 1 // Increases Index Of Active Exercise In Training Plan
        }

        training_plan_exercises[active_training_plan_exercise_index].classList.add("active") // Shows Active Exercise

        updateBars(training_plan_exercises.length) // Updates Bars
    }

    function updateBars(training_plan_exercises_amount) {
        bar_container.innerHTML = "" // Deletes All Bars From The Bar Container

        // Creates Bars By Amount Of Exercises In The Training Plan
        for(let i = 0; i < training_plan_exercises_amount; i++) {
            // Creates Bar
            const bar = document.createElement("div")
            bar.classList.add("bar")
            bar_container.appendChild(bar)
        }

        training_plan.appendChild(bar_container) // Appends Bar Container At The End Of The Training Plan

        bar_container.querySelectorAll(".bar")[active_training_plan_exercise_index].classList.add("active") // Adds Active Class For Bar Of Active Exercise
    }

    // Training Plan Drop Zone Functionality
    training_plan.addEventListener("dragover", function(event) {
        // Drop Zone For The First Exercise
        if(event.target === training_plan_drop_zone) {
            event.preventDefault() // Makes The Drop Zone Functional
        }

        // Drop Zone On Active Exercise In The Training Plan
        if(event.target === training_plan.querySelectorAll(".exercise")[active_training_plan_exercise_index]) {
            event.preventDefault() // Makes The Drop Zone Functional
        }
    })

    training_plan.addEventListener("drop", function(event) {
        // Drop Zone For The First Exercise
        if(event.target === training_plan_drop_zone) {
            addExerciseToTrainingPlan() // Adds Dragged Exercise From Exercise Selection To The Training Plan
        }

        // Drop Zone On Active Exercise In The Training Plan
        if(event.target === training_plan.querySelectorAll(".exercise")[active_training_plan_exercise_index]) {
            addExerciseToTrainingPlan() // Adds Dragged Exercise From Exercise Selection To The Training Plan
        }
    })

    // Training Plan Change Exercise In Training Plan By Bar Functionality
    training_plan.addEventListener("click", function(event) {
        // if(event.target === bar_container.querySelectorAll(".bar")[active_training_plan_exercise_index]) {
        //     console.log("A")
        // }
    })

    // EXERCISE SELECTION

    // Variables

    const exercise_selection_container = document.querySelector(".exercises_container") // Gets Exercise Selection Container

    const exercise_selection_exercises = exercise_selection_container.querySelectorAll(".exercises .exercise") // Gets All Exercise From The Exercise Selection

    // Functions

    function searchBar() {

    }

    function hideExercise() {

    }

    function showExercise() {
        
    }

    // Exercise Selection Drag Functionality
    exercise_selection_exercises.forEach(function(one_exercise) {
        one_exercise.addEventListener("dragstart", function() {
            selection_dragged_exercise = one_exercise // Sets Selection Dragged Exercise
        })

        one_exercise.addEventListener("dragend", function() {
            selection_dragged_exercise = null // Deletes Selection Dragged Exercise
        })
    })
})