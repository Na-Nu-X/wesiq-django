import { edit_training_plan_state } from "../state.js"
import { createBars, renderBars } from "./bars.js"

export function changeExercises(exercise_index, training_plan) {
    const exercises = training_plan.querySelectorAll(".exercise") // Gets All Training Plan Exercises

    exercises[edit_training_plan_state.active_exercise_index].classList.remove("active") // Hides Previous Active Exercise
    edit_training_plan_state.active_exercise_index = exercise_index // Updates Index Of Active Exercise
    exercises[edit_training_plan_state.active_exercise_index].classList.add("active") // Shows New Active Exercise

    // Creates And Renders Bars
    const bar_container = createBars(exercises.length, edit_training_plan_state)
    renderBars(training_plan, bar_container)
}