// Function For Creating Bar Container With Amount Of Bars By Training Plan Exercises Amount
export function createBars(amount, state) {
    // Creates Bar Container
    const bar_container = document.createElement("div")
    bar_container.classList.add("bar_container")

    // Creates Bars By Amount Of Exercises In The Training Plan
    for(let i = 0; i < amount; i++) {
        // Creates Bar
        const bar = document.createElement("div")
        bar.classList.add("bar")
        bar.setAttribute("draggable", "true")
        bar_container.appendChild(bar)

        if(i === state.active_exercise_index) {
            bar.classList.add("active") // Adds Active Class For Bar Of Active Exercise
        }
    }

    return bar_container // Returns Bar Container
}

// Function For Render New Bar Container With Bars
export function renderBars(parent, container) {
    // Removes Previous Bar Container
    const previous_bar_container = parent.querySelector(".bar_container")
    if(previous_bar_container) previous_bar_container.remove()

    parent.appendChild(container) // Appends New Bar Container
}