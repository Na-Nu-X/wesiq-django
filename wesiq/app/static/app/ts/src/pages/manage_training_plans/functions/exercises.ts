import { global_state } from "../state.js"
import { createBars, renderBars } from "../../../components/trainingPlanFunctions.js"

// Checks If Selection Dragged Exercise Is Already In The Training Plan
function isExistingExercise(training_plan:HTMLDivElement):boolean {
    const exercises:NodeListOf<HTMLDivElement> = training_plan.querySelectorAll<HTMLDivElement>(".exercise") // Gets All Training Plan Exercises

    // Returns True If The Exercise Is Already In The Training Plan
    return [...exercises].some(function(one_exercise:HTMLDivElement) {
        const title:string = (one_exercise.querySelector(".title") as HTMLHeadingElement).textContent // Gets Title Of The Exercise In The Training Plan

        const selection_dragged_exercise_name:string = (global_state!.selection_dragged_exercise!.querySelector(".name") as HTMLParagraphElement).textContent // Gets Dragged Exercise Name
        const selection_dragged_exercise_weight:number = Number(global_state.selection_dragged_exercise!.dataset["weight"] || 0) // Gets Current Added Or Subtracted Weight Of The Dragged Exercise

        return (
            title === selection_dragged_exercise_name && selection_dragged_exercise_weight === 0 || // For Example: Front Lever
            title === `${selection_dragged_exercise_weight}kg ${selection_dragged_exercise_name}` || // For Example: 100kg Deadlift
            title === `${selection_dragged_exercise_name} +${selection_dragged_exercise_weight}kg` || // For Example: Front Lever +10kg
            title === `${selection_dragged_exercise_name} ${selection_dragged_exercise_weight}kg`  // For Example: Front Lever -10kg

            // title === "Warm Up" // If Exercise Is Warm Up
        )
    })
}

// Creates Exercise Title With Combinated Selection Dragged Exercise Name And Added Or Subtracted Weight Of The Selection Dragged Exercise
function createExerciseTitle(exercise_name:string, exercise_weight:number):string|undefined {
    if(global_state.selection_dragged_exercise!.classList.contains("custom_exercise")) return undefined // Skips Custom Exercise
    if(global_state.selection_dragged_exercise!.classList.contains("warm_up")) return undefined // Skips Warm Up

    if(exercise_weight !== 0) {
        return global_state.selection_dragged_exercise!.dataset["requires_weight"] == "False" ? exercise_weight > 0 ? `${exercise_name} +${exercise_weight}kg` : `${exercise_name} ${exercise_weight}kg` : `${exercise_weight}kg ${exercise_name}` // Returns Title With Appended Weight If The Exercise Doesn't Require Weight And Exercise Weight Isn't Set To 0 (For Example: Front Lever +10kg Or Front Lever -10kg)
    }

    return exercise_name // Returns Unchanged Exercise Title If The Weight Is Set To 0
}

// Function For Add Custom Exercise To The Training Plan
function addCustomExercise(exercise:HTMLDivElement):void {
    // Creates Exercise Title Input
    const title_input:HTMLInputElement = document.createElement("input")

    title_input.classList.add("title_input")
    title_input.type = "text"
    title_input.placeholder = "Pridajte názov cviku"

    exercise.prepend(title_input) // Prepends Exercise Title Input

    // Creates Custom Unit Select Menu
    const unit_select_menu_template:HTMLTemplateElement = document.querySelector(".unit_select_menu_template") as HTMLTemplateElement // Gets Unit Select Menu Template
    const unit_select_menu_template_clone:DocumentFragment = unit_select_menu_template.content.cloneNode(true) as DocumentFragment // Clones The Unit Select Menu Template Content

    (exercise.querySelector(".labels") as HTMLDivElement).prepend(unit_select_menu_template_clone); // Prepends Unit Select Menu To The Exercise Labels
    (exercise.querySelector(".labels .unit_amount") as HTMLParagraphElement).style.display = "none" // Hides Unit Amount Label
}

// Function For Add Warm Up To The Training Plan
function addWarmUp(training_plan:HTMLDivElement, state:{active_exercise_index:number}):void {
    const warm_up_template:HTMLTemplateElement = document.querySelector(".warm_up_template") as HTMLTemplateElement // Gets Warm Up Template
    const warm_up_template_clone:DocumentFragment = warm_up_template.content.cloneNode(true) as DocumentFragment // Clones The Warm Up Template Content

    training_plan.prepend(warm_up_template_clone) // Appends Exercise To The Training Plan

    changeSlides(training_plan, state, true) // Changes Slides In The Training Plan
}

