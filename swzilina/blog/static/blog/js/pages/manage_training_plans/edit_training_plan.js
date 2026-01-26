import { sendPOST } from "../../services/sendPOST.js"
import { getMinimalistFormattedTime } from "../../utils/timer.js"
import { getDayName } from "../../utils/getDayName.js"
import { createBars, renderBars } from "./functions/bars.js"
import { changeExercises } from "./functions/changeExercises.js"
import { edit_training_plan_state } from "./state.js"
import { addPeriod, changeReps, changeSets } from "./functions/periods.js"

"use strict"

document.addEventListener("DOMContentLoaded", function() {
    // ALL AVAILABLE TRAINING PLANS

    // Variables

    const all_training_plans_container = document.querySelector(".all_training_plans_container") // Gets All Training Plans Container
    const exercises_data = all_training_plans_container.querySelectorAll(".one_exercise_data") // Gets Data Container For Every User's Exercise

    const training_plan = all_training_plans_container.querySelector(".training_plan") // Gets Training Plan

    const exercise_template = training_plan.querySelector(".exercise_template") // Gets Exercise Template
    const period_selection_template = training_plan.querySelector(".period_selection_template") // Gets Period Selection Template

    // Hold Button Events
    let hold_interval = null
    let hold_timeout = null

    const HOLD_INTERVAL_SPEED = 50 // 20-Times Per Second
    const HOLD_START_DELAY = 250 // Starts Hold Interval After 250MS Of Hold Time, Everything Above Is Just A Click

    function stopHold() {
        clearInterval(hold_interval)
        clearTimeout(hold_timeout)
    }

    // Stores All Possible Training Plan Types Of The User To An Array (For Example ["Pull", "Push", "Legs"])
    const all_training_plan_types = [
        ...new Set([...exercises_data].map(function(one_exercise_data) {
            return `${one_exercise_data.dataset.type} - ${getDayName(one_exercise_data.dataset.day)}`
        }))
    ]

    // Gets Current Order Of Training Plans By Day Value
    const training_plan_days_order = [
        ...new Set([...exercises_data].map(function(one_exercise_data) {
            return one_exercise_data.dataset.day
        }))
    ]

    let training_plan_day = training_plan_days_order[0] // Gets The First Value From Training Plan Days Order (Current Or Upcoming Day By Default)

    // Functions

    // Function For Render Exercises Of The Selected Training Plan
    function generateTrainingPlan(exercises_data) {
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
                
                    exercise_template_clone.querySelector(".exercise .title").textContent = exercise_data // Sets Title To The Exercise Title

                    unit_data === "reps" ? exercise_template_clone.querySelector(".exercise .labels .unit_amount").textContent = "Počet opakovaní" : exercise_template_clone.querySelector(".exercise .labels .unit_amount").textContent = "Počet sekúnd" // Sets Unit Amount Text Value By Unit Of Exercise

                    exercise_template_clone.querySelector(".exercise .labels .unit_amount").dataset.unit = unit_data

                    generatePeriodSelections(periods_data, getTotalPeriodSelections(periods_data), unit_data, exercise_template_clone.querySelector(".periods_container")) // Generates Exact Amount Of Period Selections For Exercise

                    training_plan.appendChild(exercise_template_clone) // Appends The Exercise To The Training Plan
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

    // Renders User's Training Plan If Has Any
    if(exercises_data.length > 0) {
        generateTrainingPlan(exercises_data)
    }

    // Global Event Delegations

    // Training Plan Click Events
    training_plan.addEventListener("click", function(event) {
        // Change Exercise In Training Plan With Bars Functionality
        if(event.target.classList.contains("bar")) {
            const clicked_bar_index = [...event.target.parentNode.querySelectorAll(".bar")].indexOf(event.target) // Gets Index Of The Clicked Bar

            changeExercises(clicked_bar_index, training_plan) // Changes Exercises In The Training Plan
        }

        // Add Sets & Reps Period Of Exercises In The Training Plan Functionality
        if(event.target.classList.contains("add_period")) {
            const clicked_add_period_exercise = event.target.closest(".exercise") // Gets Exercise From Training Plan Of Clicked Add Period Button

            addPeriod(clicked_add_period_exercise, period_selection_template) // Adds Period For Given Exercise
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
})