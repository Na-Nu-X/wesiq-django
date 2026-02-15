interface globalState {
    selection_dragged_exercise: HTMLDivElement | null;
    hovered_element: string | null;
    focused_element: string | null;
    hold_interval: number | null;
    hold_timeout: number | null;
}
export declare const global_state: globalState;
export declare const new_training_plan_state: {
    active_exercise_index: number;
};
export declare const edit_training_plan_state: {
    active_exercise_index: number;
    active_training_plan_index: number;
};
export declare const exercise_selection_state: {
    hovered_exercise: HTMLDivElement | null;
};
export {};
//# sourceMappingURL=state.d.ts.map