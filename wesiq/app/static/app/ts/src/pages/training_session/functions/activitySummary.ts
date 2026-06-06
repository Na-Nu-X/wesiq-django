import { 
    type exercise, 
    charts 
} from "../state.js"

import { getFormattedTime } from "../../../utils/timer.js"

// Chart JS
declare const Chart: any
declare const ChartDataLabels: any

import type { 
    ScriptableContext, 
    ChartTypeRegistry 
} from "chart.js"

declare module 'chart.js' {
    interface PluginOptionsByType<TType extends keyof ChartTypeRegistry> {
        datalabels?: any
    }
}

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

// Function For Render Activity Summary
export function renderActivitySummary(elapsed_time:number, gained_xp:number):void {
    const activity_summary:HTMLDivElement = document.querySelector(".activity_summary") as HTMLDivElement // Gets The Activity Summary
    const main_summary:HTMLParagraphElement = activity_summary.querySelector(".main_summary") as HTMLParagraphElement // Gets The Main Summary
    const weekly_activity_chart:HTMLDivElement = activity_summary.querySelector(".weekly_activity_chart") as HTMLDivElement // Gets The Weekly Activity Chart
    const average_activity_time:HTMLSpanElement = document.querySelector(".activity .previous_activity .average_activity_time") as HTMLSpanElement // Gets Average Activity Time

    // Main Summary
    // interpolate(gettext("Tréningový plán %s bol odstránený."), [training_plan_title.value])
    gained_xp == 0 ? main_summary.innerHTML = gettext("Nezískali ste žiadne XP") : main_summary.innerHTML = `${gettext("Získali ste")}: <span style="color: #52cf20">${gained_xp}XP</span>` // Displays Text For Earned XP

    main_summary.innerHTML += gettext("<br>Aktuálna aktivita trvala: ")

    // Displays The Main Summary Text In Green
    if(elapsed_time >= parseInt(average_activity_time.dataset["average_activity_time"] || "0")) {
        if(parseInt(average_activity_time.dataset["average_activity_time"] || "0") === 0) {
            main_summary.innerHTML += `
                <span style="color: #52cf20">
                    ${getFormattedTime("hours", elapsed_time)}h ${getFormattedTime("minutes", elapsed_time)}m ${getFormattedTime("seconds", elapsed_time)}s

                    <span class="tooltip" data-tooltip="${gettext('Čas aktuálnej aktivity bol o 100%% dlhší ako priemer za posledných 7 dní')}">
                        (+100%)
                    </span>
                </span>
            `
        }

        else {
            main_summary.innerHTML += `
                <span style="color: #52cf20">
                    ${getFormattedTime("hours", elapsed_time)}h ${getFormattedTime("minutes", elapsed_time)}m ${getFormattedTime("seconds", elapsed_time)}s

                    <span class="tooltip" data-tooltip="${interpolate(gettext('Čas aktuálnej aktivity bol o %s%% dlhší ako priemer za posledných 7 dní'), [((elapsed_time / parseInt(average_activity_time.dataset["average_activity_time"] || "0") * 100) - 100).toFixed(2).replace(".", ",")])}">
                        (+${((elapsed_time / parseInt(average_activity_time.dataset["average_activity_time"] || "0") * 100) - 100).toFixed(2).replace(".", ",")}%)
                    </span>
                </span>
            `
        }
    }

    // Displays The Main Summary Text In Red
    else {
        main_summary.innerHTML += `
            <span style="color: #df3535">
                ${getFormattedTime("hours", elapsed_time)}h ${getFormattedTime("minutes", elapsed_time)}m ${getFormattedTime("seconds", elapsed_time)}s

                <span class="tooltip" data-tooltip="${interpolate(gettext('Čas aktuálnej aktivity bol o %s%% kratší ako priemer za posledných 7 dní'), [(100 - (elapsed_time / parseInt(average_activity_time.dataset["average_activity_time"] || "0") * 100)).toFixed(2).replace(".", ",")])}">
                    (-${(100 - (elapsed_time / parseInt(average_activity_time.dataset["average_activity_time"] || "0") * 100)).toFixed(2).replace(".", ",")}%)
                </span>
            </span>
        `
    }

    // Weekly Activity Chart

    // Gets Weekly Activity Data
    let weekly_activity_data:{
        day:string,
        total_elapsed_time:number
    }[] = JSON.parse(weekly_activity_chart.dataset["activities"] || '[{"day": "PO", "total_elapsed_time": 0}, {"day": "UT", "total_elapsed_time": 0}, {"day": "ST", "total_elapsed_time": 0}, {"day": "ŠT", "total_elapsed_time": 0}, {"day": "PI", "total_elapsed_time": 0}, {"day": "SO", "total_elapsed_time": 0}, {"day": "NE", "total_elapsed_time": 0}]')

    const last_day_index:number = weekly_activity_data.length - 1 // Gets The Last Possible Day Index

    if(weekly_activity_data[last_day_index]) weekly_activity_data[last_day_index].total_elapsed_time += elapsed_time // Stores The Elapsed Time Of The Current Activity In Order To Show Exact Chart

    // Extracts Data From Weekly Activity Data
    const labels:string[] = weekly_activity_data.map(one_item => one_item.day) // Gets Days As Labels
    const data:number[] = weekly_activity_data.map(one_item => one_item.total_elapsed_time) // Gets Total Elapsed Time For Each Day As Data

    // Creates Chart
    charts.bar_chart = new Chart((weekly_activity_chart.querySelector("canvas") as HTMLCanvasElement), {
        type: "bar",

        data: {
            labels: labels,
            
            datasets: [{
                data: data, // Seconds
                borderRadius: 0,
                minBarLength: 2,
                backgroundColor: (chart:ScriptableContext<"bar">) => setBarTheme(chart.raw as number).backgroundColor,
                hoverBackgroundColor: (chart:ScriptableContext<"bar">) => setBarTheme(chart.raw as number).backgroundColor,
                borderColor: (chart:ScriptableContext<"bar">) => setBarTheme(chart.raw as number).borderColor,
                hoverBorderColor: (chart:ScriptableContext<"bar">) => setBarTheme(chart.raw as number).borderColor,
                borderWidth: (chart:ScriptableContext<"bar">) => setBarTheme(chart.raw as number).borderWidth,
                hoverBorderWidth: (chart:ScriptableContext<"bar">) => setBarTheme(chart.raw as number).borderWidth,
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
                legend: {
                    display: false
                },

                tooltip: {
                    enabled: false
                },

                datalabels: {
                    anchor: "end",
                    align: "bottom",
                    color: "#52cf20",

                    font: {
                        family: "'Balsamiq Sans', sans-serif",
                        size: 12
                    },
                    
                    // Creates Floating Labels
                    formatter: function(value:number) {
                        return value < 60 ? "" : `${getFormattedTime("hours", value)}h ${getFormattedTime("minutes", value)}m` // Hides Labels Which Are Lower Than 1 Minute
                    },
                },
            },
        },

        plugins: [ChartDataLabels]
    })

    activity_summary.style.display = "flex" // Shows Activity Summary
    weekly_activity_chart.style.display = "block" // Shows Weekly Summary Chart
    weekly_activity_chart.style.animation = "fadeIn 1s ease-out" // Animates Weekly Summary Chart

    // Auto Scroll To Activity Summary
    window.scrollTo({
        top: activity_summary.offsetTop,
        behavior: "smooth"
    })
}

// Function For Render Training Plan Activity Summary
export function renderTrainingPlanActivitySummary(training_plan_summary_data:exercise[]):void {
    const activity_summary:HTMLDivElement = document.querySelector(".activity_summary") as HTMLDivElement // Gets The Activity Summary
    const training_plan_summary:HTMLParagraphElement = activity_summary.querySelector(".training_plan_summary") as HTMLParagraphElement // Gets The Training Plan Summary
    const training_plan_summary_chart:HTMLDivElement = activity_summary.querySelector(".training_plan_summary_chart") as HTMLDivElement // Gets The Training Plan Summary Chart
    const total_exercises_elapsed_time = training_plan_summary_data.reduce((total, one_exercise) => { return one_exercise.elapsed_time + total }, 0) // Gets Total Elapsed Time Of Exercises

    // Training Plan Summary

    // Displays The Training Plan Summary Text
    training_plan_summary_data.forEach(function(one_exercise:exercise):void {
        training_plan_summary.innerHTML += `<br><span style="color: ${one_exercise.color}">${one_exercise.exercise}: ${getFormattedTime("hours", one_exercise.elapsed_time)}h ${getFormattedTime("minutes", one_exercise.elapsed_time)}m ${getFormattedTime("seconds", one_exercise.elapsed_time)}s (${(one_exercise.elapsed_time / total_exercises_elapsed_time * 100).toFixed(2).replace(".", ",")}%)</span>`
    })
    
    // Training Plan Summary Chart

    // Extracts Data From Training Plan Summary Data
    const data:number[] = training_plan_summary_data.map(one_item => one_item.elapsed_time) // Gets Elapsed Time For Each Exercise From Exercises Summary
    const colors:string[] = training_plan_summary_data.map(one_item => one_item.color) // Gets Color For Each Exercise From Exercises Summary

    // Creates Chart
    charts.doughnut_chart = new Chart((training_plan_summary_chart.querySelector("canvas") as HTMLCanvasElement), {
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

            labels: [],
        },

        options: {
            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    enabled: false
                }
            },

            cutout: "50%",
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
        },
    })

    training_plan_summary.style.display = "block" // Shows Training Plan Summary
    training_plan_summary_chart.style.display = "block" // Shows Training Plan Summary Chart
    training_plan_summary_chart.style.animation = "fadeInScale 1s ease-out" // Animates Training Plan Summary Chart
}

