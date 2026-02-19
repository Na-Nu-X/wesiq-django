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
    createTrainingPlanBars,
    renderTrainingPlanBars,
    createBars, 
    renderBars 
} from "../../components/trainingPlanFunctions.js"

import { 
    startHold, 
    stopHold 
} from "./functions/holdButton.js"

import { changeWarmUpTime } from "./functions/changeWarmUpTime.js"
import { saveTrainingPlan } from "./functions/saveTrainingPlan.js"
import { getMinimalistFormattedTime } from "../../utils/timer.js"
import { sendPOST } from "../../services/sendPOST.js"
import { sendNotification } from "../../utils/sendNotification.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Variables

    let dragged_exercise:HTMLDivElement|null = null // Gets Dragged Exercise From The Training Plan
    let dragged_bar:HTMLDivElement|null = null // Gets Dragged Bar From The Training Plan

    const edit_training_plan:HTMLDivElement = document.querySelector(".edit_training_plan") as HTMLDivElement // Gets Edit Training Plan
    const training_plan:HTMLDivElement = edit_training_plan.querySelector(".training_plan") as HTMLDivElement // Gets Training Plan

    const warm_up_template:HTMLTemplateElement = document.querySelector(".warm_up_template") as HTMLTemplateElement // Gets Warm Up Template
    const exercise_template:HTMLTemplateElement = document.querySelector(".exercise_template") as HTMLTemplateElement // Gets Exercise Template
    const period_selection_template:HTMLTemplateElement = document.querySelector(".period_selection_template") as HTMLTemplateElement // Gets Period Selection Template

    const exercises_data:NodeListOf<HTMLDivElement> = edit_training_plan.querySelectorAll<HTMLDivElement>(".one_exercise_data") // Gets Data From Every User's Exercise

    const drop_zone:HTMLDivElement = training_plan.querySelector(".drop_zone") as HTMLDivElement // Gets Training Plan Drop Zone

    const day_select_menu:HTMLDivElement = edit_training_plan.querySelector(".additional_info .day_select_menu") as HTMLDivElement // Gets Day Select Menu
    const day_select:HTMLDivElement = day_select_menu.querySelector(".select") as HTMLDivElement // Gets Selected Option Print
    const day_options_list:HTMLDivElement = day_select_menu.querySelector(".options_list") as HTMLDivElement // Gets Day Options List
    const day_options:NodeListOf<HTMLDivElement> = day_options_list.querySelectorAll<HTMLDivElement>(".option") // Gets All Day Options

    const buttons_container:HTMLDivElement = edit_training_plan.querySelector(".buttons") as HTMLDivElement // Gets Buttons Container
    const save:HTMLButtonElement = buttons_container.querySelector(".save") as HTMLButtonElement // Gets Training Plan Save Button
    const delete_button:HTMLButtonElement = buttons_container.querySelector(".delete") as HTMLButtonElement // Gets Training Plan Delete Button

    // Gets Current Order Of Training Plans By Day Value
    const training_plan_days_order:(string|null)[] = [
        ...new Set([...exercises_data].map(function(one_exercise_data:HTMLDivElement):string|null {
            return one_exercise_data.dataset.day ? one_exercise_data.dataset.day : null
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
    function generateTrainingPlan(exercises_data:NodeListOf<HTMLDivElement>, container:HTMLDivElement):void {
        // Set Defaults
        edit_training_plan_state.active_exercise_index = 0 // Sets Active Exercise Index Back To 0

        // Removes Exercises
        container.querySelectorAll<HTMLDivElement>(".exercise").forEach(function(one_exercise:HTMLDivElement):void {
            one_exercise.remove()
        })

        // Removes Training Plan Bar Container
        container.querySelectorAll<HTMLDivElement>(".training_plan_bar_container").forEach(function(one_bar_container:HTMLDivElement):void {
            one_bar_container.remove()
        })

        // Day
        let training_plan_day:string|null = training_plan_days_order[edit_training_plan_state.active_training_plan_index] ?? null // Gets The First Value From Training Plan Days Order (Current Or Upcoming Day By Default)

        day_options.forEach(function(remove_selected:HTMLDivElement):void {
            remove_selected.classList.remove("selected") // Removes Selected Class From Day Options
        })

        day_options.forEach(function(one_option:HTMLDivElement):void {
            // Shows Current Selected Option From List Without Icon
            // if(one_option.dataset.day === training_plan_day && training_plan_day !== "None") {
            if(one_option.dataset.day === training_plan_day) {
                (day_select.querySelector("span") as HTMLSpanElement).textContent = (one_option.querySelector("span") as HTMLSpanElement).textContent // Shows Current Selected Option From List Without Icon
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
            const training_plan_bar_container:HTMLDivElement = createTrainingPlanBars(training_plan_days_order.length, edit_training_plan_state)
            renderTrainingPlanBars(edit_training_plan, training_plan_bar_container)

            buttons_container.style.marginTop = "0px" // Changes The Top Margin For The Buttons Container
        }

        // Orders Exercises By Order Value In Exercises Data
        const ordered_exercises_data:HTMLDivElement[] = [...exercises_data].sort(function(a:HTMLDivElement, b:HTMLDivElement) {
            return Number(a.dataset.order) - Number(b.dataset.order)
        })

        // Extracts Data For Every Exercise
        ordered_exercises_data.forEach(function(one_exercise_data:HTMLDivElement):void {
            const training_plan_key:string = one_exercise_data.dataset.training_plan_key as string // Gets Training Plan Key
            const day_data:string|null = one_exercise_data.dataset.day || null // Gets Training Day Of The Exercise If Has Any
            const type_data:string = one_exercise_data.dataset.type as string // Gets Training Title Of The Exercise
            const exercise_data:string = one_exercise_data.dataset.exercise as string // Gets Exercise Name
            const periods_data:number[] = JSON.parse(one_exercise_data.dataset.periods || "[0]") // Gets Exercise Sets & Reps Periods
            const unit_data:string = one_exercise_data.dataset.unit || "reps" // Gets Exercise Unit Type (Reps Or Seconds)

            // Shows Exercises Only Which Have Some Training Plan Day
            if(day_data !== null) {
                // Shows Exercises Only Of The Selected Training Plan Day
                if(training_plan_day === day_data) {
                    // Creates Warm Up
                    if(exercise_data === "Warm Up") {
                        const warm_up_template_clone:DocumentFragment = warm_up_template.content.cloneNode(true) as DocumentFragment // Clones The Warm Up Template Content
                        (container.querySelector(".training_plan") as HTMLDivElement).prepend(warm_up_template_clone) // Appends Exercise To The Training Plan
                    }

                    // Creates Exercises
                    else {
                        const exercise_template_clone:DocumentFragment = exercise_template.content.cloneNode(true) as DocumentFragment // Clones The Exercise Template Content

                        (container.querySelector(".additional_info .title") as HTMLInputElement).value = type_data;
                    
                        (exercise_template_clone.querySelector(".exercise .title") as HTMLHeadingElement).textContent = exercise_data // Sets Title To The Exercise Title

                        // Sets The Correct Unit Amount Label By Selection Dragged Exercise Unit
                        if(unit_data === "reps") (exercise_template_clone.querySelector(".exercise .labels .unit_amount") as HTMLParagraphElement).textContent = "Počet opakovaní"
                        if(unit_data === "seconds") (exercise_template_clone.querySelector(".exercise .labels .unit_amount") as HTMLParagraphElement).textContent = "Počet sekúnd"
                        if(unit_data === "steps") (exercise_template_clone.querySelector(".exercise .labels .unit_amount") as HTMLParagraphElement).textContent = "Počet krokov";

                        (exercise_template_clone.querySelector(".exercise") as HTMLDivElement).dataset.training_plan_key = training_plan_key; // Stores Training Plan Key Data To The Exercise
                        (exercise_template_clone.querySelector(".exercise") as HTMLDivElement).dataset.unit = unit_data; // Stores Unit Type Data To The Exercise

                        (exercise_template_clone.querySelector(".exercise .periods_container") as HTMLDivElement).innerHTML = "" // Deletes All Period Selections

                        generatePeriodSelections(periods_data, getTotalPeriodSelections(periods_data), unit_data, exercise_template_clone.querySelector(".periods_container") as HTMLDivElement); // Generates Exact Amount Of Period Selections For Exercise

                        (container.querySelector(".training_plan") as HTMLDivElement).appendChild(exercise_template_clone) // Appends The Exercise To The Training Plan
                    }
                }
            }
        })

        const exercises:NodeListOf<HTMLDivElement> = training_plan.querySelectorAll<HTMLDivElement>(".exercise"); // Gets All Training Plan Exercises
        (exercises[edit_training_plan_state.active_exercise_index] as HTMLDivElement).classList.add("active") // Shows Active Exercise

        // Creates And Renders Bars
        const bar_container:HTMLDivElement = createBars(exercises.length, edit_training_plan_state)
        renderBars(training_plan, bar_container)
    }

    // Function Which Converts Exercise Period To An Array With Amounts Of The Similar Sets
    function getTotalPeriodSelections(periods_data:number[]):number[] {
        // Gets Array Of Similar Sets In Periods
        let total_period_selections:number[] = []
        let similar_sets:number = 0

        periods_data.forEach(function(_, index:number):void {
            if(periods_data[index] === periods_data[index - 1] || index === 0) similar_sets += 1
            else total_period_selections.push(similar_sets)
        })

        total_period_selections.push(similar_sets)

        return total_period_selections
    }

    // Function For Generate Period Selections
    function generatePeriodSelections(periods_data:number[], amount:number[], unit:string, parent_element:HTMLDivElement):void {
        amount.forEach(function(one_unit:number, index:number) {
            const period_selection_template_clone:DocumentFragment = period_selection_template.content.cloneNode(true) as DocumentFragment // Clones The Period Selection Template Content

            // Fills Sets & Reps Inputs With The Values
            const reps:HTMLInputElement = period_selection_template_clone.querySelector(".period_selection .reps_container .reps") as HTMLInputElement // Gets Reps Input
            const sets:HTMLInputElement = period_selection_template_clone.querySelector(".period_selection .sets_container .sets") as HTMLInputElement // Gets Sets Input

            reps.value = String(periods_data[index]) // Replaces Reps Input Value
            sets.value = String(one_unit) // Replaces Sets Input Value

            // Shows Reps Content
            const to_failure:HTMLParagraphElement = period_selection_template_clone.querySelector(".period_selection .reps_container .to_failure") as HTMLParagraphElement // Gets To Failure Text
            const time:HTMLParagraphElement = period_selection_template_clone.querySelector(".period_selection .reps_container .time") as HTMLParagraphElement // Gets Time Text

            if(periods_data[index] === 0) to_failure.style.visibility = "visible" // Shows To Failure Text

            else {
                // Checks Exercise Unit Type
                if(unit === "reps" || unit === "steps") reps.style.visibility = "visible" // Shows Reps Input

                if(unit === "seconds") {
                    time.style.visibility = "visible" // Shows Time Text
                    if(periods_data[index]) time.textContent = getMinimalistFormattedTime(periods_data[index])
                }
                
                to_failure.style.visibility = "hidden" // Hides To Failure Text
            }

            parent_element.appendChild(period_selection_template_clone) // Appends Period Selection To The Exercise
        })
    }

    // Function For Change Training Plans
    function changeTrainingPlans(training_plan_index:number):void {
        // Shows Blur Animation Between Change Of Training Plans
        training_plan.classList.remove("blur")
        void training_plan.offsetWidth
        training_plan.classList.add("blur")

        if(training_plan_index < 0) edit_training_plan_state.active_training_plan_index = training_plan_days_order.length - 1 // Shows The Last Training Plan
        else if(training_plan_index > training_plan_days_order.length - 1) edit_training_plan_state.active_training_plan_index = 0 // Shows The First Training Plan
        else edit_training_plan_state.active_training_plan_index = training_plan_index // Changes Active Training Plan Index

        generateTrainingPlan(exercises_data, edit_training_plan)
    }

    function deleteTrainingPlan(container:HTMLDivElement):void {
        const training_plan:HTMLDivElement = container.querySelector(".training_plan") as HTMLDivElement // Gets Training Plan
        const exercises:NodeListOf<HTMLDivElement> = training_plan.querySelectorAll<HTMLDivElement>(".exercise") // Gets All Training Plan Exercises
        const training_plan_title:HTMLInputElement = container.querySelector(".additional_info .title") as HTMLInputElement // Gets Training Plan Title

        const training_plan_data:{}[] = [] // Stores All Delete Training Plan Data

        exercises.forEach(function(one_exercise:HTMLDivElement):void {
            const training_plan_key:string|undefined = one_exercise.dataset.training_plan_key // Gets Training Plan Key

            if(!training_plan_key) return

            // Creates And Fills The Object Of One Exercise For Delete Training Plan
            const delete_training_plan_object:{
                training_plan_key:string,
                action:string

            } = {
                training_plan_key,
                action: "delete_training_plan"
            }

            training_plan_data.push(delete_training_plan_object) // Fills Training Plan Data Array With Objects Of Exercises
        })

        sendPOST("/my-training-plans", training_plan_data) // Sends The Data With POST
        sendNotification(`Tréningový plán ${training_plan_title.value} bol odstránený.`) // Sends The Notification For The User
        location.reload() // Reloads The Page
    }

    // Global Event Delegations

    // All Training Plans Container Click Events
    edit_training_plan.addEventListener("click", function(event:PointerEvent):void {
        // Training Plan Bars
        if(event.target instanceof Node && (event.target as HTMLDivElement).classList.contains("bar") && (event.target.parentNode as HTMLDivElement).classList.contains("training_plan_bar_container")) {
            if(!event.target.parentNode) return // Catch Errors

            const clicked_bar_index:number = [...event.target.parentNode.querySelectorAll<HTMLDivElement>(".bar")].indexOf(event.target as HTMLDivElement) // Gets Index Of The Clicked Bar
            changeTrainingPlans(clicked_bar_index) // Changes Training Plans
        }
    })

    // Document Drop Events (Remove The Exercise From The Training Plan Functionality)
    document.addEventListener("dragover", function(event:DragEvent):void {
        if(event.target instanceof Node && dragged_exercise && !training_plan.contains(event.target)) event.preventDefault() // Makes The Drop Zone Functional (If There Is Dragged Exercise And Dragover Element Isn't Inside The Training Plan)
    })

    document.addEventListener("drop", function(event:DragEvent):void {
        if(event.target instanceof Node && dragged_exercise && !training_plan.contains(event.target)) removeExercise(dragged_exercise, training_plan, edit_training_plan_state) // Removes Dragged Exercise From The Training Plan (If There Is Dragged Exercise And Drop Element Isn't Inside The Training Plan)
    })

    // Training Plan Drag & Drop Events
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

    training_plan.addEventListener("dragend", function():void {
        dragged_exercise = null // Deletes Training Plan Dragged Exercise
        dragged_bar = null // Deletes Training Plan Dragged Bar

        const bar_container:HTMLDivElement = this.querySelector(".bar_container") as HTMLDivElement // Gets Bar Container

        bar_container.querySelectorAll<HTMLDivElement>(".bar").forEach(function(one_bar:HTMLDivElement) {
            one_bar.classList.remove("animate") // Removes Drag Animation
        })
    })

    training_plan.addEventListener("dragover", function(event:DragEvent):void {
        if(event.target === drop_zone) event.preventDefault() // Drop Zone For The First Exercise (Makes The Drop Zone Functional)
        if(event.target === this.querySelectorAll<HTMLDivElement>(".exercise")[edit_training_plan_state.active_exercise_index]) event.preventDefault() // Drop Zone On Active Exercise In The Training Plan (Makes The Drop Zone Functional)
        if(global_state.selection_dragged_exercise) this.classList.add("animate") // Adds Drag Animation (Executes Only If The Dragged Element Is Selection Dragged Exercise)
        if((event.target as HTMLDivElement).classList.contains("bar")) event.preventDefault() // Drop Zone On Bars In The Bar Container (Makes The Drop Zone Functional)
    })

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
                (unit_select_menu.closest(".exercise") as HTMLDivElement).dataset.unit = clicked_option.dataset.unit_option // Sets Unit Data To The Exercise

                // Removes Selected Class From Options
                unit_options.forEach(function(one_option:HTMLDivElement) {
                    one_option.classList.remove("selected")
                })

                if(clicked_option.dataset.unit_option === (unit_select_menu.closest(".exercise") as HTMLDivElement).dataset.unit) {
                    (unit_select.querySelector("span") as HTMLSpanElement).textContent = (clicked_option.querySelector("span") as HTMLSpanElement).textContent // Shows Current Selected Option From List Without Icon
                    clicked_option.classList.add("selected") // Adds Selected Class To Selected Option
                }

                if(clicked_option.dataset.unit_option) updateUnitTypes(clicked_option.dataset.unit_option, training_plan, edit_training_plan_state) // Updates Unit Type For Every Reps Container
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

    training_plan.addEventListener("pointerup", stopHold)
    training_plan.addEventListener("pointercancel", stopHold)
    training_plan.addEventListener("pointerleave", stopHold)

    // Events

    // Sets Focused Element
    edit_training_plan.addEventListener("focus", function():void {
        global_state.focused_element = "edit_training_plan"
    })

    edit_training_plan.addEventListener("wheel", function(event:WheelEvent):void {
        if(!(event.target instanceof Node) || (event.target as HTMLDivElement).classList.contains("training_plan_bar_container") || (event.target.parentNode as HTMLDivElement).classList.contains("training_plan_bar_container")) {
            event.preventDefault() // Stop Scrolling

            if(event.deltaY < 0) changeTrainingPlans(edit_training_plan_state.active_training_plan_index + 1) // Changes Training Plans (Shows Next Training Plan)
            if(event.deltaY > 0) changeTrainingPlans(edit_training_plan_state.active_training_plan_index - 1) // Changes Training Plans (Shows Previous Training Plan)
        }
    })

    // Change Training Plan Exercises With Scroll Wheel Functionality
    training_plan.addEventListener("wheel", function(event:WheelEvent):void {
        event.preventDefault() // Stop Scrolling

        if(event.target !== drop_zone) {
            if(event.deltaY < 0) changeExercises(edit_training_plan_state.active_exercise_index - 1, this, edit_training_plan_state) // Changes Training Plan Exercises (Shows Next Exercise)
            if(event.deltaY > 0) changeExercises(edit_training_plan_state.active_exercise_index + 1, this, edit_training_plan_state) // Changes Training Plan Exercises (Shows Previous Exercise)
        }
    })

    // Change Training Plan Exercises And Training Plans With Arrow Keys Functionality
    edit_training_plan.addEventListener("mouseover", function(event:MouseEvent):void {
        if(!(event.target instanceof Node) || (event.target as HTMLDivElement).classList.contains("bar_container") || (event.target.parentNode as HTMLDivElement).classList.contains("bar_container")) global_state.hovered_element = "edit_training_plan_exercises_bars" // Sets Hovered Element For Bar Container
        else if(!(event.target instanceof Node) || (event.target as HTMLDivElement).classList.contains("training_plan_bar_container") || (event.target.parentNode as HTMLDivElement).classList.contains("training_plan_bar_container")) global_state.hovered_element = "edit_training_plan_bars" // Sets Hovered Element For Training Plan Bar Container
    })

    edit_training_plan.addEventListener("mouseout", function():void {
        global_state.hovered_element = null
    })

    document.addEventListener("keydown", function(event:KeyboardEvent):void {
        if(event.key === "ArrowLeft" && global_state.hovered_element === "edit_training_plan_exercises_bars") changeExercises(edit_training_plan_state.active_exercise_index - 1, training_plan, edit_training_plan_state) // Changes Training Plan Exercises (Shows Previous Exercise)
        else if(event.key === "ArrowRight" && global_state.hovered_element === "edit_training_plan_exercises_bars") changeExercises(edit_training_plan_state.active_exercise_index + 1, training_plan, edit_training_plan_state) // Changes Training Plan Exercises (Shows Next Exercise)

        else if(event.key === "ArrowLeft" && global_state.hovered_element === "edit_training_plan_bars") changeTrainingPlans(edit_training_plan_state.active_training_plan_index - 1) // Changes Training Plans (Shows Previous Training Plan)
        else if(event.key === "ArrowRight" && global_state.hovered_element === "edit_training_plan_bars") changeTrainingPlans(edit_training_plan_state.active_training_plan_index + 1) // Changes Training Plans (Shows Next Training Plan)
    })

    // Day Select Menu
    day_select.addEventListener("click", function():void {
        day_options_list.classList.toggle("active"); // Shows / Hides Options List
        (this.querySelector(".fa-angle-down") as HTMLElement).classList.toggle("fa-angle-up") // Toggle Icons
    })

    day_options.forEach(function(option:HTMLDivElement):void {
        option.addEventListener("click", function():void {
            if(!this.dataset.day) return

            sessionStorage.setItem("edit_training_plan_day", this.dataset.day) // Stores Edited Training Plan Day To Session Storage

            day_options_list.classList.toggle("active"); // Shows / Hides Options List
            (day_select.querySelector(".fa-angle-down") as HTMLElement).classList.toggle("fa-angle-up") // Toggle Icons

            // Removes Selected Class From Options
            day_options.forEach(function(remove_selected:HTMLDivElement):void {
                remove_selected.classList.remove("selected")
            })

            // Shows Current Selected Option From List Without Icon
            if(this.dataset.day === sessionStorage.getItem("edit_training_plan_day")) {
                (day_select.querySelector("span") as HTMLSpanElement).textContent = (this.querySelector("span") as HTMLSpanElement).textContent // Shows Current Selected Option From List Without Icon
                this.classList.add("selected") // Adds Selected Class To Selected Option
            }
        })
    })

    // Save Edited Training Plan
    save.addEventListener("click", function():void {
        saveTrainingPlan(edit_training_plan, edit_training_plan_state)
    })

    // Delete Training Plan
    delete_button.addEventListener("click", function():void {
        deleteTrainingPlan(edit_training_plan)
    })

    // MAIN

    generateTrainingPlan(exercises_data, edit_training_plan) // Renders User's Training Plan If Has Any
})