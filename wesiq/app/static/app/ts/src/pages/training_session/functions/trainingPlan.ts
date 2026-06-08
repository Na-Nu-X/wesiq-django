import { 
    type exercise,
    training_plan_state,
    warm_up_interval, 
    break_interval,
    xp_boost_interval,
    activity_summary
} from "../state.js"

import { 
    startActivity, 
    stopActivity 
} from "../functions/playback.js"

import { 
    createTrainingPlanBars,
    renderTrainingPlanBars,
    createBars,
    renderBars
} from "../../../components/trainingPlanFunctions.js"

import { 
    getFormattedTime, 
    getMinimalistFormattedTime,
    getElapsedSeconds
} from "../../../utils/timer.js"

import { getDayName } from "../../../utils/getDayName.js"
import { randomColor } from "../../../utils/randomColor.js"

// Function For Create Bar Labels
function createBarLabels(bars:NodeListOf<HTMLDivElement>, exercises:NodeListOf<HTMLDivElement>):void {
    bars.forEach(function(one_bar:HTMLDivElement, index:number):void {
        one_bar.dataset["exercise"] = ((exercises[index] as HTMLDivElement).querySelector(".title") as HTMLHeadingElement).textContent // Sets Exercise Title To Bar Data
        one_bar.classList.add("show") // Shows The Label
    })
}

// Function For Update Training Plan Progress
function updateProgress(container:HTMLDivElement):void {
    const exercises:NodeListOf<HTMLDivElement> = container.querySelectorAll<HTMLDivElement>(".training_plan_container .exercise") // Gets Exercises From All Training Plans
    const bars:NodeListOf<HTMLDivElement> = container.querySelectorAll<HTMLDivElement>(".training_plan_container .bar_container .bar") // Gets All Bars
    const set_progress:NodeListOf<HTMLSpanElement> = (exercises[training_plan_state.active_exercise_index] as HTMLDivElement).querySelectorAll<HTMLSpanElement>(".sets span") // Gets Set Progress Of The Active Exercise

    let current_set:number = set_progress.length > 0 ? parseInt((set_progress[0] as HTMLSpanElement).textContent) : 1 // Gets Current Set Value
    const sets_amount:number = set_progress.length > 0 ? parseInt((set_progress[1] as HTMLSpanElement).textContent) : 1 // Gets Total Amount Of Sets Of The Active Exercise
    let progress_percentage:number = current_set / sets_amount * 100; // Calculates Set Progress Percentage

    (bars[training_plan_state.active_exercise_index] as HTMLDivElement).classList.add("active"); // Shows Progress Bar
    (bars[training_plan_state.active_exercise_index] as HTMLDivElement).style.setProperty("--progress", `${progress_percentage}%`); // Sets Progress
    (bars[training_plan_state.active_exercise_index] as HTMLDivElement).classList.remove("show") // Hides Bar Label Of The Active Exercise

    if(Math.ceil(training_plan_state.progress_bar.red) >= training_plan_state.progress_bar.MIN_RED) bars.forEach((one_bar:HTMLDivElement):void => one_bar.style.setProperty("--progress-color", `rgb(${training_plan_state.progress_bar.red}, 207, 32)`)) // Changes Progress Bar Color In Every Bar

    const all_sets = [...exercises].reduce((sum:number, one_exercise:HTMLDivElement) => sum + (one_exercise.classList.contains("warm_up") ? 1 : parseInt((one_exercise.querySelector(".sets .total") as HTMLSpanElement).textContent)), 0)
    all_sets ? training_plan_state.progress_bar.red -= (255 - training_plan_state.progress_bar.MIN_RED) / (all_sets - 1) : training_plan_state.progress_bar.red-= 0 // Makes Color Transition For Progress Bar From rgb(255, 207, 32) To rgb(82, 207, 32)
}

