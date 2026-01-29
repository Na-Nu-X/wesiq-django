// Function For Getting Selected Day From Day Select Menu Of The Training Plan
export function getSelectedDay(day_options) {
    // Finds Selected Day For Training Plan
    const selected_day = [...day_options].find(function(one_option) {
        return one_option.classList.contains("selected")
    })
    
    if(selected_day?.dataset?.day) {
        return Number.isNaN(parseInt(selected_day.dataset.day)) ? null : parseInt(selected_day.dataset.day) // Returns The Value Of The Selected Day Number Only If The User Has Selected Any
    }
    
    else {
        return null
    }
}