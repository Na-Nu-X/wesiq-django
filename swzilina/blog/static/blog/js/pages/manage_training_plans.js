"use strict"

document.addEventListener("DOMContentLoaded", function() {
    // Function For Create And Append Exercise To Training Plan
    function createExercise(exercise_name) {
        const training_plan = document.querySelector(".training_plan_container .training_plan") // Gets Training Plan

        // Creates Exercise
        const exercise = document.createElement("div")
        exercise.classList.add("exercise")
        training_plan.appendChild(exercise)

        // Creates Exercise Title
        const exercise_title = document.createElement("h3")
        exercise_title.textContent = exercise_name
        exercise.appendChild(exercise_title)

        // Creates Exercise Reps Input
        const exercise_reps = document.createElement("input")
        exercise_reps.classList.add("reps")
        exercise_reps.type = "number"
        exercise_reps.value = 0
        exercise_reps.min = 0
        exercise_reps.max = 100
        exercise.appendChild(exercise_reps)

        // Creates Exercise Sets Input
        const exercise_sets = document.createElement("input")
        exercise_sets.classList.add("sets")
        exercise_sets.type = "number"
        exercise_sets.value = 1
        exercise_sets.min = 1
        exercise_sets.max = 100
        exercise.appendChild(exercise_sets)
    }

    // Exercises
    const exercises = document.querySelectorAll(".exercises .exercise") // Gets All Exercises
    let dragged_exercise = null // Stores Dragged Exercise

    exercises.forEach(function(one_exercise) {
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

    // Drop Zone
    const add_exercise = document.querySelector(".training_plan_container .training_plan .add_exercise") // Gets Add Exercise Drop Zone

    add_exercise.addEventListener("dragover", function(event) {
        event.preventDefault()
    })

    add_exercise.addEventListener("drop", function() {
        if(!dragged_exercise) return

        dragged_exercise.remove() // Deletes Dragged Exercise From Exercises

        const exercise_name = dragged_exercise.querySelector(".exercise_name").textContent // Gets Dragged Exercise Name
        createExercise(exercise_name) // Appends Dragged Exercise

        dragged_exercise.classList.remove("dragging") // Removes Dragging Class
        dragged_exercise = null // Deletes Stored Dragged Exercise
    })
})