// Function For Warm Up
function warmUp(container:HTMLDivElement):void {
    const warm_up:HTMLDivElement = container.querySelector(".training_plan_container .training_plan .warm_up") as HTMLDivElement // Gets Warm Up
    const warm_up_countdown:HTMLHeadingElement = warm_up.querySelector(".warm_up_timer .countdown") as HTMLHeadingElement // Gets The Warm Up Countdown
    
    warm_up_interval.max_remaining_time = getElapsedSeconds(warm_up_countdown.textContent) // Sets Warm Up Remaining Time
    warm_up_interval.remaining_time = getElapsedSeconds(warm_up_countdown.textContent) // Sets Warm Up Remaining Time

    const progress_circle:HTMLElement = warm_up.querySelector(".warm_up_timer svg .progress") as HTMLElement // Gets The Progress Circle
    const radius:number = Number(progress_circle.getAttribute("r")) // Gets The Radius Of The Progress Circle
    const circum_ference:number = 2 * Math.PI * radius // Gets The Circum Ference Of The Progress Circle (For Example: 251.32741228718345)
    progress_circle.style.strokeDasharray = String(circum_ference) // Sets Progress Circle Circum Ference

    warm_up_interval.interval = setInterval(function():void {
        if(warm_up_interval.remaining_time <= 0) skipWarmUp(container) // If The Countdown Has Passed

        else {
            if(Math.round(warm_up_interval.remaining_time) <= 10) warm_up_countdown.style.color = "#df3535" // Changes Timer Color To Red If Remaining Time Is Less Than 10 Seconds

            warm_up_countdown.textContent = `${getFormattedTime("minutes", Math.round(warm_up_interval.remaining_time))}:${getFormattedTime("seconds", Math.round(warm_up_interval.remaining_time), true)}` // Shows Remaining Time

            progress_circle.style.strokeDashoffset = String(circum_ference / warm_up_interval.max_remaining_time * warm_up_interval.remaining_time) // Updates Progress Circle Length

            const red:number = 255 - (255 / warm_up_interval.max_remaining_time * warm_up_interval.remaining_time) // Increases Red Color In Palette
            const green:number = 255 / warm_up_interval.max_remaining_time * warm_up_interval.remaining_time // Decreases Green Color In Palette

            progress_circle.style.stroke = `rgb(${red}, ${green}, 0)` // Updates Progress Circle Color
            progress_circle.style.filter = `drop-shadow(0px 0px 5px rgb(${red}, ${green}, 0))` // Updates Progress Circle Shadow Color
            progress_circle.style.webkitFilter = `drop-shadow(0px 0px 5px rgb(${red}, ${green}, 0))` // Updates Progress Circle Shadow Color

            warm_up_interval.remaining_time -= 0.1 // Decreases Remaining Time
        }
    }, warm_up_interval.SPEED)
}

// Function For Exercises Break
function exercisesBreak(container:HTMLDivElement):void {
    const exercises_break:HTMLDivElement = container.querySelector(".training_plan_container .training_plan .break") as HTMLDivElement // Gets The Break Slide
    const break_countdown:HTMLParagraphElement = exercises_break.querySelector(".break_timer p") as HTMLParagraphElement // Gets The Break Countdown

    const progress_circle:HTMLElement = exercises_break.querySelector("svg .progress") as HTMLElement // Gets The Progress Circle
    const radius:number = Number(progress_circle.getAttribute("r")) // Gets The Radius Of The Progress Circle
    const circum_ference:number = 2 * Math.PI * radius // Gets The Circum Ference Of The Progress Circle (For Example: 251.32741228718345)
    progress_circle.style.strokeDasharray = String(circum_ference) // Sets Progress Circle Circum Ference

    break_interval.interval = setInterval(function():void {
        if(break_interval.remaining_time <= 0) skipBreak(container) // If The Countdown Has Passed

        else {
            if(Math.round(break_interval.remaining_time) <= 10) break_countdown.style.color = "#df3535"; // Changes Timer Color To Red If Remaining Time Is Less Than 10 Seconds

            (break_countdown.querySelector(".minutes") as HTMLSpanElement).textContent = getFormattedTime("minutes", Math.round(break_interval.remaining_time)); // Shows Remaining Minutes
            (break_countdown.querySelector(".seconds") as HTMLSpanElement).textContent = getFormattedTime("seconds", Math.round(break_interval.remaining_time), true) // Shows Remaining Seconds

            progress_circle.style.strokeDashoffset = String(circum_ference / break_interval.max_remaining_time * break_interval.remaining_time) // Updates Progress Circle Length

            const red:number = 255 - (255 / break_interval.max_remaining_time * break_interval.remaining_time) // Increases Red Color In Palette
            const green:number = 255 / break_interval.max_remaining_time * break_interval.remaining_time // Decreases Green Color In Palette

            progress_circle.style.stroke = `rgb(${red}, ${green}, 0)` // Updates Progress Circle Color
            progress_circle.style.filter = `drop-shadow(0px 0px 5px rgb(${red}, ${green}, 0))` // Updates Progress Circle Shadow Color
            progress_circle.style.webkitFilter = `drop-shadow(0px 0px 5px rgb(${red}, ${green}, 0))` // Updates Progress Circle Shadow Color

            break_interval.remaining_time -= 0.1 // Decreases Remaining Time

            // Changes Preferences After Adding Time
            if(break_interval.remaining_time > break_interval.max_remaining_time) {
                progress_circle.style.strokeDashoffset = String(circum_ference) // Updates Progress Circle Length
                break_interval.max_remaining_time = break_interval.remaining_time // Changes Maximum Value Of Break Timer Remaining Time
            }
        }
    }, break_interval.SPEED)
}

