document.addEventListener("DOMContentLoaded", function():void {
    // Exercise Statistics

    // Variables

    const exercise_statistics:HTMLDivElement = document.querySelector(".exercise_statistics") as HTMLDivElement // Gets The Exercise Statistics
    const all_bars:NodeListOf<HTMLDivElement> = exercise_statistics.querySelectorAll<HTMLDivElement>(".bar") // Gets All Bars
    let current_bar_index:number = 0 // Stores The Current Bar Index
    const DELAY = 300 // Sets The Delay Between Animations

    // Functions

    // Function For Show The Bar Progress
    function showBarProgress():void {
        if(current_bar_index < all_bars.length) {
            const percentage:number = Number((all_bars[current_bar_index] as HTMLDivElement).dataset["percentage"]) || 0; // Gets The Percentage
            (all_bars[current_bar_index] as HTMLDivElement).style.setProperty("--percentage", String(percentage))
    
            window.setTimeout(function():void {
                current_bar_index++ // Increases The Current Bar Index
                showBarProgress() // Shows The Bar Progress
            }, DELAY)
        }
    }

    // Initialization

    window.setTimeout(function():void {
        showBarProgress() // Shows The Bar Progress
    }, DELAY)
})