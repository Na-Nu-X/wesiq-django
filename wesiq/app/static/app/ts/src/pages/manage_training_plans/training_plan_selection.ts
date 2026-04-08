"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Variables

    const training_plan_selection:HTMLDivElement = document.querySelector(".training_plan_selection") as HTMLDivElement // Gets Training Plan Selection

    const exercise_template:HTMLTemplateElement = training_plan_selection.querySelector(".exercise_template") as HTMLTemplateElement // Gets Exercise Template

    const exercises_data:NodeListOf<HTMLDivElement> = training_plan_selection.querySelectorAll<HTMLDivElement>(".one_exercise_data") // Gets Data From Every User's Exercise

    // Functions

    // Function For Render Exercises Of The Selected Training Plan
    function generateTrainingPlan(exercises_data:NodeListOf<HTMLDivElement>, container:HTMLDivElement):void {
        // Extracts Data For Every Exercise
        exercises_data.forEach(function(one_exercise_data:HTMLDivElement):void {
            const training_plan_key:string = one_exercise_data.dataset["training_plan_key"] as string // Gets Training Plan Key
            const exercise_data:string = one_exercise_data.dataset["exercise"] as string // Gets Exercise Name

            const exercise_template_clone:DocumentFragment = exercise_template.content.cloneNode(true) as DocumentFragment // Clones The Exercise Template Content

            (exercise_template_clone.querySelector(".exercise") as HTMLDivElement).dataset["training_plan_key"] = training_plan_key; // Stores Training Plan Key Data To The Exercise
        
            (exercise_template_clone.querySelector(".exercise .title") as HTMLHeadingElement).textContent = exercise_data; // Sets Title To The Exercise Title

            (container.querySelector(".training_plan") as HTMLDivElement).appendChild(exercise_template_clone) // Appends The Exercise To The Training Plan
        })
    }

    generateTrainingPlan(exercises_data, training_plan_selection)
})