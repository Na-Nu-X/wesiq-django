import { 
    global_state, 
    edit_training_plan_state 
} from "../state.js"

import { 
    addExercise, 
    changeExercises, 
    changeExercisePosition, 
    removeExercise 
} from "../functions/exercises.js"

import { 
    addPeriod, 
    changeReps, 
    changeSets, 
    updateUnitTypes 
} from "../functions/periods.js"

import { 
    startHold, 
    stopHold 
} from "../functions/holdButton.js"

import { 
    generateTrainingPlan,
    changeTrainingPlans,
    deleteTrainingPlan
} from "../functions/editTrainingPlan.js"

import { changeWarmUpTime } from "../functions/changeWarmUpTime.js"
import { saveTrainingPlan } from "../functions/saveTrainingPlan.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Variables

    let dragged_exercise:HTMLDivElement|null = null // Gets Dragged Exercise From The Training Plan
    let dragged_bar:HTMLDivElement|null = null // Gets Dragged Bar From The Training Plan

    const edit_training_plan:HTMLDivElement = document.querySelector(".edit_training_plan") as HTMLDivElement // Gets Edit Training Plan
    const training_plan:HTMLDivElement = edit_training_plan.querySelector(".training_plan") as HTMLDivElement // Gets Training Plan

    const drop_zone:HTMLDivElement = training_plan.querySelector(".drop_zone") as HTMLDivElement // Gets Training Plan Drop Zone

    const day_select_menu:HTMLDivElement = edit_training_plan.querySelector(".additional_info .day_select_menu") as HTMLDivElement // Gets Day Select Menu
    const day_select:HTMLDivElement = day_select_menu.querySelector(".select") as HTMLDivElement // Gets Selected Option Print
    const day_options_list:HTMLDivElement = day_select_menu.querySelector(".options_list") as HTMLDivElement // Gets Day Options List
    const day_options:NodeListOf<HTMLDivElement> = day_options_list.querySelectorAll<HTMLDivElement>(".option") // Gets All Day Options

    const buttons_container:HTMLDivElement = edit_training_plan.querySelector(".buttons") as HTMLDivElement // Gets Buttons Container
    const save:HTMLButtonElement = buttons_container.querySelector(".save") as HTMLButtonElement // Gets Training Plan Save Button
    const delete_button:HTMLButtonElement = buttons_container.querySelector(".delete") as HTMLButtonElement // Gets Training Plan Delete Button

    // Global Event Delegations

    // All Training Plans Container Click Events
    edit_training_plan.addEventListener("click", function(event:PointerEvent):void {
        // Training Plan Bars
        if(event.target instanceof Node && (event.target as HTMLDivElement).classList.contains("bar") && (event.target.parentNode as HTMLDivElement).classList.contains("training_plan_bar_container")) {
            if(!event.target.parentNode) return // Catch Errors

            const clicked_bar_index:number = [...event.target.parentNode.querySelectorAll<HTMLDivElement>(".bar")].indexOf(event.target as HTMLDivElement) // Gets Index Of The Clicked Bar
            changeTrainingPlans(clicked_bar_index, edit_training_plan) // Changes Training Plans
        }
    })

    // Document Drag Over Functionality (Remove The Exercise From The Training Plan Functionality)
    document.addEventListener("dragover", function(event:DragEvent):void {
        if(event.target instanceof Node && dragged_exercise && !training_plan.contains(event.target)) event.preventDefault() // Makes The Drop Zone Functional (If There Is Dragged Exercise And Dragover Element Isn't Inside The Training Plan)
    })

    // Document Drop Functionality (Remove The Exercise From The Training Plan Functionality)
    document.addEventListener("drop", function(event:DragEvent):void {
        if(event.target instanceof Node && dragged_exercise && !training_plan.contains(event.target)) removeExercise(dragged_exercise, training_plan, edit_training_plan_state) // Removes Dragged Exercise From The Training Plan (If There Is Dragged Exercise And Drop Element Isn't Inside The Training Plan)
    })

    // Training Plan Drag Start Functionality
    training_plan.addEventListener("dragstart", function(event:DragEvent):void {
        // Training Plan Exercises Drag Functionality
        if((event.target as HTMLDivElement).classList.contains("exercise")) dragged_exercise = event.target as HTMLDivElement // Sets Training Plan Dragged Exercise

        // Training Plan Bars Drag Functionality
        if((event.target as HTMLDivElement).classList.contains("bar")) {
            dragged_bar = event.target as HTMLDivElement // Sets Training Plan Dragged Bar

            const bar_container:HTMLDivElement = this.querySelector(".bar_container") as HTMLDivElement // Gets Bar Container

            // Animates All Of The Bars Except Of The Dragged One
            bar_container.querySelectorAll<HTMLDivElement>(".bar").forEach(function(one_bar:HTMLDivElement) {
                if(one_bar !== dragged_bar) one_bar.classList.add("animate") // Adds Drag Animation
            })
        }
    })

    // Training Plan Drag End Functionality
    training_plan.addEventListener("dragend", function():void {
        dragged_exercise = null // Deletes Training Plan Dragged Exercise
        dragged_bar = null // Deletes Training Plan Dragged Bar

        const bar_container:HTMLDivElement = this.querySelector(".bar_container") as HTMLDivElement // Gets Bar Container

        bar_container.querySelectorAll<HTMLDivElement>(".bar").forEach(function(one_bar:HTMLDivElement) {
            one_bar.classList.remove("animate") // Removes Drag Animation
        })
    })

    // Training Plan Drag Over Functionality
    training_plan.addEventListener("dragover", function(event:DragEvent):void {
        if(event.target === drop_zone) event.preventDefault() // Drop Zone For The First Exercise (Makes The Drop Zone Functional)
        if(event.target === this.querySelectorAll<HTMLDivElement>(".exercise")[edit_training_plan_state.active_exercise_index]) event.preventDefault() // Drop Zone On Active Exercise In The Training Plan (Makes The Drop Zone Functional)
        if(global_state.selection_dragged_exercise) this.classList.add("animate") // Adds Drag Animation (Executes Only If The Dragged Element Is Selection Dragged Exercise)
        if((event.target as HTMLDivElement).classList.contains("bar")) event.preventDefault() // Drop Zone On Bars In The Bar Container (Makes The Drop Zone Functional)
    })

    // Training Plan Drop Functionality
    training_plan.addEventListener("drop", function(event:DragEvent):void {
        if(event.target === drop_zone) addExercise(this, edit_training_plan_state) // Drop Zone For The First Exercise (Adds Dragged Exercise From Exercise Selection To The Training Plan)
        if(event.target === this.querySelectorAll<HTMLDivElement>(".exercise")[edit_training_plan_state.active_exercise_index]) addExercise(this, edit_training_plan_state) // Drop Zone On Active Exercise In The Training Plan (Adds Dragged Exercise From Exercise Selection To The Training Plan) 
        if(global_state.selection_dragged_exercise) this.classList.remove("animate") // Removes Drag Animation (Executes Only If The Dragged Element Is Selection Dragged Exercise)

        // Drop Zone On Bars In The Bar Container
        if((event.target as HTMLDivElement).classList.contains("bar")) {
            const bar_container:HTMLDivElement = this.querySelector(".bar_container") as HTMLDivElement // Gets Bar Container

            // Removes Animation From All Of The Bars Except Of The Dragged One
            bar_container.querySelectorAll<HTMLDivElement>(".bar").forEach(function(one_bar:HTMLDivElement) {
                if(one_bar !== dragged_bar) one_bar.classList.remove("animate") // Removes Drag Animation
            })

            if(!(event.target instanceof Node) || !event.target.parentNode || !dragged_bar) return // Catch Errors
            
            const dropped_bar_index:number = [...event.target.parentNode.querySelectorAll<HTMLDivElement>(".bar")].indexOf(event.target as HTMLDivElement) // Gets Index Of The Bar From The Bar Container Where The Dragged Bar Was Dropped
            changeExercisePosition(dropped_bar_index, dragged_bar, this, edit_training_plan_state) // Changes Training Plan Exercise Position By Position Of Bars In The Bar Container
        }
    })

    // Training Plan Drag Leave Functionality
    training_plan.addEventListener("dragleave", function():void {
        if(global_state.selection_dragged_exercise) this.classList.remove("animate") // Removes Drag Animation (Executes Only If The Dragged Element Is Selection Dragged Exercise)
    })

    // Training Plan Click Events
    training_plan.addEventListener("click", function(event:PointerEvent):void {
        // Change Exercise In Training Plan With Bars Functionality
        if((event.target as HTMLDivElement).classList.contains("bar")) {
            if(!(event.target instanceof Node) || !event.target.parentNode) return // Catch Errors

            const clicked_bar_index = [...event.target.parentNode.querySelectorAll<HTMLDivElement>(".bar")].indexOf(event.target as HTMLDivElement) // Gets Index Of The Clicked Bar
            changeExercises(clicked_bar_index, this, edit_training_plan_state) // Changes Training Plan Exercises
        }

        // Add Sets & Reps Period Of Exercises In The Training Plan Functionality
        if((event.target as HTMLDivElement).classList.contains("add_period")) {
            const clicked_add_period_exercise = (event.target as HTMLDivElement).closest(".exercise") as HTMLDivElement // Gets Exercise From Training Plan Of Clicked Add Period Button
            addPeriod(clicked_add_period_exercise) // Adds Period For Given Exercise
        }

        // Unit Select Menu
        if((event.target as HTMLDivElement).closest(".unit_select_menu") as HTMLDivElement) {
            const unit_select_menu:HTMLDivElement = (event.target as HTMLDivElement).closest(".unit_select_menu") as HTMLDivElement // Gets Unit Select Menu
            const unit_select:HTMLDivElement = unit_select_menu.querySelector(".select") as HTMLDivElement // Gets Selected Option Print
            const unit_options_list:HTMLDivElement = unit_select_menu.querySelector(".options_list") as HTMLDivElement // Gets Unit Options List
            const unit_options:NodeListOf<HTMLDivElement> = unit_options_list.querySelectorAll<HTMLDivElement>(".option") // Gets All Unit Options

            unit_options_list.classList.toggle("active"); // Shows / Hides Options List
		    (unit_select.querySelector(".fa-angle-down") as HTMLElement).classList.toggle("fa-angle-up") // Toggle Icons

            if((event.target as HTMLDivElement).closest(".option") as HTMLDivElement) {
                const clicked_option:HTMLDivElement = (event.target as HTMLDivElement).closest(".option") as HTMLDivElement // Gets Clicked Option
                (unit_select_menu.closest(".exercise") as HTMLDivElement).dataset["unit"] = clicked_option.dataset["unit_option"] // Sets Unit Data To The Exercise

                // Removes Selected Class From Options
                unit_options.forEach(function(one_option:HTMLDivElement) {
                    one_option.classList.remove("selected")
                })

                if(clicked_option.dataset["unit_option"] === (unit_select_menu.closest(".exercise") as HTMLDivElement).dataset["unit"]) {
                    (unit_select.querySelector("span") as HTMLSpanElement).textContent = (clicked_option.querySelector("span") as HTMLSpanElement).textContent // Shows Current Selected Option From List Without Icon
                    clicked_option.classList.add("selected") // Adds Selected Class To Selected Option
                }

                if(clicked_option.dataset["unit_option"]) updateUnitTypes(clicked_option.dataset["unit_option"], training_plan, edit_training_plan_state) // Updates Unit Type For Every Reps Container
            }
        }

        // Subtract Warm Up Time Functionality
        if(!(event.target instanceof Node) || (event.target as HTMLDivElement).classList.contains("subtract_time") || (event.target.parentNode as HTMLDivElement).classList.contains("subtract_time")) {
            const warm_up:HTMLDivElement = (event.target as HTMLDivElement).closest(".exercise") as HTMLDivElement // Gets Warm Up From The Training Plan
            changeWarmUpTime(warm_up, "subtract") // Subtracts Time
        }

        // Add Warm Up Time Functionality
        if(!(event.target instanceof Node) || (event.target as HTMLDivElement).classList.contains("add_time") || (event.target.parentNode as HTMLDivElement).classList.contains("add_time")) {
            const warm_up:HTMLDivElement = (event.target as HTMLDivElement).closest(".exercise") as HTMLDivElement // Gets Warm Up From The Training Plan
            changeWarmUpTime(warm_up, "add") // Adds Time
        }
    })

    // Training Plan Double Click Events
    training_plan.addEventListener("dblclick", function(event:MouseEvent):void {
        // Removes Exercise From The Training Plan On Double Click
        if((event.target as HTMLDivElement).classList.contains("exercise")) {
            dragged_exercise = event.target as HTMLDivElement // Sets Training Plan Dragged Exercise
            removeExercise(dragged_exercise, this, edit_training_plan_state) // Removes Dragged Exercise From The Training Plan
            dragged_exercise = null // Deletes Training Plan Dragged Exercise
        }
    })

    // Training Plan Hold Events
    training_plan.addEventListener("pointerdown", function(event:PointerEvent):void {
        // Add Decrease Exercise Reps Functionality
        if((event.target as HTMLButtonElement).classList.contains("decrease_reps")) {
            changeReps(event.target as HTMLButtonElement, "decrease") // Decreases Amount Of Reps
            startHold(() => changeReps(event.target as HTMLButtonElement, "decrease")) // Decreases Amount Of Reps On Hold
        }

        // Add Increase Exercise Reps Functionality
        if((event.target as HTMLButtonElement).classList.contains("increase_reps")) {
            changeReps(event.target as HTMLButtonElement, "increase") // Increases Amount Of Reps
            startHold(() => changeReps(event.target as HTMLButtonElement, "increase")) // Increases Amount Of Reps On Hold
        }

        // Add Decrease Exercise Sets Functionality
        if((event.target as HTMLButtonElement).classList.contains("decrease_sets")) {
            changeSets(event.target as HTMLButtonElement, "decrease") // Decreases Amount Of Sets
            startHold(() => changeSets(event.target as HTMLButtonElement, "decrease")) // Decreases Amount Of Sets On Hold
        }

        // Add Increase Exercise Sets Functionality
        if((event.target as HTMLButtonElement).classList.contains("increase_sets")) {
            changeSets(event.target as HTMLButtonElement, "increase") // Increases Amount Of Sets
            startHold(() => changeSets(event.target as HTMLButtonElement, "increase")) // Increases Amount Of Sets On Hold
        }
    })

    training_plan.addEventListener("pointerup", stopHold) // Stops The Hold Loop
    training_plan.addEventListener("pointercancel", stopHold) // Stops The Hold Loop
    training_plan.addEventListener("pointerleave", stopHold) // Stops The Hold Loop

    // Events

    // Edit Training Plan Wheel Functionality
    edit_training_plan.addEventListener("wheel", function(event:WheelEvent):void {
        if(!(event.target instanceof Node) || (event.target as HTMLDivElement).classList.contains("training_plan_bar_container") || (event.target.parentNode as HTMLDivElement).classList.contains("training_plan_bar_container")) {
            event.preventDefault() // Stop Scrolling

            if(event.deltaY < 0) changeTrainingPlans(edit_training_plan_state.active_training_plan_index + 1, edit_training_plan) // Changes Training Plans (Shows Next Training Plan)
            if(event.deltaY > 0) changeTrainingPlans(edit_training_plan_state.active_training_plan_index - 1, edit_training_plan) // Changes Training Plans (Shows Previous Training Plan)
        }
    })

    // Training Plan Wheel Functionality
    training_plan.addEventListener("wheel", function(event:WheelEvent):void {
        event.preventDefault() // Stop Scrolling

        if(event.target !== drop_zone) {
            if(event.deltaY < 0) changeExercises(edit_training_plan_state.active_exercise_index - 1, this, edit_training_plan_state) // Changes Training Plan Exercises (Shows Next Exercise)
            if(event.deltaY > 0) changeExercises(edit_training_plan_state.active_exercise_index + 1, this, edit_training_plan_state) // Changes Training Plan Exercises (Shows Previous Exercise)
        }
    })

    // Edit Training Plan Mouse Over Functionality
    edit_training_plan.addEventListener("mouseover", function(event:MouseEvent):void {
        if(!(event.target instanceof Node) || (event.target as HTMLDivElement).classList.contains("bar_container") || (event.target.parentNode as HTMLDivElement).classList.contains("bar_container")) global_state.hovered_element = "edit_training_plan_exercises_bars" // Sets Hovered Element For Bar Container
        else if(!(event.target instanceof Node) || (event.target as HTMLDivElement).classList.contains("training_plan_bar_container") || (event.target.parentNode as HTMLDivElement).classList.contains("training_plan_bar_container")) global_state.hovered_element = "edit_training_plan_bars" // Sets Hovered Element For Training Plan Bar Container
    })

    edit_training_plan.addEventListener("mouseout", () => global_state.hovered_element = null) // Removes The Stored Hovered Element

    // Document Keydown Functionalities
    document.addEventListener("keydown", function(event:KeyboardEvent):void {
        if(event.key === "ArrowLeft" && global_state.hovered_element === "edit_training_plan_exercises_bars") changeExercises(edit_training_plan_state.active_exercise_index - 1, training_plan, edit_training_plan_state) // Changes Training Plan Exercises (Shows Previous Exercise)
        else if(event.key === "ArrowRight" && global_state.hovered_element === "edit_training_plan_exercises_bars") changeExercises(edit_training_plan_state.active_exercise_index + 1, training_plan, edit_training_plan_state) // Changes Training Plan Exercises (Shows Next Exercise)

        else if(event.key === "ArrowLeft" && global_state.hovered_element === "edit_training_plan_bars") changeTrainingPlans(edit_training_plan_state.active_training_plan_index - 1, edit_training_plan) // Changes Training Plans (Shows Previous Training Plan)
        else if(event.key === "ArrowRight" && global_state.hovered_element === "edit_training_plan_bars") changeTrainingPlans(edit_training_plan_state.active_training_plan_index + 1, edit_training_plan) // Changes Training Plans (Shows Next Training Plan)
    })

    // Day Select Click Functionality
    day_select.addEventListener("click", function():void {
        day_options_list.classList.toggle("active"); // Shows / Hides Options List
        (this.querySelector(".fa-angle-down") as HTMLElement).classList.toggle("fa-angle-up") // Toggle Icons
    })

    // Day Options Click Functionalities
    day_options.forEach(function(option:HTMLDivElement):void {
        option.addEventListener("click", function():void {
            if(!this.dataset["day"]) return

            sessionStorage.setItem("edit_training_plan_day", this.dataset["day"]) // Stores Edited Training Plan Day To Session Storage

            day_options_list.classList.toggle("active"); // Shows / Hides Options List
            (day_select.querySelector(".fa-angle-down") as HTMLElement).classList.toggle("fa-angle-up") // Toggle Icons

            // Removes Selected Class From Options
            day_options.forEach(function(remove_selected:HTMLDivElement):void {
                remove_selected.classList.remove("selected")
            })

            // Shows Current Selected Option From List Without Icon
            if(this.dataset["day"] === sessionStorage.getItem("edit_training_plan_day")) {
                (day_select.querySelector("span") as HTMLSpanElement).textContent = (this.querySelector("span") as HTMLSpanElement).textContent // Shows Current Selected Option From List Without Icon
                this.classList.add("selected") // Adds Selected Class To Selected Option
            }
        })
    })
 
    save.addEventListener("click", () => saveTrainingPlan(edit_training_plan, edit_training_plan_state)) // Save Edited Training Plan
    delete_button.addEventListener("click", () => deleteTrainingPlan(edit_training_plan)) // Delete Training Plan

    // Initialization

    generateTrainingPlan(edit_training_plan) // Renders User's Training Plan If Has Any
})