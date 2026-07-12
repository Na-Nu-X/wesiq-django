// Function For Search Bar
export function searchBar(search_bar:HTMLInputElement, selection_exercises:NodeListOf<HTMLDivElement>):void {
    // Gets Only Exercises In The Exercise Selection Which Are Not Already Put In The New Training Plan
    const not_used_selection_exercises:HTMLDivElement[] = [...selection_exercises].filter(function(one_exercise:HTMLDivElement):boolean {
        return !one_exercise.classList.contains("hidden")
    })

    // Exercises In The Exercise Selection Are Visible By Default
    not_used_selection_exercises.forEach(function(one_exercise:HTMLDivElement):void {
        one_exercise.style.display = "flex"
    })

    // Filters Exercises by Searched Bar Value (Returns Not Corresponding Exercises)
    const filtered_selection_exercises:HTMLDivElement[] = [...not_used_selection_exercises].filter(function(one_exercise:HTMLDivElement):boolean {
        const categories:string[] = one_exercise.dataset["categories"] ? JSON.parse(one_exercise.dataset["categories"].replace(/'/g, '"') || "[]") || [] : [] // Gets The Exercise Categories

        return (
            !(one_exercise.querySelector(".name") as HTMLParagraphElement).textContent.toLowerCase().trim().includes(search_bar.value.toLowerCase().trim()) &&
            !categories.some(category => category.toLowerCase().trim().includes(search_bar.value.toLowerCase().trim()))
        )
    })

    // Hides Filtered Exercises Except Of Custom Exercise And Warm Up In The Exercise Selection
    filtered_selection_exercises.forEach(function(one_exercise:HTMLDivElement):void {
        if(!one_exercise.classList.contains("custom_exercise") && !one_exercise.classList.contains("warm_up")) one_exercise.style.display = "none"
    })
}

// Function For Delete Search Bar
export function deleteSearchBar(search_bar:HTMLInputElement, selection_exercises:NodeListOf<HTMLDivElement>):void {
    search_bar.value = "" // Deletes Search Bar Value
    searchBar(search_bar, selection_exercises) // Refreshes Exercise Selection Exercises (Refreshes Search Bar Results)
}

// Function For Change Weight In Exercise
export function changeWeight(exercise:HTMLDivElement, operation:string):void {
    const current_weight:string = exercise.dataset["weight"] || "0" // Gets Current Added Or Subtracted Weight
    const weight:HTMLSpanElement = exercise.querySelector(".weight_selection .weight span:first-child") as HTMLSpanElement // Gets Weight Print

    let current_weight_number:number = parseInt(current_weight) // Converts Current Weight Into Number Format

    if(exercise.dataset["requires_weight"] == "True" && operation === "decrease" && current_weight_number <= 0) return // Can't Get Negative Number If The Exercise Has Required Weight

    operation === "increase" ? current_weight_number += 1 : current_weight_number -= 1 // Increases Or Decreases Weight Value Based On The Operation

    exercise.dataset["weight"] = String(current_weight_number) // Updates Current Weight Value In Exercise
    weight.textContent = String(current_weight_number) // Shows Weight Value In The Input
}