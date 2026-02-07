import { global_state } from "../state.js"
import { createBars, renderBars } from "./bars.js"

// Checks If Selection Dragged Exercise Is Already In The Training Plan
function isExistingExercise(training_plan) {
    const exercises = training_plan.querySelectorAll(".exercise") // Gets All Training Plan Exercises

    // Returns True If The Exercise Is Already In The Training Plan
    return [...exercises].some(function(one_exercise) {
        const title = one_exercise.querySelector(".title").textContent // Gets Title Of The Exercise In The Training Plan

        const selection_dragged_exercise_name = global_state.selection_dragged_exercise.querySelector(".name").textContent // Gets Dragged Exercise Name
        const selection_dragged_exercise_weight = global_state.selection_dragged_exercise.dataset.weight // Gets Current Added Or Subtracted Weight Of The Dragged Exercise

        return (
            title === selection_dragged_exercise_name && selection_dragged_exercise_weight == 0 || // For Example: Front Lever
            title === `${selection_dragged_exercise_weight}kg ${selection_dragged_exercise_name}` || // For Example: 100kg Deadlift
            title === `${selection_dragged_exercise_name} +${selection_dragged_exercise_weight}kg` || // For Example: Front Lever +10kg
            title === `${selection_dragged_exercise_name} ${selection_dragged_exercise_weight}kg` ||  // For Example: Front Lever -10kg

            title === "Warm Up" // If Exercise Is Warm Up
        )
    })
}

// Creates Exercise Title With Combinated Selection Dragged Exercise Name And Added Or Subtracted Weight Of The Selection Dragged Exercise
function createExerciseTitle(exercise_name, exercise_weight) {
    if(global_state.selection_dragged_exercise.classList.contains("custom_exercise")) return // Skips Custom Exercise
    if(global_state.selection_dragged_exercise.classList.contains("warm_up")) return // Skips Warm Up

    if(exercise_weight != 0) {
        // Returns Title With Appended Weight If The Exercise Doesn't Require Weight (For Example: Front Lever +10kg Or Front Lever -10kg)
        if(global_state.selection_dragged_exercise.dataset.requires_weight == "False") {
            return exercise_weight > 0 ? `${exercise_name} +${exercise_weight}kg` : `${exercise_name} ${exercise_weight}kg` // Returns Plus Symbol Before Weight Value If The Weigh Is A Positive Number
        }

        return `${exercise_weight}kg ${exercise_name}` // Returns Title With Prepended Weight If The Exercise Requires Weight (For Example: 100kg Deadlift)
    }

    return exercise_name // Returns Unchanged Exercise Title If The Weight Is Set To 0
}

// Function For Add Custom Exercise To The Training Plan
function addCustomExercise(exercise) {
    // Creates Exercise Title Input
    const title_input = document.createElement("input")

    title_input.classList.add("title_input")
    title_input.type = "text"
    title_input.placeholder = "Pridajte názov cviku"

    exercise.prepend(title_input) // Prepends Exercise Title Input

    // Creates Custom Unit Select Menu
    const unit_select_menu_template = document.querySelector(".unit_select_menu_template") // Gets Unit Select Menu Template
    const unit_select_menu_template_clone = unit_select_menu_template.content.cloneNode(true) // Clones The Unit Select Menu Template Content

    exercise.querySelector(".labels").prepend(unit_select_menu_template_clone) // Prepends Unit Select Menu To The Exercise Labels
    exercise.querySelector(".labels .unit_amount").style.display = "none" // Hides Unit Amount Label
}

// Function For Add Warm Up To The Training Plan
function addWarmUp(training_plan, state) {
    const warm_up_template = document.querySelector(".warm_up_template") // Gets Warm Up Template
    const warm_up_template_clone = warm_up_template.content.cloneNode(true) // Clones The Warm Up Template Content

    training_plan.appendChild(warm_up_template_clone) // Appends Exercise To The Training Plan

    changeSlides(training_plan, state) // Changes Slides In The Training Plan
}

// Function For Add Exercise To The Training Plan
export function addExercise(training_plan, state) {
    // Executes Only If The Dragged Element Is Selection Dragged Exercise And Doesn't Already Exist In The Training Plan (Except Of The Custom Exercise)
    if(global_state.selection_dragged_exercise && !isExistingExercise(training_plan) && !global_state?.selection_dragged_exercise?.classList?.contains("warm_up") || global_state?.selection_dragged_exercise?.classList?.contains("custom_exercise")) {
        const exercise_template = document.querySelector(".exercise_template") // Gets Exercise Template
        const exercise_template_clone = exercise_template.content.cloneNode(true) // Clones The Exercise Template Content

        const selection_dragged_exercise_name = global_state.selection_dragged_exercise.querySelector(".name").textContent // Gets Dragged Exercise Name
        const selection_dragged_exercise_weight = global_state.selection_dragged_exercise.dataset.weight // Gets Current Added Or Subtracted Weight Of The Dragged Exercise

        exercise_template_clone.querySelector(".exercise .title").textContent = createExerciseTitle(selection_dragged_exercise_name, selection_dragged_exercise_weight) // Sets Formatted Title Value To The Exercise Title

        // Sets The Correct Unit Amount Label By Selection Dragged Exercise Unit
        if(global_state.selection_dragged_exercise.dataset.unit === "reps") exercise_template_clone.querySelector(".labels .unit_amount").textContent = "Počet opakovaní"
        if(global_state.selection_dragged_exercise.dataset.unit === "seconds") exercise_template_clone.querySelector(".labels .unit_amount").textContent = "Počet sekúnd"

        exercise_template_clone.querySelector(".exercise").dataset.unit = global_state.selection_dragged_exercise.dataset.unit || "reps" // Stores Unit Type Data To The Exercise (Reps By Default)

        if(global_state.selection_dragged_exercise.classList.contains("custom_exercise")) addCustomExercise(exercise_template_clone.querySelector(".exercise")) // Adds Custom Exercise To The Training Plan

        training_plan.appendChild(exercise_template_clone) // Appends Exercise To The Training Plan

        changeSlides(training_plan, state) // Changes Slides In The Training Plan
    }

    else if(global_state?.selection_dragged_exercise?.classList?.contains("warm_up") && !isExistingExercise(training_plan)) {
        addWarmUp(training_plan, state) // Adds Warm Up To The Training Plan
    }
}

