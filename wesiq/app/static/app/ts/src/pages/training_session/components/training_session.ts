import { 
    training_plan_state, 
    activity_interval, 
    break_interval, 
    activity_summary, 
    xp_boost_interval
} from "../state.js"

import { 
    generateTrainingPlan,
    changeTrainingPlans,
    startTraining,
    finishTraining,
    nextExercise,
    skipWarmUp,
    skipBreak
} from "../functions/trainingPlan.js"

import { 
    startActivity,
    pauseActivity,
    stopActivity
} from "../functions/playback.js"

import { getRemainingSecondsFromDate } from "../functions/getRemainingSecondsFromDate.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Variables
    
    const activity:HTMLDivElement = document.querySelector(".activity") as HTMLDivElement // Gets The Activity Container
    const playback:HTMLDivElement = activity.querySelector(".record_activity") as HTMLDivElement // Gets The Activity Playback
    const play_pause:HTMLAnchorElement = playback.querySelector(".buttons .play") as HTMLAnchorElement // Gets The Play / Pause Button
    const stop:HTMLAnchorElement = playback.querySelector(".buttons .stop") as HTMLAnchorElement // Gets The Stop Button
    const training_plan_container:HTMLDivElement = activity.querySelector(".training_plan_container") as HTMLDivElement // Gets The Training Plan Container
    const training_plan:HTMLDivElement = training_plan_container.querySelector(".training_plan") as HTMLDivElement // Gets The Training Plan
    const exercises_data:NodeListOf<HTMLDivElement> = training_plan_container.querySelectorAll<HTMLDivElement>(".one_exercise_data") // Gets Data From Every User's Exercise
    const start_training_button:HTMLButtonElement = training_plan.querySelector(".start_training .start_training_button") as HTMLButtonElement // Gets Start Training Button
    const finish_training_button:HTMLDivElement = training_plan.querySelector(".finish_training .finish_training_button") as HTMLDivElement // Gets Start Training Button
    const add_time:HTMLButtonElement = training_plan.querySelector(".break .add_time") as HTMLButtonElement // Gets Add Time Button
    const add_time_message:HTMLParagraphElement = add_time.querySelector(".add_time_message") as HTMLParagraphElement // Gets Add Time Message
    const skip_break_button:HTMLButtonElement = training_plan.querySelector(".break .skip_break_button") as HTMLButtonElement // Gets Skip Break Button

    const current_activity_info:HTMLParagraphElement = training_plan.querySelector(".current_activity_info") as HTMLParagraphElement // Gets Current Activity Info

    // Gets Ordered Days From Available Training Plans
    const ordered_days:(string|null)[] = [
        ...new Set([...exercises_data].map(function(one_exercise_data:HTMLDivElement):string|null {
            return one_exercise_data.dataset["day"] ? one_exercise_data.dataset["day"] : null
        }))
    ]

    // Global Event Delegations

    // Training Plan Container Click Functionalities
    training_plan_container.addEventListener("click", function(event:PointerEvent):void {
        // Training Plan Bars
        if(event.target instanceof Node && (event.target as HTMLDivElement).classList.contains("bar") && (event.target.parentNode as HTMLDivElement).classList.contains("training_plan_bar_container")) {
            if(!event.target.parentNode) return // Catch Errors

            const clicked_bar_index:number = [...event.target.parentNode.querySelectorAll<HTMLDivElement>(".bar")].indexOf(event.target as HTMLDivElement) // Gets Index Of The Clicked Bar
            changeTrainingPlans(activity, clicked_bar_index, ordered_days) // Changes Training Plans
        }

        // Next Exercise
        if((event.target as HTMLButtonElement).classList.contains("next_exercise_button") || ((event.target as HTMLElement).parentNode as HTMLButtonElement).classList.contains("next_exercise_button")) nextExercise(activity)

        // Skip Warm Up
        if((event.target as HTMLDivElement).classList.contains("skip_warm_up_button") || ((event.target as HTMLDivElement).parentNode as HTMLDivElement).classList.contains("skip_warm_up_button")) skipWarmUp(activity)
    })

    // Training Plan Container Keydown Functionalities
    training_plan_container.addEventListener("keydown", function(event:KeyboardEvent):void {
        // Training Plan Bars
        if(event.key === "Enter" && event.target instanceof Node && (event.target as HTMLDivElement).classList.contains("bar") && (event.target.parentNode as HTMLDivElement).classList.contains("training_plan_bar_container")) {
            if(!event.target.parentNode) return // Catch Errors

            const clicked_bar_index:number = [...event.target.parentNode.querySelectorAll<HTMLDivElement>(".bar")].indexOf(event.target as HTMLDivElement) // Gets Index Of The Clicked Bar
            changeTrainingPlans(activity, clicked_bar_index, ordered_days) // Changes Training Plans
        }
    })

    // Training Plan Container Wheel Functionalities
    training_plan_container.addEventListener("wheel", function(event:WheelEvent):void {
        // Change Training Plans With Scroll Wheel Functionality
        if(!(event.target instanceof Node) || (event.target as HTMLDivElement).classList.contains("training_plan_bar_container") || (event.target.parentNode as HTMLDivElement).classList.contains("training_plan_bar_container")) {
            event.preventDefault() // Stop Scrolling

            if(event.deltaY < 0) changeTrainingPlans(activity, training_plan_state.active_training_plan_index + 1, ordered_days) // Changes Training Plans (Shows Next Training Plan)
            if(event.deltaY > 0) changeTrainingPlans(activity, training_plan_state.active_training_plan_index - 1, ordered_days) // Changes Training Plans (Shows Previous Training Plan)
        }
    })

    // Training Plan Container Mouse Over Functionality
    training_plan_container.addEventListener("mouseover", function(event:MouseEvent):void {
        if(!(event.target instanceof Node) || (event.target as HTMLDivElement).classList.contains("training_plan_bar_container") || (event.target.parentNode as HTMLDivElement).classList.contains("training_plan_bar_container")) training_plan_state.hovered_element = "training_plan_bars" // Sets Hovered Element For Training Plan Bar Container
    })

    // Training Plan Container Mouse Out Functionality
    training_plan_container.addEventListener("mouseout", function():void {
        if(training_plan_state.hovered_element) training_plan_state.hovered_element = null // Removes Value Of Hovered Element
    })

    // Document Key Down Functionalities
    document.addEventListener("keydown", function(event:KeyboardEvent):void {
        const target = event.target as HTMLElement // Gets The Target Element

        if (
            target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable
        ) {
            return
        }

        // Playback
        if(event.code === "Space") {
            event.preventDefault() // Stop Scrolling

            if(activity_interval.interval) pauseActivity(playback) // Pauses Activity
            
            else {
                if(activity_summary.elapsed_time === 0) training_plan_container.style.display = "none" // Hides Training Plan
                startActivity(activity, playback) // Starts Activity
            }
        }

        else if(event.key === "Escape") stopActivity(activity, playback) // Stops Activity
        
        // Changes Training Plans
        else if(event.key === "ArrowLeft" && training_plan_state.hovered_element === "training_plan_bars") changeTrainingPlans(activity, training_plan_state.active_training_plan_index - 1, ordered_days) // Changes Training Plans (Shows Previous Training Plan)
        else if(event.key === "ArrowRight" && training_plan_state.hovered_element === "training_plan_bars") changeTrainingPlans(activity, training_plan_state.active_training_plan_index + 1, ordered_days) // Changes Training Plans (Shows Next Training Plan)
    })

    // Events

    // Play Pause Click Functionalities
    play_pause.addEventListener("click", function():void {
        if((this.querySelector("i") as HTMLElement).classList.contains("fa-play")) {
            if(activity_summary.elapsed_time === 0) training_plan_container.style.display = "none" // Hides Training Plan
            startActivity(activity, playback) // Starts Activity
        }

        else if((this.querySelector("i") as HTMLElement).classList.contains("fa-pause")) pauseActivity(playback) // Pauses Activity
    })

    stop.addEventListener("click", () => stopActivity(activity, playback)) // Stops The Activity
    start_training_button.addEventListener("click", () => startTraining(activity)) // Starts The Training
    finish_training_button.addEventListener("click", () => finishTraining(activity)) // Finishes The Training

    // Add Time Click Functionality
    add_time.addEventListener("click", function():void {
        break_interval.remaining_time += 30 // Adds 30 Seconds On Countdown

        if(break_interval.remaining_time >= 600) break_interval.remaining_time = 600 // Sets Maximum For Break Countdown Remaining Time To 10 Minutes

        else {
            // Shows Animated Text
            add_time_message.classList.remove("animate")
            void add_time_message.offsetWidth
            add_time_message.classList.add("animate")
        }
    })

    skip_break_button.addEventListener("click", () => skipBreak(activity)) // Skips The Break

    // Initialization

    generateTrainingPlan(activity) // Renders User's Training Plan If Has Any

    // Initializes The Update Of The XP Boost Progress If Its Remaining Time Hasn't Already Passed
    if(xp_boost_interval.remaining_time > 0) {
        xp_boost_interval.interval = setInterval(function():void {
            const xp_boost_expiration_time:number = getRemainingSecondsFromDate(current_activity_info.dataset["xp_boost_expiration_time"] || "") || 0 // Gets The XP Boost Expiration Time

            xp_boost_interval.remaining_time = xp_boost_expiration_time // Updates The Remaining Time

            const xp_boost_progress = 100 - ((xp_boost_interval.remaining_time / xp_boost_interval.max_remaining_time) * 100) // Gets Current Percentage Of Remaining Time Of XP Boost Progress
            current_activity_info.style.setProperty("--progress", `${xp_boost_progress}%`)
            current_activity_info.innerHTML = `<i class="fa-solid fa-bolt"></i> ${xp_boost_interval.amount}x` // https://fontawesome.com/icons/bolt

            // Stops XP Boost Timer When Remaining Time Pass
            if(xp_boost_interval.remaining_time === 0) {
                if(xp_boost_interval.interval) {
                    clearInterval(xp_boost_interval.interval)
                    xp_boost_interval.interval = null
                }

                xp_boost_interval.amount = 1 // Resets XP Boost Amount
                current_activity_info.innerHTML = gettext("<span>Žiadne aktívne navýšenie XP</span>")
            }
        }, xp_boost_interval.SPEED)
    }
})