// Function For Delete Activity Summary
export function deleteActivitySummary():void {
    const activity_summary:HTMLDivElement = document.querySelector(".activity_summary") as HTMLDivElement // Gets The Activity Summary
    const weekly_activity_chart:HTMLDivElement = activity_summary.querySelector(".weekly_activity_chart") as HTMLDivElement // Gets The Weekly Activity Chart
    const training_plan_summary:HTMLParagraphElement = activity_summary.querySelector(".training_plan_summary") as HTMLParagraphElement // Gets The Training Plan Summary
    const training_plan_summary_chart:HTMLDivElement = activity_summary.querySelector(".training_plan_summary_chart") as HTMLDivElement // Gets The Training Plan Summary Chart

    // Deletes Bar Chart (Weekly Activity Chart)
    if(charts.bar_chart) {
        charts.bar_chart.destroy()
        charts.bar_chart = null
    }

    // Deletes Doughnut Chart (Training Plan Summary Chart)
    if(charts.doughnut_chart) {
        charts.doughnut_chart.destroy()
        charts.doughnut_chart = null
    }

    activity_summary.style.display = "none" // Hides Activity Summary
    weekly_activity_chart.style.display = "none" // Hides Weekly Summary Chart
    training_plan_summary.style.display = "none" // Hides Training Plan Summary
    training_plan_summary.innerHTML = "" // Deletes Training Plan Summary
    training_plan_summary_chart.style.display = "none" // Hides Training Plan Summary Chart
}