// Function For Change Slides Of Training Plan
export function changeSlides(training_plan, state) {
    const exercises = training_plan.querySelectorAll(".exercise") // Gets All Training Plan Exercises
    const drop_zone = training_plan.querySelector(".add_exercise") // Gets Training Plan Drop Zone

    if(drop_zone.classList.contains("active")) drop_zone.classList.remove("active") // Hides Training Plan Drop Zone On First Exercise Change

    else {
        exercises[state.active_exercise_index].classList.remove("active") // Hides Previous Active Exercise
        state.active_exercise_index = exercises.length - 1 // Sets Index Of Active Exercise In Training Plan To Last Possible Index (Shows The Last Exercise)
    }

    exercises[state.active_exercise_index].classList.add("active") // Shows Active Exercise

    // Creates And Renders Bars
    const bar_container = createBars(exercises.length, state)
    renderBars(training_plan, bar_container)
}

// Function For Change Exercises In The Training Plan
export function changeExercises(exercise_index, training_plan, state) {
    const exercises = training_plan.querySelectorAll(".exercise") // Gets All Training Plan Exercises

    exercises[state.active_exercise_index].classList.remove("active") // Hides Previous Active Exercise

    if(exercise_index < 0) {
        state.active_exercise_index = exercises.length - 1 // Shows The Last Exercise
    }

    else if(exercise_index > exercises.length - 1) {
        state.active_exercise_index = 0 // Shows The First Exercise
    }
    
    else {
        state.active_exercise_index = exercise_index // Updates Index Of Active Exercise
    }
    
    exercises[state.active_exercise_index].classList.add("active") // Shows New Active Exercise

    // Creates And Renders Bars
    const bar_container = createBars(exercises.length, state)
    renderBars(training_plan, bar_container)
}

// Function For Change Exercises Order In The Training Plan With Bars
export function changeExercisePosition(dropped_bar_index, dragged_bar, training_plan, state) {
    // Executes Only If The Dragged Element Is Dragged Bar
    if(dragged_bar) {
        const dragged_bar_index = [...dragged_bar.parentNode.querySelectorAll(".bar")].indexOf(dragged_bar) // Gets Index Of The Dragged Bar In The Training Plan
        const exercises = training_plan.querySelectorAll(".exercise") // Gets All Training Plan Exercises

        dragged_bar_index < dropped_bar_index ? training_plan.insertBefore(exercises[dragged_bar_index], exercises[dropped_bar_index].nextSibling) : training_plan.insertBefore(exercises[dragged_bar_index], exercises[dropped_bar_index]) // Changes DOM Position Of Exercises

        exercises[state.active_exercise_index].classList.remove("active") // Hides Previous Active Exercise
        exercises[dropped_bar_index].classList.remove("active") // Hides Previous Active Exercise
        exercises[dragged_bar_index].classList.remove("active") // Hides Previous Active Exercise
        
        changeExercises(dropped_bar_index, training_plan, state) // Shows The Exercise Of Dropped Bar Index
    }
}

// Function For Remove Exercise From The Training Plan
export function removeExercise(dragged_exercise, training_plan, state) {
    // Executes Only If The Dragged Element Is Dragged Exercise From The Training Plan
    if(dragged_exercise) {
        const drop_zone = training_plan.querySelector(".add_exercise") // Gets Training Plan Drop Zone

        dragged_exercise.remove() // Removes Training Plan Dragged Exercise From DOM

        const exercises = training_plan.querySelectorAll(".exercise") // Gets All Training Plan Exercises

        // Checks If There Will Be Still Any Exercise In The Training Plan After Removal
        if(exercises.length >= 1) {
            state.active_exercise_index = exercises.length - 1 // Sets Index Of Active Exercise In Training Plan To Last Possible Index (Shows The Last Exercise)
            exercises[state.active_exercise_index].classList.add("active") // Shows Active Exercise
        }

        else {
            drop_zone.classList.add("active") // Shows Training Plan Drop Zone
        }
        
        // Creates And Renders Bars
        const bar_container = createBars(exercises.length, state)
        renderBars(training_plan, bar_container)
    }
}