import { global_state, activity_summary, xp_boost_interval, activity_interval, break_interval } from "../state.js"
import { getFormattedTime } from "../../../utils/timer.js"
import { resetTrainingPlan } from "./trainingPlan.js"
import { renderActivitySummary, renderTrainingPlanActivitySummary } from "./activitySummary.js"
import type { exercise } from "../state.js"

// Finction For Update Activity Summary
function updateActivitySummary(exercise:HTMLDivElement|null):void {
    // Activity Summary
    activity_summary.elapsed_time += 1 // Increases Elapsed Time
    activity_summary.gained_xp += 100 / 3600 * xp_boost_interval.amount // Increases Gained XP From Activity (1 Hour Of The Activity Gains 100XP Without XP Boost)

    // Training Plan Activity Summary
    if(exercise) {
        const title:string = (exercise.querySelector(".title") as HTMLHeadingElement).textContent // Gets Title Of The Exercise In The Training Plan

        const current_exercise:exercise|null = activity_summary.training_plan.find((one_exercise:exercise):boolean => one_exercise.exercise === title) || null // Returns Object Of Current Active Exercise

        // Updates Data Of Exercise
        if(current_exercise) {
            current_exercise.elapsed_time += 1 // Increases Elapsed Time
            current_exercise.gained_xp += 100 / 3600 * xp_boost_interval.amount // Increases Gained XP From Activity (1 Hour Of The Activity Gains 100XP Without XP Boost)
        }
    }
}

// Function For Update Activity Timer
function updateTimer(timer:HTMLHeadingElement):void {
    (timer.querySelector(".hours") as HTMLSpanElement).textContent = getFormattedTime("hours", activity_summary.elapsed_time, true);
    (timer.querySelector(".minutes") as HTMLSpanElement).textContent = getFormattedTime("minutes", activity_summary.elapsed_time, true);
    (timer.querySelector(".seconds") as HTMLSpanElement).textContent = getFormattedTime("seconds", activity_summary.elapsed_time, true)
}

// Function For Start Activity
export function startActivity(container:HTMLDivElement, playback:HTMLDivElement):void {
    const training_plan:HTMLDivElement = container.querySelector(".training_plan_container .training_plan") as HTMLDivElement // Gets The Training Plan
    const exercises:NodeListOf<HTMLDivElement> = training_plan.querySelectorAll<HTMLDivElement>(".exercise") // Gets All Training Plan Exercises

    const timer:HTMLHeadingElement = playback.querySelector(".timer") as HTMLHeadingElement // Gets The Playback Timer
    const play_pause:HTMLAnchorElement = playback.querySelector(".play") as HTMLAnchorElement // Gets The Play / Pause Button

    (play_pause.querySelector("i") as HTMLElement).classList.replace("fa-play", "fa-pause") // Shows The Pause Icon

    // Starts Activity Timer
    if(!activity_interval.interval) {
        activity_interval.interval = setInterval(function():void {
            (exercises[global_state.active_exercise_index] as HTMLDivElement).classList.contains("active") ? updateActivitySummary(exercises[global_state.active_exercise_index] as HTMLDivElement) : updateActivitySummary(null) // Updates Activity Summary
            updateTimer(timer) // Shows Elapsed Time On The Playback Timer
        }, activity_interval.SPEED)
    }

    // Uses Available XP Boost
    if(xp_boost_interval.amount !== 1) {
        xp_boost_interval.interval = setInterval(function():void {
            xp_boost_interval.remaining_time -= 1 // Decreases Remaining Time

            // Stops XP Boost Timer When Remaining Time Pass
            if(xp_boost_interval.remaining_time === 0) {
                if(xp_boost_interval.interval) {
                    clearInterval(xp_boost_interval.interval)
                    xp_boost_interval.interval = null
                }

                xp_boost_interval.amount = 1 // Resets XP Boost Amount
            }
        }, xp_boost_interval.SPEED)
    }
}

// Function For Pause Activity
export function pauseActivity(playback:HTMLDivElement):void {
    const play_pause:HTMLAnchorElement = playback.querySelector(".play") as HTMLAnchorElement // Gets The Play / Pause Button

    (play_pause.querySelector("i") as HTMLElement).classList.replace("fa-pause", "fa-play") // Shows The Play Icon

    // Stops Activity Timer
    if(activity_interval.interval) {
        clearInterval(activity_interval.interval)
        activity_interval.interval = null
    }
}

// Function For Stop Activity
export function stopActivity(container:HTMLDivElement, playback:HTMLDivElement):void {
    if(activity_summary.elapsed_time > 0) {
        const timer:HTMLHeadingElement = playback.querySelector(".timer") as HTMLHeadingElement // Gets The Playback Timer

        pauseActivity(playback) // Pauses Activity

        // Stops Break Timer
        if(break_interval.interval) {
            clearInterval(break_interval.interval)
            break_interval.interval = null
        }

        const elapsed_time:number = activity_summary.elapsed_time // Gets Activity Elapsed Time
        const gained_xp:number = Math.round(activity_summary.gained_xp) // Gets Gained XP From Activity
        const training_plan_summary:exercise[] = activity_summary.training_plan.map((one_exercise:exercise):exercise => ({ ...one_exercise, gained_xp: Math.round(one_exercise.gained_xp) })).filter((one_exercise:exercise):boolean => one_exercise.gained_xp > 0) // Gets Training Plan Summary With Rounded Gained XP Values (Only Exercises With Gained XP)

        if(gained_xp > 0) {
            renderActivitySummary(elapsed_time, gained_xp) // Renders Activity Summary

            if(training_plan_summary.length > 0) {
                const training_plan_title:string = (container.querySelector(".training_plan_container .training_plan") as HTMLParagraphElement).dataset.title || "" // Gets Training Plan Title
                renderTrainingPlanActivitySummary(training_plan_summary, training_plan_title) // Renders Training Plan Activity Summary
            }
        }

        activity_summary.elapsed_time = 0 // Resets Elapsed Time
        activity_summary.gained_xp = 0 // Resets Gained XP
        activity_summary.training_plan = [] // Resets Training Plan Activity Summary

        updateTimer(timer) // Resets Elapsed Time On The Playback Timer

        resetTrainingPlan(container) // Resets Training Plan
    }
}