import { edit_training_plan_state } from "../state.js"

import { 
    createTrainingPlanBars,
    renderTrainingPlanBars,
    createBars, 
    renderBars 
} from "../../../components/trainingPlanFunctions.js"

import { getFormattedTime, getMinimalistFormattedTime } from "../../../utils/timer.js"
import { sendPOST } from "../../../services/sendPOST.js"
import { sendNotification } from "../../../utils/sendNotification.js"
import { displayMessage } from "../../../utils/displayMessage.js"

import type { response } from "../../../services/sendPOST.js"

// Function For Render Exercises Of The Selected Training Plan
export function generateTrainingPlan(edit_training_plan:HTMLDivElement):void {
    const training_plan:HTMLDivElement = edit_training_plan.querySelector(".training_plan") as HTMLDivElement // Gets Training Plan
    const exercises_data:NodeListOf<HTMLDivElement> = edit_training_plan.querySelectorAll<HTMLDivElement>(".one_exercise_data") // Gets Data From Every User's Exercise

    const warm_up_template:HTMLTemplateElement = document.querySelector(".warm_up_template") as HTMLTemplateElement // Gets Warm Up Template
    const exercise_template:HTMLTemplateElement = document.querySelector(".exercise_template") as HTMLTemplateElement // Gets Exercise Template

    const day_select_menu:HTMLDivElement = edit_training_plan.querySelector(".additional_info .day_select_menu") as HTMLDivElement // Gets Day Select Menu
    const day_select:HTMLDivElement = day_select_menu.querySelector(".select") as HTMLDivElement // Gets Selected Option Print
    const day_options_list:HTMLDivElement = day_select_menu.querySelector(".options_list") as HTMLDivElement // Gets Day Options List
    const day_options:NodeListOf<HTMLDivElement> = day_options_list.querySelectorAll<HTMLDivElement>(".option") // Gets All Day Options

    const buttons_container:HTMLDivElement = edit_training_plan.querySelector(".buttons") as HTMLDivElement // Gets Buttons Container

    // Gets Current Order Of Training Plans By Day Value
    const training_plan_days_order:(string|null)[] = [
        ...new Set([...exercises_data].map(function(one_exercise_data:HTMLDivElement):string|null {
            return one_exercise_data.dataset["day"] ? one_exercise_data.dataset["day"] : null
        }))
    ]

    // Set Defaults
    edit_training_plan_state.active_exercise_index = 0 // Sets Active Exercise Index Back To 0

    // Removes Exercises
    edit_training_plan.querySelectorAll<HTMLDivElement>(".exercise").forEach(function(one_exercise:HTMLDivElement):void {
        one_exercise.remove()
    })

    // Removes Training Plan Bar Container
    edit_training_plan.querySelectorAll<HTMLDivElement>(".training_plan_bar_container").forEach(function(one_bar_container:HTMLDivElement):void {
        one_bar_container.remove()
    })

    // Day
    let training_plan_day:string|null = training_plan_days_order[edit_training_plan_state.active_training_plan_index] ?? null // Gets The First Value From Training Plan Days Order (Current Or Upcoming Day By Default)

    day_options.forEach(function(remove_selected:HTMLDivElement):void {
        remove_selected.classList.remove("selected") // Removes Selected Class From Day Options
    })

    day_options.forEach(function(one_option:HTMLDivElement):void {
        // Shows Current Selected Option From List Without Icon
        if(one_option.dataset["day"] === training_plan_day) {
            (day_select.querySelector("span") as HTMLSpanElement).textContent = (one_option.querySelector("span") as HTMLSpanElement).textContent // Shows Current Selected Option From List Without Icon
            one_option.classList.add("selected") // Adds Selected Class To Selected Option
        }
    })

    // Creates And Renders Training Plan Bars (Only If There Are More Than One Training Plans)
    if(training_plan_days_order.length > 1) {
        const training_plan_bar_container:HTMLDivElement = createTrainingPlanBars(training_plan_days_order.length, edit_training_plan_state)
        renderTrainingPlanBars(edit_training_plan, training_plan_bar_container)

        buttons_container.style.marginTop = "0px" // Changes The Top Margin For The Buttons Container
    }

    // Orders Exercises By Order Value In Exercises Data
    const ordered_exercises_data:HTMLDivElement[] = [...exercises_data].sort(function(a:HTMLDivElement, b:HTMLDivElement) {
        return Number(a.dataset["order"]) - Number(b.dataset["order"])
    })

    // Extracts Data For Every Exercise
    ordered_exercises_data.forEach(function(one_exercise_data:HTMLDivElement):void {
        const training_plan_key:string = one_exercise_data.dataset["training_plan_key"] as string // Gets Training Plan Key
        const day_data:string|null = one_exercise_data.dataset["day"] || null // Gets Training Day Of The Exercise If Has Any
        const type_data:string = one_exercise_data.dataset["type"] as string // Gets Training Title Of The Exercise
        const exercise_data:string = one_exercise_data.dataset["exercise"] as string // Gets Exercise Name
        const periods_data:number[] = JSON.parse(one_exercise_data.dataset["periods"] || "[0]") // Gets Exercise Sets & Reps Periods
        const unit_data:string = one_exercise_data.dataset["unit"] || "reps" // Gets Exercise Unit Type (Reps Or Seconds)

        // Shows Exercises Only Which Have Some Training Plan Day
        if(day_data !== null) {
            // Shows Exercises Only Of The Selected Training Plan Day
            if(training_plan_day === day_data) {
                // Creates Warm Up
                if(exercise_data === "Warm Up") {
                    const warm_up_template_clone:DocumentFragment = warm_up_template.content.cloneNode(true) as DocumentFragment // Clones The Warm Up Template Content

                    (warm_up_template_clone.querySelector(".timer .countdown") as HTMLHeadingElement).textContent = `${getFormattedTime("minutes", periods_data[0])}:${getFormattedTime("seconds", periods_data[0], true)}`; // Stores Timer Of Warm Up

                    (edit_training_plan.querySelector(".training_plan") as HTMLDivElement).prepend(warm_up_template_clone) // Appends Exercise To The Training Plan
                }

                // Creates Exercises
                else {
                    const exercise_template_clone:DocumentFragment = exercise_template.content.cloneNode(true) as DocumentFragment // Clones The Exercise Template Content

                    (edit_training_plan.querySelector(".additional_info .title") as HTMLInputElement).value = type_data;
                
                    (exercise_template_clone.querySelector(".exercise .title") as HTMLHeadingElement).textContent = exercise_data // Sets Title To The Exercise Title

                    // Sets The Correct Unit Amount Label By Selection Dragged Exercise Unit
                    if(unit_data === "reps") (exercise_template_clone.querySelector(".exercise .labels .unit_amount") as HTMLParagraphElement).textContent = gettext("Počet opakovaní")
                    if(unit_data === "seconds") (exercise_template_clone.querySelector(".exercise .labels .unit_amount") as HTMLParagraphElement).textContent = gettext("Počet sekúnd")
                    if(unit_data === "steps") (exercise_template_clone.querySelector(".exercise .labels .unit_amount") as HTMLParagraphElement).textContent = gettext("Počet krokov");

                    (exercise_template_clone.querySelector(".exercise") as HTMLDivElement).dataset["training_plan_key"] = training_plan_key; // Stores Training Plan Key Data To The Exercise
                    (exercise_template_clone.querySelector(".exercise") as HTMLDivElement).dataset["unit"] = unit_data; // Stores Unit Type Data To The Exercise

                    (exercise_template_clone.querySelector(".exercise .periods_container") as HTMLDivElement).innerHTML = "" // Deletes All Period Selections

                    generatePeriodSelections(periods_data, getConsecutiveNumbersCount(periods_data), unit_data, exercise_template_clone.querySelector(".periods_container") as HTMLDivElement); // Generates Exact Amount Of Period Selections For Exercise

                    (edit_training_plan.querySelector(".training_plan") as HTMLDivElement).appendChild(exercise_template_clone) // Appends The Exercise To The Training Plan
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

// Function For Change Training Plans
export function changeTrainingPlans(training_plan_index:number, edit_training_plan:HTMLDivElement):void {
    const training_plan:HTMLDivElement = edit_training_plan.querySelector(".training_plan") as HTMLDivElement // Gets Training Plan
    const exercises_data:NodeListOf<HTMLDivElement> = edit_training_plan.querySelectorAll<HTMLDivElement>(".one_exercise_data") // Gets Data From Every User's Exercise

    // Gets Current Order Of Training Plans By Day Value
    const training_plan_days_order:(string|null)[] = [
        ...new Set([...exercises_data].map(function(one_exercise_data:HTMLDivElement):string|null {
            return one_exercise_data.dataset["day"] ? one_exercise_data.dataset["day"] : null
        }))
    ]

    // Shows Blur Animation Between Change Of Training Plans
    training_plan.classList.remove("blur")
    void training_plan.offsetWidth
    training_plan.classList.add("blur")

    if(training_plan_index < 0) edit_training_plan_state.active_training_plan_index = training_plan_days_order.length - 1 // Shows The Last Training Plan
    else if(training_plan_index > training_plan_days_order.length - 1) edit_training_plan_state.active_training_plan_index = 0 // Shows The First Training Plan
    else edit_training_plan_state.active_training_plan_index = training_plan_index // Changes Active Training Plan Index

    generateTrainingPlan(edit_training_plan)
}

// Function For Delete The Training Plan
export async function deleteTrainingPlan(container:HTMLDivElement):Promise<void> {
    const training_plan:HTMLDivElement = container.querySelector(".training_plan") as HTMLDivElement // Gets Training Plan
    const exercises:NodeListOf<HTMLDivElement> = training_plan.querySelectorAll<HTMLDivElement>(".exercise") // Gets All Training Plan Exercises
    const training_plan_title:HTMLInputElement = container.querySelector(".additional_info .title") as HTMLInputElement // Gets Training Plan Title

    const training_plan_data:{}[] = [] // Stores All Delete Training Plan Data

    exercises.forEach(function(one_exercise:HTMLDivElement):void {
        const training_plan_key:string|undefined = one_exercise.dataset["training_plan_key"] // Gets Training Plan Key

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

    try {
        const delete_training_plan_response:response = await sendPOST(window.location.pathname, training_plan_data) // Sends The Data With POST

        // If The Response Isn't Success
        if(!delete_training_plan_response.success) {
            displayMessage(delete_training_plan_response.message, "error") // Displays The Error Message
            return
        }

        sendNotification(interpolate(gettext("Tréningový plán %s bol odstránený."), [training_plan_title.value])) // Sends The Notification For The User
        window.location.reload() // Reloads The Page
    }

    catch {
        displayMessage(gettext("Pri odstraňovaní tréningového plánu došlo k chybe."), "error") // Displays The Error Message
    }
}

// Function For Count Consecutive Numbers In An Array (For Example From [1, 1, 2, 2, 3] To [2, 2, 1])
function getConsecutiveNumbersCount(array:number[]):number[] {
    if(array.length === 0) return []

    const result:number[] = []
    let counter:number = 1

    for(let i:number = 1; i <= array.length; i++) {
        if(array[i] === array[i - 1]) counter += 1 // Increments The Counter

        else {
            result.push(counter) // Stores Previous Counter Value
            counter = 1 // Resets The Counter
        }
    }

    return result
}

// Function For Reduce An Array Of Repeating Numbers (For Example From [1, 1, 2, 2, 3] To [1, 2, 3])
function compressConsecutiveNumbers(array:number[]):number[] {
    if(array.length === 0) return []

    const result:number[] = [array[0] as number] // Stores The First Number

    for(let i:number = 1; i < array.length; i++) {
        if(array[i] !== array[i - 1]) {
            result.push(array[i] as number) // Stores The Number
        }
    }

    return result
}

// Function For Generate Period Selections
function generatePeriodSelections(periods_data:number[], amount:number[], unit:string, parent_element:HTMLDivElement):void {
    amount.forEach(function(one_unit:number, index:number) {
        const period_selection_template:HTMLTemplateElement = document.querySelector(".period_selection_template") as HTMLTemplateElement // Gets Period Selection Template
        const period_selection_template_clone:DocumentFragment = period_selection_template.content.cloneNode(true) as DocumentFragment // Clones The Period Selection Template Content

        // Fills Sets & Reps Inputs With The Values
        const reps:HTMLInputElement = period_selection_template_clone.querySelector(".period_selection .reps_container .reps") as HTMLInputElement // Gets Reps Input
        const sets:HTMLInputElement = period_selection_template_clone.querySelector(".period_selection .sets_container .sets") as HTMLInputElement // Gets Sets Input

        reps.value = String(compressConsecutiveNumbers(periods_data)[index]) // Replaces Reps Input Value
        sets.value = String(one_unit) // Replaces Sets Input Value

        // Shows Reps Content
        const to_failure:HTMLParagraphElement = period_selection_template_clone.querySelector(".period_selection .reps_container .to_failure") as HTMLParagraphElement // Gets To Failure Text
        const time:HTMLParagraphElement = period_selection_template_clone.querySelector(".period_selection .reps_container .time") as HTMLParagraphElement // Gets Time Text

        if(compressConsecutiveNumbers(periods_data)[index] === 0) to_failure.style.visibility = "visible" // Shows To Failure Text

        else {
            // Checks Exercise Unit Type
            if(unit === "reps" || unit === "steps") reps.style.visibility = "visible" // Shows Reps Input

            if(unit === "seconds") {
                time.style.visibility = "visible" // Shows Time Text
                if(compressConsecutiveNumbers(periods_data)[index]) time.textContent = getMinimalistFormattedTime(compressConsecutiveNumbers(periods_data)[index] as number)
            }
            
            to_failure.style.visibility = "hidden" // Hides To Failure Text
        }

        parent_element.appendChild(period_selection_template_clone) // Appends Period Selection To The Exercise
    })
}