"use strict"

document.addEventListener("DOMContentLoaded", function() {
    // Function For Get Cookie by Its Name
    function getCookie(cookie_name) {
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${cookie_name}=`)
        if (parts.length === 2) return parts.pop().split(";")[0]
    }

    // Buttons
    const play = document.querySelector(".play")
    const stop = document.querySelector(".stop")

    // Play / Resume Icon
    const play_icon = play.querySelector("i")

    // Timer
    const timer = document.querySelector(".timer")
    const timer_seconds_tag = timer.querySelector(".seconds")
    const timer_minutes_tag = timer.querySelector(".minutes")
    const timer_hours_tag = timer.querySelector(".hours")

    let elapsed_time = 0 // Current Elapsed Time In Seconds
    let gained_xp = 0

    // Timer Values
    let timer_seconds = 0 // Current Elapsed Seconds In Timer
    let timer_minutes = 0 // Current Elapsed Minutes In Timer 
    let timer_hours = 0 // Current Elapsed Hours In Timer

    function getTimerSeconds(elapsed_time) {
        return elapsed_time % 60
    }

    function getTimerMinutes(elapsed_time) {
        return (Math.floor(elapsed_time / 60)) % 60
    }

    function getTimerHours(elapsed_time) {
        return (Math.floor(elapsed_time / 3600)) % 60
    }

    // XP Boost
    const activity_info = document.querySelector(".activity .activity_info")
    let xp_boost = 1 // 1 Times Boosted Amount Of XP By Default
    let xp_boost_remaining_time = 600 // 10 Minutes

    if(xp_boost_remaining_time <= 0) {
        xp_boost = 1
        activity_info.textContent = "Žiadne aktívne navýšenia XP"
    }

    else {
        xp_boost = 2 // Change
        activity_info.textContent = `${xp_boost}x XP`
    }

    // Activity Report
    const activity_summary = document.querySelector(".activity_summary")
    const main_summary = activity_summary.querySelector(".main_summary")
    const training_plan_summary = activity_summary.querySelector(".training_plan_summary")
    const main_summary_chart = activity_summary.querySelector(".main_summary_chart")
    const training_plan_summary_chart = activity_summary.querySelector(".training_plan_summary_chart")
    let bar_chart = null
    let doughnut_chart = null

    // Timer For Exercises Summary
    let exercises_elapsed_time = 0
    let exercises_summary = []
    let total_exercises_elapsed_time = 0

    let timer_interval = null

    // Function For Generate Random Color (Lighter Tone)
    function randomColor() {
        return `rgb(
            ${Math.floor(Math.random() * (256 - 128) + 128)},
            ${Math.floor(Math.random() * (256 - 128) + 128)},
            ${Math.floor(Math.random() * (256 - 128) + 128)}
        )` // Random Number From 128 (Included) To 255 (Included)
    }

    // Training Plan Break
    const training_plan_break = document.querySelector(".training_plan .break")
    let break_timer_interval = null

    // Training Plan Break Function
    function breakTimer(exercise_index) {
        const break_timer = document.querySelector(".break .break_timer h3")
        let break_timer_remaining_time = 1800 // 3 Minutes
        let max_break_timer_remaining_time = 1800 // 3 Minutes

        // Progress Circle
        const progress = document.querySelector(".break .break_timer svg .progress")
        const radius = parseInt(progress.getAttribute("r"))
        const circum_ference = 2 * Math.PI * radius // 251.32741228718345
        progress.style.strokeDasharray = circum_ference

        // Timer Interval (100MS)
        break_timer_interval = setInterval(function() {
            // Timer's Numbers

            let remaining_minutes = Math.floor((break_timer_remaining_time / 10) / 60)
            let remaining_seconds = Math.floor((break_timer_remaining_time / 10) % 60)

            // Checks If There Is Still Some Remaining Time
            if(break_timer_remaining_time <= 0) {
                // Skip To Next Exercise

                // Stops Timer
                clearInterval(break_timer_interval)
                break_timer_interval = null

                // return
            }

            // Changes Timer Color To Red If Remaining Time Is Less Than 10 Seconds
            if(break_timer_remaining_time <= 100) {
                break_timer.style.color = "#df3535"
            }

            break_timer.innerText = `${remaining_minutes}:${remaining_seconds.toString().padStart(2, "0")}` // Updates Numbers In Timer

            // Progress Circle

            // Length
            progress.style.strokeDashoffset = circum_ference / max_break_timer_remaining_time * break_timer_remaining_time // Updates Progress Circle Length

            // Color
            const red = 255 - (255 / max_break_timer_remaining_time * break_timer_remaining_time) // Increases Red Color In Palette
            const green = 255 / max_break_timer_remaining_time * break_timer_remaining_time // Decreases Green Color In Palette

            progress.style.stroke = `rgb(${red}, ${green}, 0)` // Updates Progress Circle Color
            progress.style.filter = `drop-shadow(0px 0px 5px rgb(${red}, ${green}, 0))` // Updates Progress Circle Shadow Color
            progress.style.webkitFilter = `drop-shadow(0px 0px 5px rgb(${red}, ${green}, 0))` // Updates Progress Circle Shadow Color

            break_timer_remaining_time -= 1 // Decreases Remaining Time By 100MS Every 100MS Interval

            if(break_timer_remaining_time > max_break_timer_remaining_time) {
                progress.style.strokeDashoffset = circum_ference // Sets Progress In Progress Circle On The Start

                max_break_timer_remaining_time = break_timer_remaining_time // Changes Maximum Value Of Break Timer Remaining Time
            }
        }, 100)

        // Add Time Button
        const add_time = document.querySelector(".break .add_time")
        const add_time_message = add_time.querySelector(".add_time_message")

        add_time.addEventListener("click", function() {
            break_timer_remaining_time += 300 // Adds 30 Seconds On Timer

            // Shows Animated Text
            add_time_message.classList.remove("animate")
            void add_time_message.offsetWidth
            add_time_message.classList.add("animate")
        })

        // Skip To Next Exercise Button
        const skip_exercise = document.querySelector(".break .skip_exercise")
        
        skip_exercise.addEventListener("click", function() {
            // Stops Timer
            clearInterval(break_timer_interval)
            break_timer_interval = null

            // Change Slides
            training_plan_break.classList.remove("active") // Removes Active Class From Training Plan Break In Order To Hide It

            // Adds Active Class To Next Exercise
            exercises[exercise_index].classList.remove("active")
            exercises[exercise_index + 1].classList.add("active")

            // Adds Active Class To Next Bar In Progress Bar
            progress_bar[exercise_index + 1].classList.add("active")
        }, { once: true }) // Once Option Is Turned On Because There Are Multiple Event Listeners On The Skip Exercise Button
    }

    // Function For Start Timer
    function startTimer() {
        if(play_icon.classList.contains("fa-play")) {
            // Changes Icons
            play_icon.classList.remove("fa-play")
            play_icon.classList.add("fa-pause")

            // Deletes Activity Summary
            if(activity_summary.innerText !== "") {
                main_summary.innerHTML = ""
                training_plan_summary.innerHTML = ""

                activity_summary.style.display = "none" // Hides Activity Summary
                training_plan_summary.style.display = "none" // Hides Training Plan Summary
                main_summary_chart.style.display = "none" // Hides Main Summary Summary Chart
                training_plan_summary_chart.style.display = "none" // Hides Training Plan Summary Chart
            }

            // Deletes Training Plan Activity Chart
            if(bar_chart) {
                bar_chart.destroy()
                bar_chart = null
            }

            if(doughnut_chart) {
                doughnut_chart.destroy()
                doughnut_chart = null
            }

            // Starts Timer With 1 Second Interval
            timer_interval = setInterval(function() {
                elapsed_time += 1 // Every Second Increases Elapsed Time (Seconds) By 1
                gained_xp += (100 / 3600) * xp_boost // Every Second Increases Amount Of Gained XP (1 Hour = 100XP Without Active XP Boost)
                xp_boost_remaining_time -= 1 // Every Second Decreases Remaining Time Of XP Boost

                if(xp_boost_remaining_time <= 0) {
                    xp_boost = 1
                    activity_info.textContent = "Žiadne aktívne navýšenia XP"
                }

                else {
                    xp_boost = 2 // Change
                    activity_info.textContent = `${xp_boost}x XP`
                }

                // Calculates Every Unit For Timer
                timer_seconds = getTimerSeconds(elapsed_time)
                timer_minutes = getTimerMinutes(elapsed_time)
                timer_hours = getTimerHours(elapsed_time)

                // Timer Rendering
                function timerFormat(timer_units, timer_units_tag) {
                    // Formats 1 Digit Numbers (For Example 1 To 01)
                    if(timer_units < 10) {
                        timer_units_tag.textContent = `0${timer_units}`
                    }

                    else {
                        timer_units_tag.textContent = timer_units
                    }
                }

                timerFormat(timer_seconds, timer_seconds_tag) // Renders Current Seconds In Timer
                timerFormat(timer_minutes, timer_minutes_tag) // Renders Current Minutes In Timer
                timerFormat(timer_hours, timer_hours_tag) // Renders Current Hours In Timer

                // Timer For Exercises Summary
                exercises.forEach(function(one_exercise) {
                    // Gets Active Exercise
                    if(one_exercise.classList.contains("active")) {
                        const exercise_name = one_exercise.querySelector("h3").textContent // Gets Active Exercise Name

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
                            exercise_object.color = randomColor()

                            exercises_summary.push(exercise_object) // Fills Exercise Summary Array With Object
                        }                                
                    }
                })
            }, 1000)
        }

        else if(play_icon.classList.contains("fa-pause")) {
            // Changes Icons
            play_icon.classList.remove("fa-pause")
            play_icon.classList.add("fa-play")

            // Stops Timer
            clearInterval(timer_interval)
            timer_interval = null
        }
    }

    // Function For Stop Timer
    function stopTimer() {
        // Stops Timer
        clearInterval(timer_interval)
        timer_interval = null

        // Set Play Icon If Is Set As Pause
        if(play_icon.classList.contains("fa-pause")) {
            play_icon.classList.remove("fa-pause")
            play_icon.classList.add("fa-play")
        }

        // Only Executed If A Timer Has Been Started
        if(elapsed_time >= 1) {
            // Calculates Gained XP
            gained_xp = Math.round(gained_xp) // Final Rounded Amount Of XP

            // Renders Completed Activity Summary
            const average_activity_time = parseInt(document.querySelector(".average_activity_time").dataset.average_activity_time) // Gets Average Activity Time

            gained_xp == 0 ? main_summary.innerHTML = `Nezískali ste žiadne XP` : main_summary.innerHTML = `Získali ste: <span style="color: #52cf20">${gained_xp}XP</span>` // Renders Text For Earned XP

            // main_summary.innerHTML += "<br>Informácie o aktuálnej aktivite<br>Aktuálna aktivita trvala: "
            main_summary.innerHTML += "<br>Aktuálna aktivita trvala: "

            elapsed_time < average_activity_time ? 
                main_summary.innerHTML += `
                    <span style="color: #df3535">
                        ${timer_hours}h ${timer_minutes}m ${timer_seconds}s 
                        <span title="Čas aktuálnej aktivity bol o ${(100 - (elapsed_time / average_activity_time * 100)).toFixed(2)}% kratší ako priemer za posledných 7 dní">
                            (-${(100 - (elapsed_time / average_activity_time * 100)).toFixed(2)}%)
                        </span>
                    </span>
                ` 
                
                : 
                
                main_summary.innerHTML += ` 
                    <span style="color: #52cf20">
                        ${timer_hours}h ${timer_minutes}m ${timer_seconds}s 
                        <span title="Čas aktuálnej aktivity bol o ${((elapsed_time / average_activity_time * 100) - 100).toFixed(2)}% dlhší ako priemer za posledných 7 dní">
                            (+${((elapsed_time / average_activity_time * 100) - 100).toFixed(2)}%)
                        </span>
                    </span>
                `
            
            // Weekly Activity Summary
            let weekly_activity = JSON.parse(main_summary_chart.dataset.activities) // Gets Weekly Activity Parsed Data

            // Gets Each Data From Weekly Activity Parsed Data
            const labels = weekly_activity.map(one_item => one_item.day) // Gets Days As Labels
            const data = weekly_activity.map(one_item => one_item.total_elapsed_time) // Gets Data As Total Elapsed Time Value For Each Day

            // Creates Chart
            bar_chart = new Chart(main_summary_chart.querySelector("canvas"), {
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

                                return `${getTimerHours(value)}h ${getTimerMinutes(value)}m`
                            },
                        },
                    },
                },

                plugins: [ChartDataLabels],
            })

            // Exercises Summary
            if(exercises_summary.length > 0) {
                training_plan_summary.style.display = "block" // Shows Training Plan Summary
                training_plan_summary_chart.style.display = "block" // Shows Training Plan Summary Chart
                training_plan_summary_chart.style.animation = "fade_in_scale_animation 1s ease-out" // Adds Animation For Training Plan Summary Chart

                // Training Plan Activity Report
                // training_plan_summary.innerText = "Strávený čas v daných cvičeniach"

                exercises_summary.forEach(function(one_exercise) {
                    training_plan_summary.innerHTML += `<br><span style="color: ${one_exercise.color}">${one_exercise.exercise}: ${getTimerHours(one_exercise.elapsed_time)}h ${getTimerMinutes(one_exercise.elapsed_time)}m ${getTimerSeconds(one_exercise.elapsed_time)}s (${(one_exercise.elapsed_time / total_exercises_elapsed_time * 100).toFixed(2)}%)</span>`
                })

                // Chart
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

            activity_summary.style.display = "flex" // Shows Activity Summary
            main_summary_chart.style.display = "block" // Shows Main Summary Chart
            main_summary_chart.style.animation = "fade_in_animation 1s ease-out" // Adds Animation For Main Summary Summary Chart

            // Sends POST Data
            const post_data = new FormData()
            post_data.append("formatted_elapsed_time", `${timer_hours}h ${timer_minutes}m ${timer_seconds}s`)
            post_data.append("elapsed_time", elapsed_time)
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

            // Set Timer's Default Values
            timer_seconds_tag.textContent = "00"
            timer_minutes_tag.textContent = "00"
            timer_hours_tag.textContent = "00"

            elapsed_time = 0 // Set Elapsed Time To Default Value
            gained_xp = 0 // Set Gained XP To Default Value

            // Auto Scroll To Activity Summary After Finish Activity
            window.scrollTo({
                top: activity_summary.offsetTop,
                behavior: "smooth"
            })
        }
    }
    
    // Playback
    const training_plan = document.querySelector(".training_plan")
    const exercises = training_plan.querySelectorAll(".exercise")
    const progress_bar = training_plan.querySelectorAll(".progress_bar .bar")
    const start_training = document.querySelector(".start_training")

    let first_play = true // Protection For Hiding Training Plan

    // Play / Resume Buttons
    play.addEventListener("click", function() {
        startTimer()

        // Hides Training Plan If User Start The Timer With Play Button
        if(play_icon.classList.contains("fa-pause") && first_play === true || play_icon.classList.contains("fa-pause") && start_training.classList.contains("active")) {
            training_plan.style.display = "none"
            first_play = false
        }
    })

    // Progress Bar Color
    let all_sets = 0
    
    exercises.forEach(function(one_exercise) {
        all_sets += (parseInt(one_exercise.querySelectorAll(".sets span")[1].textContent))
    })

    const min_red = 82
    let red = 255

    // Stop Button
    stop.addEventListener("click", function() {
        stopTimer()

        training_plan.style.display = "block"

        // Removes Active Class From Exercises
        exercises.forEach(function(one_exercise) {
            one_exercise.classList.remove("active")
        })

        // Removes Active Class From Progress Bar
        progress_bar.forEach(function(one_bar, index) {
            one_bar.classList.remove("active")

            // Sets Progress To Default Values

            // Sets Current Set Default Value
            const sets = exercises[index].querySelectorAll(".sets span")
            sets[0].textContent = "1"

            // Sets Current Progress Default Value
            let current_set = parseInt(sets[0].textContent)
            const sets_amount = parseInt(sets[1].textContent)

            if(sets_amount >= 1 && current_set < sets_amount) {
                // Shows Progress
                let progress_percentage = current_set / sets_amount * 100
                one_bar.style.setProperty("--progress", `${progress_percentage}%`)

                // Updates Progress Bar Color
                red = 255

                progress_bar.forEach(function(one_bar) {
                    one_bar.style.setProperty("--progress-color", `rgb(${red}, 207, 32)`)
                })
            }
        })

        // Shows Start Training Tab
        finish_training.classList.remove("active")
        start_training.classList.add("active")

        first_play = true

        // Stops Training Plan Timer
        clearInterval(break_timer_interval)
        break_timer_interval = null
        training_plan_break.classList.remove("active") // Removes Active Class From Training Plan Break In Order To Hide It
    })

    // Training Plan

    // Start Training
    const start_training_button = start_training.querySelector(".start_training_button")

    start_training_button.addEventListener("click", function() {
        startTimer()

        // Shows First Exercise In Training Plan
        start_training.classList.remove("active")
        exercises[0].classList.add("active")
        progress_bar[0].classList.add("active")

        first_play = false
    })

    // Finish Training
    const finish_training = document.querySelector(".finish_training")
    const finish_training_button = finish_training.querySelector(".finish_training_button")

    finish_training_button.addEventListener("click", function() {
        stopTimer()

        // Shows Start Training Tab
        finish_training.classList.remove("active")
        start_training.classList.add("active")

        // Removes Active Class From Progress Bar
        progress_bar.forEach(function(one_bar, index) {
            one_bar.classList.remove("active")

            // Sets Progress To Default Values

            // Sets Current Set Default Value
            const sets = exercises[index].querySelectorAll(".sets span")
            sets[0].textContent = "1"

            // Sets Current Progress Default Value
            let current_set = parseInt(sets[0].textContent)
            const sets_amount = parseInt(sets[1].textContent)

            if(sets_amount >= 1 && current_set < sets_amount) {
                // Shows Progress
                let progress_percentage = current_set / sets_amount * 100
                one_bar.style.setProperty("--progress", `${progress_percentage}%`)
                
                // Updates Progress Bar Color
                red = 255

                progress_bar.forEach(function(one_bar) {
                    one_bar.style.setProperty("--progress-color", `rgb(${red}, 207, 32)`)
                })
            }
        })
    })

    // Next Exercise
    exercises.forEach(function(one_exercise, index) {
        // Shows Default Progress Percentage
        progress_bar.forEach(function(one_bar, index) {
            // Current Set Value
            const sets = exercises[index].querySelectorAll(".sets span")
            let current_set = parseInt(sets[0].textContent)
            const sets_amount = parseInt(sets[1].textContent)

            if(sets_amount >= 1 && current_set <= sets_amount) {
                // Shows Progress
                let progress_percentage = current_set / sets_amount * 100
                one_bar.style.setProperty("--progress", `${progress_percentage}%`)
            }
        })

        // Skip Exercise By Button
        const skip_exercise = one_exercise.querySelector(".skip_exercise")

        skip_exercise.addEventListener("click", function() {
            // Starts Timer If Is Paused And User Skip The Exercise
            if(play_icon.classList.contains("fa-play")) {
                startTimer()
            }

            // Updates Progress Bar Color
            if(red >= min_red) {
                red -= (255 - min_red) / (all_sets - 1) // Makes Color Transition For Progress Bar From rgb(255, 207, 32) To rgb(82, 207, 32)

                progress_bar.forEach(function(one_bar) {
                    one_bar.style.setProperty("--progress-color", `rgb(${red}, 207, 32)`)
                })
            }

            // Current Set Value
            const sets = one_exercise.querySelectorAll(".sets span")
            let current_set = parseInt(sets[0].textContent)
            const sets_amount = parseInt(sets[1].textContent)

            if(sets_amount >= 1 && current_set < sets_amount) {
                // Increments Current Set Value
                current_set += 1
                sets[0].textContent = current_set

                // Shows Progress
                let progress_percentage = current_set / sets_amount * 100
                progress_bar[index].style.setProperty("--progress", `${progress_percentage}%`)
            }

            // Continues If All Sets Are Done
            else {
                // Shows Finish Training Tab, If There Isn't Any Next Exercise
                if(index + 1 == exercises.length) {
                    exercises[index].classList.remove("active")
                    // progress_bar[index].classList.remove("active")
                    finish_training.classList.add("active")
                    return
                }

                // Adds Active Class To Next Exercise
                // exercises[index].classList.remove("active")
                // exercises[index + 1].classList.add("active")

                // Adds Active Class To Next Bar In Progress Bar
                // progress_bar[index + 1].classList.add("active")

                // Change Slides
                exercises[index].classList.remove("active")
                training_plan_break.classList.add("active") // Adds Active Class To Training Plan Break In Order To Show It
                breakTimer(index)
            }
        })
    })
})