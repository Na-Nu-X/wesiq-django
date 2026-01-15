"use strict"

document.addEventListener("DOMContentLoaded", function() {
    const training_plan = document.querySelector(".training_plan_container .training_plan") // Gets Training Plan
    const exercise_template = document.querySelector(".exercise_template") // Gets Exercise Template

    // Function For Create And Append Exercise To Training Plan
    function createExercise(exercise_name) {
        const exercise_template_clone = exercise_template.content.cloneNode(true) // Clones Exercise Template

        exercise_template_clone.querySelector(".title").textContent = exercise_name // Adds Exercise Name As A Title

        const reps = exercise_template_clone.querySelector(".reps") // Gets Reps Input
        const sets = exercise_template_clone.querySelector(".sets") // Gets Sets Input

        const decrease_reps = exercise_template_clone.querySelector(".decrease_reps") // Gets Decrease Reps Button
        const increase_reps = exercise_template_clone.querySelector(".increase_reps") // Gets Increase Reps Button
        const decrease_sets = exercise_template_clone.querySelector(".decrease_sets") // Gets Decrease Sets Button
        const increase_sets = exercise_template_clone.querySelector(".increase_sets") // Gets Increase Sets Button

        // Adds Decrease Exercise Reps Functionality
        decrease_reps.addEventListener("click", function() {
            let reps_number = parseInt(reps.value) // Gets Current Reps Amount In Number Format
            reps_number -= 1 // Decreases Reps Amount By 1

            if(reps_number < 0) return // Do Nothing
            reps.value = reps_number // Updates Exercise Reps Amount
        })
        
        // Adds Increase Exercise Reps Functionality
        increase_reps.addEventListener("click", function() {
            let reps_number = parseInt(reps.value) // Gets Current Reps Amount In Number Format
            reps_number += 1 // Increases Reps Amount By 1

            if(reps_number > 100) return // Do Nothing
            reps.value = reps_number // Updates Exercise Reps Amount
        })

        // Adds Decrease Exercise Sets Functionality
        decrease_sets.addEventListener("click", function() {
            let sets_number = parseInt(sets.value) // Gets Current Sets Amount In Number Format
            sets_number -= 1 // Decreases Sets Amount By 1

            if(sets_number < 1) return // Do Nothing
            sets.value = sets_number // Updates Exercise Sets Amount
        })
        
        // Adds Increase Exercise Sets Functionality
        increase_sets.addEventListener("click", function() {
            let sets_number = parseInt(sets.value) // Gets Current Sets Amount In Number Format
            sets_number += 1 // Increases Sets Amount By 1

            if(sets_number > 100) return // Do Nothing
            sets.value = sets_number // Updates Exercise Sets Amount
        })

        // ADD PERIOD
        const add_period = exercise_template_clone.querySelector(".add_period") // Gets Add Period Button

        const period_selection_template = document.querySelector(".period_selection_template") // Gets Period Selection Template
        
        add_period.addEventListener("click", function(event) {
            const period_selection_template_clone = period_selection_template.content.cloneNode(true) // Clones Period Selection Template
            
            event.target.closest(".periods_container").appendChild(period_selection_template_clone) // Appends Period Selection Template

            // DELETE PERIOD
            const delete_period = document.querySelectorAll(".delete_period") // Gets All Delete Period Buttons

            // Adds Event Listener To Every Delete Period Button
            delete_period.forEach(function(one_button) {
                one_button.addEventListener("click", function(event) {
                    event.target.closest(".period_selection").remove() // Removes Period Selection From DOM
                }, { once: true })
            })
        })

        training_plan.appendChild(exercise_template_clone) // Appends New Exercise Cloned From The Exercise Template

        updateProgressBar() // Updates Progress Bar

        const exercises = document.querySelectorAll(".training_plan_container .training_plan .exercise") // Gets All Exercises
        changeExercises(exercises.length - 1) // Shows The Last Added Exercise

        // Drop Zone (On Exercise)
        exercises.forEach(function(one_exercise) {
            one_exercise.addEventListener("dragover", function(event) {
                event.preventDefault()

                training_plan.classList.add("animate") // Adds Animation
            })

            one_exercise.addEventListener("drop", function() {
                if(!dragged_exercise) return

                dragged_exercise.remove() // Deletes Dragged Exercise From Exercises

                const exercise_name = dragged_exercise.querySelector(".exercise_name").textContent // Gets Dragged Exercise Name
                createExercise(exercise_name) // Appends Dragged Exercise

                dragged_exercise.classList.remove("dragging") // Removes Dragging Class
                dragged_exercise = null // Deletes Stored Dragged Exercise

                training_plan.classList.remove("animate") // Removes Animation
            })

            one_exercise.addEventListener("dragleave", function() {
                training_plan.classList.remove("animate") // Removes Animation
            })
        })
    }

    // Function For Add Bar To The Progress Bar
    function updateProgressBar() {
        const progress_bar = document.querySelector(".training_plan_container .training_plan .progress_bar") // Gets Progress Bar

        training_plan.appendChild(progress_bar) // Appends Progress Bar To The End Of The Training Plan

        // Creates Bar
        const bar = document.createElement("div")
        bar.classList.add("bar")
        progress_bar.appendChild(bar)

        // Adds Click Event Listener To The New Bar In The Progress Bar
        bar.addEventListener("click", function(event) {
            chooseExerciseWithProgressBar(event.target)
        })
    }

    // Function For Choose Exercise With Bars In The Progress Bar
    function chooseExerciseWithProgressBar(clicked_bar) {
        const bars = document.querySelectorAll(".training_plan_container .training_plan .progress_bar .bar") // Gets All Bars From The Progress Bar

        // Removes Active Class From Every Bar In The Progress Bar
        bars.forEach(function(one_bar) {
            one_bar.classList.remove("active")
        })

        clicked_bar.classList.add("active") // Adds Active Class To The Clicked Bar

        const clicked_bar_index = [...bars].indexOf(clicked_bar) // Gets Index Of Clicked Bar
        changeExercises(clicked_bar_index) // Shows Exercise With Equal Index
    }

    // Function For Change Exercises In Training Plan
    function changeExercises(exercise_index) {
        const exercises = document.querySelectorAll(".training_plan .exercise") // Gets All Exercises

        add_exercise.classList.remove("active") // Hides Add Exercise Drop Zone

        // Hides Every Exercise
        exercises.forEach(function(one_exercise) {
            one_exercise.classList.remove("active")
        })

        exercises[exercise_index].classList.add("active") // Shows Exercise With The Chosen Index

        const bars = document.querySelectorAll(".training_plan_container .training_plan .progress_bar .bar") // Gets All Bars From The Progress Bar

        // Removes Active Class From Every Bar In The Progress Bar
        bars.forEach(function(one_bar) {
            one_bar.classList.remove("active")
        })

        bars[exercise_index].classList.add("active") // Adds Active Class To The Bar Of The Current Active Exercise
    }

    // Exercises
    const exercises_selection = document.querySelectorAll(".exercises .exercise") // Gets All Exercises From Selection
    let dragged_exercise = null // Stores Dragged Exercise

    exercises_selection.forEach(function(one_exercise) {
        // Drag Start
        one_exercise.addEventListener("dragstart", function() {
            dragged_exercise = one_exercise // Saves Dragged Exercise
            one_exercise.classList.add("dragging") // Adds Dragging Class
        })

        // Drag End
        one_exercise.addEventListener("dragend", function() {
            one_exercise.classList.remove("dragging") // Removes Dragging Class
        })
    })

    // Drop Zone (For First Exercise)
    const add_exercise = document.querySelector(".training_plan_container .training_plan .add_exercise") // Gets Add Exercise Drop Zone

    add_exercise.addEventListener("dragover", function(event) {
        event.preventDefault()

        training_plan.classList.add("animate") // Adds Animation
    })

    add_exercise.addEventListener("drop", function() {
        if(!dragged_exercise) return

        dragged_exercise.remove() // Deletes Dragged Exercise From Exercises

        const exercise_name = dragged_exercise.querySelector(".exercise_name").textContent // Gets Dragged Exercise Name
        createExercise(exercise_name) // Appends Dragged Exercise

        dragged_exercise.classList.remove("dragging") // Removes Dragging Class
        dragged_exercise = null // Deletes Stored Dragged Exercise

        training_plan.classList.remove("animate") // Removes Animation
    })

    add_exercise.addEventListener("dragleave", function() {
        training_plan.classList.remove("animate") // Removes Animation
    })
})