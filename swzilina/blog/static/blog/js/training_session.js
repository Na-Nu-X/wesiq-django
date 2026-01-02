"use strict"

document.addEventListener("DOMContentLoaded", function() {
    // VARIABLES

    // Playback
    const play = document.querySelector(".activity .record_activity .buttons .play")
    const play_appearance = play.querySelector("i") // Gets Play Button Icon (fa-play / fa-pause)

    // Training Plan
    const training_plan = document.querySelector(".activity .training_plan") // Gets Training Plan

    const start_training = training_plan.querySelector(".start_training") // Gets Start Training Tab
    const exercises = training_plan.querySelectorAll(".exercise") // Gets All Exercises Tabs
    const break_between_sets = training_plan.querySelector(".break") // Gets Break Between Sets Tab
    const finish_training = training_plan.querySelector(".finish_training") // Gets Finish Training Tab

    const progress_bar = document.querySelectorAll(".activity .training_plan .progress_bar .bar") // Gets All Bars From Progress Bar

    const all_sets = [...exercises].reduce((sum, one_exercise) => sum + parseInt(one_exercise.querySelector(".sets span:last-child").textContent), 0) // Gets Total Amount Of Sets From All Exercises

    const min_red = 82 // Final Progress Bar Color rgb(82, 207, 32)
    let red = 255 // Start Progress Bar Color rgb(255, 207, 32)

    let active_exercise_index = 0 // Exercise Index With Active Class

    // Activity Timer
    let activity_timer_interval = null
    let activity_timer_elapsed_time = 0 // Seconds

    // Gained XP
    let gained_xp = 0
    let xp_boost_remaining_time = 600 // 10 Minutes XP Boost (Default 0)
    let xp_boost = 2 // 2 Times XP Boost (Default 1)

    const current_activity_info = document.querySelector(".activity .current_activity_info") // Gets Current Activity Info

    xp_boost === 1 ? current_activity_info.textContent = "Žiadne aktívne navýšenia XP" : current_activity_info.textContent = `${xp_boost}x XP` // Displays Info About XP Boost

    // Break Timer
    let break_timer_interval = null

    let max_break_remaining_time = 180 // 3 Minutes
    let break_remaining_time = 180

    // FUNCTIONS

    // General Functions
    function getFormattedSeconds(elapsed_seconds) {
        const result = elapsed_seconds % 60 // Number Value Of Elapsed Seconds
        return result.toString().padStart(2, "0") // Returns Formatted Style Of Elapsed Seconds
    }

    function getFormattedMinutes(elapsed_seconds) {
        const result = (Math.floor(elapsed_seconds / 60)) % 60 // Number Value Of Elapsed Minutes
        return result.toString().padStart(2, "0") // Returns Formatted Style Of Elapsed Minutes
    }

    function getFormattedHours(elapsed_seconds) {
        const result = (Math.floor(elapsed_seconds / 3600)) % 60 // Number Value Of Elapsed Hours
        return result.toString().padStart(2, "0") // Returns Formatted Style Of Elapsed Hours
    }

    function trainingPlanProgress() {
        const set_progress = exercises[active_exercise_index].querySelectorAll(".sets span") // Gets Set Progress Of Active Exercise
        let current_set = parseInt(set_progress[0].textContent) // Gets Current Set Value
        const sets_amount = parseInt(set_progress[1].textContent) // Gets Total Amount Of Sets Of The Active Exercise

        let progress_percentage = current_set / sets_amount * 100 // Calculates Set Progress Percentage

        // Progress Bar
        progress_bar[active_exercise_index].classList.add("active") // Shows Progress Bar
        progress_bar[active_exercise_index].style.setProperty("--progress", `${progress_percentage}%`) // Shows Progress In Progress Bar

        // Changes Progress Bar Color
        if(red >= min_red) {
            progress_bar.forEach(function(one_bar) {
                one_bar.style.setProperty("--progress-color", `rgb(${red}, 207, 32)`)
            })
        }

        // Returns All Of The Variables
        return {
            set_progress,
            current_set,
            sets_amount,

            progress_percentage,
        }
    }

    // Activity
    const activity_timer = document.querySelector(".activity .record_activity .timer") // Gets Activity Timer

    function startActivity() {
        // Hides Training Plan If Activity Was Already Started With The Playback Play Button
        if(play_appearance.classList.contains("fa-pause") && start_training.classList.contains("active")) {
            training_plan.style.display = "none" // Hides Training Plan
        }
        
        activity_summary.style.display = "none" // Hides Activity Summary

        activity_timer_interval = setInterval(function() {
            // Activity Timer

            activity_timer_elapsed_time += 1 // Counts The Elapsed Time Since The Start Of The Activity

            // Renders Elapsed Time Values To The Activity Timer
            activity_timer.querySelector(".hours").textContent = getFormattedHours(activity_timer_elapsed_time)
            activity_timer.querySelector(".minutes").textContent = getFormattedMinutes(activity_timer_elapsed_time)
            activity_timer.querySelector(".seconds").textContent = getFormattedSeconds(activity_timer_elapsed_time)

            // Gained XP

            xp_boost_remaining_time -= 1 // Decreases XP Boost Remaining Time Every Second
            gained_xp += 100 / 3600 * xp_boost // 1 Hour Of The Activity Gains 100XP Without XP Boost

            // Checks XP Boost Remaining Time
            if(xp_boost_remaining_time <= 0) {
                // If There Is No Active XP Boost
                xp_boost = 1
                current_activity_info.textContent = "Žiadne aktívne navýšenia XP"
            }

            else {
                // If There Is An Active XP Boost
                current_activity_info.textContent = `${xp_boost}x XP`
            }
        }, 1000)
    }

    function pauseActivity() {
        // Stops Activity Timer
        clearInterval(activity_timer_interval)
        activity_timer_interval = null
    }

    const average_activity_time = document.querySelector(".activity .previous_activity .average_activity_time")
    const activity_summary = document.querySelector(".activity_summary") // Gets Activity Summary

    function stopActivity() {
        // Stops Activity Timer
        clearInterval(activity_timer_interval)
        activity_timer_interval = null

        // Resets Default Values

        training_plan.style.display = "block" // Shows Training Plan
        exercises[active_exercise_index].classList.remove("active") // Hides Exercise With Active Class
        finish_training.classList.remove("active") // Hides Finish Training Tab
        start_training.classList.add("active") // Shows Start Training Tab
        
        break_between_sets.classList.remove("active") // Hides Break Between Sets Tab

        // Stops Break Timer
        clearInterval(break_timer_interval)
        break_timer_interval = null

        max_break_remaining_time = 180 // Sets Max Break Remaining Time Back To Default
        break_remaining_time = 180 // Sets Max Break Remaining Time Back To Default

        // Sets Current Set Back To 1
        exercises.forEach(function(one_exercise) {
            one_exercise.querySelectorAll(".sets span")[0].textContent = "1"
        })

        // Progress Bar
        progress_bar.forEach(function(one_bar) {
            one_bar.classList.add("active") // Deletes Active Class From Progress Bars
            one_bar.style.setProperty("--progress", "0%") // Set Progress Bar Progress Back to 0%
        })

        red = 255

        active_exercise_index = 0 // Sets Active Exercise Index To Default

        // Only Executed If The Activity Timer Has Been Started
        if(activity_timer_elapsed_time >= 1) {
            // Sends POST Data

            gained_xp = Math.round(gained_xp) // Rounds Gained XP Value

            // Activity Summary

            activity_summary.style.display = "flex" // Shows Activity Summary

            activity_summary.querySelector(".main_summary").innerHTML = "<br>Aktuálna aktivita trvala: "

            // Displays The Main Summary Text Of The Activity Summary In Green
            if(activity_timer_elapsed_time >= parseInt(average_activity_time.dataset.average_activity_time)) {
                activity_summary.querySelector(".main_summary").innerHTML += `
                    <span style="color: #52cf20">
                        ${getFormattedHours(activity_timer_elapsed_time)}h ${getFormattedMinutes(activity_timer_elapsed_time)}m ${getFormattedSeconds(activity_timer_elapsed_time)}s

                        <span title="Čas aktuálnej aktivity bol o ${((activity_timer_elapsed_time / parseInt(average_activity_time.dataset.average_activity_time) * 100) - 100).toFixed(2)}% dlhší ako priemer za posledných 7 dní">
                            (+${((activity_timer_elapsed_time / parseInt(average_activity_time.dataset.average_activity_time) * 100) - 100).toFixed(2)}%)
                        </span>
                    </span>
                `
            }

            // Displays The Main Summary Text Of The Activity Summary In Red
            else {
                activity_summary.querySelector(".main_summary").innerHTML += `
                    <span style="color: #df3535">
                        ${getFormattedHours(activity_timer_elapsed_time)}h ${getFormattedMinutes(activity_timer_elapsed_time)}m ${getFormattedSeconds(activity_timer_elapsed_time)}s

                        <span title="Čas aktuálnej aktivity bol o ${(100 - (activity_timer_elapsed_time / parseInt(average_activity_time.dataset.average_activity_time) * 100)).toFixed(2)}% kratší ako priemer za posledných 7 dní">
                            (-${(100 - (activity_timer_elapsed_time / parseInt(average_activity_time.dataset.average_activity_time) * 100)).toFixed(2)}%)
                        </span>
                    </span>
                `
            }

            // Auto Scroll To Activity Summary After Finish Activity
            window.scrollTo({
                top: activity_summary.offsetTop,
                behavior: "smooth"
            })

            // Resets Default Values

            activity_timer_elapsed_time = 0 // Sets Elapsed Time Back To 0
            gained_xp = 0 // Sets Gained XP Back To 0

            // Sets Activity Timer Default Texts
            activity_timer.querySelector(".hours").textContent = "00"
            activity_timer.querySelector(".minutes").textContent = "00"
            activity_timer.querySelector(".seconds").textContent = "00"
        }
    }

    // Training Plan
    function startTraining() {
        start_training.classList.remove("active") // Hides Start Training Tab
        exercises[0].classList.add("active") // Shows First Exercise

        // Change Buttons - Shows Pause Button
        play_appearance.classList.remove("fa-play")
        play_appearance.classList.add("fa-pause")

        startActivity()

        // Shows Progress In Progress Bar
        let { progress_percentage } = trainingPlanProgress()
        red -= (255 - min_red) / (all_sets - 1) // Makes Color Transition For Progress Bar From rgb(255, 207, 32) To rgb(82, 207, 32)
    }

    function breakBetweenSets() {
        // Change Tabs
        exercises[active_exercise_index].classList.remove("active") // Hides Current Active Exercise
        break_between_sets.classList.add("active") // Shows Break Between Sets Tab
        
        // Break Timer
        const break_timer = break_between_sets.querySelector(".break_timer p") // Gets Break Timer

        // Progress Circle
        const progress_circle = break_between_sets.querySelector("svg .progress")
        const radius = parseInt(progress_circle.getAttribute("r"))
        const circum_ference = 2 * Math.PI * radius // 251.32741228718345
        progress_circle.style.strokeDasharray = circum_ference

        // Timer Interval (100MS)
        break_timer_interval = setInterval(function() {
            // Checks If There Is Still Some Remaining Time
            if(break_remaining_time <= 0) {
                // Skip To Next Exercise

                // Stops Break Timer
                clearInterval(break_timer_interval)
                break_timer_interval = null
            }

            else {
                // Changes Timer Color To Red If Remaining Time Is Less Than 10 Seconds
                if(break_remaining_time <= 10) {
                    break_timer.style.color = "#df3535"
                }

                // Break Timer
                break_timer.querySelector(".minutes").textContent = Math.floor(break_remaining_time / 60)
                break_timer.querySelector(".seconds").textContent = getFormattedSeconds(Math.floor(break_remaining_time))

                // Progress Circle
                progress_circle.style.strokeDashoffset = circum_ference / max_break_remaining_time * break_remaining_time // Updates Progress Circle Length

                const progress_circle_red = 255 - (255 / max_break_remaining_time * break_remaining_time) // Increases Red Color In Palette
                const progress_circle_green = 255 / max_break_remaining_time * break_remaining_time // Decreases Green Color In Palette

                progress_circle.style.stroke = `rgb(${progress_circle_red}, ${progress_circle_green}, 0)` // Updates Progress Circle Color
                progress_circle.style.filter = `drop-shadow(0px 0px 5px rgb(${progress_circle_red}, ${progress_circle_green}, 0))` // Updates Progress Circle Shadow Color
                progress_circle.style.webkitFilter = `drop-shadow(0px 0px 5px rgb(${progress_circle_red}, ${progress_circle_green}, 0))` // Updates Progress Circle Shadow Color

                break_remaining_time -= 0.1

                // Changes Preferences After Adding Time
                if(break_remaining_time > max_break_remaining_time) {
                    progress_circle.style.strokeDashoffset = circum_ference // Sets Progress In Progress Circle On The Start

                    max_break_remaining_time = break_remaining_time // Changes Maximum Value Of Break Timer Remaining Time
                }
            }
        }, 100)
    }

    function nextExercise() {
        // Unpause Activity If Is Paused
        if(play_appearance.classList.contains("fa-play")) {
            // Change Buttons - Shows Pause Button
            play_appearance.classList.remove("fa-play")
            play_appearance.classList.add("fa-pause")

            startActivity()
        }

        let { set_progress, current_set, sets_amount } = trainingPlanProgress() // Gets Current Set Progress

        // Updates Set Progress
        if(current_set < sets_amount) {
            current_set += 1 // Increases Current Set Value
            set_progress[0].textContent = current_set // Displays Current Set Value

            // Shows Progress In Progress Bar
            let { progress_percentage } = trainingPlanProgress()
            red -= (255 - min_red) / (all_sets - 1) // Makes Color Transition For Progress Bar From rgb(255, 207, 32) To rgb(82, 207, 32)
        }

        else {
            // Changes Exercises Only If There Is Still Any Left
            if(active_exercise_index < exercises.length - 1) {
                // Shows Break Between Sets Only If There Is No Active Break Between Sets Tab, Only If There Is Still Any Exercise Left And If Current Set Is Equal Sets Amount In Current Active Exercise
                if(!break_between_sets.classList.contains("active")) {
                    breakBetweenSets()
                }

                else {
                    // Changes Exercises
                    exercises[active_exercise_index].classList.remove("active") // Hides Current Active Exercise
                    exercises[active_exercise_index + 1].classList.add("active") // Shows Next Exercise
                    active_exercise_index += 1 // Changes Active Exercise Index

                    // Shows Progress In Progress Bar
                    let { progress_percentage } = trainingPlanProgress()
                    red -= (255 - min_red) / (all_sets - 1) // Makes Color Transition For Progress Bar From rgb(255, 207, 32) To rgb(82, 207, 32)
                }
            }

            // Shows Finish Training Tab If There Are No Exercises Left
            else {
                exercises[active_exercise_index].classList.remove("active") // Hides Exercise With Active Class
                finish_training.classList.add("active") // Shows Finish Training Tab
            }
        }
    }

    function finishTraining() {
        stopActivity()
    }

    // BUTTONS

    // Playback

    const stop = document.querySelector(".activity .record_activity .buttons .stop")

    // Play
    play.addEventListener("click", function() {
        // Play Button
        if(play_appearance.classList.contains("fa-play")) {
            // Change Buttons - Shows Pause Button
            play_appearance.classList.remove("fa-play")
            play_appearance.classList.add("fa-pause")

            startActivity() // Start Activity
        }

        // Pause Button
        else if(play_appearance.classList.contains("fa-pause")) {
            // Change Buttons - Shows Play Button
            play_appearance.classList.remove("fa-pause")
            play_appearance.classList.add("fa-play")

            pauseActivity() // Pause Activity
        }

        else return // Do Nothing
    })

    // Stop
    stop.addEventListener("click", function() {
        // Change Buttons - Shows Play Button
        play_appearance.classList.remove("fa-pause")
        play_appearance.classList.add("fa-play")

        stopActivity()
    })

    // Training Plan

    const start_training_button = start_training.querySelector(".start_training_button")
    const finish_training_button = finish_training.querySelector(".finish_training_button")

    // Start Training
    start_training_button.addEventListener("click", startTraining)

    // Next Exercise
    exercises.forEach(function(one_exercise) {
        const next_exercise_button = one_exercise.querySelector(".next_exercise_button") // Gets Next Exercise Button Of One Exercise

        next_exercise_button.addEventListener("click", function() {
            nextExercise()
        })
    })

    // Finish Training
    finish_training_button.addEventListener("click", function() {
        // Change Buttons - Shows Play Button
        play_appearance.classList.remove("fa-pause")
        play_appearance.classList.add("fa-play")

        finishTraining()
    })

    // Break Between Sets

    // Skip To The Next Exercise
    const skip_break_button = break_between_sets.querySelector(".skip_break_button")

    skip_break_button.addEventListener("click", function() {
        // Stops Break Timer
        clearInterval(break_timer_interval)
        break_timer_interval = null

        max_break_remaining_time = 180 // Sets Max Break Remaining Time Back To Default
        break_remaining_time = 180 // Sets Max Break Remaining Time Back To Default

        nextExercise()

        break_between_sets.classList.remove("active") // Hides Break Between Sets Tab
    })

    // Add Time Button
    const add_time = break_between_sets.querySelector(".add_time")
    const add_time_message = add_time.querySelector(".add_time_message")

    add_time.addEventListener("click", function() {
        break_remaining_time += 30 // Adds 30 Seconds On Timer

        // Shows Animated Text
        add_time_message.classList.remove("animate")
        void add_time_message.offsetWidth
        add_time_message.classList.add("animate")
    })
})