// Function For Generate Current Reps, Hold Time, Or Steps Amount
function generateReps(periods:number[], current_set:number, unit:string, parent:DocumentFragment|HTMLDivElement):void {
    if(periods[current_set - 1] === 0) (parent.querySelector(".reps") as HTMLParagraphElement).textContent = "Do zlyhania" // Sets To Failure Text

    else {
        if(unit === "reps") (parent.querySelector(".reps") as HTMLParagraphElement).textContent = `${periods[current_set - 1]}x`; // Sets Exercise Reps Unit
        if(unit === "seconds") (parent.querySelector(".reps") as HTMLParagraphElement).textContent = `${getMinimalistFormattedTime(periods[current_set - 1] || 0)}`; // Sets Exercise Time Unit
        if(unit === "steps") (parent.querySelector(".reps") as HTMLParagraphElement).textContent = `${periods[current_set - 1]}`; // Sets Exercise Steps Unit
    }
}

// Function For Create Objects Of Exercises Of Started Training Plan In Training Plan Activity Summary
function createExerciseObjects(exercises:NodeListOf<HTMLDivElement>):void {
    exercises.forEach(function(one_exercise:HTMLDivElement):void {
        const exercise_object:exercise = {
            exercise: (one_exercise.querySelector(".title") as HTMLHeadingElement).textContent, // Sets Title Of The Exercise In The Training Plan
            elapsed_time: 0, // Sets Elapsed Time To 0
            gained_xp: 0, // Sets Gained XP To 0
            color: randomColor(128, 255) // Generates Random Color
        }

        activity_summary.training_plan.push(exercise_object)
    })
}

// Function For Reset Progress Bar Of Training Plan
function resetProgressBars(bars:HTMLDivElement[], index:number):void {
    let red:number = Number((bars[index] as HTMLDivElement).style.getPropertyValue("--progress-color").match(/\d+/)?.[0]) // Gets Current Red Color From Bar
    const red_increasion:number = (255 - red) / bars.length // Gets Number Of Red Increasion
    red += red_increasion; // Increases Red Color Of Progress Color

    // First Bar Reset
    (bars[index] as HTMLDivElement).style.setProperty("--progress", "0%"); // Resets Progress
    bars.forEach((one_bar:HTMLDivElement) => one_bar.style.setProperty("--progress-color", `rgb(${red}, 207, 32)`)) // Updates Progress Color

    red += red_increasion // Increases Red Color Of Progress Color
    index -= 1 // Decreases Last Active Bar Index
    
    // Other Bars Reset
    let bar_cleaner:number|null = setInterval(function():void {
        // Stops Bar Cleaner
        if(index < -1) {
            if(bar_cleaner) {
                clearInterval(bar_cleaner)
                bar_cleaner = null
            }
        }

        const previous_bar:HTMLDivElement = bars[index + 1] as HTMLDivElement // Gets The Previous Bar

        if(index >= 0) (bars[index + 1] as HTMLDivElement).classList.remove("active") // Removes Active Class From Bar
        if(previous_bar) previous_bar.classList.add("show") // Removes Show Class From Bar
        if(bars[index]) {
            (bars[index] as HTMLDivElement).style.setProperty("--progress", "0%"); // Resets Progress
            bars.forEach((one_bar:HTMLDivElement) => one_bar.style.setProperty("--progress-color", `rgb(${red}, 207, 32)`)) // Updates Progress Color
        }

        red += red_increasion // Increases Red Color Of Progress Color
        index -= 1 // Decreases Last Active Bar Index
    }, 500)
}

