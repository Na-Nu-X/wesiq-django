import { 
    global_state, 
    edit_training_plan_state 
} from "./state.js"

import { 
    addExercise, 
    changeExercises, 
    changeExercisePosition, 
    removeExercise 
} from "./functions/exercises.js"

import { 
    addPeriod, 
    changeReps, 
    changeSets, 
    updateUnitTypes 
} from "./functions/periods.js"

import { 
    startHold, 
    stopHold 
} from "./functions/holdButton.js"

import { 
    createBars, 
    renderBars 
} from "./functions/bars.js"

import { changeWarmUpTime } from "./functions/changeWarmUpTime.js"
import { saveTrainingPlan } from "./functions/saveTrainingPlan.js"
import { getMinimalistFormattedTime } from "../../utils/timer.js"
import { sendPOST } from "../../services/sendPOST.js"
import { sendNotification } from "../../utils/sendNotification.js"

"use strict"

document.addEventListener("DOMContentLoaded", function() {
    // Variables

    let dragged_exercise = null // Gets Dragged Exercise From The Training Plan
    let dragged_bar = null // Gets Dragged Bar From The Training Plan

    const edit_training_plan = document.querySelector(".edit_training_plan") // Gets Edit Training Plan
    const training_plan = edit_training_plan.querySelector(".training_plan") // Gets Training Plan

    const warm_up_template = document.querySelector(".warm_up_template") // Gets Warm Up Template
    const exercise_template = document.querySelector(".exercise_template") // Gets Exercise Template
    const period_selection_template = document.querySelector(".period_selection_template") // Gets Period Selection Template

    const exercises_data = edit_training_plan.querySelectorAll(".one_exercise_data") // Gets Data From Every User's Exercise

    const drop_zone = training_plan.querySelector(".drop_zone") // Gets Training Plan Drop Zone

    const day_select_menu = edit_training_plan.querySelector(".additional_info .day_select_menu") // Gets Day Select Menu
    const day_select = day_select_menu.querySelector(".select") // Gets Selected Option Print
    const day_options_list = day_select_menu.querySelector(".options_list") // Gets Day Options List
    const day_options = day_options_list.querySelectorAll(".option") // Gets All Day Options

    const buttons_container = edit_training_plan.querySelector(".buttons") // Gets Buttons Container
    const save = buttons_container.querySelector(".save") // Gets Training Plan Save Button
    const delete_button = buttons_container.querySelector(".delete") // Gets Training Plan Delete Button

    // Gets Current Order Of Training Plans By Day Value
    const training_plan_days_order = [
        ...new Set([...exercises_data].map(function(one_exercise_data) {
            return one_exercise_data.dataset.day
        }))
    ]

    // const training_plan_days_order = [
    //     ...new Set(
    //         [...exercises_data].map(el =>
    //             `${el.dataset.day}__${el.dataset.training_plan_key}`
    //         )
    //     )
    // ].map(key => key.split("__")[0])

    // console.log(training_plan_days_order)

    // Functions

    // Function For Render Exercises Of The Selected Training Plan
    function generateTrainingPlan(exercises_data, container) {
        // Set Defaults
        edit_training_plan_state.active_exercise_index = 0 // Sets Active Exercise Index Back To 0

        // Removes Exercises
        container.querySelectorAll(".exercise").forEach(function(one_exercise) {
            one_exercise.remove()
        })

        // Removes Training Plan Bar Container
        container.querySelectorAll(".training_plan_bar_container").forEach(function(one_bar_container) {
            one_bar_container.remove()
        })

        // Day
        let training_plan_day = training_plan_days_order[edit_training_plan_state.active_training_plan_index] // Gets The First Value From Training Plan Days Order (Current Or Upcoming Day By Default)

        day_options.forEach(function(remove_selected) {
            remove_selected.classList.remove("selected") // Removes Selected Class From Day Options
        })

        day_options.forEach(function(one_option) {
            // Shows Current Selected Option From List Without Icon
            // if(one_option.dataset.day === training_plan_day && training_plan_day !== "None") {
            if(one_option.dataset.day === training_plan_day) {
                day_select.querySelector("span").textContent = one_option.querySelector("span").textContent // Shows Current Selected Option From List Without Icon
                one_option.classList.add("selected") // Adds Selected Class To Selected Option
            }

            // // Shows No Selected Day Option If Training Plan Is Without A Day
            // if(training_plan_day === "None") {
            //     if(one_option.dataset.day === "not_selected") {
            //         day_select.querySelector("span").textContent = one_option.querySelector("span").textContent // Shows Current Selected Option From List Without Icon
            //         one_option.classList.add("selected") // Adds Selected Class To Selected Option
            //     }
            // }
        })

        // Creates And Renders Training Plan Bars (Only If There Are More Than One Training Plans)
        if(training_plan_days_order.length > 1) {
            const training_plan_bar_container = createTrainingPlanBars(training_plan_days_order.length)
            renderTrainingPlanBars(edit_training_plan, training_plan_bar_container)

            buttons_container.style.marginTop = "0px" // Changes The Top Margin For The Buttons Container
        }

        // Orders Exercises By Order Value In Exercises Data
        const ordered_exercises_data = [...exercises_data].sort(function(a, b) {
            return Number(a.dataset.order) - Number(b.dataset.order)
        })

        // Extracts Data For Every Exercise
        ordered_exercises_data.forEach(function(one_exercise_data) {
            const training_plan_key = one_exercise_data.dataset.training_plan_key // Gets Training Plan Key
            const day_data = one_exercise_data.dataset.day || null // Gets Training Day Of The Exercise If Has Any
            const type_data = one_exercise_data.dataset.type // Gets Training Title Of The Exercise
            const exercise_data = one_exercise_data.dataset.exercise // Gets Exercise Name
            const periods_data = JSON.parse(one_exercise_data.dataset.periods) // Gets Exercise Sets & Reps Periods
            const unit_data = one_exercise_data.dataset.unit // Gets Exercise Unit Type (Reps Or Seconds)

            // Shows Exercises Only Which Have Some Training Plan Day
            if(day_data !== null) {
                // Shows Exercises Only Of The Selected Training Plan Day
                if(training_plan_day === day_data) {
                    // Creates Warm Up
                    if(exercise_data === "Warm Up") {
                        const warm_up_template_clone = warm_up_template.content.cloneNode(true) // Clones The Warm Up Template Content
                        container.querySelector(".training_plan").prepend(warm_up_template_clone) // Appends Exercise To The Training Plan
                    }

                    // Creates Exercises
                    else {
                        const exercise_template_clone = exercise_template.content.cloneNode(true) // Clones The Exercise Template Content

                        container.querySelector(".additional_info .title").value = type_data
                    
                        exercise_template_clone.querySelector(".exercise .title").textContent = exercise_data // Sets Title To The Exercise Title

                        // Sets The Correct Unit Amount Label By Selection Dragged Exercise Unit
                        if(unit_data === "reps") exercise_template_clone.querySelector(".exercise .labels .unit_amount").textContent = "Počet opakovaní"
                        if(unit_data === "seconds") exercise_template_clone.querySelector(".exercise .labels .unit_amount").textContent = "Počet sekúnd"
                        if(unit_data === "steps") exercise_template_clone.querySelector(".exercise .labels .unit_amount").textContent = "Počet krokov"

                        exercise_template_clone.querySelector(".exercise").dataset.training_plan_key = training_plan_key // Stores Training Plan Key Data To The Exercise
                        exercise_template_clone.querySelector(".exercise").dataset.unit = unit_data // Stores Unit Type Data To The Exercise

                        exercise_template_clone.querySelector(".exercise .periods_container").innerHTML = "" // Deletes All Period Selections

                        generatePeriodSelections(periods_data, getTotalPeriodSelections(periods_data), unit_data, exercise_template_clone.querySelector(".periods_container")) // Generates Exact Amount Of Period Selections For Exercise

                        container.querySelector(".training_plan").appendChild(exercise_template_clone) // Appends The Exercise To The Training Plan
                    }
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
                if(unit === "reps" || unit === "steps") {
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

    // Function For Creating Bar Container With Amount Of Bars By Training Plans Amount
    function createTrainingPlanBars(amount) {
        // Creates Bar Container
        const training_plan_bar_container = document.createElement("div")
        training_plan_bar_container.classList.add("training_plan_bar_container")

        // Creates Bars By Amount Of Training Plans
        for(let i = 0; i < amount; i++) {
            // Creates Bar
            const bar = document.createElement("div")
            bar.classList.add("bar")
            training_plan_bar_container.appendChild(bar)

            if(i === edit_training_plan_state.active_training_plan_index) {
                bar.classList.add("active") // Adds Active Class For Bar Of Active Training Plan
            }
        }

        return training_plan_bar_container // Returns Bar Container
    }

    // Function For Render Training Plan Bar Container With Bars
    function renderTrainingPlanBars(parent, container) {
        // Removes Previous Bar Container
        const previous_bar_container = parent.querySelector(".bar_container")
        if(previous_bar_container) previous_bar_container.remove()

        parent.insertBefore(container, parent.querySelector(".buttons")) // Appends New Training Plan Bar Container Before Save Button
    }

    // Function For Change Training Plans
    function changeTrainingPlans(training_plan_index) {
        // Shows Blur Animation Between Change Of Training Plans
        training_plan.classList.remove("blur")
        void training_plan.offsetWidth
        training_plan.classList.add("blur")

        if(training_plan_index < 0) {
            edit_training_plan_state.active_training_plan_index = training_plan_days_order.length - 1 // Shows The Last Training Plan
        }

        else if(training_plan_index > training_plan_days_order.length - 1) {
            edit_training_plan_state.active_training_plan_index = 0 // Shows The First Training Plan
        }

        else {
            edit_training_plan_state.active_training_plan_index = training_plan_index // Changes Active Training Plan Index
        }

        generateTrainingPlan(exercises_data, edit_training_plan)
    }

    function deleteTrainingPlan(container) {
        const training_plan = container.querySelector(".training_plan") // Gets Training Plan
        const exercises = training_plan.querySelectorAll(".exercise") // Gets All Training Plan Exercises
        const training_plan_title = container.querySelector(".additional_info .title") // Gets Training Plan Title

        const training_plan_data = [] // Stores All Delete Training Plan Data

        exercises.forEach(function(one_exercise) {
            const training_plan_key = one_exercise.dataset.training_plan_key // Gets Training Plan Key

            // Creates Object Of One Exercise For Delete Training Plan
            const delete_training_plan_object = {}

            delete_training_plan_object.training_plan_key = training_plan_key
            delete_training_plan_object.action = "delete_training_plan"

            training_plan_data.push(delete_training_plan_object) // Fills Training Plan Data Array With Objects Of Exercises
        })

        sendPOST("/my-training-plans", training_plan_data) // Sends The Data With POST
        sendNotification(`Tréningový plán ${training_plan_title.value} bol odstránený.`) // Sends The Notification For The User
        location.reload() // Reloads The Page
    }

    // Global Event Delegations

    // All Training Plans Container Click Events
    edit_training_plan.addEventListener("click", function(event) {
        // Training Plan Bars
        if(event.target.classList.contains("bar") && event.target.parentNode.classList.contains("training_plan_bar_container")) {
            const clicked_bar_index = [...event.target.parentNode.querySelectorAll(".bar")].indexOf(event.target) // Gets Index Of The Clicked Bar
            changeTrainingPlans(clicked_bar_index, training_plan) // Changes Training Plans
        }
    })

    // Document Drop Events (Remove The Exercise From The Training Plan Functionality)
    document.addEventListener("dragover", function(event) {
        // If There Is Dragged Exercise And Dragover Element Isn't Inside The Training Plan
        if(dragged_exercise && !training_plan.contains(event.target)) {
            event.preventDefault() // Makes The Drop Zone Functional
        }
    })

    document.addEventListener("drop", function(event) {
        // If There Is Dragged Exercise And Drop Element Isn't Inside The Training Plan
        if(dragged_exercise && !training_plan.contains(event.target)) {
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

                // Removes Selected Class From Options
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

        // Subtract Warm Up Time Functionality
        if(event.target.classList.contains("subtract_time") || event.target.parentNode.classList.contains("subtract_time")) {
            const warm_up = event.target.closest(".exercise") // Gets Warm Up From The Training Plan
            changeWarmUpTime(warm_up, "subtract") // Subtracts Time
        }

        // Add Warm Up Time Functionality
        if(event.target.classList.contains("add_time") || event.target.parentNode.classList.contains("add_time")) {
            const warm_up = event.target.closest(".exercise") // Gets Warm Up From The Training Plan
            changeWarmUpTime(warm_up, "add") // Adds Time
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

    // Sets Focused Element
    edit_training_plan.addEventListener("focus", function() {
        global_state.focused_element = "edit_training_plan"
    })

    edit_training_plan.addEventListener("wheel", function(event) {
        if(event.target.classList.contains("training_plan_bar_container") || event.target.parentNode.classList.contains("training_plan_bar_container")) {
            event.preventDefault() // Stop Scrolling

            if(event.deltaY < 0) changeTrainingPlans(edit_training_plan_state.active_training_plan_index + 1) // Changes Training Plans (Shows Next Training Plan)
            if(event.deltaY > 0) changeTrainingPlans(edit_training_plan_state.active_training_plan_index - 1) // Changes Training Plans (Shows Previous Training Plan)
        }
    })

    // Change Training Plan Exercises With Scroll Wheel Functionality
    training_plan.addEventListener("wheel", function(event) {
        event.preventDefault() // Stop Scrolling

        if(event.target !== drop_zone) {
            if(event.deltaY < 0) changeExercises(edit_training_plan_state.active_exercise_index - 1, training_plan, edit_training_plan_state) // Changes Training Plan Exercises (Shows Next Exercise)
            if(event.deltaY > 0) changeExercises(edit_training_plan_state.active_exercise_index + 1, training_plan, edit_training_plan_state) // Changes Training Plan Exercises (Shows Previous Exercise)
        }
    })

    // Change Training Plan Exercises And Training Plans With Arrow Keys Functionality
    edit_training_plan.addEventListener("mouseover", function(event) {
        if(event.target.classList.contains("bar_container") || event.target.parentNode.classList.contains("bar_container")) global_state.hovered_element = "edit_training_plan_exercises_bars" // Sets Hovered Element For Bar Container
        else if(event.target.classList.contains("training_plan_bar_container") || event.target.parentNode.classList.contains("training_plan_bar_container")) global_state.hovered_element = "edit_training_plan_bars" // Sets Hovered Element For Training Plan Bar Container
    })

    edit_training_plan.addEventListener("mouseout", function() {
        global_state.hovered_element = null
    })

    document.addEventListener("keydown", function(event) {
        if(event.key === "ArrowLeft" && global_state.hovered_element === "edit_training_plan_exercises_bars") changeExercises(edit_training_plan_state.active_exercise_index - 1, training_plan, edit_training_plan_state) // Changes Training Plan Exercises (Shows Previous Exercise)
        else if(event.key === "ArrowRight" && global_state.hovered_element === "edit_training_plan_exercises_bars") changeExercises(edit_training_plan_state.active_exercise_index + 1, training_plan, edit_training_plan_state) // Changes Training Plan Exercises (Shows Next Exercise)

        else if(event.key === "ArrowLeft" && global_state.hovered_element === "edit_training_plan_bars") changeTrainingPlans(edit_training_plan_state.active_training_plan_index - 1) // Changes Training Plans (Shows Previous Training Plan)
        else if(event.key === "ArrowRight" && global_state.hovered_element === "edit_training_plan_bars") changeTrainingPlans(edit_training_plan_state.active_training_plan_index + 1) // Changes Training Plans (Shows Next Training Plan)
    })

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

            // Removes Selected Class From Options
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
        saveTrainingPlan(edit_training_plan, edit_training_plan_state)
    })

    // Delete Training Plan
    delete_button.addEventListener("click", function() {
        deleteTrainingPlan(edit_training_plan)
    })

    // MAIN

    generateTrainingPlan(exercises_data, edit_training_plan) // Renders User's Training Plan If Has Any
})