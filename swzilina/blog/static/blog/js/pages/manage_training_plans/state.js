// GLOBAL STATES

export const global_state = {
    selection_dragged_exercise: null, // Gets Dragged Exercise From Exercise Selection

    hovered_element: null, // Gets Current Hovered Element
    focused_element: "new_training_plan", // Gets Focused Element (New Training Plan As Default)

    // Hold Button Interval
    hold_interval: null,
    hold_timeout: null,

    hovered_exercise_selection_exercise: null
}

export const new_training_plan_state = {
    active_exercise_index: 0 // 0 By Default
}

export const edit_training_plan_state = {
    active_exercise_index: 0, // 0 By Default
    active_training_plan_index: 0 // 0 By Default
}