// Function For Reset Training Plan
export function resetTrainingPlan(container:HTMLDivElement):void {
    const training_plan_container:HTMLDivElement = container.querySelector(".training_plan_container") as HTMLDivElement // Gets The Training Plan Container
    const training_plan:HTMLDivElement = training_plan_container.querySelector(".training_plan") as HTMLDivElement // Gets The Training Plan
    const start_training:HTMLDivElement = training_plan.querySelector(".start_training") as HTMLDivElement // Gets The Start Training Slide
    const exercises:NodeListOf<HTMLDivElement> = training_plan.querySelectorAll<HTMLDivElement>(".exercise"); // Gets All Training Plan Exercises
    const exercises_break:HTMLDivElement = training_plan.querySelector(".break") as HTMLDivElement // Gets The Break Slide
    const finish_training:HTMLDivElement = training_plan.querySelector(".finish_training") as HTMLDivElement // Gets The Start Training Slide
    const bars:NodeListOf<HTMLDivElement> = training_plan.querySelectorAll<HTMLDivElement>(".training_plan_container .bar_container .bar") // Gets All Bars

    training_plan_container.style.display = "block" // Shows Training Plan

    container.querySelectorAll<HTMLDivElement>(".training_plan_bar_container").forEach((one_bar_container:HTMLDivElement) => one_bar_container.style.display = "flex"); // Shows Training Plan Bar Container

    (exercises[training_plan_state.active_exercise_index] as HTMLDivElement).classList.remove("active"); // Hides Active Exercise
    (exercises[training_plan_state.active_exercise_index] as HTMLDivElement).inert = true // Disables Focus

    exercises_break.classList.remove("active") // Hides Exercises Break Slide
    exercises_break.inert = true // Disables Focus

    finish_training.classList.remove("active") // Hides Finish Training Slide
    finish_training.inert = true // Disables Focus

    start_training.classList.add("active") // Shows Start Training Slide
    start_training.inert = false // Enables Focus

    // Resets Current Set On Exercises
    exercises.forEach(function(one_exercise:HTMLDivElement) {
        if(!one_exercise.classList.contains("warm_up")) (one_exercise.querySelector(".sets .current") as HTMLSpanElement).textContent = "1" // Skips Warm Up
    })

    // Progress Bar
    const active_bars:HTMLDivElement[] = Array.from(bars).filter((one_bar:HTMLDivElement):boolean => one_bar.classList.contains("active")); // Gets Active Bars
    let last_active_bar_index:number = active_bars.length - 1; // Gets Last Active Bar Index

    resetProgressBars(active_bars, last_active_bar_index) // Resets Progress Bar

    training_plan_state.progress_bar.red = 255 // Resets Progress Bar Color

    training_plan_state.active_exercise_index = 0 // Resets Active Exercise Index
}

