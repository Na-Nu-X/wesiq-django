import type { exercise } from "../state.js"

export function renderActivitySummary(elapsed_time:number, gained_xp:number):void {
    console.log("AKTIVITA")
    console.log(elapsed_time)
    console.log(gained_xp)


}

export function renderTrainingPlanActivitySummary(training_plan_summary:exercise[], training_plan_title:string):void {
    console.log("TG AKTIVITA")
    console.log(training_plan_title)
    console.log(training_plan_summary)


}