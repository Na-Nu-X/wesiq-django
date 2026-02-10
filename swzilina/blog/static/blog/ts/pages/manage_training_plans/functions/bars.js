"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBars = createBars;
exports.renderBars = renderBars;
// Function For Creating Bar Container With Amount Of Bars By Training Plan Exercises Amount
function createBars(amount, state) {
    // Creates Bar Container
    var bar_container = document.createElement("div");
    bar_container.classList.add("bar_container");
    // Creates Bars By Amount Of Exercises In The Training Plan
    for (var i = 0; i < amount; i++) {
        // Creates Bar
        var bar = document.createElement("div");
        bar.classList.add("bar");
        bar.draggable = true;
        bar_container.appendChild(bar);
        if (i === state.active_exercise_index) {
            bar.classList.add("active"); // Adds Active Class For Bar Of Active Exercise
        }
    }
    return bar_container; // Returns Bar Container
}
// Function For Render New Bar Container With Bars
function renderBars(parent, container) {
    // Removes Previous Bar Container
    var previous_bar_container = parent.querySelector(".bar_container");
    previous_bar_container === null || previous_bar_container === void 0 ? void 0 : previous_bar_container.remove();
    parent.appendChild(container); // Appends New Bar Container
}