// Function For Render Exercises Of The Selected Training Plan
export function generateTrainingPlan(container:HTMLDivElement):void {
    const training_plan_container:HTMLDivElement = container.querySelector(".training_plan_container") as HTMLDivElement // Gets The Training Plan Container
    const exercise_template:HTMLTemplateElement = container.querySelector(".exercise_template") as HTMLTemplateElement // Gets Exercise Template
    const warm_up_template:HTMLTemplateElement = container.querySelector(".warm_up_template") as HTMLTemplateElement // Gets Warm Up Template
    const data:NodeListOf<HTMLDivElement> = training_plan_container.querySelectorAll<HTMLDivElement>(".one_exercise_data") // Gets Data From Every User's Exercise
    const training_plan:HTMLDivElement = training_plan_container.querySelector(".training_plan") as HTMLDivElement // Gets The Training Plan
    const start_training:HTMLDivElement = training_plan.querySelector(".start_training") as HTMLDivElement // Gets The Start Training Slide
    const finish_training:HTMLDivElement = training_plan.querySelector(".finish_training") as HTMLDivElement // Gets The Start Training Slide

    xp_boost_interval.amount = xp_boost_interval.amount // Shows Current Activity Info

    // Gets Ordered Days From Available Training Plans
    const days:(string|null)[] = [
        ...new Set([...data].map(function(one_exercise_data:HTMLDivElement):string|null {
            return one_exercise_data.dataset["day"] ? one_exercise_data.dataset["day"] : null
        }))
    ]

    container.querySelectorAll<HTMLDivElement>(".exercise").forEach((one_exercise:HTMLDivElement):void => one_exercise.remove()) // Removes Exercises
    container.querySelectorAll<HTMLDivElement>(".training_plan_bar_container").forEach((one_bar_container:HTMLDivElement):void => one_bar_container.remove()) // Removes Training Plan Bar Container

    // Creates And Renders Training Plan Bars (Only If There Are More Than One Training Plan Available)
    if(days.length > 1) {
        const training_plan_bar_container:HTMLDivElement = createTrainingPlanBars(days.length, training_plan_state)
        renderTrainingPlanBars(training_plan_container, training_plan_bar_container)
    }

    const selected_day:string|null = days[training_plan_state.active_training_plan_index] || null // Selects Current Or Upcoming Day Of Training Plan
    const ordered_exercises:HTMLDivElement[] = [...data].sort((a:HTMLDivElement, b:HTMLDivElement) => Number(a.dataset["order"]) - Number(b.dataset["order"])) // Orders Exercises From All Training Plans By Their Order Value

    // Extracts Data For Every Exercise
    ordered_exercises.forEach(function(one_exercise:HTMLDivElement):void {
        // const training_plan_key:string = one_exercise.dataset["training_plan_key"] as string // Gets Training Plan Key
        const day_data:string|null = one_exercise.dataset["day"] || null // Gets Training Day Of The Exercise If Has Any
        const training_plan_title_data:string = one_exercise.dataset["type"] as string // Gets Training Title Of The Exercise
        const exercise_title_data:string = one_exercise.dataset["exercise"] as string // Gets Exercise Name
        const periods_data:number[] = JSON.parse(one_exercise.dataset["periods"] || "[0]") // Gets Exercise Sets & Reps Periods
        const unit_data:string = one_exercise.dataset["unit"] || "reps" // Gets Exercise Unit Type (Reps, Seconds Or Steps)

        // Shows Exercises Which Have Assigned Day
        if(day_data !== null) {
            // Shows Training Plan Exercises Of Selected Day
            if(selected_day === day_data) {
                training_plan.dataset["title"] = training_plan_title_data; // Stores Training Plan Title Data
                training_plan.dataset["day"] = day_data; // Stores Training Plan Day Data

                (start_training.querySelector(".title") as HTMLParagraphElement).textContent = `${training_plan_title_data} - ${getDayName(Number(day_data))}`; // Sets Training Plan Title On The Start Training Slide
                (finish_training.querySelector(".title") as HTMLParagraphElement).textContent = `${training_plan_title_data} - ${getDayName(Number(day_data))}` // Sets Training Plan Title On The Finish Training Slide

                // Creates Warm Up
                if(exercise_title_data === "Warm Up") {
                    const warm_up_template_clone:DocumentFragment = warm_up_template.content.cloneNode(true) as DocumentFragment // Clones The Warm Up Template Content

                    (warm_up_template_clone.querySelector(".warm_up_timer .countdown") as HTMLHeadingElement).textContent = `${getFormattedTime("minutes", periods_data[0])}:${getFormattedTime("seconds", periods_data[0], true)}`; // Stores Timer Of Warm Up

                    training_plan.prepend(warm_up_template_clone) // Appends Exercise To The Training Plan
                }

                // Creates Exercise
                else {
                    const exercise_template_clone:DocumentFragment = exercise_template.content.cloneNode(true) as DocumentFragment // Clones The Exercise Template Content
                    
                    (exercise_template_clone.querySelector(".title") as HTMLHeadingElement).textContent = exercise_title_data; // Sets Exercise Title

                    (exercise_template_clone.querySelector(".reps") as HTMLParagraphElement).dataset["periods_data"] = JSON.stringify(periods_data); // Stores Periods Data
                    (exercise_template_clone.querySelector(".reps") as HTMLParagraphElement).dataset["unit_data"] = unit_data; // Stores Unit Data

                    (exercise_template_clone.querySelector(".sets .total") as HTMLSpanElement).textContent = String(periods_data.length); // Sets Exercise Total Sets

                    training_plan.appendChild(exercise_template_clone) // Appends The Exercise To The Training Plan
                }
            }
        }
    })

    const exercises:NodeListOf<HTMLDivElement> = training_plan.querySelectorAll<HTMLDivElement>(".exercise") // Gets All Training Plan Exercises

    // Creates And Renders Bars
    const bar_container:HTMLDivElement = createBars(exercises.length, training_plan_state)
    renderBars(training_plan, bar_container)

    createBarLabels(bar_container.querySelectorAll<HTMLDivElement>(".bar"), exercises) // Creates Bar Labels

    const current_activity_info = training_plan.querySelector(".current_activity_info") as HTMLParagraphElement // Gets Current Activity Info
    training_plan.appendChild(current_activity_info) // Appends Current Activity Info At The End Of The Training Plan
}

