import { 
    getMinimalistFormattedTime, 
    getElapsedSeconds 
} from "../../../utils/timer.js"

// Function Add Period To The Exercise
export function addPeriod(exercise:HTMLDivElement):void {
    const period_selection_template:HTMLTemplateElement = document.querySelector(".period_selection_template") as HTMLTemplateElement // Gets Period Selection Template
    const period_selection_template_clone:DocumentFragment = period_selection_template.content.cloneNode(true) as DocumentFragment // Clones The Period Selection Template Content
    const periods_container:HTMLDivElement = exercise.querySelector(".periods_container") as HTMLDivElement // Gets Periods Container Of Exercise

    periods_container.prepend(period_selection_template_clone) // Prepends New Period To The Exercise In The Training Plan
}

// Function For Change The Reps Value
export function changeReps(button:HTMLButtonElement, operation:string):void {
    const unit:string|undefined = (button.closest(".exercise") as HTMLDivElement).dataset.unit // Gets Exercise Unit Type (Reps Or Seconds)
    const reps:HTMLInputElement = (button.closest(".reps_container") as HTMLDivElement).querySelector(".reps") as HTMLInputElement // Gets Reps Input
    const to_failure:HTMLParagraphElement = (button.closest(".reps_container") as HTMLDivElement).querySelector(".to_failure") as HTMLParagraphElement // Gets To Failure Text
    const time:HTMLParagraphElement = (button.closest(".reps_container") as HTMLDivElement).querySelector(".time") as HTMLParagraphElement // Gets Time Text
    let reps_number:number = parseInt(reps.value) // Gets Current Reps Amount In Number Format

    reps.style.visibility = "hidden" // Hides Reps Input
    time.style.visibility = "hidden" // Hides Time Text

    if(operation === "decrease") reps_number -= 1 // Decreases Reps Amount By 1
    if(operation === "increase") reps_number += 1 // Increases Reps Amount By 1

    if(reps_number < 0) return // Do Nothing

    else if(reps_number === 0) to_failure.style.visibility = "visible" // Shows To Failure Text

    else {
        to_failure.style.visibility = "hidden" // Hides To Failure Text

        if(unit === "reps") {
            reps.style.visibility = "visible" // Shows Reps Input
            if(reps_number > 100) return // Do Nothing
        }

        if(unit === "seconds") {
            time.style.visibility = "visible" // Shows Time Text
            time.textContent = getMinimalistFormattedTime(reps_number) // Shows Exercise Time Amount
            if(reps_number > 3600) return // Do Nothing
        }

        if(unit === "steps") {
            reps.style.visibility = "visible" // Shows Reps Input
            if(reps_number > 1000) return // Do Nothing
        }
    }

    reps.value = String(reps_number) // Updates Exercise Reps Amount
}

// Function For Change The Sets Value
export function changeSets(button:HTMLButtonElement, operation:string):void {
    const sets:HTMLInputElement = (button.closest(".sets_container") as HTMLDivElement).querySelector(".sets") as HTMLInputElement // Gets Sets Input
    let sets_number:number = parseInt(sets.value) // Gets Current Sets Amount In Number Format

    if(operation === "decrease") sets_number -= 1 // Decreases Sets Amount By 1
    if(operation === "increase") sets_number += 1 // Increases Sets Amount By 1

    // Delete Period Functionality
    if(sets_number === 0 && (button.closest(".exercise") as HTMLDivElement).querySelectorAll<HTMLDivElement>(".period_selection").length > 1) {
        (button.closest(".period_selection") as HTMLDivElement).remove() // Removes Period Selection From DOM
    }

    if(sets_number < 1 || sets_number > 100) return // Do Nothing

    sets.value = String(sets_number) // Updates Exercise Sets Amount
}

// Function For Convert Current Values To Selected Unit Type
export function updateUnitTypes(unit:string, training_plan:HTMLDivElement, state:{active_exercise_index:number}):void {
    const exercises:NodeListOf<HTMLDivElement> = training_plan.querySelectorAll<HTMLDivElement>(".exercise") // Gets All Training Plan Exercises
    const reps_inputs:NodeListOf<HTMLInputElement> = (exercises[state.active_exercise_index] as HTMLDivElement).querySelectorAll<HTMLInputElement>(".periods_container .reps") // Gets All Reps Inputs From The Active Exercise

    // Updates Unit Type For Every Reps Container
    reps_inputs.forEach(function(one_input:HTMLInputElement) {
        const time:HTMLParagraphElement = (one_input.parentNode as HTMLDivElement).querySelector(".time") as HTMLParagraphElement // Gets Time Text
        let input_value:number = parseInt(one_input.value) // Gets Current Reps Amount In Number Format

        one_input.style.visibility = "hidden" // Hides Reps Input
        time.style.visibility = "hidden" // Hides Time Text

        if(unit === "reps") {
            if(input_value > 100) one_input.value = "100" // Sets The Maximum Value For The Amount Of Reps
            one_input.style.visibility = "visible" // Shows Reps Input
        }

        if(unit === "seconds") {
            time.style.visibility = "visible" // Shows Time Text
            time.textContent = getMinimalistFormattedTime(input_value) // Shows Exercise Time Amount
        }

        if(unit === "steps") {
            if(input_value > 1000) one_input.value = "1000" // Sets The Maximum Value For The Amount Of Steps
            one_input.style.visibility = "visible" // Shows Reps Input
        }
    })
}

// Function For Get Periods Values
export function getPeriods(exercise:HTMLDivElement):number[] {
    let periods:number[] = [] // Stores Periods Of Sets & Reps, Hold Time Or Steps

    if(exercise.classList.contains("exercise")) {
        const reps_inputs:NodeListOf<HTMLInputElement> = exercise.querySelectorAll<HTMLInputElement>(".periods_container .reps") // Gets All Reps Inputs
        const sets_inputs:NodeListOf<HTMLInputElement> = exercise.querySelectorAll<HTMLInputElement>(".periods_container .sets") // Gets All Sets Inputs

        const reps_inputs_values:number[] = [...reps_inputs].map((one_input:HTMLInputElement) => Number(one_input.value)) // Gets All Reps Inputs Values
        const sets_inputs_values:number[] = [...sets_inputs].map((one_input:HTMLInputElement) => Number(one_input.value)) // Gets All Sets Inputs Values

        // Generates Periods Of Sets & Reps, Hold Time Or Steps Values
        for(let i:number = 0; i < sets_inputs_values.length; i++) {
            const reps_number:number = reps_inputs_values[i] as number
            const sets_number:number = sets_inputs_values[i] as number

            for(let j:number = 0; j < sets_number; j++) {
                periods.unshift(reps_number) // Saves Values To Periods
            }
        }
    }

    if(exercise.classList.contains("warm_up")) {
        const warm_up_time = getElapsedSeconds((exercise.querySelector(".timer .countdown") as HTMLHeadingElement).textContent) // Gets Elapsed Seconds Of Warm Up

        periods = [] // Deletes Periods
        periods.push(warm_up_time) // Saves Value To Periods
    }

    return periods // Returns Periods
}