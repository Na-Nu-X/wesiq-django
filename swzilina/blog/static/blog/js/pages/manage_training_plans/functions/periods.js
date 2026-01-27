import { getMinimalistFormattedTime } from "../../../utils/timer.js"

export function addPeriod(exercise, template) {
    const periods_container = exercise.querySelector(".periods_container") // Gets Periods Container Of Exercise

    const period_selection_template_clone = template.content.cloneNode(true) // Clones The Period Selection Template Content

    periods_container.prepend(period_selection_template_clone) // Prepends New Period To The Exercise In The Training Plan
}

export function changeReps(button, operation) {
    const unit = button.closest(".exercise").dataset.unit // Gets Exercise Unit Type (Reps Or Seconds)
    const reps = button.closest(".reps_container").querySelector(".reps") // Gets Reps Input
    const to_failure = button.closest(".reps_container").querySelector(".to_failure") // Gets To Failure Text
    const time = button.closest(".reps_container").querySelector(".time") // Gets Time Text
    let reps_number = parseInt(reps.value) // Gets Current Reps Amount In Number Format

    reps.style.visibility = "hidden" // Hides Reps Input
    // to_failure.style.visibility = "hidden" // Hides To Failure Text
    time.style.visibility = "hidden" // Hides Time Text

    if(operation === "decrease") reps_number -= 1 // Decreases Reps Amount By 1
    if(operation === "increase") reps_number += 1 // Increases Reps Amount By 1

    if(reps_number < 0) return // Do Nothing

    else if(reps_number === 0) to_failure.style.visibility = "visible" // Shows To Failure Text

    else {
        to_failure.style.visibility = "hidden" // Hides To Failure Text

        // Checks Exercise Unit Type
        if(unit === "reps") {
            reps.style.visibility = "visible" // Shows Reps Input

            if(reps_number > 100) return // Do Nothing
        }

        if(unit === "seconds") {
            time.style.visibility = "visible" // Shows Time Text
            time.textContent = getMinimalistFormattedTime(reps_number)
            
            if(reps_number > 3600) return // Do Nothing
        }
    }

    reps.value = reps_number // Updates Exercise Reps Amount
}

export function changeSets(button, operation) {
    const sets = button.closest(".sets_container").querySelector(".sets") // Gets Sets Input
    let sets_number = parseInt(sets.value) // Gets Current Sets Amount In Number Format

    if(operation === "decrease") sets_number -= 1 // Decreases Sets Amount By 1
    if(operation === "increase") sets_number += 1 // Increases Sets Amount By 1

    // Delete Period Functionality
    if(sets_number === 0 && button.closest(".exercise").querySelectorAll(".period_selection").length > 1) {
        button.closest(".period_selection").remove() // Removes Period Selection From DOM
    }

    if(sets_number < 1 || sets_number > 100) return // Do Nothing

    sets.value = sets_number // Updates Exercise Sets Amount
}