// Function For Change Training Plans
export function changeTrainingPlans(container:HTMLDivElement, index:number, days:(string|null)[]):void {
    const training_plan:HTMLDivElement = container.querySelector(".training_plan_container .training_plan") as HTMLDivElement // Gets The Training Plan

    // Shows Blur Animation Between Change Of Training Plans
    training_plan.classList.remove("blur")
    void training_plan.offsetWidth
    training_plan.classList.add("blur")

    if(index < 0) training_plan_state.active_training_plan_index = days.length - 1 // Shows The Last Training Plan
    else if(index > days.length - 1) training_plan_state.active_training_plan_index = 0 // Shows The First Training Plan
    else training_plan_state.active_training_plan_index = index // Changes Active Training Plan Index

    generateTrainingPlan(container)
}

// Function For Start Training Plan
export function startTraining(container:HTMLDivElement):void {
    const playback:HTMLDivElement = container.querySelector(".record_activity") as HTMLDivElement // Gets The Activity Playback
    const training_plan:HTMLDivElement = container.querySelector(".training_plan_container .training_plan") as HTMLDivElement // Gets The Training Plan
    const start_training:HTMLDivElement = training_plan.querySelector(".start_training") as HTMLDivElement // Gets The Start Training Slide
    const exercises:NodeListOf<HTMLDivElement> = container.querySelectorAll<HTMLDivElement>(".training_plan .exercise") // Gets All Training Plan Exercises

    // First Exercise Is Ordinary
    if(!(exercises[training_plan_state.active_exercise_index] as HTMLDivElement).classList.contains("warm_up")) {
        const periods_data:number[] = JSON.parse(((exercises[training_plan_state.active_exercise_index] as HTMLDivElement).querySelector(".reps") as HTMLParagraphElement).dataset["periods_data"] || "[0]") // Gets Exercise Sets & Reps Periods
        const unit_data:string = ((exercises[training_plan_state.active_exercise_index] as HTMLDivElement).querySelector(".reps") as HTMLParagraphElement).dataset["unit_data"] || "reps" // Gets Exercise Unit Type (Reps, Seconds Or Steps)

        container.querySelectorAll<HTMLDivElement>(".training_plan_bar_container").forEach((one_bar_container:HTMLDivElement) => one_bar_container.style.display = "none") // Hides Training Plan Bar Container

        start_training.classList.remove("active") // Hides The Start Training Slide
        start_training.inert = true; // Disables Focus

        (exercises[training_plan_state.active_exercise_index] as HTMLDivElement).classList.add("active"); // Shows The Active Exercise
        (exercises[training_plan_state.active_exercise_index] as HTMLDivElement).inert = false // Enables Focus

        generateReps(periods_data, 1, unit_data, exercises[training_plan_state.active_exercise_index] as HTMLDivElement); // Sets Exercise Current Reps, Hold Time, Or Steps Amount For The First Set Of The First Exercise
        updateProgress(container.querySelector(".training_plan") as HTMLDivElement) // Updates Progress Bar
        startActivity(container, playback) // Starts Activity
        createExerciseObjects(exercises) // Creates Objects Of Exercises In Training Plan Activity Summary
    }

    // First Exercise Is Warm Up
    else {
        container.querySelectorAll<HTMLDivElement>(".training_plan_bar_container").forEach((one_bar_container:HTMLDivElement) => one_bar_container.style.display = "none") // Hides Training Plan Bar Container

        start_training.classList.remove("active"); // Hides The Start Training Slide
        start_training.inert = true; // Disables Focus

        (exercises[training_plan_state.active_exercise_index] as HTMLDivElement).classList.add("active"); // Shows The Active Exercise
        (exercises[training_plan_state.active_exercise_index] as HTMLDivElement).inert = false // Enables Focus

        warmUp(container) // Starts Warm Up
        updateProgress(container.querySelector(".training_plan") as HTMLDivElement) // Updates Progress Bar
        startActivity(container, playback) // Starts Activity
        createExerciseObjects(exercises) // Creates Objects Of Exercises In Training Plan Activity Summary
    }
}

