import { global_state, break_interval, activity_interval, activity_summary } from "./state.js"

import { 
    generateTrainingPlan,
    changeTrainingPlans,
    startTraining,
    finishTraining,
    nextExercise,
    skipBreak
} from "./functions/trainingPlan.js"

import { 
    startActivity,
    pauseActivity,
    stopActivity
} from "./functions/playback.js"

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
    const start_training_button:HTMLDivElement = training_plan.querySelector(".start_training .start_training_button") as HTMLDivElement // Gets Start Training Button
    const finish_training_button:HTMLDivElement = training_plan.querySelector(".finish_training .finish_training_button") as HTMLDivElement // Gets Start Training Button
    const add_time:HTMLDivElement = training_plan.querySelector(".break .add_time") as HTMLDivElement // Gets Add Time Button
    const add_time_message:HTMLParagraphElement = add_time.querySelector(".add_time_message") as HTMLParagraphElement // Gets Add Time Message
    const skip_break_button:HTMLDivElement = training_plan.querySelector(".break .skip_break_button") as HTMLDivElement // Gets Skip Break Button

    // Gets Ordered Days From Available Training Plans
    const ordered_days:(string|null)[] = [
        ...new Set([...exercises_data].map(function(one_exercise_data:HTMLDivElement):string|null {
            return one_exercise_data.dataset.day ? one_exercise_data.dataset.day : null
        }))
    ]

    // Global Event Delegations

    // Training Plan Container Click Events
    training_plan_container.addEventListener("click", function(event:PointerEvent):void {
        // Training Plan Bars
        if(event.target instanceof Node && (event.target as HTMLDivElement).classList.contains("bar") && (event.target.parentNode as HTMLDivElement).classList.contains("training_plan_bar_container")) {
            if(!event.target.parentNode) return // Catch Errors

            const clicked_bar_index:number = [...event.target.parentNode.querySelectorAll<HTMLDivElement>(".bar")].indexOf(event.target as HTMLDivElement) // Gets Index Of The Clicked Bar
            changeTrainingPlans(activity, clicked_bar_index, ordered_days) // Changes Training Plans
        }

        if((event.target as HTMLDivElement).classList.contains("next_exercise_button") || ((event.target as HTMLDivElement).parentNode as HTMLDivElement).classList.contains("next_exercise_button")) nextExercise(activity) // Next Exercise
    })

    // Training Plan Container Wheel Events
    training_plan_container.addEventListener("wheel", function(event:WheelEvent):void {
        // Change Training Plans With Scroll Wheel Functionality
        if(!(event.target instanceof Node) || (event.target as HTMLDivElement).classList.contains("training_plan_bar_container") || (event.target.parentNode as HTMLDivElement).classList.contains("training_plan_bar_container")) {
            event.preventDefault() // Stop Scrolling

            if(event.deltaY < 0) changeTrainingPlans(activity, global_state.active_training_plan_index + 1, ordered_days) // Changes Training Plans (Shows Next Training Plan)
            if(event.deltaY > 0) changeTrainingPlans(activity, global_state.active_training_plan_index - 1, ordered_days) // Changes Training Plans (Shows Previous Training Plan)
        }
    })

    // Training Plan Container Mouse Over Events
    training_plan_container.addEventListener("mouseover", function(event:MouseEvent):void {
        if(!(event.target instanceof Node) || (event.target as HTMLDivElement).classList.contains("training_plan_bar_container") || (event.target.parentNode as HTMLDivElement).classList.contains("training_plan_bar_container")) global_state.hovered_element = "training_plan_bars" // Sets Hovered Element For Training Plan Bar Container
    })

    // Training Plan Container Mouse Out Events
    training_plan_container.addEventListener("mouseout", ():void => {
        if(global_state.hovered_element) global_state.hovered_element = null // Removes Value Of Hovered Element
    })

    // Key Down Events
    document.addEventListener("keydown", function(event:KeyboardEvent):void {
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
        else if(event.key === "ArrowLeft" && global_state.hovered_element === "training_plan_bars") changeTrainingPlans(activity, global_state.active_training_plan_index - 1, ordered_days) // Changes Training Plans (Shows Previous Training Plan)
        else if(event.key === "ArrowRight" && global_state.hovered_element === "training_plan_bars") changeTrainingPlans(activity, global_state.active_training_plan_index + 1, ordered_days) // Changes Training Plans (Shows Next Training Plan)
    })

    // Events

    // Play Pause
    play_pause.addEventListener("click", function():void {
        if((this.querySelector("i") as HTMLElement).classList.contains("fa-play")) {
            if(activity_summary.elapsed_time === 0) training_plan_container.style.display = "none" // Hides Training Plan
            startActivity(activity, playback) // Starts Activity
        }

        else if((this.querySelector("i") as HTMLElement).classList.contains("fa-pause")) pauseActivity(playback) // Pauses Activity
    })

    // Stop
    stop.addEventListener("click", function():void {
        stopActivity(activity, playback) // Stops Activity
    })

    // Start Training
    start_training_button.addEventListener("click", function():void {
        startTraining(activity)
    })

    finish_training_button.addEventListener("click", function():void {
        finishTraining(activity)
    })

    // Add Time To Break Countdown
    add_time.addEventListener("click", function():void {
        break_interval.remaining_time += 30 // Adds 30 Seconds On Countdown

        // Shows Animated Text
        add_time_message.classList.remove("animate")
        void add_time_message.offsetWidth
        add_time_message.classList.add("animate")
    })

    // Skip Break
    skip_break_button.addEventListener("click", function():void {
        skipBreak(activity)
    })

    // MAIN

    generateTrainingPlan(activity) // Renders User's Training Plan If Has Any
})