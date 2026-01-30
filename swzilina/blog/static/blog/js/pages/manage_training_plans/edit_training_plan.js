import { global_state, edit_training_plan_state } from "./state.js"
import { addExercise, changeExercises, changeExercisePosition, removeExercise } from "./functions/exercises.js"
import { addPeriod, changeReps, changeSets, updateUnitTypes } from "./functions/periods.js"
import { startHold, stopHold } from "./functions/holdButton.js"
import { saveTrainingPlan } from "./functions/saveTrainingPlan.js"
import { getMinimalistFormattedTime } from "../../utils/timer.js"
import { createBars, renderBars } from "./functions/bars.js"

"use strict"

document.addEventListener("DOMContentLoaded", function() {
    // Variables

    let dragged_exercise = null // Gets Dragged Exercise From The Training Plan
    let dragged_bar = null // Gets Dragged Bar From The Training Plan

    const all_training_plans_container = document.querySelector(".all_training_plans_container") // Gets All Training Plans Container
    const training_plan = all_training_plans_container.querySelector(".training_plan") // Gets Training Plan

    const exercise_template = document.querySelector(".exercise_template") // Gets Exercise Template
    const period_selection_template = document.querySelector(".period_selection_template") // Gets Period Selection Template

    const exercises_data = all_training_plans_container.querySelectorAll(".one_exercise_data") // Gets Data From Every User's Exercise

    const drop_zone = training_plan.querySelector(".add_exercise") // Gets Training Plan Drop Zone

    const day_select_menu = all_training_plans_container.querySelector(".additional_info .day_select_menu") // Gets Day Select Menu
    const day_select = day_select_menu.querySelector(".select") // Gets Selected Option Print
    const day_options_list = day_select_menu.querySelector(".options_list") // Gets Day Options List
    const day_options = day_options_list.querySelectorAll(".option") // Gets All Day Options

    const save = all_training_plans_container.querySelector(".save") // Gets Training Plan Save Button

    // Stores All Possible Training Plan Types Of The User To An Array (For Example ["Pull", "Push", "Legs"])
    // const all_training_plan_types = [
    //     ...new Set([...exercises_data].map(function(one_exercise_data) {
    //         return `${one_exercise_data.dataset.type} - ${getDayName(one_exercise_data.dataset.day)}`
    //     }))
    // ]

    // Gets Current Order Of Training Plans By Day Value
    const training_plan_days_order = [
        ...new Set([...exercises_data].map(function(one_exercise_data) {
            return one_exercise_data.dataset.day
        }))
    ]

    let training_plan_day = training_plan_days_order[0] // Gets The First Value From Training Plan Days Order (Current Or Upcoming Day By Default)

    // Functions

    // Function For Render Exercises Of The Selected Training Plan
    function generateTrainingPlan(exercises_data, container) {
        // Extracts Data For Every Exercise
        exercises_data.forEach(function(one_exercise_data) {
            const day_data = one_exercise_data.dataset.day || null // Gets Training Day Of The Exercise If Has Any
            const type_data = one_exercise_data.dataset.type // Gets Training Title Of The Exercise
            const exercise_data = one_exercise_data.dataset.exercise // Gets Exercise Name
            const periods_data = JSON.parse(one_exercise_data.dataset.periods) // Gets Exercise Sets & Reps Periods
            const unit_data = one_exercise_data.dataset.unit // Gets Exercise Unit Type (Reps Or Seconds)

            // Shows Exercises Only Which Have Some Training Plan Day
            if(day_data !== null) {
                // Shows Exercises Only Of The Selected Training Plan Day
                if(training_plan_day === day_data) {
                    const exercise_template_clone = exercise_template.content.cloneNode(true) // Clones The Exercise Template Content

                    container.querySelector(".additional_info .title").value = type_data
                
                    exercise_template_clone.querySelector(".exercise .title").textContent = exercise_data // Sets Title To The Exercise Title

                    unit_data === "reps" ? exercise_template_clone.querySelector(".exercise .labels .unit_amount").textContent = "Počet opakovaní" : exercise_template_clone.querySelector(".exercise .labels .unit_amount").textContent = "Počet sekúnd" // Sets Unit Amount Text Value By Unit Of Exercise

                    exercise_template_clone.querySelector(".exercise").dataset.unit = unit_data // Stores Unit Type Data To The Exercise

                    exercise_template_clone.querySelector(".exercise .periods_container").innerHTML = "" // Deletes All Period Selections

                    generatePeriodSelections(periods_data, getTotalPeriodSelections(periods_data), unit_data, exercise_template_clone.querySelector(".periods_container")) // Generates Exact Amount Of Period Selections For Exercise

                    container.querySelector(".training_plan").appendChild(exercise_template_clone) // Appends The Exercise To The Training Plan
                }
            }
        })

        const exercises = training_plan.querySelectorAll(".exercise") // Gets All Training Plan Exercises

        exercises[edit_training_plan_state.active_exercise_index].classList.add("active") // Shows Active Exercise

        // Creates And Renders Bars
        const bar_container = createBars(exercises.length, edit_training_plan_state)
        renderBars(training_plan, bar_container)
    }

    // Function Which Converts Exercise Period To An Array With Amounts Of The Similar Sets
    function getTotalPeriodSelections(periods_data) {
        // Gets Array Of Similar Sets In Periods
        let total_period_selections = []
        let similar_sets = 0

        periods_data.forEach(function(_, index) {
            if(periods_data[index] === periods_data[index - 1] || index === 0) {
                similar_sets += 1
            }

            else {
                total_period_selections.push(similar_sets)
            }
        })

        total_period_selections.push(similar_sets)

        return total_period_selections
    }

    // Function For Generate Period Selections
    function generatePeriodSelections(periods_data, amount, unit, parent_element) {
        amount.forEach(function(one_unit, index) {
            const period_selection_template_clone = period_selection_template.content.cloneNode(true) // Clones The Period Selection Template Content

            // Fills Sets & Reps Inputs With The Values
            const reps = period_selection_template_clone.querySelector(".period_selection .reps_container .reps") // Gets Reps Input
            const sets = period_selection_template_clone.querySelector(".period_selection .sets_container .sets") // Gets Sets Input

            reps.value = periods_data[index] // Replaces Reps Input Value
            sets.value = one_unit // Replaces Sets Input Value

            // Shows Reps Content
            const to_failure = period_selection_template_clone.querySelector(".period_selection .reps_container .to_failure") // Gets To Failure Text
            const time = period_selection_template_clone.querySelector(".period_selection .reps_container .time") // Gets Time Text

            if(periods_data[index] === 0) {
                to_failure.style.visibility = "visible" // Shows To Failure Text
            }

            else {
                // Checks Exercise Unit Type
                if(unit === "reps") {
                    reps.style.visibility = "visible" // Shows Reps Input
                }

                if(unit === "seconds") {
                    time.style.visibility = "visible" // Shows Time Text
                    time.textContent = getMinimalistFormattedTime(periods_data[index])
                }
                
                to_failure.style.visibility = "hidden" // Hides To Failure Text
            }

            parent_element.appendChild(period_selection_template_clone) // Appends Period Selection To The Exercise
        })
    }

    // Global Event Delegations

    // All Training Plans Container Drop Events (Remove The Exercise From The Training Plan)
    all_training_plans_container.addEventListener("dragover", function(event) {
        if(event.target === all_training_plans_container) {
            event.preventDefault() // Makes The Drop Zone Functional
        }
    })

    all_training_plans_container.addEventListener("drop", function(event) {
        if(event.target === all_training_plans_container) {
            removeExercise(dragged_exercise, training_plan, edit_training_plan_state) // Removes Dragged Exercise From The Training Plan
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
        if(event.target === training_plan.querySelectorAll(".exercise")[edit_training_plan_state.active_exercise_index]) {
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
            addExercise(training_plan, edit_training_plan_state) // Adds Dragged Exercise From Exercise Selection To The Training Plan
        }

        // Drop Zone On Active Exercise In The Training Plan
        if(event.target === training_plan.querySelectorAll(".exercise")[edit_training_plan_state.active_exercise_index]) {
            addExercise(training_plan, edit_training_plan_state) // Adds Dragged Exercise From Exercise Selection To The Training Plan
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
            changeExercisePosition(dropped_bar_index, dragged_bar, training_plan, edit_training_plan_state) // Changes Training Plan Exercise Position By Position Of Bars In The Bar Container
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
            changeExercises(clicked_bar_index, training_plan, edit_training_plan_state) // Changes Training Plan Exercises
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

                // Remove Selected Class From Options
                unit_options.forEach(function(one_option) {
                    one_option.classList.remove("selected")
                })

                if(clicked_option.dataset.unit_option === unit_select_menu.closest(".exercise").dataset.unit) {
                    unit_select.querySelector("span").textContent = clicked_option.querySelector("span").textContent // Shows Current Selected Option From List Without Icon
                    clicked_option.classList.add("selected") // Adds Selected Class To Selected Option
                }

                updateUnitTypes(clicked_option.dataset.unit_option, training_plan, edit_training_plan_state) // Updates Unit Type For Every Reps Container
            }
        }
    })

    // Training Plan Double Click Events
    training_plan.addEventListener("dblclick", function(event) {
        if(event.target.classList.contains("exercise")) {
            dragged_exercise = event.target // Sets Training Plan Dragged Exercise
            removeExercise(dragged_exercise, training_plan, edit_training_plan_state) // Removes Dragged Exercise From The Training Plan
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

    // Day Select Menu
    day_select.addEventListener("click", function() {
        day_options_list.classList.toggle("active") // Shows / Hides Options List
        day_select.querySelector(".fa-angle-down").classList.toggle("fa-angle-up") // Toggle Icons
    })

    day_options.forEach(function(option) {
        option.addEventListener("click", function() {
            sessionStorage.setItem("edit_training_plan_day", option.dataset.day) // Stores Edited Training Plan Day To Session Storage

            day_options_list.classList.toggle("active") // Shows / Hides Options List
            day_select.querySelector(".fa-angle-down").classList.toggle("fa-angle-up") // Toggle Icons

            // Remove Selected Class From Options
            day_options.forEach(function(remove_selected) {
                remove_selected.classList.remove("selected")
            })

            // Shows Current Selected Option From List Without Icon
            if(option.dataset.day === sessionStorage.getItem("edit_training_plan_day")) {
                day_select.querySelector("span").textContent = option.querySelector("span").textContent // Shows Current Selected Option From List Without Icon
                option.classList.add("selected") // Adds Selected Class To Selected Option
            }
        })
    })

    // Save Edited Training Plan
    save.addEventListener("click", function() {
        saveTrainingPlan(all_training_plans_container, edit_training_plan_state)
    })

    // MAIN

    // Renders User's Training Plan If Has Any
    if(exercises_data.length > 0) {
        generateTrainingPlan(exercises_data, all_training_plans_container)
    }
})