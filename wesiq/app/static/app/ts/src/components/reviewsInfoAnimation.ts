import { easeOutEffect } from "../utils/easeOutEffect.js"

// Function For Animate Reviews Info
export function reviewsInfoAnimation():void {
    // Review Graph Animation
    const reviews_graph_columns:NodeListOf<HTMLDivElement> = document.querySelectorAll<HTMLDivElement>(".reviews .reviews_info_container .graph .one_column") // Gets All Columns From Reviews Graph
    
    let total_reviews_amount:number = [...reviews_graph_columns].reduce((sum:number, one_column:HTMLDivElement) => sum + Number((one_column.querySelector(".counter") as HTMLParagraphElement).dataset["amount"]), 0) // Gets Total Amount Of Reviews

    const max_green:number = 185 // Color With Maximum Of Green Is rgb(235, 185, 20)

    reviews_graph_columns.forEach(function(one_column:HTMLDivElement):void {
        const bar:HTMLDivElement = one_column.querySelector(".review_bar") as HTMLDivElement // Gets Bar
        const counter:HTMLParagraphElement = one_column.querySelector(".counter") as HTMLParagraphElement // Gets Counter

        const progress_percentage:string = ((Number(counter.dataset["amount"]) / total_reviews_amount) * 100).toFixed(2) // Gets Progress Percentage For Each Column

        // Animation's Settings
        const bar_target:number = parseFloat(progress_percentage) // Saves Each Column's Progress Pecentage As A Float Number
        const animation_duration:number = 3000 // 3 Seconds Animation
        let start_time:number|null = null // Sets Start Time Default Value

        // Function For Animation
        function reviewGraphAnimation(time:number):void {
            if(!start_time) start_time = time

            const elapsed_time:number = time - start_time // Animation Elapsed Time
            const progress:number = Math.min(elapsed_time / animation_duration, 1) // Animation Progress From 0 To 1
            const eased:number = easeOutEffect(progress) // Slows Down Animation At The End (Slows Down Progress Variable)
            
            // Makes Color Transition For Progress Bars From rgb(235, 0, 20) To rgb(235, 185, 20)
            let bars_color:number = max_green * eased
            bar.style.setProperty("--color", `rgb(235, ${bars_color}, 20)`)

            // Each Progress Bar Rendering
            // Sets Values To Graph In Each Frame Of The Animation
            bar.style.setProperty("--progress", `${eased * bar_target}%`) // Sets Progress Percentage To Variable In CSS From Data Attribute

            // Each Review Counter Rendering
           counter.dataset["amount"] ? counter.textContent = String(Math.floor(eased * Number(counter.dataset["amount"]))) : counter.textContent = "0" // Sets Each Column's Reviews Amount To Its Counter

            if(progress < 1) requestAnimationFrame(reviewGraphAnimation) // Calls The Animation Until Its Duration Ends
        }

        requestAnimationFrame(reviewGraphAnimation) // Calls The Animation For The First Time
    })
    
    // Average Rating Animation
    const average_rating:HTMLDivElement = document.querySelector(".reviews .reviews_info_container .average_rating") as HTMLDivElement // Gets Average Rating
    average_rating.style.animation = "fadeIn 0.5s ease 3s forwards" // Sets Animation In CSS And Makes Average Rating Appear

    const average_rating_number_tag:HTMLParagraphElement = document.querySelector(".reviews_info_container .average_rating .average_rating_number") as HTMLParagraphElement // Gets Average Rating Number HTML Tag

    // Animation's Settings
    const average_rating_number_target:number = Number(average_rating_number_tag.textContent) // Target Value Of Animation (For Example 425)
    const animation_duration:number = 3000 // 3 Seconds Animation
    let start_time:number|null = null // Sets Start Time Default Value / Delay For Animation Start

    let green:number = 0 // Start Color Of Stars Is rgb(235, 0, 20)

    // Function For Animation
    function averageRatingAnimation(time:number):void {
        if(!start_time) start_time = time + 3000 // Starts After 3 Seconds Delay

        const elapsed_time:number = time - start_time // Animation Elapsed Time
        const progress:number = Math.min(elapsed_time / animation_duration, 1) // Animation Progress From 0 To 1
        const eased:number = easeOutEffect(progress) // Slows Down Animation At The End (Slows Down Progress Variable)

        // average_rating_number_tag.innerHTML = "0<span>00</span>" // Renders Start Values To HTML

        // Starts The Animation After Delay Set In Start Time Expires
        if(progress >= 0) {
            // Average Rating Number Rendering
            const avg_rating_splitted:string[] = ((eased * average_rating_number_target) / 100).toFixed(2).split(".") // Calculates New Values For Average Rating Number For Every Frame Of The Animation In Array Format (For Example ["4", "25"])
            // Splits Array
            average_rating_number_tag.innerHTML = `${avg_rating_splitted[0]}<span>${avg_rating_splitted[1]}</span>` // Splits Values From Array And Renders Them To HTML

            // Stars Rendering
            const average_rating_number:number = parseFloat((document.querySelector(".reviews_info_container .average_rating .average_rating_number") as HTMLParagraphElement).textContent) / 100 // Gets Average Rating And Stores It As A Float Number (For Example Converts "425" To 4.25)
            const average_rating_stars:NodeListOf<HTMLSpanElement> = document.querySelectorAll<HTMLSpanElement>(".reviews_info_container .average_rating .stars .star") // Gets All 5 Star Icons

            let rest_from_average_rating_number:number = average_rating_number // Rest From Average Rating (From 4.25 To 0.25)

            average_rating_stars.forEach(function(one_star:HTMLSpanElement, index:number):void {
                // Colors Of Stars

                let star_color_1:HTMLElement = one_star.querySelectorAll<HTMLElement>("svg linearGradient stop")[0] as HTMLElement // Gets Part Of Star Icon
                let star_color_2:HTMLElement = one_star.querySelectorAll<HTMLElement>("svg linearGradient stop")[1] as HTMLElement // Gets Part Of Star Icon

                // Set Color Value To Stars
                star_color_1.setAttribute("stop-color", `rgb(235, ${green}, 20)`)
                star_color_2.setAttribute("stop-color", `rgb(235, ${green}, 20)`)

                green = (max_green / 5) * average_rating_number // Changes Color Of Stars By Average Rating (Lower Average Rating - Stars Are More To Red, Higher Average Rating - Stars Are More To Yellow)

                // Filling Stars
                
                let filled_part:HTMLElement = one_star.querySelectorAll<HTMLElement>("svg linearGradient stop")[1] as HTMLElement // Gets Part Of Star Icon

                // Fills Full Stars
                if(index + 1 <= Math.floor(average_rating_number)) {
                    filled_part.setAttribute("offset", "100%")

                    // Saves Rest From Average Rating
                    rest_from_average_rating_number = average_rating_number
                    rest_from_average_rating_number -= index + 1
                }

                // Fills Rest From Average Rating
                else if(index + 1 > Math.floor(average_rating_number) && rest_from_average_rating_number !== 0) {
                    filled_part.setAttribute("offset", `${Number(rest_from_average_rating_number.toFixed(2)) * 100}%`)

                    rest_from_average_rating_number = 0 // Sets Rest From Average Rating Number To 0 And Stops The Statement
                }
            })
        }
        
        // Calls The Animation Until Its Duration Ends
        if(progress < 1) requestAnimationFrame(averageRatingAnimation)
    }

    requestAnimationFrame(averageRatingAnimation) // Calls The Animation For The First Time
}