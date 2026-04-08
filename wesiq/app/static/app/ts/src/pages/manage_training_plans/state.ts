// GLOBAL STATES

interface globalState {
    selection_dragged_exercise:HTMLDivElement|null,

    hovered_element:string|null,

    hold_interval:number|null,
    hold_timeout:number|null
}

export const global_state:globalState = {
    selection_dragged_exercise: null, // Gets Dragged Exercise From Exercise Selection

    hovered_element: null, // Gets Current Hovered Element

    // Hold Button Interval
    hold_interval: null,
    hold_timeout: null,
}

export const new_training_plan_state:{
    active_exercise_index:number
} = {
    active_exercise_index: 0 // 0 By Default
}

export const edit_training_plan_state:{
    active_exercise_index:number,
    active_training_plan_index:number
} = {
    active_exercise_index: 0, // 0 By Default
    active_training_plan_index: 0 // 0 By Default
}

export const exercise_selection_state:{
    hovered_exercise:HTMLDivElement|null
} = {
    hovered_exercise: null
}