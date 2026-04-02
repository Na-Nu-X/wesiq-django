// Function For Creating Bar Container With Amount Of Bars By Training Plans Amount
export function createTrainingPlanBars(amount:number, state:{active_training_plan_index:number}):HTMLDivElement {
    // Creates Bar Container
    const training_plan_bar_container:HTMLDivElement = document.createElement("div")
    training_plan_bar_container.classList.add("training_plan_bar_container")

    // Creates Bars By Amount Of Training Plans
    for(let i:number = 0; i < amount; i++) {
        // Creates Bar
        const bar:HTMLDivElement = document.createElement("div")
        bar.classList.add("bar")
        training_plan_bar_container.appendChild(bar)

        if(i === state.active_training_plan_index) bar.classList.add("active") // Adds Active Class For Bar Of Active Training Plan
    }

    return training_plan_bar_container // Returns Bar Container
}

// Function For Render Training Plan Bar Container With Bars
export function renderTrainingPlanBars(parent:HTMLDivElement, container:HTMLDivElement):void {
    // Removes Previous Bar Container
    const previous_bar_container:HTMLDivElement = parent.querySelector(".bar_container") as HTMLDivElement
    if(previous_bar_container) previous_bar_container.remove()

    parent.insertBefore(container, parent.querySelector(".buttons")) // Appends New Training Plan Bar Container Before Save Button
}

// Function For Creating Bar Container With Amount Of Bars By Training Plan Exercises Amount
export function createBars(amount:number, state:{active_exercise_index:number}):HTMLDivElement {
    // Creates Bar Container
    const bar_container:HTMLDivElement = document.createElement("div")
    bar_container.classList.add("bar_container")

    // Creates Bars By Amount Of Exercises In The Training Plan
    for(let i:number = 0; i < amount; i++) {
        // Creates Bar
        const bar:HTMLDivElement = document.createElement("div")
        bar.classList.add("bar")
        bar.draggable = true
        bar_container.appendChild(bar)

        if(i === state.active_exercise_index) {
            bar.classList.add("active") // Adds Active Class For Bar Of Active Exercise
        }
    }

    return bar_container // Returns Bar Container
}

// Function For Render New Bar Container With Bars
export function renderBars(parent:HTMLElement, container:HTMLElement):void {
    // Removes Previous Bar Container
    const previous_bar_container:HTMLDivElement = parent.querySelector(".bar_container") as HTMLDivElement
    if(previous_bar_container) previous_bar_container.remove()

    parent.appendChild(container) // Appends New Bar Container
}