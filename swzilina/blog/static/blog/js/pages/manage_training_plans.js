import { sendPOST } from "../services/sendPOST.js"

"use strict"

document.addEventListener("DOMContentLoaded", function() {
    // CREATE TRAINING PLAN

    // Variables

    const training_plan_container = document.querySelector(".training_plan_container") // Gets Training Plan Container
    const training_plan = training_plan_container.querySelector(".training_plan")

    let selection_dragged_exercise = null // Gets Dragged Exercise From Exercise Selection
    let training_plan_dragged_exercise = null // Gets Dragged Exercise From The Training Plan
    let training_plan_dragged_bar = null // Gets Dragged Bar From The Training Plan

    const training_plan_drop_zone = training_plan.querySelector(".add_exercise") // Gets Training Plan Drop Zone

    const exercise_template = training_plan.querySelector(".exercise_template") // Gets Training Plan Exercise Template
    const period_selection_template = training_plan.querySelector(".period_selection_template")

    let active_training_plan_exercise_index = 0 // Stores Index Of Active Exercise In Training Plan

    const bar_container = training_plan.querySelector(".progress_bar") // Gets Bar Container

    const training_plan_title = training_plan_container.querySelector(".additional_info .training_title") // Gets Training Plan Title

    const day_select_menu = training_plan_container.querySelector(".additional_info .day_select_menu") // Gets Day Select Menu
    const day_select = day_select_menu.querySelector(".select") // Gets Selected Option Print
    const day_options_list = day_select_menu.querySelector(".options_list") // Gets Day Options List
    const day_options = day_options_list.querySelectorAll(".option") // Gets All Day Options

    const save = training_plan_container.querySelector(".save") // Gets Training Plan Save Button

    const exercise_selection_container = document.querySelector(".exercises_container") // Gets Exercise Selection Container

    const exercise_selection_exercises = exercise_selection_container.querySelectorAll(".exercises .exercise") // Gets All Exercise From The Exercise Selection
    
    // Functions

    function addExerciseToTrainingPlan() {
        // Executes Only If The Dragged Element Is Selection Dragged Exercise
        if(selection_dragged_exercise) {
            const exercise_template_clone = exercise_template.content.cloneNode(true) // Clones The Exercise Template Content

            exercise_template_clone.querySelector(".exercise .title").textContent = selection_dragged_exercise.querySelector(".exercise_name").textContent // Sets Exercise Name

            training_plan.appendChild(exercise_template_clone) // Appends Exercise To The Training Plan

            selection_dragged_exercise.classList.add("hidden") // Hides Dragged Exercise From The Selection

            changeTrainingPlanSlides() // Changes Slides In The Training Plan
        }
    }

    function removeExerciseFromTrainingPlan() {
        // Executes Only If The Dragged Element Is Training Plan Dragged Exercise
        if(training_plan_dragged_exercise) {
            // Finds Hidden Exercise In The Exercise Selection
            const hidden_exercise = [...exercise_selection_exercises].find(function(one_exercise) {
                return one_exercise.querySelector(".exercise_name").textContent === training_plan_dragged_exercise.querySelector(".title").textContent
            })

            hidden_exercise.classList.remove("hidden") // Shows Hidden Exercise Again In The Exercise Selection

            training_plan_dragged_exercise.remove() // Removes Training Plan Dragged Exercise From DOM

            const training_plan_exercises = training_plan.querySelectorAll(".exercise") // Gets All Training Plan Exercises

            // Checks If There Will Be Still Any Exercise In The Training Plan After Removal
            if(training_plan_exercises.length >= 1) {
                active_training_plan_exercise_index = training_plan_exercises.length - 1 // Sets Index Of Active Exercise In Training Plan To Last Possible Index (Shows The Last Exercise)

                training_plan_exercises[active_training_plan_exercise_index].classList.add("active") // Shows Active Exercise

                updateBars(training_plan_exercises.length) // Updates Bars
            }

            else {
                training_plan_drop_zone.classList.add("active") // Shows Training Plan Drop Zone

                updateBars(training_plan_exercises.length) // Updates Bars
            }
        }
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
            // active_training_plan_exercise_index += 1 // Increases Index Of Active Exercise In Training Plan (Shows Next Exercise)
            active_training_plan_exercise_index = training_plan_exercises.length - 1 // Sets Index Of Active Exercise In Training Plan To Last Possible Index (Shows The Last Exercise)
        }

        training_plan_exercises[active_training_plan_exercise_index].classList.add("active") // Shows Active Exercise

        updateBars(training_plan_exercises.length) // Updates Bars
    }

    function changeTrainingPlanExercises(clicked_bar_index) {
        const training_plan_exercises = training_plan.querySelectorAll(".exercise") // Gets All Training Plan Exercises

        training_plan_exercises[active_training_plan_exercise_index].classList.remove("active") // Hides Previous Active Exercise
        active_training_plan_exercise_index = clicked_bar_index // Sets Index Of Active Exercise In Training Plan To Clicked Bar Index Value
        training_plan_exercises[active_training_plan_exercise_index].classList.add("active") // Shows Active Exercise
        
        updateBars(training_plan_exercises.length) // Updates Bars
    }

    function changeTrainingPlanExercisePosition(dropped_bar_index) {
        // Executes Only If The Dragged Element Is Training Plan Dragged Bar
        if(training_plan_dragged_bar) {
            const dragged_bar_index = [...bar_container.querySelectorAll(".bar")].indexOf(training_plan_dragged_bar) // Gets Index Of The Dragged Bar In The Training Plan

            const training_plan_exercises = training_plan.querySelectorAll(".exercise") // Gets All Training Plan Exercises

            // Changes DOM Position Of Exercises
            if(dragged_bar_index < dropped_bar_index) {
                training_plan.insertBefore(training_plan_exercises[dragged_bar_index], training_plan_exercises[dropped_bar_index].nextSibling)
            }

            else {
                training_plan.insertBefore(training_plan_exercises[dragged_bar_index], training_plan_exercises[dropped_bar_index])
            }

            // Hides All Possible Options For Active Exercise In The Training Plan
            training_plan_exercises[active_training_plan_exercise_index].classList.remove("active") // Hides Previous Active Exercise
            training_plan_exercises[dropped_bar_index].classList.remove("active") // Hides Previous Active Exercise
            training_plan_exercises[dragged_bar_index].classList.remove("active") // Hides Previous Active Exercise

            changeTrainingPlanExercises(dropped_bar_index) // Shows The Exercise Of Dropped Bar Index
        }
    }

    function updateBars(training_plan_exercises_amount) {
        bar_container.innerHTML = "" // Deletes All Bars From The Bar Container

        // Creates Bars By Amount Of Exercises In The Training Plan
        for(let i = 0; i < training_plan_exercises_amount; i++) {
            // Creates Bar
            const bar = document.createElement("div")
            bar.classList.add("bar")
            bar.setAttribute("draggable", "true")
            bar_container.appendChild(bar)
        }

        training_plan.appendChild(bar_container) // Appends Bar Container At The End Of The Training Plan

        bar_container?.querySelectorAll(".bar")[active_training_plan_exercise_index]?.classList?.add("active") // Adds Active Class For Bar Of Active Exercise
    }

    function addPeriod(clicked_add_period_exercise) {
        const periods_container = clicked_add_period_exercise.querySelector(".periods_container") // Gets Periods Container Of Exercise

        const period_selection_template_clone = period_selection_template.content.cloneNode(true) // Clones The Period Selection Template Content

        periods_container.prepend(period_selection_template_clone) // Prepends New Period To The Exercise In The Training Plan
    }

    function saveNewTrainingPlan() {
        const training_plan_exercises = training_plan.querySelectorAll(".exercise") // Gets All Training Plan Exercises

        if(training_plan_title.value === "") {
            // Shows Error Animation
            training_plan_title.classList.remove("error_animation")
            void training_plan_title.offsetWidth
            training_plan_title.classList.add("error_animation")
        }

        if(training_plan_exercises.length === 0) {
            // Shows Error Animation
            training_plan.querySelector(".fa-compress").classList.remove("error_animation")
            void training_plan.querySelector(".fa-compress").offsetWidth
            training_plan.querySelector(".fa-compress").classList.add("error_animation")
        }

        // Only Saves If Everything Required Is Filled
        if(training_plan_title.value !== "" && training_plan_exercises.length !== 0) {
            const new_training_plan_data = [] // Stores All New Saved Training Plan Data

            // Gets Info From Every Exercise
            training_plan_exercises.forEach(function(one_exercise) {
                const exercise_name = one_exercise.querySelector(".title").textContent // Gets Exercise Name

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
                
                let periods = [] // Stores Periods Of Sets & Reps

                // Generates Periods Of Sets & Reps Values
                for(let i = 0; i < all_sets_inputs_values.length; i++) {
                    for(let j = 0; j < all_sets_inputs_values[i]; j++) {
                        periods.unshift(parseInt(all_reps_inputs_values[i])) // Saves Numbers To An Array
                    }
                }

                // Creates Object Of One Exercise For New Saved Training Plan
                const new_training_plan_object = {}

                // Finds Selected Day For Training Plan
                const selected_day = [...day_options].find(function(one_option) {
                    return one_option.classList.contains("selected")
                })
                
                if(selected_day?.dataset?.day) {
                    Number.isNaN(parseInt(selected_day.dataset.day)) ? new_training_plan_object.day = null : new_training_plan_object.day = parseInt(selected_day.dataset.day) // Saves The Value Of The Selected Day Number Only If The User Has Selected Any
                }
                
                else {
                    new_training_plan_object.day = null
                }

                new_training_plan_object.type = training_plan_title.value
                new_training_plan_object.exercise = exercise_name
                new_training_plan_object.periods = periods
                new_training_plan_object.order = [...training_plan_exercises].indexOf(one_exercise) + 1

                new_training_plan_data.push(new_training_plan_object) // Fills New Training Plan Data Array With Objects Of Exercises
            })

            sendPOST("/my-training-plans", new_training_plan_data) // Sends The Data With POST

            location.reload() // Reloads The Page
        }
    }

    // Global Event Delegations

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

        // Executes Only If The Dragged Element Is Selection Dragged Exercise
        if(selection_dragged_exercise) {
            training_plan.classList.add("animate") // Adds Drag Animation
        }

        // Drop Zone On Bars In The Bar Container
        if(event.target.classList.contains("bar")) {
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

        // Executes Only If The Dragged Element Is Selection Dragged Exercise
        if(selection_dragged_exercise) {
            training_plan.classList.remove("animate") // Removes Drag Animation
        }

        // Drop Zone On Bars In The Bar Container
        if(event.target.classList.contains("bar")) {
            const dropped_bar_index = [...bar_container.querySelectorAll(".bar")].indexOf(event.target) // Gets Index Of The Bar From The Bar Container Where The Dragged Bar Was Dropped
            changeTrainingPlanExercisePosition(dropped_bar_index) // Changes Training Plan Exercise Position By Position Of Bars In The Bar Container
        }
    })

    training_plan.addEventListener("dragleave", function() {
        // Executes Only If The Dragged Element Is Selection Dragged Exercise
        if(selection_dragged_exercise) {
            training_plan.classList.remove("animate") // Removes Drag Animation
        }
    })

    // Training Plan Click Events
    training_plan.addEventListener("click", function(event) {
        // Change Exercise In Training Plan With Bars Functionality
        if(event.target.classList.contains("bar")) {
            const clicked_bar_index = [...bar_container.querySelectorAll(".bar")].indexOf(event.target) // Gets Index Of The Clicked Bar

            changeTrainingPlanExercises(clicked_bar_index) // Changes Training Plan Exercises
        }

        // Add Sets & Reps Period Of Exercises In The Training Plan Functionality
        if(event.target.classList.contains("add_period")) {
            const clicked_add_period_exercise = event.target.closest(".exercise") // Gets Exercise From Training Plan Of Clicked Add Period Button

            addPeriod(clicked_add_period_exercise) // Adds Period For Given Exercise
        }

        // Add Decrease Exercise Reps Functionality
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

        // Add Increase Exercise Reps Functionality
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

        // Add Decrease Exercise Sets Functionality
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

        // Add Increase Exercise Sets Functionality
        if(event.target.classList.contains("increase_sets")) {
            const sets = event.target.closest(".sets_container").querySelector(".sets") // Gets Reps Input
            let sets_number = parseInt(sets.value) // Gets Current Reps Amount In Number Format

            sets_number += 1 // Increases Sets Amount By 1

            if(sets_number > 100) return // Do Nothing
            sets.value = sets_number // Updates Exercise Sets Amount
        }
    })

    // Training Plan Drag Start Events
    training_plan.addEventListener("dragstart", function(event) {
        // Training Plan Exercises Drag Functionality
        if(event.target.classList.contains("exercise")) {
            training_plan_dragged_exercise = event.target // Sets Training Plan Dragged Exercise
        }

        // Training Plan Exercises Drag With Bars Functionality
        if(event.target.classList.contains("bar")) {
            training_plan_dragged_bar = event.target // Sets Training Plan Dragged Bar
        }
    })

    training_plan.addEventListener("dragend", function(event) {
        training_plan_dragged_exercise = null // Deletes Training Plan Dragged Exercise
        training_plan_dragged_bar = null // Deletes Training Plan Dragged Bar
    })

    // Training Plan Container Drop Zone Functionality (Remove The Exercise From The Training Plan)
    training_plan_container.addEventListener("dragover", function(event) {
        if(event.target === training_plan_container) {
            event.preventDefault() // Makes The Drop Zone Functional
        }
    })

    training_plan_container.addEventListener("drop", function(event) {
        if(event.target === training_plan_container) {
            removeExerciseFromTrainingPlan() // Removes Dragged Exercise From The Training Plan
        }
    })

    // Events

    // Day Select Menu
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

    // Save New Training Plan Button
    save.addEventListener("click", saveNewTrainingPlan)

    // EXERCISE SELECTION

    // Variables
    const search_bar = exercise_selection_container.querySelector(".search_bar_menu .search_bar") // Gets Search Bar Input
    const delete_search_bar = exercise_selection_container.querySelector(".search_bar_menu .fa-xmark") // Gets Delete Search Bar Button

    // Functions

    function searchBar() {
        // Gets Only Exercises In The Exercise Selection Which Are Not Already Put In The New Training Plan
        const not_used_exercise_selection_exercises = [...exercise_selection_exercises].filter(function(one_exercise) {
            return !one_exercise.classList.contains("hidden")
        })

        // Exercises In The Exercise Selection Are Visible By Default
        not_used_exercise_selection_exercises.forEach(function(one_exercise) {
            one_exercise.style.display = "flex"
        })

        // Filters Exercises by Searched Bar Value (Returns Not Corresponding Exercises)
        const filtered_exercise_selection_exercises = [...not_used_exercise_selection_exercises].filter(function(one_exercise) {
            return !one_exercise.querySelector(".exercise_name").textContent.toLocaleLowerCase().includes(search_bar.value.toLocaleLowerCase())
        })

        // Hides Filtered Exercises In The Exercise Selection
        filtered_exercise_selection_exercises.forEach(function(one_exercise) {
            one_exercise.style.display = "none"
        })
    }

    function deleteSearchBar() {
        search_bar.value = "" // Deletes Search Bar Value
        searchBar() // Refreshes Exercise Selection Exercises
    }

    // Events

    // Exercise Selection Search Bar Functionality
    search_bar.addEventListener("input", searchBar)
    delete_search_bar.addEventListener("click", deleteSearchBar)

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