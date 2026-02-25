import type { Chart as ChartType } from "chart.js" // Chart JS

const activity:HTMLDivElement = document.querySelector(".activity") as HTMLDivElement // Gets The Activity Container

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
    SPEED: 1000, // 1 Second Interval
    interval: null
}

export const break_interval:{
    SPEED:number,
    interval:number|null,
    max_remaining_time:number,
    remaining_time:number
} = {
    SPEED: 100, // 100MS Interval
    interval: null,
    max_remaining_time: 120, // 2 Minutes
    remaining_time: 120 // 2 Minutes
}

export const xp_boost_interval:{
    SPEED:number,
    interval:number|null,
    _amount:number,
    remaining_time:number,
    amount:number
} = {
    SPEED: 1000, // 1 Second Interval
    interval: null,
    _amount: 2, // Double XP Boost
    remaining_time: 600, // 10 Minutes

    // Getter To Get Current XP Boost Amount
    get amount():number {
        return this._amount
    },

    // Setter To Set Current XP Boost Amount And Render Current Activity Info
    set amount(value:number) {
        this._amount = value
        const current_activity_info = activity.querySelector(".current_activity_info") as HTMLParagraphElement // Gets Current Activity Info
        current_activity_info.textContent = value === 1 ? "Zatiaľ žiadne aktívne navýšenie XP" : `${value}x navýšenie XP` // Shows Current Activity Info
    }
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