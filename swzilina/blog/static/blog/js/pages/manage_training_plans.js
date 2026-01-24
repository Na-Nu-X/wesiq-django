import { sendPOST } from "../services/sendPOST.js"
import { getMinimalistFormattedTime } from "../utils/timer.js"

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
    const unit_select_menu_template = training_plan.querySelector(".unit_select_menu_template")

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

    // Hold Button Events
    let hold_interval = null
    let hold_timeout = null

    const HOLD_INTERVAL_SPEED = 100 // 10-Times Per Second
    const HOLD_START_DELAY = 250 // Starts Hold Interval After 250MS Of Hold Time, Everything Above Is Just A Click

    function stopHold() {
        clearInterval(hold_interval)
        clearTimeout(hold_timeout)
    }
    
    // Functions

    function addExerciseToTrainingPlan() {
        // Checks If Selection Dragged Exercise Is Already In The Training Plan
        function isExistingExercise() {
            const training_plan_exercises = training_plan.querySelectorAll(".exercise") // Gets All Training Plan Exercises

            // Returns True If The Exercise Is Already In The Training Plan
            return [...training_plan_exercises].some(function(one_exercise) {
                const exercise_title = one_exercise.querySelector(".title").textContent // Gets Title Of The Exercise In The Training Plan
                const selection_dragged_exercise_name = selection_dragged_exercise.querySelector(".exercise_name").textContent // Gets Dragged Exercise Name
                const selection_dragged_exercise_weight = selection_dragged_exercise.dataset.weight // Gets Current Added Or Subtracted Weight Of The Dragged Exercise

                // Checks All The Combinations Of Exercise Title Formats
                return (
                    exercise_title === selection_dragged_exercise_name && selection_dragged_exercise_weight == 0 || // For Example: Front Lever

                    exercise_title === `${selection_dragged_exercise_weight}kg ${selection_dragged_exercise_name}` || // For Example: 100kg Deadlift

                    exercise_title === `${selection_dragged_exercise_name} +${selection_dragged_exercise_weight}kg` || // For Example: Front Lever +10kg

                    exercise_title === `${selection_dragged_exercise_name} ${selection_dragged_exercise_weight}kg` // For Example: Front Lever -10kg
                )
            })
        }

        // Creates Exercise Title With Combination Of Exercise Name And Added Or Subtracted Weight Of The Dragged Exercise
        function createExerciseTitle(exercise_name, exercise_weight) {
            if(selection_dragged_exercise.classList.contains("custom_exercise")) return // Skips Custom Exercise

            // Formats Exercise Title
            if(exercise_weight != 0) {
                // Returns Title With Appended Weight If The Exercise Doesn't Require Weight
                if(selection_dragged_exercise.dataset.requires_weight == "False") {
                    return exercise_weight > 0 ? `${exercise_name} +${exercise_weight}kg` : `${exercise_name} ${exercise_weight}kg` // Returns Plus Symbol Before Weight Value If The Weigh Is A Positive Number
                }

                return `${exercise_weight}kg ${exercise_name}` // Returns Title With Prepended Weight If The Exercise Requires Weight
            }

            return exercise_name // Returns Unchanged Exercise Title If The Weight Is Set On 0
        }

        function addCustomExerciseToTrainingPlan(exercise) {
            // Creates Exercise Title Input
            const exercise_title_input = document.createElement("input")

            exercise_title_input.classList.add("exercise_title_input")
            exercise_title_input.type = "text"
            exercise_title_input.placeholder = "Pridajte názov cviku"

            exercise.prepend(exercise_title_input) // Prepends Exercise Title Input

            // Creates Custom Unit Select Menu
            const unit_select_menu_template_clone = unit_select_menu_template.content.cloneNode(true) // Clones The Custom Unit Select Template Content

            exercise.querySelector(".labels").prepend(unit_select_menu_template_clone) // Prepends Custom Unit Select To The Exercise Labels

            exercise.querySelector(".labels .unit_amount").style.display = "none" // Hides Unit Amount Label
        }

        // Executes Only If The Dragged Element Is Selection Dragged Exercise And Doesn't Already Exist In The Training Plan (Except Of The Custom Exercise)
        if(selection_dragged_exercise && !isExistingExercise() || selection_dragged_exercise.classList.contains("custom_exercise")) {
            const exercise_template_clone = exercise_template.content.cloneNode(true) // Clones The Exercise Template Content

            const selection_dragged_exercise_name = selection_dragged_exercise.querySelector(".exercise_name").textContent // Gets Dragged Exercise Name
            const selection_dragged_exercise_weight = selection_dragged_exercise.dataset.weight // Gets Current Added Or Subtracted Weight Of The Dragged Exercise

            exercise_template_clone.querySelector(".exercise .title").textContent = createExerciseTitle(selection_dragged_exercise_name, selection_dragged_exercise_weight) // Sets Formatted Title Value To The Exercise Title

            // Sets The Correct Unit Amount Label By Selection Dragged Exercise Unit
            exercise_template_clone.querySelector(".labels .unit_amount").dataset.unit = selection_dragged_exercise.dataset.unit

            if(selection_dragged_exercise.dataset.unit === "reps") {
                exercise_template_clone.querySelector(".labels .unit_amount").textContent = "Počet opakovaní"
            }

            if(selection_dragged_exercise.dataset.unit === "seconds") {
                exercise_template_clone.querySelector(".labels .unit_amount").textContent = "Počet sekúnd"
            }

            // Adds Custom Exercise To The Training Plan
            if(selection_dragged_exercise.classList.contains("custom_exercise")) {
                addCustomExerciseToTrainingPlan(exercise_template_clone.querySelector(".exercise"))
            }

            training_plan.appendChild(exercise_template_clone) // Appends Exercise To The Training Plan

            // Hides Dragged Exercise From The Selection (Doesn't Hide Custom Exercise And Exercises With Changed Weight Values)
            // if(!selection_dragged_exercise.classList.contains("custom_exercise") && selection_dragged_exercise.dataset.weight == 0) {
            //     selection_dragged_exercise.classList.add("hidden")
            // }

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

            searchBar() // Refreshes Exercise Selection Exercises (Refreshes Search Bar Results)
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

        // Checks For Empty Exercise Title Inputs In Custom Exercises In The Training Plan
        const custom_exercises_without_name = [...training_plan_exercises].filter(function(one_exercise) {
            return one_exercise?.querySelector(".exercise_title_input")?.value?.trim() === ""
        })

        if(custom_exercises_without_name.length > 0) {
            const first_custom_exercise_without_name_index = [...training_plan_exercises].indexOf(custom_exercises_without_name[0]) // Gets Index Of The First Custom Exercise Without Filled Title Input

            changeTrainingPlanExercises(first_custom_exercise_without_name_index) // Shows The Exercise Of The First Custom Exercise Without Filled Title Input Index
        }

        // Only Saves If Everything Required Is Filled
        if(training_plan_title.value !== "" && training_plan_exercises.length !== 0 && custom_exercises_without_name.length === 0) {
            const new_training_plan_data = [] // Stores All New Saved Training Plan Data

            // Gets Info From Every Exercise
            training_plan_exercises.forEach(function(one_exercise) {
                const exercise_name = one_exercise.querySelector(".exercise_title_input") ? one_exercise.querySelector(".exercise_title_input").value : one_exercise.querySelector(".title").textContent // Gets Exercise Name

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

                const exercise_unit = one_exercise.querySelector("[data-unit]").dataset.unit // Gets Exercise Unit Type (Reps Or Seconds)

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
                new_training_plan_object.unit = exercise_unit
                new_training_plan_object.order = [...training_plan_exercises].indexOf(one_exercise) + 1

                new_training_plan_data.push(new_training_plan_object) // Fills New Training Plan Data Array With Objects Of Exercises
            })

            sendPOST("/my-training-plans", new_training_plan_data) // Sends The Data With POST

            location.reload() // Reloads The Page
        }
    }

    function changeReps(button, operation) {
        const exercise_unit = button.closest(".exercise").querySelector("[data-unit]").dataset.unit // Gets Exercise Unit Type (Reps Or Seconds)
        const reps = button.closest(".reps_container").querySelector(".reps") // Gets Reps Input
        const to_failure = button.closest(".reps_container").querySelector(".to_failure") // Gets To Failure Text
        const time = button.closest(".reps_container").querySelector(".time") // Gets Time Text
        let reps_number = parseInt(reps.value) // Gets Current Reps Amount In Number Format

        console.log(exercise_unit)

        if(operation === "decrease") {
            reps_number -= 1 // Decreases Reps Amount By 1

            if(reps_number < 0) {
                return // Do Nothing
            }

            if(reps_number === 0) {
                reps.style.visibility = "hidden" // Hides Reps Input
                time.style.visibility = "hidden" // Hides Time Text
                to_failure.style.visibility = "visible" // Shows To Failure Text
            }

            else {
                // Checks Exercise Unit Type
                if(exercise_unit === "reps") {
                    reps.style.visibility = "visible" // Shows Reps Input
                }

                if(exercise_unit === "seconds") {
                    time.style.visibility = "visible" // Shows Time Text
                    reps.style.visibility = "hidden" // Hides Reps Input
                    
                    time.textContent = getMinimalistFormattedTime(reps_number)
                }
                
                to_failure.style.visibility = "hidden" // Hides To Failure Text
            }
            
            reps.value = reps_number // Updates Exercise Reps Amount
        }

        if(operation === "increase") {
            reps_number += 1 // Increases Reps Amount By 1

            // Checks Exercise Unit Type
            if(exercise_unit === "reps") {
                if(reps_number > 100) return // Do Nothing

                reps.style.visibility = "visible" // Shows Reps Input
            }

            if(exercise_unit === "seconds") {
                if(reps_number > 3600) return // Do Nothing

                time.style.visibility = "visible" // Shows Time Text
                reps.style.visibility = "hidden" // Hides Reps Input

                time.textContent = getMinimalistFormattedTime(reps_number)
            }

            to_failure.style.visibility = "hidden" // Hides To Failure Text
            reps.value = reps_number // Updates Exercise Reps Amount
        }
    }

    function changeSets(button, operation) {
        const sets = button.closest(".sets_container").querySelector(".sets") // Gets Reps Input
        let sets_number = parseInt(sets.value) // Gets Current Reps Amount In Number Format

        if(operation === "decrease") {
            sets_number -= 1 // Decreases Sets Amount By 1

            // DELETE PERIOD
            if(sets_number === 0 && button.closest(".exercise").querySelectorAll(".period_selection").length > 1) {
                button.closest(".period_selection").remove() // Removes Period Selection From DOM
            }

            if(sets_number < 1) return // Do Nothing

            sets.value = sets_number // Updates Exercise Sets Amount
        }

        if(operation === "increase") {
            sets_number += 1 // Increases Sets Amount By 1

            if(sets_number > 100) return // Do Nothing
            sets.value = sets_number // Updates Exercise Sets Amount
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
            // Removes Animation From All Of The Bars Except Of The Dragged One
            bar_container.querySelectorAll(".bar").forEach(function(one_bar) {
                if(one_bar !== training_plan_dragged_bar) {
                    one_bar.classList.remove("animate") // Removes Drag Animation
                }
            })

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

        // Unit Select Menu
        if(event.target.closest(".unit_select_menu")) {
            const unit_select_menu = event.target.closest(".unit_select_menu") // Gets Unit Select Menu
            const unit_select = unit_select_menu.querySelector(".select") // Gets Selected Option Print
            const unit_options_list = unit_select_menu.querySelector(".options_list") // Gets Unit Options List
            const unit_options = unit_options_list.querySelectorAll(".option") // Gets All Unit Options

            unit_options_list.classList.toggle("active")
		    unit_select.querySelector(".fa-angle-down").classList.toggle("fa-angle-up")

            if(event.target.closest(".option")) {
                const clicked_option = event.target.closest(".option")

                unit_select_menu.dataset.unit = clicked_option.dataset.unit_option

                // Remove Selected Class From Options
                unit_options.forEach(function(one_option) {
                    one_option.classList.remove("selected")
                })

                // Shows Current Selected Option From List Without Icon
                if(clicked_option.dataset.unit_option === unit_select_menu.dataset.unit) {
                    unit_select.querySelector("span").textContent = clicked_option.querySelector("span").textContent
                    unit_select_menu.querySelector("input").value = clicked_option.querySelector("span").textContent

                    clicked_option.classList.add("selected") // Adds Selected Class To Selected Option
                }
            }
        }
    })

    // Removes Exercise From The Training Plan On Double Click
    training_plan.addEventListener("dblclick", function(event) {
        if(event.target.classList.contains("exercise")) {
            training_plan_dragged_exercise = event.target // Sets Training Plan Dragged Exercise
            removeExerciseFromTrainingPlan() // Removes Dragged Exercise From The Training Plan
            training_plan_dragged_exercise = null // Deletes Training Plan Dragged Exercise
        }
    })

    // Increase And Decrease Sets & Reps Functionality
    training_plan.addEventListener("pointerdown", function(event) {
        // Add Decrease Exercise Reps Functionality
        if(event.target.classList.contains("decrease_reps")) {
            changeReps(event.target, "decrease")

            // Decreases Amount Of Reps On Hold
            hold_timeout = setTimeout(function() {
                hold_interval = setInterval(function() {
                    changeReps(event.target, "decrease")
                }, HOLD_INTERVAL_SPEED)
            }, HOLD_START_DELAY)
        }

        // Add Increase Exercise Reps Functionality
        if(event.target.classList.contains("increase_reps")) {
            changeReps(event.target, "increase")

            // Increases Amount Of Reps On Hold
            hold_timeout = setTimeout(function() {
                hold_interval = setInterval(function() {
                    changeReps(event.target, "increase")
                }, HOLD_INTERVAL_SPEED)
            }, HOLD_START_DELAY)
        }

        // Add Decrease Exercise Sets Functionality
        if(event.target.classList.contains("decrease_sets")) {
            changeSets(event.target, "decrease")

            // Decreases Amount Of Sets On Hold
            hold_timeout = setTimeout(function() {
                hold_interval = setInterval(function() {
                    changeSets(event.target, "decrease")
                }, HOLD_INTERVAL_SPEED)
            }, HOLD_START_DELAY)
        }

        // Add Increase Exercise Sets Functionality
        if(event.target.classList.contains("increase_sets")) {
            changeSets(event.target, "increase")

            // Increases Amount Of Sets On Hold
            hold_timeout = setTimeout(function() {
                hold_interval = setInterval(function() {
                    changeSets(event.target, "increase")
                }, HOLD_INTERVAL_SPEED)
            }, HOLD_START_DELAY)
        }
    })

    training_plan.addEventListener("pointerup", stopHold)
    training_plan.addEventListener("pointercancel", stopHold)
    training_plan.addEventListener("pointerleave", stopHold)

    // Training Plan Drag Start Events
    training_plan.addEventListener("dragstart", function(event) {
        // Training Plan Exercises Drag Functionality
        if(event.target.classList.contains("exercise")) {
            training_plan_dragged_exercise = event.target // Sets Training Plan Dragged Exercise
        }

        // Training Plan Exercises Drag With Bars Functionality
        if(event.target.classList.contains("bar")) {
            training_plan_dragged_bar = event.target // Sets Training Plan Dragged Bar

            // Animates All Of The Bars Except Of The Dragged One
            bar_container.querySelectorAll(".bar").forEach(function(one_bar) {
                if(one_bar !== training_plan_dragged_bar) {
                    one_bar.classList.add("animate") // Adds Drag Animation
                }
            })
        }
    })

    training_plan.addEventListener("dragend", function(event) {
        training_plan_dragged_exercise = null // Deletes Training Plan Dragged Exercise
        training_plan_dragged_bar = null // Deletes Training Plan Dragged Bar

        bar_container.querySelectorAll(".bar").forEach(function(one_bar) {
            one_bar.classList.remove("animate") // Removes Drag Animation
        })
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

        // Hides Filtered Exercises Except Of Custom Exercise In The Exercise Selection
        filtered_exercise_selection_exercises.forEach(function(one_exercise) {
            if(!one_exercise.classList.contains("custom_exercise")) {
                one_exercise.style.display = "none"
            }
        })
    }

    function deleteSearchBar() {
        search_bar.value = "" // Deletes Search Bar Value
        searchBar() // Refreshes Exercise Selection Exercises (Refreshes Search Bar Results)
    }

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
        
        // Add Exercise To The Training Plan On Double Click
        one_exercise.addEventListener("dblclick", function(event) {
            // Executes Only If The Click Is Outside The Increase Weight Button, Decrease Weight Button And Weight Print
            if(!event.target.classList.contains("increase_weight") && !event.target.classList.contains("decrease_weight") && !event.target.parentNode.classList.contains("weight")) {
                selection_dragged_exercise = one_exercise // Sets Selection Dragged Exercise
                addExerciseToTrainingPlan() // Adds Dragged Exercise From Exercise Selection To The Training Plan
                selection_dragged_exercise = null // Deletes Selection Dragged Exercise
            }
        })

        // Increase And Decrease Weight Functionality
        one_exercise.addEventListener("pointerdown", function(event) {
            // Increase Weight
            if(event.target.classList.contains("increase_weight")) {
                changeWeight(one_exercise, "increase") // Increases Weight

                // Increases Weight On Hold
                hold_timeout = setTimeout(function() {
                    hold_interval = setInterval(function() {
                        changeWeight(one_exercise, "increase")
                    }, HOLD_INTERVAL_SPEED)
                }, HOLD_START_DELAY)
            }

            // Decrease Weight
            if(event.target.classList.contains("decrease_weight")) {
                changeWeight(one_exercise, "decrease") // Decreases Weight

                // Decreases Weight On Hold
                hold_timeout = setTimeout(function() {
                    hold_interval = setInterval(function() {
                        changeWeight(one_exercise, "decrease")
                    }, HOLD_INTERVAL_SPEED)
                }, HOLD_START_DELAY)
            }
        })

        one_exercise.addEventListener("pointerup", stopHold)
        one_exercise.addEventListener("pointercancel", stopHold)
        one_exercise.addEventListener("pointerleave", stopHold)
    })
})