import { getFormattedTime } from "../../utils/timer.js"
import { getDayName } from "../../utils/getDayName.js"
import { randomColor } from "../../utils/randomColor.js"
import { sendPOST } from "../../services/sendPOST.js"

// Chart
// import ChartDataLabels from "chartjs-plugin-datalabels"
// import type { Chart as ChartType } from "chart.js"
// import type { ScriptableContext } from "chart.js"
// declare const Chart: typeof import("chart.js").Chart

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    interface exercise {
        exercise:string,
        elapsed_time:number,
        color:string
    }

    // VARIABLES

    // Playback
    const play:HTMLAnchorElement = document.querySelector(".activity .record_activity .buttons .play") as HTMLAnchorElement 
    const play_appearance:HTMLElement = play.querySelector("i") as HTMLElement  // Gets Play Button Icon (fa-play / fa-pause)

    // Training Plan
    const training_plan:HTMLDivElement = document.querySelector(".activity .training_plan_container .training_plan") as HTMLDivElement // Gets Training Plan

    const start_training:HTMLDivElement = training_plan.querySelector(".start_training") as HTMLDivElement // Gets Start Training Tab
    const break_between_sets:HTMLDivElement = training_plan.querySelector(".break") as HTMLDivElement // Gets Break Between Sets Tab
    const finish_training:HTMLDivElement = training_plan.querySelector(".finish_training") as HTMLDivElement // Gets Finish Training Tab

    // Exercises
    const all_exercises:NodeListOf<HTMLDivElement> = training_plan.querySelectorAll<HTMLDivElement>(".exercise") // Gets All Exercises From All Training Plans

    // Stores All Possible Training Plan Types Of The User To An Array (For Example ["Pull", "Push", "Legs"])
    let all_training_plan_types:string[] = [
        ...new Set([...all_exercises].map(function(one_exercise:HTMLDivElement):string {
            return `${one_exercise.dataset.type} - ${getDayName(Number(one_exercise.dataset.day))}`
        }))
    ]

    let active_training_plan_type_index:number = 0 // Index Key From All Training Plan Types Array (By Default Is Selected First Training Plan Type With Index Of 0)
    let training_plan_type:string|undefined = all_training_plan_types[active_training_plan_type_index] // Selected Training Plan Type (For Example "Pull")

    let exercises:HTMLDivElement[]|null = null // All Exercises From The Selected Training Plan

    // Progress Bar
    const progress_bar:HTMLDivElement = document.querySelector(".activity .training_plan_container .training_plan .progress_bar") as HTMLDivElement // Gets Progress Bar
    let progress_bars:NodeListOf<HTMLDivElement>|null = null // Gets All Bars From The Progress Bar

    let all_sets:number|null = null // Gets Total Amount Of Sets From All Exercises

    const min_red:number = 82 // Final Progress Bar Color rgb(82, 207, 32)
    let red:number = 255 // Start Progress Bar Color rgb(255, 207, 32)

    let active_exercise_index:number = 0 // Exercise Index With Active Class

    // Activity Timer
    let activity_timer_interval:number|null = null
    let activity_timer_elapsed_time:number = 0 // Seconds

    // Gained XP
    let gained_xp:number = 0
    let xp_boost_remaining_time:number = 600 // 10 Minutes XP Boost (Default 0)
    let xp_boost:number = 2 // 2 Times XP Boost (Default 1)

    const current_activity_info:HTMLParagraphElement = document.querySelector(".activity .current_activity_info") as HTMLParagraphElement // Gets Current Activity Info

    xp_boost === 1 ? current_activity_info.textContent = "Žiadne aktívne navýšenia XP" : current_activity_info.textContent = `${xp_boost}x XP` // Displays Info About XP Boost

    // Break Timer
    let break_timer_interval:number|null = null

    let max_break_remaining_time:number = 120 // 2 Minutes
    let break_remaining_time:number = 120

    // Summary
    const average_activity_time:HTMLSpanElement = document.querySelector(".activity .previous_activity .average_activity_time") as HTMLSpanElement // Gets Average Activity Value

    const activity_summary:HTMLDivElement = document.querySelector(".activity_summary") as HTMLDivElement // Gets Activity Summary

    const main_summary:HTMLParagraphElement = activity_summary.querySelector(".main_summary") as HTMLParagraphElement // Gets Main Summary
    const weekly_activity_chart:HTMLDivElement = activity_summary.querySelector(".weekly_activity_chart") as HTMLDivElement // Gets Weekly Summary Chart
    // let bar_chart:ChartType<"bar">|null = null

    const training_plan_summary:HTMLParagraphElement = activity_summary.querySelector(".training_plan_summary") as HTMLParagraphElement // Gets Training Plan Summary
    const training_plan_summary_chart:HTMLDivElement = activity_summary.querySelector(".training_plan_summary_chart") as HTMLDivElement // Gets Training Plan Summary Chart
    // let doughnut_chart:ChartType<"doughnut">|null = null

    let exercises_summary:exercise[] = []

    let exercises_elapsed_time:number = 0
    let total_exercises_elapsed_time:number = 0

    // FUNCTIONS

    // General Functions
    function trainingPlanProgress():{
        set_progress:NodeListOf<HTMLSpanElement>,
        current_set:number,
        sets_amount:number,
        progress_percentage:number
    }|undefined {
        if(!exercises) return

        const set_progress:NodeListOf<HTMLSpanElement> = exercises[active_exercise_index]!.querySelectorAll<HTMLSpanElement>(".sets span") // Gets Set Progress Of Active Exercise
        let current_set:number = parseInt(set_progress[0]!.textContent) || 1 // Gets Current Set Value
        const sets_amount:number = parseInt(set_progress[1]!.textContent) || 1 // Gets Total Amount Of Sets Of The Active Exercise

        let progress_percentage:number = current_set / sets_amount * 100 // Calculates Set Progress Percentage

        // Progress Bar
        if(!progress_bars) return

        progress_bars[active_exercise_index]!.classList.add("active"); // Shows Progress Bar
        progress_bars[active_exercise_index]!.style.setProperty("--progress", `${progress_percentage}%`) // Shows Progress In Progress Bar

        // Changes Progress Bar Color
        if(Math.ceil(red) >= min_red) {
            progress_bars.forEach(function(one_bar:HTMLDivElement):void {
                one_bar.style.setProperty("--progress-color", `rgb(${red}, 207, 32)`) // Changes Color For Every Bar
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

    function setDefaults():void {
        // Stops Activity Timer
        if(activity_timer_interval !== null) {
            clearInterval(activity_timer_interval)
            activity_timer_interval = null 
        }

        // Resets Default Values

        training_plan.style.display = "block"; // Shows Training Plan
        // exercises[active_exercise_index].classList.remove("active") // Hides Exercise With Active Class

        (previous_training_plan[0] as HTMLDivElement).style.display = "block"; // Hides Previous Training Plan Button
        (previous_training_plan[1] as HTMLDivElement).style.display = "block"; // Hides Previous Training Plan Button
        (next_training_plan[0] as HTMLDivElement).style.display = "block"; // Hides Next Next Training Button
        (next_training_plan[1] as HTMLDivElement).style.display = "block" // Hides Next Next Training Button

        exercises!.forEach(function(one_exercise:HTMLDivElement):void {
            one_exercise.classList.remove("active") // Hides All Exercises
        })

        finish_training.classList.remove("active") // Hides Finish Training Tab
        start_training.classList.add("active") // Shows Start Training Tab
        
        break_between_sets.classList.remove("active") // Hides Break Between Sets Tab

        // Stops Break Timer
        if(break_timer_interval !== null) {
            clearInterval(break_timer_interval)
            break_timer_interval = null
        }

        max_break_remaining_time = 120 // Sets Max Break Remaining Time Back To Default
        break_remaining_time = 120 // Sets Max Break Remaining Time Back To Default

        // Sets Current Set Back To 1
        exercises!.forEach(function(one_exercise:HTMLDivElement):void {
            one_exercise.querySelectorAll<HTMLSpanElement>(".sets span")[0]!.textContent = "1"
        })

        // Progress Bar
        progress_bars!.forEach(function(one_bar:HTMLDivElement):void {
            one_bar.classList.add("active") // Deletes Active Class From Progress Bars
            one_bar.style.setProperty("--progress", "0%") // Set Progress Bar Progress Back to 0%
        })

        red = 255

        active_exercise_index = 0 // Sets Active Exercise Index To Default

        // Sets Training Plan Summary To Default
        training_plan_summary.style.display = "none" // Hides Training Plan Summary
        training_plan_summary_chart.style.display = "none" // Hides Training Plan Summary Chart
        training_plan_summary.innerHTML = "" // Deletes Everything From Training Plan Summary
    }

    // Activity
    const activity_timer:HTMLHeadingElement = document.querySelector(".activity .record_activity .timer") as HTMLHeadingElement // Gets Activity Timer

    function startActivity():void {
        // Hides Training Plan If Activity Was Already Started With The Playback Play Button
        if(play_appearance.classList.contains("fa-pause") && start_training.classList.contains("active")) training_plan.style.display = "none"; // Hides Training Plan

        (previous_training_plan[0] as HTMLDivElement).style.display = "none"; // Hides Previous Training Plan Button
        (previous_training_plan[1] as HTMLDivElement).style.display = "none"; // Hides Previous Training Plan Button
        (next_training_plan[0] as HTMLDivElement).style.display = "none"; // Hides Next Next Training Button
        (next_training_plan[1] as HTMLDivElement).style.display = "none" // Hides Next Next Training Button
        
        activity_summary.style.display = "none" // Hides Activity Summary

        // Deletes Existing Summary Charts
        // if(bar_chart) {
        //     bar_chart.destroy()
        //     bar_chart = null
        // }

        // if(doughnut_chart) {
        //     doughnut_chart.destroy()
        //     doughnut_chart = null
        // }

        activity_timer_interval = setInterval(function() {
            // Activity Timer

            activity_timer_elapsed_time += 1; // Counts The Elapsed Time Since The Start Of The Activity

            // Renders Elapsed Time Values To The Activity Timer
            (activity_timer.querySelector(".hours") as HTMLSpanElement).textContent = getFormattedTime("hours", activity_timer_elapsed_time, true);
            (activity_timer.querySelector(".minutes") as HTMLSpanElement).textContent = getFormattedTime("minutes", activity_timer_elapsed_time, true);
            (activity_timer.querySelector(".seconds") as HTMLSpanElement).textContent = getFormattedTime("seconds", activity_timer_elapsed_time, true)

            // Gained XP

            xp_boost_remaining_time -= 1 // Decreases XP Boost Remaining Time Every Second
            gained_xp += 100 / 3600 * xp_boost // 1 Hour Of The Activity Gains 100XP Without XP Boost

            // Checks XP Boost Remaining Time
            if(xp_boost_remaining_time <= 0) {
                // If There Is No Active XP Boost
                xp_boost = 1
                current_activity_info.textContent = "Žiadne aktívne navýšenia XP"
            }

            else current_activity_info.textContent = `${xp_boost}x XP` // If There Is An Active XP Boost

            if(!exercises) return

            // Starts Counting Elapsed Time For The Current Active Exercise In The Training Plan
            if(exercises[active_exercise_index]!.classList.contains("active")) {
                const exercise_name = (exercises[active_exercise_index]!.querySelector("h3") as HTMLHeadingElement).textContent // Gets Active Exercise Name

                exercises_elapsed_time += 1 // Increments Exercises Elapsed Time
                total_exercises_elapsed_time += 1 // Increments Total Exercises Elapsed Time

                // Returns Exercise Name Which Is Already In Exercises Summary Array
                const existing_exercise = exercises_summary.find(function(one_exercise:exercise):boolean {
                    return one_exercise.exercise === exercise_name
                })
                
                if(existing_exercise) existing_exercise.elapsed_time = exercises_elapsed_time // Updated Only Elapsed Time For Existing Exercise

                // Creates New Object For Unexisting Exercise
                else {
                    exercises_elapsed_time = 1 // Reset Exercise Elapsed Time

                    // Creates Exercise Object
                    const exercise_object:exercise = {
                        exercise: exercise_name,
                        elapsed_time: exercises_elapsed_time,
                        color: randomColor(128, 255)
                    }

                    exercises_summary.push(exercise_object) // Fills Exercise Summary Array With Object
                }
            }
        }, 1000)
    }

    function pauseActivity():void {
        // Stops Activity Timer
        if(activity_timer_interval !== null) {
            clearInterval(activity_timer_interval)
            activity_timer_interval = null
        }
    }

    function stopActivity():void {
        setDefaults()

        if(!average_activity_time.dataset.average_activity_time || !weekly_activity_chart.dataset.activities || !exercises) return

        // Only Executed If The Activity Timer Has Been Started
        if(activity_timer_elapsed_time >= 1) {
            gained_xp = Math.round(gained_xp) // Rounds Gained XP Value

            // Sends POST Data
            const new_activity_data:{
                formatted_elapsed_time:string,
                elapsed_time:number,
                gained_xp:number,
                type:string|null
            } = {
                formatted_elapsed_time: `${getFormattedTime("hours", activity_timer_elapsed_time, true)}h ${getFormattedTime("minutes", activity_timer_elapsed_time, true)}m ${getFormattedTime("seconds", activity_timer_elapsed_time, true)}s`,
                elapsed_time: activity_timer_elapsed_time,
                gained_xp: gained_xp,
                type: null
            } // Stores All New Activity Data
            
            if(exercises && exercises[0] && exercises_summary.length > 0) new_activity_data.type = exercises[0].dataset.type || null // Sends Type Of Training If Activity Was Started With Training Plan

            sendPOST("/training-session", new_activity_data)

            // Activity Summary

            activity_summary.style.display = "flex" // Shows Activity Summary

            // Main Summary Text
            gained_xp == 0 ? main_summary.innerHTML = `Nezískali ste žiadne XP` : main_summary.innerHTML = `Získali ste: <span style="color: #52cf20">${gained_xp}XP</span>` // Renders Text For Earned XP

            main_summary.innerHTML += "<br>Aktuálna aktivita trvala: "

            // Displays The Main Summary Text Of The Activity Summary In Green
            if(activity_timer_elapsed_time >= parseInt(average_activity_time.dataset.average_activity_time)) {
                if(parseInt(average_activity_time.dataset.average_activity_time) === 0) {
                    main_summary.innerHTML += `
                        <span style="color: #52cf20">
                            ${getFormattedTime("hours", activity_timer_elapsed_time)}h ${getFormattedTime("minutes", activity_timer_elapsed_time)}m ${getFormattedTime("seconds", activity_timer_elapsed_time)}s

                            <span class="tooltip" data-tooltip="Čas aktuálnej aktivity bol o 100% dlhší ako priemer za posledných 7 dní">
                                (+100%)
                            </span>
                        </span>
                    `
                }

                else {
                    main_summary.innerHTML += `
                        <span style="color: #52cf20">
                            ${getFormattedTime("hours", activity_timer_elapsed_time)}h ${getFormattedTime("minutes", activity_timer_elapsed_time)}m ${getFormattedTime("seconds", activity_timer_elapsed_time)}s

                            <span class="tooltip" data-tooltip="Čas aktuálnej aktivity bol o ${((activity_timer_elapsed_time / parseInt(average_activity_time.dataset.average_activity_time) * 100) - 100).toFixed(2).replace(".", ",")}% dlhší ako priemer za posledných 7 dní">
                                (+${((activity_timer_elapsed_time / parseInt(average_activity_time.dataset.average_activity_time) * 100) - 100).toFixed(2).replace(".", ",")}%)
                            </span>
                        </span>
                    `
                }
            }

            // Displays The Main Summary Text Of The Activity Summary In Red
            else {
                main_summary.innerHTML += `
                    <span style="color: #df3535">
                        ${getFormattedTime("hours", activity_timer_elapsed_time)}h ${getFormattedTime("minutes", activity_timer_elapsed_time)}m ${getFormattedTime("seconds", activity_timer_elapsed_time)}s

                        <span class="tooltip" data-tooltip="Čas aktuálnej aktivity bol o ${(100 - (activity_timer_elapsed_time / parseInt(average_activity_time.dataset.average_activity_time) * 100)).toFixed(2).replace(".", ",")}% kratší ako priemer za posledných 7 dní">
                            (-${(100 - (activity_timer_elapsed_time / parseInt(average_activity_time.dataset.average_activity_time) * 100)).toFixed(2).replace(".", ",")}%)
                        </span>
                    </span>
                `
            }

            // Weekly Activity Chart
            let weekly_activity:{
                day:string,
                total_elapsed_time:number
            }[] = JSON.parse(weekly_activity_chart.dataset.activities) // Gets Weekly Activity Parsed Data

            // Gets Each Data From Weekly Activity Parsed Data
            const labels:string[] = weekly_activity.map(one_item => one_item.day) // Gets Days As Labels
            const data:number[] = weekly_activity.map(one_item => one_item.total_elapsed_time) // Gets Data As Total Elapsed Time Value For Each Day

            // Function To Set Theme Of Bars In The Chart Based On Values
            function setBarTheme(value:number):{
                backgroundColor:string,
                borderColor:string,
                borderWidth:number
            } {
                // Sets Bar Theme To Green
                return value !== 0
                ? {
                    backgroundColor: "rgb(195, 240, 175)",
                    borderColor: "#52cf20",
                    borderWidth: 1,
                }
                
                // Sets Bar Theme To Red
                : {
                    backgroundColor: "#df3535",
                    borderColor: "#df3535",
                    borderWidth: 0,
                }
            }

            // Creates Chart
            // bar_chart = new Chart<"bar">((weekly_activity_chart.querySelector("canvas") as HTMLCanvasElement), {
            //     type: "bar",

            //     data: {
            //         labels: labels,
            //         datasets: [{
            //             data: data, // Seconds
            //             borderRadius: 0,
            //             minBarLength: 2,
            //             backgroundColor: (chart:ScriptableContext<"bar">) => setBarTheme(chart.raw as number).backgroundColor,
            //             hoverBackgroundColor: (chart:ScriptableContext<"bar">) => setBarTheme(chart.raw as number).backgroundColor,
            //             borderColor: (chart:ScriptableContext<"bar">) => setBarTheme(chart.raw as number).borderColor,
            //             hoverBorderColor: (chart:ScriptableContext<"bar">) => setBarTheme(chart.raw as number).borderColor,
            //             borderWidth: (chart:ScriptableContext<"bar">) => setBarTheme(chart.raw as number).borderWidth,
            //             hoverBorderWidth: (chart:ScriptableContext<"bar">) => setBarTheme(chart.raw as number).borderWidth,
            //         }],
            //     },

            //     options: {
            //         animation: false,

            //         scales: {
            //             y: {
            //                 display: false,
            //             },

            //             x: {
            //                 ticks: {
            //                     color: "#ffffff",

            //                     font: {
            //                         family: "'Balsamiq Sans', sans-serif",
            //                         size: 15,
            //                     },
            //                 },

            //                 grid: {
            //                     display: false,
            //                 },
            //             },
            //         },

            //         plugins: {
            //             legend: {
            //                 display: false
            //             },

            //             tooltip: {
            //                 enabled: false
            //             },

            //             datalabels: {
            //                 anchor: "end",
            //                 align: "bottom",
            //                 color: "#52cf20",

            //                 font: {
            //                     family: "'Balsamiq Sans', sans-serif",
            //                     size: 12
            //                 },
                            
            //                 // Creates Floating Labels
            //                 formatter: function(value:number) {
            //                     return value === 0 ? "" : `${getFormattedTime("hours", value)}h ${getFormattedTime("minutes", value)}m`
            //                 },
            //             },
            //         },
            //     },

            //     plugins: [ChartDataLabels],
            // })

            weekly_activity_chart.style.display = "block" // Shows Weekly Summary Chart
            weekly_activity_chart.style.animation = "fade_in_animation 1s ease-out" // Adds Animation For Weekly Summary Summary Chart

            // Training Plan Summary
            if(exercises_summary.length > 0) {
                training_plan_summary.style.display = "block" // Shows Training Plan Summary
                training_plan_summary_chart.style.display = "block" // Shows Training Plan Summary Chart
                // training_plan_summary_chart.dataset.trainingPlanType = training_plan_type // Shows Training Plan Type In The Chart
                training_plan_summary_chart.style.animation = "fade_in_scale_animation 1s ease-out" // Adds Animation For Training Plan Summary Chart

                // Training Plan Summary Text
                exercises_summary.forEach(function(one_exercise:exercise):void {
                    training_plan_summary.innerHTML += `<br><span style="color: ${one_exercise.color}">${one_exercise.exercise}: ${getFormattedTime("hours", one_exercise.elapsed_time)}h ${getFormattedTime("minutes", one_exercise.elapsed_time)}m ${getFormattedTime("seconds", one_exercise.elapsed_time)}s (${(one_exercise.elapsed_time / total_exercises_elapsed_time * 100).toFixed(2).replace(".", ",")}%)</span>`
                })

                // If The Training Plan Wasn't Completed By The End
                if(exercises_summary.length < exercises.length) {
                    // Gets An Array Of All Exercise Names In A Training Plan
                    const exercises_names:string[] = Array.from(exercises).map(function(one_exercise:HTMLDivElement):string {
                        return (one_exercise.querySelector("h3") as HTMLHeadingElement).textContent
                    })
                    
                    // Gets An Array Of All Exercise Names From The Exercises Summary
                    const exercises_summary_names:string[] = exercises_summary.map(function(one_exercise:exercise):string {
                        return one_exercise.exercise
                    })

                    // Gets An Array Of All Unfinished Exercises From The Training Plan
                    const unfinished_exercises:string[] = exercises_names.filter(function(one_exercise:string):boolean {
                        return !exercises_summary_names.includes(one_exercise)
                    })

                    unfinished_exercises.forEach(function(one_exercise:string):void {
                        training_plan_summary.innerHTML += `<br>${one_exercise}: 0h 0m 0s (0,00%)`
                    })
                }

                // Training Plan Summary Chart
                // Gets Data From Exercise Summary Array
                const data:number[] = exercises_summary.map(one_item => one_item.elapsed_time) // Gets Elapsed Time For Each Exercise From Exercises Summary
                const colors:string[] = exercises_summary.map(one_item => one_item.color) // Gets Color For Each Exercise From Exercises Summary

                // Creates Chart
                // doughnut_chart = new Chart((training_plan_summary_chart.querySelector("canvas") as HTMLCanvasElement), {
                //     type: "doughnut",

                //     data: {
                //         datasets: [{
                //             data: data,
                //             backgroundColor: colors,
                //             hoverBackgroundColor: colors,
                //             borderColor: "#ffffff",
                //             hoverBorderColor: "#ffffff",
                //             borderWidth: 2,
                //             hoverBorderWidth: 2,
                //             borderRadius: 5,
                //             offset: 10,
                //         }],

                //         labels: [],
                //     },

                //     options: {
                //         plugins: {
                //             legend: {
                //                 display: false
                //             },

                //             tooltip: {
                //                 enabled: false
                //             }
                //         },

                //         cutout: "50%",
                //         responsive: true,
                //         maintainAspectRatio: false,
                //         animation: false,
                //     },                      
                // })

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
            gained_xp = 0; // Sets Gained XP Back To 0

            // Sets Activity Timer Default Texts
            (activity_timer.querySelector(".hours") as HTMLSpanElement).textContent = "00";
            (activity_timer.querySelector(".minutes") as HTMLSpanElement).textContent = "00";
            (activity_timer.querySelector(".seconds") as HTMLSpanElement).textContent = "00"
        }
    }

    // Training Plan
    function startTraining():void {
        if(!exercises || !progress_bars) return

        start_training.classList.remove("active"); // Hides Start Training Tab
        (exercises[0] as HTMLDivElement).classList.add("active") // Shows First Exercise

        // Change Buttons - Shows Pause Button
        play_appearance.classList.remove("fa-play")
        play_appearance.classList.add("fa-pause")

        startActivity();

        ((progress_bars[active_exercise_index] as HTMLDivElement).nextSibling as HTMLDivElement).style.opacity = "0" // Hides Progress Bar Label

        // Shows Progress In Progress Bar

        let { progress_percentage } = trainingPlanProgress() ?? {}
        all_sets ? red -= (255 - min_red) / (all_sets - 1) : red-= 0 // Makes Color Transition For Progress Bar From rgb(255, 207, 32) To rgb(82, 207, 32)
    }

    function breakBetweenSets():void {
        if(!exercises) return

        // Change Tabs
        (exercises[active_exercise_index] as HTMLDivElement).classList.remove("active") // Hides Current Active Exercise
        break_between_sets.classList.add("active") // Shows Break Between Sets Tab
        
        // Break Timer
        const break_timer:HTMLParagraphElement = break_between_sets.querySelector(".break_timer p") as HTMLParagraphElement // Gets Break Timer

        // Progress Circle
        const progress_circle:HTMLElement = break_between_sets.querySelector("svg .progress") as HTMLElement
        const radius:number = Number(progress_circle.getAttribute("r"))
        const circum_ference:number = 2 * Math.PI * radius // 251.32741228718345
        progress_circle.style.strokeDasharray = String(circum_ference)

        // Timer Interval (100MS)
        break_timer_interval = setInterval(function():void {
            // Checks If There Is Still Some Remaining Time
            if(break_remaining_time <= 0) {
                // Stops Break Timer
                if(break_timer_interval) {
                    clearInterval(break_timer_interval)
                    break_timer_interval = null
                }

                max_break_remaining_time = 120 // Sets Max Break Remaining Time Back To Default
                break_remaining_time = 120 // Sets Max Break Remaining Time Back To Default

                nextExercise()

                break_between_sets.classList.remove("active") // Hides Break Between Sets Tab
            }

            else {
                // Changes Timer Color To Red If Remaining Time Is Less Than 10 Seconds
                break_remaining_time <= 10 ? break_timer.style.color = "#df3535" : break_timer.style.color = "#ffffff";

                // Break Timer
                (break_timer.querySelector(".minutes") as HTMLSpanElement).textContent = getFormattedTime("minutes", Math.round(break_remaining_time));
                (break_timer.querySelector(".seconds") as HTMLSpanElement).textContent = getFormattedTime("seconds", Math.round(break_remaining_time), true)

                // Progress Circle
                progress_circle.style.strokeDashoffset = String(circum_ference / max_break_remaining_time * break_remaining_time) // Updates Progress Circle Length

                const progress_circle_red:number = 255 - (255 / max_break_remaining_time * break_remaining_time) // Increases Red Color In Palette
                const progress_circle_green:number = 255 / max_break_remaining_time * break_remaining_time // Decreases Green Color In Palette

                progress_circle.style.stroke = `rgb(${progress_circle_red}, ${progress_circle_green}, 0)` // Updates Progress Circle Color
                progress_circle.style.filter = `drop-shadow(0px 0px 5px rgb(${progress_circle_red}, ${progress_circle_green}, 0))` // Updates Progress Circle Shadow Color
                progress_circle.style.webkitFilter = `drop-shadow(0px 0px 5px rgb(${progress_circle_red}, ${progress_circle_green}, 0))` // Updates Progress Circle Shadow Color

                break_remaining_time -= 0.1

                // Changes Preferences After Adding Time
                if(break_remaining_time > max_break_remaining_time) {
                    progress_circle.style.strokeDashoffset = String(circum_ference) // Sets Progress In Progress Circle On The Start

                    max_break_remaining_time = break_remaining_time // Changes Maximum Value Of Break Timer Remaining Time
                }
            }
        }, 100)
    }

    function nextExercise():void {
        if(!exercises) return

        // Unpause Activity If Is Paused
        if(play_appearance.classList.contains("fa-play")) {
            // Change Buttons - Shows Pause Button
            play_appearance.classList.remove("fa-play")
            play_appearance.classList.add("fa-pause")

            startActivity()
        }

        let { set_progress, current_set, sets_amount } = trainingPlanProgress() ?? {} // Gets Current Set Progress

        if(!set_progress || !current_set || !sets_amount) return

        // Updates Set Progress
        if(current_set < sets_amount) {
            // Updates Reps Amount For Every Set
            const reps = exercises[active_exercise_index]!.querySelector(".reps") as HTMLParagraphElement

            if(!reps.dataset.periods) return

            const periods:number[] = JSON.parse(reps.dataset.periods)

            if(periods[current_set] === 0) reps.textContent = "Do zlyhania"
            
            // Sets The Correct Unit Based On The Reps Or Seconds
            else {
                if(reps.dataset.unit === "reps") reps.textContent = `${periods[current_set]}x`
                if(reps.dataset.unit === "seconds") reps.textContent = `${periods[current_set]}s`
            }

            // Updates Set Amount
            current_set += 1; // Increases Current Set Value
            (set_progress[0] as HTMLSpanElement).textContent = String(current_set) // Displays Current Set Value

            // Shows Progress In Progress Bar
            let { progress_percentage } = trainingPlanProgress() ?? {}
            all_sets ? red -= (255 - min_red) / (all_sets - 1) : red-= 0 // Makes Color Transition For Progress Bar From rgb(255, 207, 32) To rgb(82, 207, 32)
        }

        else {
            // Changes Exercises Only If There Is Still Any Left
            if(active_exercise_index < exercises.length - 1) {
                if(!progress_bars) return

                // Shows Break Between Sets Only If There Is No Active Break Between Sets Tab, Only If There Is Still Any Exercise Left And If Current Set Is Equal Sets Amount In Current Active Exercise
                if(!break_between_sets.classList.contains("active")) {
                    breakBetweenSets();

                    // Shows Progress Bar Label
                    ((progress_bars[active_exercise_index + 1] as HTMLDivElement).nextSibling as HTMLDivElement).textContent = ((exercises[active_exercise_index + 1] as HTMLDivElement).querySelector("h3") as HTMLHeadingElement).textContent;
                    ((progress_bars[active_exercise_index + 1] as HTMLDivElement).nextSibling as HTMLDivElement).style.opacity = "1"
                }

                else {
                    // Changes Exercises
                    (exercises[active_exercise_index] as HTMLDivElement).classList.remove("active"); // Hides Current Active Exercise
                    (exercises[active_exercise_index + 1] as HTMLDivElement).classList.add("active") // Shows Next Exercise
                    active_exercise_index += 1; // Changes Active Exercise Index

                    ((progress_bars[active_exercise_index] as HTMLDivElement).nextSibling as HTMLDivElement).style.opacity = "0" // Hides Progress Bar Label

                    // Shows Progress In Progress Bar
                    let { progress_percentage } = trainingPlanProgress() ?? {}
                    all_sets ? red -= (255 - min_red) / (all_sets - 1) : red-= 0 // Makes Color Transition For Progress Bar From rgb(255, 207, 32) To rgb(82, 207, 32)
                }
            }

            // Shows Finish Training Tab If There Are No Exercises Left
            else {
                (exercises[active_exercise_index] as HTMLDivElement).classList.remove("active") // Hides Exercise With Active Class
                finish_training.classList.add("active") // Shows Finish Training Tab
            }
        }
    }

    function finishTraining():void {
        stopActivity()
    }

    // BUTTONS

    // Playback

    const stop:HTMLAnchorElement = document.querySelector(".activity .record_activity .buttons .stop") as HTMLAnchorElement

    // Play
    play.addEventListener("click", function():void {
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
    stop.addEventListener("click", function():void {
        // Change Buttons - Shows Play Button
        play_appearance.classList.remove("fa-pause")
        play_appearance.classList.add("fa-play")

        stopActivity()
    })

    // Training Plan

    // Choose Training Plan
    const previous_training_plan:NodeListOf<HTMLDivElement> = document.querySelectorAll<HTMLDivElement>(".training_plan_container .previous_training_plan") // Gets Previous Training Plan Button
    const next_training_plan:NodeListOf<HTMLDivElement> = document.querySelectorAll<HTMLDivElement>(".training_plan_container .next_training_plan") // Gets Next Training Plan Button

    // Function For Set Training Plan
    function setTrainingPlanType():void {
        if(!training_plan_type) return

        exercises = [] // Deletes Every Exercise From Exercises

        if(play_appearance.classList.contains("fa-pause")) {
            // Change Buttons - Shows Play Button
            play_appearance.classList.remove("fa-pause")
            play_appearance.classList.add("fa-play")
        }
        
        // Sets New Exercises For Selected Training Plan Type
        all_exercises.forEach(function(one_exercise:HTMLDivElement):void {
            if(`${one_exercise.dataset.type} - ${getDayName(Number(one_exercise.dataset.day))}` === training_plan_type) {
                if(exercises !== null) exercises.push(one_exercise)
            }
        })

        progress_bar.innerHTML = "" // Deletes All Bars From Progress Bar

        // Creates Bars By Amount Of Total Exercises In Selected Training
        for(let i:number = 0; i <= exercises.length - 1; i++) {
            // Creates Containers
            const container:HTMLDivElement = document.createElement("div")
            container.classList.add("container")
            progress_bar.appendChild(container)

            // Creates Bars
            const bar:HTMLDivElement = document.createElement("div")
            bar.classList.add("bar")
            container.appendChild(bar)

            // Creates Labels
            const label:HTMLParagraphElement = document.createElement("p")
            label.classList.add("label")
            // label.textContent = exercises[i].querySelector("h3").textContent // Gets Exercise Name
            container.appendChild(label)
        }

        (start_training.querySelector(".type") as HTMLParagraphElement).textContent = training_plan_type.toUpperCase(); // Sets Training Plan Type In The Start Training Tab
        (finish_training.querySelector(".type") as HTMLParagraphElement).textContent = training_plan_type.toUpperCase(); // Sets Training Plan Type In The Finish Training Tab
        
        progress_bars = document.querySelectorAll<HTMLDivElement>(".activity .training_plan_container .training_plan .progress_bar .bar"); // Gets All Bars From The Progress Bar

        // Shows Progress Bar Label
        ((progress_bars[active_exercise_index] as HTMLDivElement).nextSibling as HTMLDivElement).textContent = ((exercises[active_exercise_index] as HTMLDivElement).querySelector("h3") as HTMLHeadingElement).textContent;
        ((progress_bars[active_exercise_index] as HTMLDivElement).nextSibling as HTMLDivElement).style.opacity = "1"

        all_sets = [...exercises].reduce((sum:number, one_exercise:HTMLDivElement) => sum + parseInt((one_exercise.querySelector(".sets span:last-child") as HTMLSpanElement).textContent), 0) // Gets Total Amount Of Sets From All Exercises
    }

    setTrainingPlanType() // Sets Default Training Plan

    // Previous Training Plan
    previous_training_plan.forEach(function(one_button:HTMLDivElement):void {
        one_button.addEventListener("click", function():void {
            // Decreases Index Value If Index Of Active Training Plan Type Is Higher Than Minimum Possible Index
            active_training_plan_type_index > 0 ? active_training_plan_type_index -= 1 : active_training_plan_type_index = all_training_plan_types.length - 1

            training_plan_type = all_training_plan_types[active_training_plan_type_index] // Sets New Training Plan Type

            // Shows Blur Animation Between Change Of Training Plans
            training_plan.classList.remove("blur")
            void training_plan.offsetWidth
            training_plan.classList.add("blur")

            // Resets Default Values
            setDefaults()

            activity_timer_elapsed_time = 0 // Sets Elapsed Time Back To 0
            gained_xp = 0; // Sets Gained XP Back To 0

            // Sets Activity Timer Default Texts
            (activity_timer.querySelector(".hours") as HTMLSpanElement).textContent = "00";
            (activity_timer.querySelector(".minutes") as HTMLSpanElement).textContent = "00";
            (activity_timer.querySelector(".seconds") as HTMLSpanElement).textContent = "00"

            exercises_summary = [] // Sets Exercises Summary To Default
            total_exercises_elapsed_time = 0 // Sets Total Exercises Elapsed Time To Default

            setTrainingPlanType() // Sets New Training Plan
        })
    })

    // Next Training Plan
    next_training_plan.forEach(function(one_button:HTMLDivElement):void {
        one_button.addEventListener("click", function():void {
            // Increases Index Value If Index Of Active Training Plan Type Is Less Than Maximum Possible Index
            active_training_plan_type_index < all_training_plan_types.length - 1 ? active_training_plan_type_index += 1 : active_training_plan_type_index = 0

            training_plan_type = all_training_plan_types[active_training_plan_type_index] // Sets New Training Plan Type

            // Shows Blur Animation Between Change Of Training Plans
            training_plan.classList.remove("blur")
            void training_plan.offsetWidth
            training_plan.classList.add("blur")

            // Resets Default Values
            setDefaults()

            activity_timer_elapsed_time = 0 // Sets Elapsed Time Back To 0
            gained_xp = 0; // Sets Gained XP Back To 0

            // Sets Activity Timer Default Texts
            (activity_timer.querySelector(".hours") as HTMLSpanElement).textContent = "00";
            (activity_timer.querySelector(".minutes") as HTMLSpanElement).textContent = "00";
            (activity_timer.querySelector(".seconds") as HTMLSpanElement).textContent = "00"

            exercises_summary = [] // Sets Exercises Summary To Default
            total_exercises_elapsed_time = 0 // Sets Total Exercises Elapsed Time To Default

            setTrainingPlanType() // Sets New Training Plan
        })
    })

    // Start Training
    const start_training_button:HTMLDivElement = start_training.querySelector(".start_training_button") as HTMLDivElement
    
    start_training_button.addEventListener("click", startTraining)

    // Finish Training
    const finish_training_button:HTMLDivElement = finish_training.querySelector(".finish_training_button") as HTMLDivElement

    finish_training_button.addEventListener("click", function():void {
        // Change Buttons - Shows Play Button
        play_appearance.classList.remove("fa-pause")
        play_appearance.classList.add("fa-play")

        finishTraining()
    })

    // Next Exercise
    training_plan.addEventListener("click", function(event:PointerEvent):void {
        const next_exercise_button = (event.target as HTMLDivElement).closest(".next_exercise_button")
        if(!next_exercise_button) return

        nextExercise()
    })

    // Break Between Sets

    // Skip To The Next Exercise
    const skip_break_button:HTMLDivElement = break_between_sets.querySelector(".skip_break_button") as HTMLDivElement

    skip_break_button.addEventListener("click", function():void {
        // Stops Break Timer
        if(break_timer_interval) {
            clearInterval(break_timer_interval)
            break_timer_interval = null
        }

        max_break_remaining_time = 120 // Sets Max Break Remaining Time Back To Default
        break_remaining_time = 120 // Sets Max Break Remaining Time Back To Default

        nextExercise()

        break_between_sets.classList.remove("active") // Hides Break Between Sets Tab
    })

    // Add Time Button
    const add_time:HTMLDivElement = break_between_sets.querySelector(".add_time") as HTMLDivElement
    const add_time_message:HTMLParagraphElement = add_time.querySelector(".add_time_message") as HTMLParagraphElement

    add_time.addEventListener("click", function():void {
        break_remaining_time += 30 // Adds 30 Seconds On Timer

        // Shows Animated Text
        add_time_message.classList.remove("animate")
        void add_time_message.offsetWidth
        add_time_message.classList.add("animate")
    })
})