// Function For Add Exercise To The Training Plan
export function addExercise(training_plan:HTMLDivElement, state:{active_exercise_index:number}):void {
    // Executes Only If The Dragged Element Is Selection Dragged Exercise And Doesn't Already Exist In The Training Plan (Except Of The Custom Exercise)
    if(global_state.selection_dragged_exercise && !isExistingExercise(training_plan) && !global_state.selection_dragged_exercise.classList.contains("warm_up") || global_state.selection_dragged_exercise!.classList.contains("custom_exercise")) {
        const exercise_template:HTMLTemplateElement = document.querySelector(".exercise_template") as HTMLTemplateElement // Gets Exercise Template
        const exercise_template_clone:DocumentFragment = exercise_template.content.cloneNode(true) as DocumentFragment // Clones The Exercise Template Content

        const selection_dragged_exercise_name:string = (global_state.selection_dragged_exercise!.querySelector(".name") as HTMLParagraphElement).textContent // Gets Dragged Exercise Name
        const selection_dragged_exercise_weight:number = Number(global_state.selection_dragged_exercise!.dataset["weight"] || 0); // Gets Current Added Or Subtracted Weight Of The Dragged Exercise

        (exercise_template_clone.querySelector(".exercise .title") as HTMLHeadingElement).textContent = createExerciseTitle(selection_dragged_exercise_name, selection_dragged_exercise_weight) || "" // Sets Formatted Title Value To The Exercise Title

        // Sets The Correct Unit Amount Label By Selection Dragged Exercise Unit
        if(global_state.selection_dragged_exercise!.dataset["unit"] === "reps") (exercise_template_clone.querySelector(".labels .unit_amount") as HTMLParagraphElement).textContent = gettext("Počet opakovaní")
        if(global_state.selection_dragged_exercise!.dataset["unit"] === "seconds") (exercise_template_clone.querySelector(".labels .unit_amount") as HTMLParagraphElement).textContent = gettext("Počet sekúnd")
        if(global_state.selection_dragged_exercise!.dataset["unit"] === "steps") (exercise_template_clone.querySelector(".labels .unit_amount") as HTMLParagraphElement).textContent = gettext("Počet krokov");

        (exercise_template_clone.querySelector(".exercise") as HTMLDivElement).dataset["unit"] = global_state.selection_dragged_exercise!.dataset["unit"] || "reps" // Stores Unit Type Data To The Exercise (Reps By Default)

        if(global_state.selection_dragged_exercise!.classList.contains("custom_exercise")) addCustomExercise(exercise_template_clone.querySelector(".exercise") as HTMLDivElement) // Adds Custom Exercise To The Training Plan

        training_plan.appendChild(exercise_template_clone) // Appends Exercise To The Training Plan

        changeSlides(training_plan, state) // Changes Slides In The Training Plan
    }

    else if(global_state.selection_dragged_exercise!.classList.contains("warm_up")) {
        const exercises:NodeListOf<HTMLDivElement> = training_plan.querySelectorAll<HTMLDivElement>(".exercise") // Gets All Training Plan Exercises

        // Checks If The Warm Up Is Already In The Training Plan
        const is_existing_warm_up:boolean = [...exercises].some(function(one_exercise:HTMLDivElement) {
            const title:string = (one_exercise.querySelector(".title") as HTMLHeadingElement).textContent // Gets Title Of The Exercise In The Training Plan
            return title === "Warm Up"
        })

        if(!is_existing_warm_up) addWarmUp(training_plan, state) // Adds Warm Up To The Training Plan
    }
}

// Function For Change Slides Of Training Plan
export function changeSlides(training_plan:HTMLDivElement, state:{active_exercise_index:number}, show_first:boolean = false):void {
    const exercises:NodeListOf<HTMLDivElement> = training_plan.querySelectorAll<HTMLDivElement>(".exercise") // Gets All Training Plan Exercises
    const drop_zone:HTMLDivElement = training_plan.querySelector(".drop_zone") as HTMLDivElement // Gets Training Plan Drop Zone

    if(drop_zone.classList.contains("active")) drop_zone.classList.remove("active") // Hides Training Plan Drop Zone On First Exercise Change

    else {
        if(show_first) {
            // Removes Active Class From All Exercises In The Training Plan
            exercises.forEach(function(one_exercise:HTMLDivElement) {
                one_exercise.classList.remove("active")
            })

            state.active_exercise_index = 0 // Sets Index Of Active Exercise In Training Plan To First Index (Shows The Warm Up)
        }

        else {
            exercises[state.active_exercise_index]!.classList.remove("active") // Hides Previous Active Exercise
            state.active_exercise_index = exercises.length - 1 // Sets Index Of Active Exercise In Training Plan To Last Possible Index (Shows The Last Exercise)
        }
    }

    exercises[state.active_exercise_index]!.classList.add("active") // Shows Active Exercise

    // Creates And Renders Bars
    const bar_container:HTMLDivElement = createBars(exercises.length, state)
    renderBars(training_plan, bar_container)
}

