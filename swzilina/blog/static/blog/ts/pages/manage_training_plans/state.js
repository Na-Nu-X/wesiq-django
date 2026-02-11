"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.edit_training_plan_state = exports.new_training_plan_state = exports.global_state = void 0;
exports.global_state = {
    selection_dragged_exercise: null, // Gets Dragged Exercise From Exercise Selection
    hovered_element: null, // Gets Current Hovered Element
    focused_element: "new_training_plan", // Gets Focused Element (New Training Plan As Default)
    // Hold Button Interval
    hold_interval: null,
    hold_timeout: null
};
exports.new_training_plan_state = {
    active_exercise_index: 0 // 0 By Default
};
exports.edit_training_plan_state = {
    active_exercise_index: 0, // 0 By Default
    active_training_plan_index: 0 // 0 By Default
};
