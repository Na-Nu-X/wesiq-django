import { getRemainingSecondsFromDate } from "./functions/getRemainingSecondsFromDate.js"

import type { Chart as ChartType } from "chart.js" // Chart JS

const GLOBAL_SPEED:number = 0.01 // 1 Default (Lower = Faster)
const training_plan:HTMLDivElement = document.querySelector(".activity .training_plan_container .training_plan") as HTMLDivElement // Gets The Training Plan
const xp_boost_expiration_time:number = getRemainingSecondsFromDate((training_plan.querySelector(".current_activity_info") as HTMLParagraphElement).dataset["xp_boost_expiration_time"] || "") || 0 // Gets The XP Boost Expiration Time

// GLOBAL STATES

export interface exercise {
    exercise:string,
    elapsed_time:number,
    gained_xp:number,
    color:string
}

export const training_plan_state:{
    active_exercise_index:number,
    active_training_plan_index:number,
    hovered_element:string|null,

    progress_bar:{
        MIN_RED:number,
        red:number
    }
} = {
    active_exercise_index: 0, // 0 By Default
    active_training_plan_index: 0, // 0 By Default
    hovered_element: null, // Gets Current Hovered Element

    progress_bar: {
        MIN_RED: 82, // Final Progress Bar Color rgb(82, 207, 32)
        red: 255 // Starting Progress Bar Color rgb(255, 207, 32)
    }
}

export const activity_interval:{
    SPEED:number,
    interval:number|null
} = {
    SPEED: 1000 * GLOBAL_SPEED, // 1 Second Interval
    interval: null
}

export const warm_up_interval:{
    SPEED:number,
    interval:number|null,
    max_remaining_time:number,
    remaining_time:number
} = {
    SPEED: 100 * GLOBAL_SPEED, // 100MS Interval
    interval: null,
    max_remaining_time: 30, // 30 Seconds By Default
    remaining_time: 30 // 30 Seconds By Default
}

export const break_interval:{
    SPEED:number,
    interval:number|null,
    max_remaining_time:number,
    remaining_time:number
} = {
    SPEED: 100 * GLOBAL_SPEED, // 100MS Interval
    interval: null,
    max_remaining_time: 120, // 2 Minutes
    remaining_time: 120 // 2 Minutes
}

export const xp_boost_interval:{
    SPEED:number,
    interval:number|null,
    amount:number,
    max_remaining_time:number,
    remaining_time:number
} = {
    SPEED: 1000 * GLOBAL_SPEED, // 1 Second Interval
    interval: null,
    amount: 2, // Double XP Boost
    max_remaining_time: 600, // 10 Minutes
    remaining_time: xp_boost_expiration_time,
}

export const activity_summary:{
    elapsed_time:number,
    gained_xp:number,
    training_plan:exercise[]
} = {
    elapsed_time: 0, // Elapsed Time Of Activity
    gained_xp: 0, // Gained XP Of Activity
    training_plan: [] // Training Plan Activity Summary
}

export const charts:{
    bar_chart:ChartType<"bar">|null,
    doughnut_chart:ChartType<"doughnut">|null
} = {
    bar_chart: null, // Sets Bar Chart (Weekly Activity Chart)
    doughnut_chart: null // Sets Bar Chart (Training Plan Summary Chart)
}

export const custom_tasks_state:{
    dragged_task:HTMLDivElement|null
} = {
    dragged_task: null // Stores The Dragged Task
}