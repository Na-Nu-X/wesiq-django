import { changeExercises } from "./exercises.js"
import { generateKey } from "../../../utils/generateKey.js"
import { getSelectedDay } from "./getSelectedDay.js"
import { getPeriods } from "./periods.js"
import { sendPOST } from "../../../services/sendPOST.js"
import { sendNotification } from "../../../utils/sendNotification.js"

export function saveTrainingPlan(container:HTMLDivElement, state:{active_exercise_index:number}) {
    const training_plan:HTMLDivElement = container.querySelector(".training_plan") as HTMLDivElement // Gets Training Plan
    const exercises:NodeListOf<HTMLDivElement> = training_plan.querySelectorAll<HTMLDivElement>(".exercise") // Gets All Training Plan Exercises
    const day_options:NodeListOf<HTMLDivElement> = container.querySelectorAll<HTMLDivElement>(".additional_info .day_select_menu .options_list .option") // Gets All Day Options
    const training_plan_title:HTMLInputElement = container.querySelector(".additional_info .title") as HTMLInputElement // Gets Training Plan Title

    if(training_plan_title.value === "") {
        // Shows Error Animation
        training_plan_title.classList.remove("error_animation")
        void training_plan_title.offsetWidth
        training_plan_title.classList.add("error_animation")
    }

    if(exercises.length === 0) {
        // Shows Error Animation
        (training_plan.querySelector(".fa-compress") as HTMLElement).classList.remove("error_animation")
        void (training_plan.querySelector(".fa-compress") as HTMLElement).offsetWidth;
        (training_plan.querySelector(".fa-compress") as HTMLElement).classList.add("error_animation")
    }

    // Checks For Empty Exercise Title Inputs In Custom Exercises In The Training Plan
    const custom_exercises_without_name:HTMLDivElement[] = [...exercises].filter(function(one_exercise) {
        return (one_exercise?.querySelector(".title_input") as HTMLInputElement)?.value?.trim() === ""
    })

    if(custom_exercises_without_name.length > 0) {
        const first_custom_exercise_without_name_index:number = [...exercises].indexOf(custom_exercises_without_name[0] as HTMLDivElement) // Gets Index Of The First Custom Exercise Without Filled Title Input

        changeExercises(first_custom_exercise_without_name_index, training_plan, state) // Shows The Exercise Of The First Custom Exercise Without Filled Title Input Index
    }

    // Only Saves If Everything Required Is Filled
    if(training_plan_title.value !== "" && exercises.length !== 0 && custom_exercises_without_name.length === 0) {
        const training_plan_data:{}[] = [] // Stores All New Saved Training Plan Data

        const training_plan_key:string = generateKey(50) // Gets Random 50 Characters Long Generated Key
        
        // Gets Action (New Training Plan Or Edited Training Plan)
        let action:string = "new_training_plan" // Stores Action Value
        if(container.classList.contains("new_training_plan")) action = "new_training_plan"
        else if(container.classList.contains("edit_training_plan")) action = "edited_training_plan"

        const day:number|null = getSelectedDay(day_options) // Gets Training Plan Day
        const type:string = training_plan_title.value // Gets Training Plan Title Value

        // Gets Info From Every Exercise
        exercises.forEach(function(one_exercise) {
            const previous_training_plan_key:string|null = one_exercise.dataset.training_plan_key ?? null // Gets Previous Training Plan Key If POST Is From Edited Training Plan
            const exercise = (one_exercise.querySelector(".title") as HTMLHeadingElement).textContent !== "" ? (one_exercise.querySelector(".title") as HTMLHeadingElement).textContent : (one_exercise.querySelector(".title_input") as HTMLInputElement).value // Gets Exercise Title
            const periods:number[] = getPeriods(one_exercise) // Stores Periods Value
            const unit:string = one_exercise.dataset.unit ?? "reps" // Gets Exercise Unit Type (Reps Or Seconds)

            // Creates And Fills Data For Object Of One Exercise For Saved Training Plan
            const training_plan_object:{
                previous_training_plan_key:string|null,
                training_plan_key:string,
                action:string,
                day:number|null,
                type:string,
                exercise:string,
                periods:number[],
                unit:string,
                order:number
            } = {
                previous_training_plan_key,
                training_plan_key,
                action,
                day,
                type,
                exercise,
                periods,
                unit,
                order: [...exercises].indexOf(one_exercise) + 1
            }

            training_plan_data.push(training_plan_object) // Fills Training Plan Data Array With Objects Of Exercises
        })

        // console.log(training_plan_data)

        sendPOST("/my-training-plans", training_plan_data) // Sends The Data With POST 

        // Sends The Notification For The User
        if(action === "new_training_plan") sendNotification(`Tréningový plán ${training_plan_title.value} bol úspešne pridaný.`)
        if(action === "edited_training_plan") sendNotification(`Tréningový plán ${training_plan_title.value} bol úspešne upravený.`)

        location.reload() // Reloads The Page
    }
}