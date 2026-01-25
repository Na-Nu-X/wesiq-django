import { sendPOST } from "../../services/sendPOST.js"
import { getMinimalistFormattedTime } from "../../utils/timer.js"
import { getDayName } from "../../utils/getDayName.js"

"use strict"

document.addEventListener("DOMContentLoaded", function() {
    // ALL AVAILABLE TRAINING PLANS

    // Variables

    const all_training_plans_container = document.querySelector(".all_training_plans_container") // Gets All Training Plans Container
    const exercises_data = all_training_plans_container.querySelectorAll(".one_exercise_data") // Gets Data Container For Every User's Exercise

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

        function generatePeriodSelections(amount, unit, parent_element) {
            for(let i = 0; i < amount.length; i++) {
                const period_selection_template = all_training_plans_container.querySelector(".training_plan .period_selection_template") // Gets Training Plan Period Selection Template

                const period_selection_template_clone = period_selection_template.content.cloneNode(true) // Clones The Period Selection Template Content

                // Fills Sets & Reps Inputs With The Values

                parent_element.appendChild(period_selection_template_clone) // Appends Period Selection To The Exercise
            }
        }

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
                    const exercise_template = all_training_plans_container.querySelector(".training_plan .exercise_template") // Gets Training Plan Exercise Template

                    const exercise_template_clone = exercise_template.content.cloneNode(true) // Clones The Exercise Template Content
                
                    exercise_template_clone.querySelector(".exercise .title").textContent = exercise_data // Sets Title To The Exercise Title

                    unit_data === "reps" ? exercise_template_clone.querySelector(".exercise .labels .unit_amount").textContent = "Počet opakovaní" : exercise_template_clone.querySelector(".exercise .labels .unit_amount").textContent = "Počet sekúnd" // Sets Unit Amount Text Value By Unit Of Exercise

                    generatePeriodSelections(getTotalPeriodSelections(periods_data), unit_data, exercise_template_clone.querySelector(".periods_container")) // Generates Exact Amount Of Period Selections For Exercise

                    all_training_plans_container.querySelector(".training_plan").appendChild(exercise_template_clone) // Appends The Exercise To The Training Plan

                    console.log(periods_data)
                    console.log(getTotalPeriodSelections(periods_data))
                }
            }
        })
    }

    // Renders User's Training Plan If Has Any
    if(exercises_data.length > 0) {
        generateTrainingPlan(exercises_data)
    }
})