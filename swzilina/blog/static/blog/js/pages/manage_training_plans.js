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

        // Creates Reps Title
        const exercise_reps_title = document.createElement("p")
        exercise_reps_title.textContent = "Počet opakovaní"
        // exercise.appendChild(exercise_reps_title)

        // Creates Periods (Sets & Reps) Container
        const periods_container = document.createElement("div")
        periods_container.classList.add("periods_container")
        exercise.appendChild(periods_container)

        // Creates Exercise Reps Container
        const exercise_reps_container = document.createElement("div")
        exercise_reps_container.classList.add("exercise_reps_container")
        periods_container.appendChild(exercise_reps_container)

        // Creates Exercise Reps Decrease Button
        const decrease_exercise_reps = document.createElement("button")
        decrease_exercise_reps.classList.add("decrease_exercise_reps")
        decrease_exercise_reps.innerHTML = "<i class='fa-solid fa-minus'></i>" // https://fontawesome.com/icons/minus
        exercise_reps_container.appendChild(decrease_exercise_reps)

        // Creates Exercise Reps Input
        const exercise_reps = document.createElement("input")
        exercise_reps.classList.add("reps")
        exercise_reps.type = "number"
        exercise_reps.value = 0
        exercise_reps.min = 0
        exercise_reps.max = 100
        exercise_reps_container.appendChild(exercise_reps)

        // Creates Exercise Reps Increase Button
        const increase_exercise_reps = document.createElement("button")
        increase_exercise_reps.classList.add("increase_exercise_reps")
        increase_exercise_reps.innerHTML = "<i class='fa-solid fa-plus'></i>" // https://fontawesome.com/icons/plus
        exercise_reps_container.appendChild(increase_exercise_reps)

        // Adds Decrease Exercise Reps Functionality
        decrease_exercise_reps.addEventListener("click", function() {
            let reps = parseInt(exercise_reps.value) // Gets Current Reps Amount In Number Format
            reps -= 1 // Decreases Reps Amount By 1

            if(reps < 0) return // Do Nothing
            exercise_reps.value = reps // Updates Exercise Reps Amount
        })
        
        // Adds Increase Exercise Reps Functionality
        increase_exercise_reps.addEventListener("click", function() {
            let reps = parseInt(exercise_reps.value) // Gets Current Reps Amount In Number Format
            reps += 1 // Increases Reps Amount By 1

            if(reps > 100) return // Do Nothing
            exercise_reps.value = reps // Updates Exercise Reps Amount
        })

        // Creates Exercise Sets Container
        const exercise_sets_container = document.createElement("div")
        exercise_sets_container.classList.add("exercise_sets_container")
        periods_container.appendChild(exercise_sets_container)

        // Creates Exercise Sets Decrease Button
        const decrease_exercise_sets = document.createElement("button")
        decrease_exercise_sets.classList.add("decrease_exercise_sets")
        decrease_exercise_sets.innerHTML = "<i class='fa-solid fa-minus'></i>" // https://fontawesome.com/icons/minus
        exercise_sets_container.appendChild(decrease_exercise_sets)

        // Creates Exercise Sets Input
        const exercise_sets = document.createElement("input")
        exercise_sets.classList.add("sets")
        exercise_sets.type = "number"
        exercise_sets.value = 1
        exercise_sets.min = 1
        exercise_sets.max = 100
        exercise_sets_container.appendChild(exercise_sets)

        // Creates Exercise Sets Increase Button
        const increase_exercise_sets = document.createElement("button")
        increase_exercise_sets.classList.add("increase_exercise_sets")
        increase_exercise_sets.innerHTML = "<i class='fa-solid fa-plus'></i>" // https://fontawesome.com/icons/plus
        exercise_sets_container.appendChild(increase_exercise_sets)

        // Adds Decrease Exercise Sets Functionality
        decrease_exercise_sets.addEventListener("click", function() {
            let sets = parseInt(exercise_sets.value) // Gets Current Sets Amount In Number Format
            sets -= 1 // Decreases Sets Amount By 1

            if(sets < 1) return // Do Nothing
            exercise_sets.value = sets // Updates Exercise Sets Amount
        })
        
        // Adds Increase Exercise Sets Functionality
        increase_exercise_sets.addEventListener("click", function() {
            let sets = parseInt(exercise_sets.value) // Gets Current Sets Amount In Number Format
            sets += 1 // Increases Sets Amount By 1

            if(sets > 100) return // Do Nothing
            exercise_sets.value = sets // Updates Exercise Sets Amount
        })

        updateProgressBar()

        const exercises = document.querySelectorAll(".training_plan_container .training_plan .exercise") // Gets All Exercises
        changeExercises(exercises.length - 1) // Shows The Last Added Exercise
        // updateReps(exercises.length - 1) // Calls Update Reps Function On Every Added Exercise
    }

    // function updateReps(exercise_index) {
        
    // }

    // Function For Add Bar To The Progress Bar
    function updateProgressBar() {
        const training_plan = document.querySelector(".training_plan_container .training_plan") // Gets Training Plan
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

        // exercises[exercises.length - 1].classList.add("active") // Shows The Last Exercise
        // exercises[0].classList.add("active") // Shows The Last Added Exercise
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