// Function For Finish Training Plan
export function finishTraining(container:HTMLDivElement):void {
    const playback:HTMLDivElement = container.querySelector(".record_activity") as HTMLDivElement // Gets The Activity Playback

    stopActivity(container, playback) // Stops Activity
}

// Function For Change Exercises Or Their Set Progress In The Training Plan
export function nextExercise(container:HTMLDivElement):void {
    console.log(container)
    const playback:HTMLDivElement = container.querySelector(".record_activity") as HTMLDivElement // Gets The Activity Playback
    const training_plan:HTMLDivElement = container.querySelector(".training_plan_container .training_plan") as HTMLDivElement // Gets The Training Plan
    const exercises:NodeListOf<HTMLDivElement> = training_plan.querySelectorAll<HTMLDivElement>(".exercise"); // Gets All Training Plan Exercises
    const exercises_break:HTMLDivElement = training_plan.querySelector(".break") as HTMLDivElement // Gets The Break Slide
    const finish_training:HTMLDivElement = training_plan.querySelector(".finish_training") as HTMLDivElement // Gets The Start Training Slide

    const set_progress:NodeListOf<HTMLSpanElement> = (exercises[training_plan_state.active_exercise_index] as HTMLDivElement).querySelectorAll<HTMLSpanElement>(".sets span") // Gets Set Progress Of The Active Exercise
    let current_set:number = set_progress.length > 0 ? parseInt((set_progress[0] as HTMLSpanElement).textContent) : 1 // Gets Current Set Value
    const sets_amount:number = set_progress.length > 0 ? parseInt((set_progress[1] as HTMLSpanElement).textContent) : 1 // Gets Total Amount Of Sets Of The Active Exercise

    // Updates Set Progress
    if(current_set < sets_amount || exercises_break.classList.contains("active")) {
        const periods_data:number[] = JSON.parse(((exercises[training_plan_state.active_exercise_index] as HTMLDivElement).querySelector(".reps") as HTMLParagraphElement).dataset["periods_data"] || "[0]") // Gets Exercise Sets & Reps Periods
        const unit_data:string = ((exercises[training_plan_state.active_exercise_index] as HTMLDivElement).querySelector(".reps") as HTMLParagraphElement).dataset["unit_data"] || "reps" // Gets Exercise Unit Type (Reps, Seconds Or Steps)

        if(!exercises_break.classList.contains("active")) {
            // Warm Up
            if(exercises[training_plan_state.active_exercise_index - 1] && (exercises[training_plan_state.active_exercise_index - 1] as HTMLDivElement).classList.contains("warm_up")) {
                if((exercises[training_plan_state.active_exercise_index - 1] as HTMLDivElement).classList.contains("skip")) {
                    ((exercises[training_plan_state.active_exercise_index] as HTMLDivElement).querySelector(".sets .current") as HTMLSpanElement).textContent = `${current_set += 1}` // Increments Current Set Value
                }

                else (exercises[training_plan_state.active_exercise_index - 1] as HTMLDivElement).classList.add("skip") // Adds Skip Class To Warm Up
            }

            else {
                ((exercises[training_plan_state.active_exercise_index] as HTMLDivElement).querySelector(".sets .current") as HTMLSpanElement).textContent = `${current_set += 1}` // Increments Current Set Value
            }
        }

        generateReps(periods_data, current_set, unit_data, exercises[training_plan_state.active_exercise_index] as HTMLDivElement); // Sets Exercise Current Reps, Hold Time, Or Steps Amount
        updateProgress(training_plan) // Updates Progress Bar
    }

    // Exercises Break Slide
    else if(current_set === sets_amount && training_plan_state.active_exercise_index < exercises.length - 1) {
        (exercises[training_plan_state.active_exercise_index] as HTMLDivElement).classList.remove("active"); // Hides Active Exercise
        (exercises[training_plan_state.active_exercise_index] as HTMLDivElement).inert = true // Disables Focus

        exercises_break.classList.add("active") // Shows Exercises Break Slide
        exercises_break.inert = false // Enables Focus

        exercisesBreak(container)
    }

    // Finish Training Slide
    else {
        (exercises[training_plan_state.active_exercise_index] as HTMLDivElement).classList.remove("active"); // Hides Active Exercise
        (exercises[training_plan_state.active_exercise_index] as HTMLDivElement).inert = true // Disables Focus

        finish_training.classList.add("active") // Shows Finish Training Slide
        finish_training.inert = false // Enables Focus
    }

    startActivity(container, playback) // Starts Activity
}

