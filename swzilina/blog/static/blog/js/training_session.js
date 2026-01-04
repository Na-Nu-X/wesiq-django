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

    // Summary
    const average_activity_time = document.querySelector(".activity .previous_activity .average_activity_time") // Gets Average Activity Value

    const activity_summary = document.querySelector(".activity_summary") // Gets Activity Summary

    const main_summary = activity_summary.querySelector(".main_summary") // Gets Main Summary
    const weekly_activity_chart = activity_summary.querySelector(".weekly_activity_chart") // Gets Weekly Summary Chart
    let bar_chart = null

    const training_plan_summary = activity_summary.querySelector(".training_plan_summary") // Gets Training Plan Summary
    const training_plan_summary_chart = activity_summary.querySelector(".training_plan_summary_chart") // Gets Training Plan Summary Chart
    let doughnut_chart = null

    let exercises_summary = []
    let exercises_elapsed_time = 0
    let total_exercises_elapsed_time = 0

    // FUNCTIONS

    // General Functions
    function getFormattedSeconds(elapsed_seconds, leading_zero=false) {
        const result = elapsed_seconds % 60 // Number Value Of Elapsed Seconds

        return leading_zero === true ? result.toString().padStart(2, "0") : result // Returns Formatted Style Of Elapsed Seconds If Format Parameter Is Set As True
    }

    function getFormattedMinutes(elapsed_seconds, leading_zero=false) {
        const result = (Math.floor(elapsed_seconds / 60)) % 60 // Number Value Of Elapsed Minutes

        return leading_zero === true ? result.toString().padStart(2, "0") : result // Returns Formatted Style Of Elapsed Minutes If Format Parameter Is Set As True
    }

    function getFormattedHours(elapsed_seconds, leading_zero=false) {
        const result = (Math.floor(elapsed_seconds / 3600)) % 60 // Number Value Of Elapsed Hours

        return leading_zero === true ? result.toString().padStart(2, "0") : result // Returns Formatted Style Of Elapsed Hours If Format Parameter Is Set As True
    }

    // Function For Generate Random Color
    function randomColor(from=0, to=255) {
        return `rgb(
            ${Math.floor(Math.random() * ((to + 1) - from) + from)},
            ${Math.floor(Math.random() * ((to + 1) - from) + from)},
            ${Math.floor(Math.random() * ((to + 1) - from) + from)}
        )`
    }

    // Function For Get Cookie by Its Name
    function getCookie(cookie_name) {
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${cookie_name}=`)
        if (parts.length === 2) return parts.pop().split(";")[0]
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

        // Deletes Existing Summary Charts
        if(bar_chart) {
            bar_chart.destroy()
            bar_chart = null
        }

        if(doughnut_chart) {
            doughnut_chart.destroy()
            doughnut_chart = null
        }

        activity_timer_interval = setInterval(function() {
            // Activity Timer

            activity_timer_elapsed_time += 1 // Counts The Elapsed Time Since The Start Of The Activity

            // Renders Elapsed Time Values To The Activity Timer
            activity_timer.querySelector(".hours").textContent = getFormattedHours(activity_timer_elapsed_time, true)
            activity_timer.querySelector(".minutes").textContent = getFormattedMinutes(activity_timer_elapsed_time, true)
            activity_timer.querySelector(".seconds").textContent = getFormattedSeconds(activity_timer_elapsed_time, true)

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

            // Starts Counting Elapsed Time For The Current Active Exercise In The Training Plan
            if(exercises[active_exercise_index].classList.contains("active")) {
                const exercise_name = exercises[active_exercise_index].querySelector("h3").textContent // Gets Active Exercise Name

                exercises_elapsed_time += 1 // Increments Exercises Elapsed Time
                total_exercises_elapsed_time += 1 // Increments Total Exercises Elapsed Time

                // Returns Exercise Name Which Is Already In Exercises Summary Array
                const existing_exercise = exercises_summary.find(function(one_exercise) {
                    return one_exercise.exercise === exercise_name
                })
                
                // Updated Only Elapsed Time For Existing Exercise
                if(existing_exercise) {
                    existing_exercise.elapsed_time = exercises_elapsed_time
                }

                // Creates New Object For Unexisting Exercise
                else {
                    exercises_elapsed_time = 1 // Reset Exercise Elapsed Time

                    // Creates Exercise Object
                    const exercise_object = {}
                    exercise_object.exercise = exercise_name
                    exercise_object.elapsed_time = exercises_elapsed_time
                    exercise_object.color = randomColor(128, 255)

                    exercises_summary.push(exercise_object) // Fills Exercise Summary Array With Object
                }
            }
        }, 1000)
    }

    function pauseActivity() {
        // Stops Activity Timer
        clearInterval(activity_timer_interval)
        activity_timer_interval = null
    }

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

        // Sets Training Plan Summary To Default
        training_plan_summary.style.display = "none" // Hides Training Plan Summary
        training_plan_summary_chart.style.display = "none" // Hides Training Plan Summary Chart
        training_plan_summary.innerHTML = "" // Deletes Everything From Training Plan Summary

        // Only Executed If The Activity Timer Has Been Started
        if(activity_timer_elapsed_time >= 1) {
            gained_xp = Math.round(gained_xp) // Rounds Gained XP Value

            // Sends POST Data
            const post_data = new FormData()
            post_data.append("formatted_elapsed_time", `${getFormattedHours(activity_timer_elapsed_time, true)}h ${getFormattedMinutes(activity_timer_elapsed_time, true)}m ${getFormattedSeconds(activity_timer_elapsed_time, true)}s`)
            post_data.append("elapsed_time", activity_timer_elapsed_time)
            post_data.append("gained_xp", gained_xp)

            fetch("/training-session", {
                method: "POST",
                headers: {
                    "X-CSRFToken": getCookie("csrftoken")
                },
                body: post_data
            })
            .then(res => res.json())
            .then(data => {
                data.gained_xp = gained_xp
            })

            // Activity Summary

            activity_summary.style.display = "flex" // Shows Activity Summary

            // Main Summary Text
            gained_xp == 0 ? main_summary.innerHTML = `Nezískali ste žiadne XP` : main_summary.innerHTML = `Získali ste: <span style="color: #52cf20">${gained_xp}XP</span>` // Renders Text For Earned XP

            main_summary.innerHTML += "<br>Aktuálna aktivita trvala: "

            // Displays The Main Summary Text Of The Activity Summary In Green
            if(activity_timer_elapsed_time >= parseInt(average_activity_time.dataset.average_activity_time)) {
                main_summary.innerHTML += `
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
                main_summary.innerHTML += `
                    <span style="color: #df3535">
                        ${getFormattedHours(activity_timer_elapsed_time)}h ${getFormattedMinutes(activity_timer_elapsed_time)}m ${getFormattedSeconds(activity_timer_elapsed_time)}s

                        <span title="Čas aktuálnej aktivity bol o ${(100 - (activity_timer_elapsed_time / parseInt(average_activity_time.dataset.average_activity_time) * 100)).toFixed(2)}% kratší ako priemer za posledných 7 dní">
                            (-${(100 - (activity_timer_elapsed_time / parseInt(average_activity_time.dataset.average_activity_time) * 100)).toFixed(2)}%)
                        </span>
                    </span>
                `
            }

            // Weekly Activity Chart
            let weekly_activity = JSON.parse(weekly_activity_chart.dataset.activities) // Gets Weekly Activity Parsed Data

            // Gets Each Data From Weekly Activity Parsed Data
            const labels = weekly_activity.map(one_item => one_item.day) // Gets Days As Labels
            const data = weekly_activity.map(one_item => one_item.total_elapsed_time) // Gets Data As Total Elapsed Time Value For Each Day

            // Creates Chart
            bar_chart = new Chart(weekly_activity_chart.querySelector("canvas"), {
                type: "bar",

                data: {
                    labels: labels,
                    datasets: [{
                        data: data, // Seconds
                        backgroundColor: "rgb(195, 240, 175)",
                        hoverBackgroundColor: "rgb(195, 240, 175)",
                        borderColor: "#52cf20",
                        hoverBorderColor: "#52cf20",
                        borderWidth: 1,
                        hoverBorderWidth: 1,
                        borderRadius: 0,
                    }],
                },

                options: {
                    animation: false,

                    scales: {
                        y: {
                            display: false,
                        },

                        x: {
                            ticks: {
                                color: "#ffffff",

                                font: {
                                    family: "'Balsamiq Sans', sans-serif",
                                    size: 15,
                                },
                            },

                            grid: {
                                display: false,
                            },
                        },
                    },

                    plugins: {
                        legend: false,
                        tooltip: false,

                        datalabels: {
                            anchor: "end",
                            align: "bottom",
                            color: "#52cf20",

                            font: {
                                family: "'Balsamiq Sans', sans-serif",
                                size: 12
                            },
                            
                            formatter: function(value) {
                                if(value === 0) return ""

                                return `${getFormattedHours(value)}h ${getFormattedMinutes(value)}m`
                            },
                        },
                    },
                },

                plugins: [ChartDataLabels],
            })

            weekly_activity_chart.style.display = "block" // Shows Weekly Summary Chart
            weekly_activity_chart.style.animation = "fade_in_animation 1s ease-out" // Adds Animation For Weekly Summary Summary Chart

            // Training Plan Summary
            if(exercises_summary.length > 0) {
                training_plan_summary.style.display = "block" // Shows Training Plan Summary
                training_plan_summary_chart.style.display = "block" // Shows Training Plan Summary Chart
                training_plan_summary_chart.style.animation = "fade_in_scale_animation 1s ease-out" // Adds Animation For Training Plan Summary Chart

                // Training Plan Summary Text
                // training_plan_summary.innerText = "Strávený čas v daných cvičeniach"
                exercises_summary.forEach(function(one_exercise) {
                    training_plan_summary.innerHTML += `<br><span style="color: ${one_exercise.color}">${one_exercise.exercise}: ${getFormattedHours(one_exercise.elapsed_time)}h ${getFormattedMinutes(one_exercise.elapsed_time)}m ${getFormattedSeconds(one_exercise.elapsed_time)}s (${(one_exercise.elapsed_time / total_exercises_elapsed_time * 100).toFixed(2)}%)</span>`
                })

                // Training Plan Summary Chart
                // Gets Data From Exercise Summary Array
                const data = exercises_summary.map(one_item => one_item.elapsed_time) // Gets Elapsed Time For Each Exercise From Exercises Summary
                const colors = exercises_summary.map(one_item => one_item.color) // Gets Color For Each Exercise From Exercises Summary

                // Creates Chart
                doughnut_chart = new Chart(training_plan_summary_chart.querySelector("canvas"), {
                    type: "doughnut",

                    data: {
                        datasets: [{
                            data: data,
                            backgroundColor: colors,
                            hoverBackgroundColor: colors,
                            borderColor: "#ffffff",
                            hoverBorderColor: "#ffffff",
                            borderWidth: 2,
                            hoverBorderWidth: 2,
                            borderRadius: 5,
                            offset: 10,
                        }],

                        labels: false,
                    },

                    options: {
                        plugins: {
                            legend: false,
                            tooltip: false,
                        },

                        cutout: "50%",
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: false,
                    },                      
                })

                exercises_summary = [] // Sets Exercises Summary To Default
                total_exercises_elapsed_time = 0 // Sets Total Exercises Elapsed Time To Default
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
                // Stops Break Timer
                clearInterval(break_timer_interval)
                break_timer_interval = null

                max_break_remaining_time = 180 // Sets Max Break Remaining Time Back To Default
                break_remaining_time = 180 // Sets Max Break Remaining Time Back To Default

                nextExercise()

                break_between_sets.classList.remove("active") // Hides Break Between Sets Tab
            }

            else {
                // Changes Timer Color To Red If Remaining Time Is Less Than 10 Seconds
                break_remaining_time <= 10 ? break_timer.style.color = "#df3535" : break_timer.style.color = "#ffffff"

                // Break Timer
                break_timer.querySelector(".minutes").textContent = getFormattedMinutes(Math.round(break_remaining_time))
                break_timer.querySelector(".seconds").textContent = getFormattedSeconds(Math.round(break_remaining_time), true)

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