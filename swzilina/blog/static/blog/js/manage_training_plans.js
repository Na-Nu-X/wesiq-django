"use strict"

document.addEventListener("DOMContentLoaded", function() {
    // Exercises
    const exercises = document.querySelectorAll(".exercises .exercise") // Gets All Exercises

    let dragged_exercise_id = null // Stores Dragged Exercise Added

    exercises.forEach(function(one_exercise) {
        // Gets ID Of Dragged Exercise
        one_exercise.addEventListener("dragstart", function() {
            dragged_exercise_id = one_exercise.dataset.id
        })
    })

    // Training Plan
    const add_exercise = document.querySelector(".training_plan_container .training_plan .add_exercise")

    const added_exercises = document.querySelector(".training_plan_container .training_plan .added_exercises")

    let added_exercises_amount = 0 // Amount Of Added (Dragged) Exercises
    
    add_exercise.addEventListener("dragover", function(event) {
        event.preventDefault()

        // Finds Dragged Exercise HTML Tag
        let dragged_exercise = [...exercises].find(function(one_exercise) {
            return one_exercise.dataset.id === dragged_exercise_id
        })
        
        // Checks If Dragged Exercise Has Not Already Been Added To Prevent Its Duplication
        if(added_exercises?.querySelectorAll("p")[added_exercises_amount].textContent !== dragged_exercise.querySelector("p").textContent) {
            // Creates Paragraph With The Dragged Exercise Name
            const exercise_name = document.createElement("p")
            exercise_name.textContent = dragged_exercise.querySelector("p").textContent
            added_exercises.appendChild(exercise_name)

            dragged_exercise.style.display = "none" // Hides Dragged Exercise After Adding

            added_exercises_amount += 1 // Increases Amount Of Added Exercises
        }
    })
})