// Function For Skip Warm Up
export function skipWarmUp(container:HTMLDivElement):void {
    const exercises:NodeListOf<HTMLDivElement> = container.querySelectorAll<HTMLDivElement>(".training_plan_container .training_plan .exercise"); // Gets All Training Plan Exercises
    const warm_up:HTMLDivElement = container.querySelector(".training_plan_container .training_plan .warm_up") as HTMLDivElement // Gets Warm Up

    // Stops Warm Up Timer
    if(warm_up_interval.interval) {
        clearInterval(warm_up_interval.interval)
        warm_up_interval.interval = null
    }

    warm_up_interval.max_remaining_time = 0
    warm_up_interval.remaining_time = 0

    training_plan_state.active_exercise_index += 1; // Changes Active Exercise Index

    (exercises[training_plan_state.active_exercise_index] as HTMLDivElement).classList.add("active"); // Shows Active Exercise
    (exercises[training_plan_state.active_exercise_index] as HTMLDivElement).inert = false // Enables Focus

    nextExercise(container) // Next Exercise

    warm_up.classList.remove("active") // Hides Warm Up
    warm_up.inert = true // Disables Focus
}

// Function For Skip Exercises Break
export function skipBreak(container:HTMLDivElement):void {
    const exercises:NodeListOf<HTMLDivElement> = container.querySelectorAll<HTMLDivElement>(".training_plan_container .training_plan .exercise"); // Gets All Training Plan Exercises
    const exercises_break:HTMLDivElement = container.querySelector(".training_plan_container .training_plan .break") as HTMLDivElement // Gets The Break Slide
    const break_countdown:HTMLParagraphElement = exercises_break.querySelector(".break_timer p") as HTMLParagraphElement // Gets The Break Countdown

    // Stops Break Timer
    if(break_interval.interval) {
        clearInterval(break_interval.interval)
        break_interval.interval = null
    }

    break_interval.max_remaining_time = 120 // Sets Max Break Remaining Time Back To Default
    break_interval.remaining_time = 120 // Sets Max Break Remaining Time Back To Default

    break_countdown.style.color = "#ffffff" // Sets Break Countdown Color To White

    training_plan_state.active_exercise_index += 1; // Changes Active Exercise Index

    (exercises[training_plan_state.active_exercise_index] as HTMLDivElement).classList.add("active"); // Shows Active Exercise
    (exercises[training_plan_state.active_exercise_index] as HTMLDivElement).inert = false // Enables Focus
    
    nextExercise(container) // Next Exercise

    exercises_break.classList.remove("active") // Hides Break Between Sets Tab
    exercises_break.inert = true // Disables Focus
}