// Function For Change Exercises In The Training Plan
export function changeExercises(exercise_index:number, training_plan:HTMLDivElement, state:{active_exercise_index:number}):void {
    const exercises:NodeListOf<HTMLDivElement> = training_plan.querySelectorAll<HTMLDivElement>(".exercise") // Gets All Training Plan Exercises

    exercises[state.active_exercise_index]!.classList.remove("active") // Hides Previous Active Exercise

    if(exercise_index < 0) state.active_exercise_index = exercises.length - 1 // Shows The Last Exercise
    else if(exercise_index > exercises.length - 1) state.active_exercise_index = 0 // Shows The First Exercise
    else state.active_exercise_index = exercise_index // Updates Index Of Active Exercise
    
    exercises[state.active_exercise_index]!.classList.add("active") // Shows New Active Exercise

    // Creates And Renders Bars
    const bar_container:HTMLDivElement = createBars(exercises.length, state)
    renderBars(training_plan, bar_container)
}

// Function For Change Exercises Order In The Training Plan With Bars
export function changeExercisePosition(dropped_bar_index:number, dragged_bar:HTMLDivElement, training_plan:HTMLDivElement, state:{active_exercise_index:number}):void {
    // Executes Only If The Dragged Element Is Dragged Bar
    if(dragged_bar) {
        const dragged_bar_index:number = [...dragged_bar.parentNode!.querySelectorAll<HTMLDivElement>(".bar")].indexOf(dragged_bar) // Gets Index Of The Dragged Bar In The Training Plan
        const exercises:NodeListOf<HTMLDivElement> = training_plan.querySelectorAll<HTMLDivElement>(".exercise") // Gets All Training Plan Exercises

        const active_exercise:HTMLDivElement = exercises[state.active_exercise_index] as HTMLDivElement // Gets The Active Exercise
        const dragged_exercise:HTMLDivElement = exercises[dragged_bar_index] as HTMLDivElement // Gets The Dragged Exercise
        const dropped_exercise:HTMLDivElement = exercises[dropped_bar_index] as HTMLDivElement // Gets The Dropped Exercise

        if((dragged_exercise.querySelector(".title") as HTMLHeadingElement).textContent === "Warm Up" || (dropped_exercise.querySelector(".title") as HTMLHeadingElement).textContent === "Warm Up") return // Do Nothing If Exercise Of Dropped Bar Index Or Dragged Bar Index Is Warm Up

        dragged_bar_index < dropped_bar_index ? training_plan.insertBefore(dragged_exercise, dropped_exercise.nextSibling) : training_plan.insertBefore(dragged_exercise, dropped_exercise); // Changes DOM Position Of Exercises

        active_exercise.classList.remove("active") // Hides Previous Active Exercise
        dragged_exercise.classList.remove("active") // Hides Previous Active Exercise
        dropped_exercise.classList.remove("active") // Hides Previous Active Exercise
        
        changeExercises(dropped_bar_index, training_plan, state) // Shows The Exercise Of Dropped Bar Index
    }
}

// Function For Remove Exercise From The Training Plan
export function removeExercise(dragged_exercise:HTMLDivElement, training_plan:HTMLDivElement, state:{active_exercise_index:number}):void {
    // Executes Only If The Dragged Element Is Dragged Exercise From The Training Plan
    if(dragged_exercise) {
        const drop_zone:HTMLDivElement = training_plan.querySelector(".drop_zone") as HTMLDivElement // Gets Training Plan Drop Zone

        dragged_exercise.remove() // Removes Training Plan Dragged Exercise From DOM

        const exercises:NodeListOf<HTMLDivElement> = training_plan.querySelectorAll<HTMLDivElement>(".exercise") // Gets All Training Plan Exercises

        // Checks If There Will Be Still Any Exercise In The Training Plan After Removal
        if(exercises.length >= 1) {
            state.active_exercise_index = exercises.length - 1 // Sets Index Of Active Exercise In Training Plan To Last Possible Index (Shows The Last Exercise)
            exercises[state.active_exercise_index]!.classList.add("active") // Shows Active Exercise
        }

        else drop_zone!.classList.add("active") // Shows Training Plan Drop Zone
        
        // Creates And Renders Bars
        const bar_container:HTMLDivElement = createBars(exercises.length, state)
        renderBars(training_plan, bar_container)
    }
}