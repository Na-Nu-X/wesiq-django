import { sendPOST } from "../services/sendPOST.js"

"use strict"

document.addEventListener("DOMContentLoaded", function() {
    const training_plan = document.querySelector(".training_plan_container .training_plan") // Gets Training Plan
    const exercise_template = document.querySelector(".exercise_template") // Gets Exercise Template

    // Event Delegation For Global Events
    training_plan.addEventListener("click", function(event) {
        // CHANGE SETS & REPS VALUES

        // Adds Decrease Exercise Reps Functionality
        if(event.target.classList.contains("decrease_reps")) {
            const reps = event.target.closest(".reps_container").querySelector(".reps") // Gets Reps Input
            const to_failure = event.target.closest(".reps_container").querySelector(".to_failure") // Gets To Failure Text
            let reps_number = parseInt(reps.value) // Gets Current Reps Amount In Number Format

            reps.style.visibility = "visible" // Shows Reps Input
            to_failure.style.visibility = "hidden" // Hides To Failure Text
            
            reps_number -= 1 // Decreases Reps Amount By 1

            if(reps_number === 0) {
                reps.style.visibility = "hidden" // Hides Reps Input
                to_failure.style.visibility = "visible" // Shows To Failure Text
            }

            if(reps_number < 0) {
                reps.style.visibility = "hidden" // Hides Reps Input
                to_failure.style.visibility = "visible" // Shows To Failure Text
                return // Do Nothing
            }

            reps.value = reps_number // Updates Exercise Reps Amount
        }

        // Adds Increase Exercise Reps Functionality
        if(event.target.classList.contains("increase_reps")) {
            const reps = event.target.closest(".reps_container").querySelector(".reps") // Gets Reps Input
            const to_failure = event.target.closest(".reps_container").querySelector(".to_failure") // Gets To Failure Text
            let reps_number = parseInt(reps.value) // Gets Current Reps Amount In Number Format

            reps_number += 1 // Increases Reps Amount By 1

            if(reps_number > 100) return // Do Nothing

            reps.style.visibility = "visible" // Shows Reps Input
            to_failure.style.visibility = "hidden" // Hides To Failure Text
            reps.value = reps_number // Updates Exercise Reps Amount
        }

        // Adds Decrease Exercise Sets Functionality
        if(event.target.classList.contains("decrease_sets")) {
            const sets = event.target.closest(".sets_container").querySelector(".sets") // Gets Reps Input
            let sets_number = parseInt(sets.value) // Gets Current Reps Amount In Number Format

            sets_number -= 1 // Decreases Sets Amount By 1

            // DELETE PERIOD
            if(sets_number === 0 && event.target.closest(".exercise").querySelectorAll(".period_selection").length > 1) {
                event.target.closest(".period_selection").remove() // Removes Period Selection From DOM
            }

            if(sets_number < 1) return // Do Nothing

            sets.value = sets_number // Updates Exercise Sets Amount
        }

        // Adds Increase Exercise Sets Functionality
        if(event.target.classList.contains("increase_sets")) {
            const sets = event.target.closest(".sets_container").querySelector(".sets") // Gets Reps Input
            let sets_number = parseInt(sets.value) // Gets Current Reps Amount In Number Format

            sets_number += 1 // Increases Sets Amount By 1

            if(sets_number > 100) return // Do Nothing
            sets.value = sets_number // Updates Exercise Sets Amount
        }
    })

    // Function For Create And Append Exercise To Training Plan
    function createExercise(exercise_name) {
        const exercise_template_clone = exercise_template.content.cloneNode(true) // Clones Exercise Template

        exercise_template_clone.querySelector(".title").textContent = exercise_name // Adds Exercise Name As A Title

        // ADD PERIOD
        const add_period = exercise_template_clone.querySelector(".add_period") // Gets Add Period Button

        const period_selection_template = document.querySelector(".period_selection_template") // Gets Period Selection Template
        
        add_period.addEventListener("click", function(event) {
            const period_selection_template_clone = period_selection_template.content.cloneNode(true) // Clones Period Selection Template
            
            event.target.parentNode.querySelector(".periods_container").prepend(period_selection_template_clone) // Prepends Period Selection Template
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

        removeExercise()
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

    // Function For Remove Added Exercise From The Training Plan
    function removeExercise() {
        const exercises = training_plan.querySelectorAll(".exercise") // Gets All Exercises From The Training Plan
        let dragged_exercise = null // Stores Dragged Exercise

        exercises.forEach(function(one_exercise) {
            // Drag Start
            one_exercise.addEventListener("dragstart", function() {
                dragged_exercise = one_exercise // Saves Dragged Exercise
                one_exercise.classList.add("dragging") // Adds Dragging Class
                console.log(one_exercise)
            })

            // Drag End
            one_exercise.addEventListener("dragend", function() {
                one_exercise.classList.remove("dragging") // Removes Dragging Class
                console.log(one_exercise)
            })
        })

        // Drop Zone
        // const body = document.querySelector("body")

        // body.addEventListener("dragover", function(event) {
        //     event.preventDefault()

        //     body.classList.add("animate") // Adds Animation
        // })

        // body.addEventListener("drop", function() {
        //     if(!dragged_exercise) return

        //     dragged_exercise.remove() // Deletes Dragged Exercise From Exercises

        //     const exercise_name = dragged_exercise.querySelector(".exercise_name").textContent // Gets Dragged Exercise Name
        //     createExercise(exercise_name) // Appends Dragged Exercise

        //     dragged_exercise.classList.remove("dragging") // Removes Dragging Class
        //     dragged_exercise = null // Deletes Stored Dragged Exercise

        //     body.classList.remove("animate") // Removes Animation
        // })

        // body.addEventListener("dragleave", function() {
        //     body.classList.remove("animate") // Removes Animation
        // })
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

    // Day Select Menu
    const day_select_menu = document.querySelector(".day_select_menu")
    const day_select = document.querySelector(".day_select_menu .select")
    const day_options_list = document.querySelector(".day_select_menu .options_list")
    const day_options = document.querySelectorAll(".day_select_menu .option")

    day_select.addEventListener("click", function() {
        day_options_list.classList.toggle("active")
        day_select.querySelector(".fa-angle-down").classList.toggle("fa-angle-up")
    })

    day_options.forEach(function(option) {
        option.addEventListener("click", function() {
            sessionStorage.setItem("day", option.dataset.day)

            day_options_list.classList.toggle("active")
            day_select.querySelector(".fa-angle-down").classList.toggle("fa-angle-up")

            // Remove Selected Class From Options
            day_options.forEach(function(remove_selected) {
                remove_selected.classList.remove("selected")
            })

            // Shows Current Selected Option From List Without Icon
            if(option.dataset.day === sessionStorage.getItem("day")) {
                day_select.querySelector("span").textContent = option.querySelector("span").textContent
                day_select_menu.querySelector("input").value = option.querySelector("span").textContent

                option.classList.add("selected") // Adds Selected Class To Selected Option
            }
        })
    })

    // Save
    const save = document.querySelector(".training_plan_container .save") // Gets Save Button

    save.addEventListener("click", function() {
        const training_title = document.querySelector(".training_title") // Gets Training Title
        const all_exercises = training_plan.querySelectorAll(".exercise") // Gets All Exercises From Created Training Plan

        if(training_title.value === "") {
            // Shows Error Animation
            training_title.classList.remove("error_animation")
            void training_title.offsetWidth
            training_title.classList.add("error_animation")
        }

        if(all_exercises.length === 0) {
            // Shows Error Animation
            training_plan.querySelector(".fa-compress").classList.remove("error_animation")
            void training_plan.querySelector(".fa-compress").offsetWidth
            training_plan.querySelector(".fa-compress").classList.add("error_animation")
        }

        else {
            const training_plan_data = [] // Stores All Training Plan Data

            // Gets Info From Every Exercise
            all_exercises.forEach(function(one_exercise) {
                const exercise_name = one_exercise.querySelector(".title").textContent // Gets Exercise Title

                const all_reps_inputs = one_exercise.querySelectorAll(".periods_container .reps") // Gets All Reps Inputs
                const all_sets_inputs = one_exercise.querySelectorAll(".periods_container .sets") // Gets All Sets Inputs

                // Gets All Reps Inputs Values
                const all_reps_inputs_values = [...all_reps_inputs].map(function(one_input) {
                    return one_input.value
                })

                // Gets All Sets Inputs Values
                const all_sets_inputs_values = [...all_sets_inputs].map(function(one_input) {
                    return one_input.value
                })
                
                let periods = [] // Stores Periods Of Sets And Reps

                // Generates Periods Of Sets And Reps Values
                for(let i = 0; i < all_sets_inputs_values.length; i++) {
                    for(let j = 0; j < all_sets_inputs_values[i]; j++) {
                        periods.unshift(parseInt(all_reps_inputs_values[i])) // Saves Numbers To An Array
                    }
                }

                // Creates Object For One Exercise For Training Plan
                const training_plan_object = {}

                // training_plan_object.user = null

                // Finds Selected Day For Training Plan
                const selected_day = [...day_options].find(function(one_option) {
                    return one_option.classList.contains("selected")
                })
                
                if(selected_day?.dataset?.day) {
                    Number.isNaN(parseInt(selected_day.dataset.day)) ? training_plan_object.day = null : training_plan_object.day = parseInt(selected_day.dataset.day)
                } else {
                    training_plan_object.day = null
                }

                training_plan_object.type = training_title.value
                training_plan_object.exercise = exercise_name
                training_plan_object.periods = periods
                training_plan_object.order = [...all_exercises].indexOf(one_exercise) + 1

                training_plan_data.push(training_plan_object) // Fills Training Plan Data Array With Object
            })

            sendPOST("/my-training-plans", training_plan_data)
        }
    })
})