import { 
    type exercise,
    training_plan_state, 
    activity_interval, 
    break_interval,
    xp_boost_interval, 
    activity_summary
} from "../state.js"

import { 
    renderActivitySummary, 
    renderTrainingPlanActivitySummary, 
    deleteActivitySummary 
} from "./activitySummary.js"

import { getFormattedTime } from "../../../utils/timer.js"
import { resetTrainingPlan } from "./trainingPlan.js"
import { sendPOST } from "../../../services/sendPOST.js"

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
    const training_plan:HTMLDivElement|null = container.querySelector(".training_plan_container .training_plan") as HTMLDivElement || null // Gets The Training Plan
    const exercises:NodeListOf<HTMLDivElement>|null = training_plan ? training_plan.querySelectorAll<HTMLDivElement>(".exercise") : null // Gets All Training Plan Exercises

    const timer:HTMLHeadingElement = playback.querySelector(".timer") as HTMLHeadingElement // Gets The Playback Timer
    const play_pause:HTMLAnchorElement = playback.querySelector(".play") as HTMLAnchorElement // Gets The Play / Pause Button

    const current_activity_info:HTMLParagraphElement|null = training_plan ? training_plan.querySelector(".current_activity_info") as HTMLParagraphElement : null; // Gets Current Activity Info

    (play_pause.querySelector("i") as HTMLElement).classList.replace("fa-play", "fa-pause") // Shows The Pause Icon

    // Starts Activity Timer
    if(!activity_interval.interval) {
        activity_interval.interval = setInterval(function():void {
            // Updates Activity Summary
            if(exercises && (exercises[training_plan_state.active_exercise_index] as HTMLDivElement).classList.contains("active")) updateActivitySummary(exercises[training_plan_state.active_exercise_index] as HTMLDivElement)
            else updateActivitySummary(null)

            updateTimer(timer) // Shows Elapsed Time On The Playback Timer
        }, activity_interval.SPEED)
    }

    // Uses Available XP Boost
    if(xp_boost_interval.amount !== 1) {
        if(!xp_boost_interval.interval) {
            xp_boost_interval.interval = setInterval(function():void {
                xp_boost_interval.remaining_time -= 1 // Decreases Remaining Time

                const xp_boost_progress = 100 - ((xp_boost_interval.remaining_time / xp_boost_interval.max_remaining_time) * 100) // Gets Current Percentage Of Remaining Time Of XP Boost Progress
                if(current_activity_info) current_activity_info.style.setProperty("--progress", `${xp_boost_progress}%`)

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

    deleteActivitySummary() // Deletes Activity Summary
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
        const elapsed_time:number = activity_summary.elapsed_time // Gets Activity Elapsed Time

        if(!container.querySelector(".no_logged_in")) {
            const gained_xp:number = Math.round(activity_summary.gained_xp) // Gets Gained XP From Activity
            const training_plan_summary:exercise[] = activity_summary.training_plan.map((one_exercise:exercise):exercise => ({ ...one_exercise, gained_xp: Math.round(one_exercise.gained_xp) })).filter((one_exercise:exercise):boolean => one_exercise.gained_xp > 0) // Gets Training Plan Summary With Rounded Gained XP Values (Only Exercises With Gained XP)

            const new_activity_data:{
                formatted_elapsed_time:string,
                elapsed_time:number,
                gained_xp:number,
                type:string|null,
                day:number|null
            } = {
                formatted_elapsed_time: `${getFormattedTime("hours", elapsed_time)}h ${getFormattedTime("minutes", elapsed_time, true)}m ${getFormattedTime("seconds", elapsed_time, true)}s`, // Stores Formatted Elapsed Time
                elapsed_time, // Stores Formatted Elapsed Time
                gained_xp, // Stores Gained XP
                type: null, // Stores Training Plan Title
                day: null // Stores Training Plan Day
            }

            // Commits Activity
            if(gained_xp > 0) {
                renderActivitySummary(elapsed_time, gained_xp) // Renders Activity Summary

                if(training_plan_summary.length > 0) {
                    const training_plan_title:string = (container.querySelector(".training_plan_container .training_plan") as HTMLParagraphElement).dataset["title"] || "" // Gets Training Plan Title
                    const training_plan_day:number|null = Number((container.querySelector(".training_plan_container .training_plan") as HTMLParagraphElement).dataset["day"]) || null // Gets Training Plan Day

                    new_activity_data.type = training_plan_title // Stores Training Plan Title
                    new_activity_data.day = training_plan_day // Stores Training Plan Day

                    renderTrainingPlanActivitySummary(training_plan_summary) // Renders Training Plan Activity Summary
                }

                if(!container.querySelector(".no_logged_in")) sendPOST(window.location.pathname, new_activity_data) // Sends POST Data
            }
        }

        else renderActivitySummary(elapsed_time, 0) // Renders Activity Summary (If The User Isn't Logged In)

        pauseActivity(playback) // Pauses Activity

        // Stops Break Timer
        if(break_interval.interval) {
            clearInterval(break_interval.interval)
            break_interval.interval = null
        }

        activity_summary.elapsed_time = 0 // Resets Elapsed Time
        activity_summary.gained_xp = 0 // Resets Gained XP
        activity_summary.training_plan = [] // Resets Training Plan Activity Summary

        updateTimer(timer) // Resets Elapsed Time On The Playback Timer
        if(container.querySelector(".training_plan_container")) resetTrainingPlan(container) // Resets Training Plan
    }
}