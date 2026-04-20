// Function For Generate The Post Bars
export function generatePostBars(all_media:NodeListOf<HTMLDivElement>, post_bars:HTMLDivElement):void {
    // Creates The Bars Only If There Are More Than One Media In Post
    if(all_media.length > 1) {
        for(let i:number = 0; i < all_media.length; i++) {
            const bar:HTMLDivElement = document.createElement("div") // Creates The Bar
        
            bar.classList.add("bar") // Adds The Bar Class
            post_bars.appendChild(bar) // Appends The Bar To The Post Bars
        }
    }

    else {
        post_bars.style.display = "none" // Hides The Post Bars Container
    }
}

// Function For Change The Post
export function changePost(clicked_bar_index:number, post_bars:HTMLDivElement, bar:HTMLDivElement, all_media:NodeListOf<HTMLDivElement>):void {
    all_media.forEach(function(one_post:HTMLDivElement, index:number):void {
        if(index !== clicked_bar_index) {
            one_post.style.display = "none"

            const all_bars:NodeListOf<HTMLDivElement> = post_bars.querySelectorAll<HTMLDivElement>(".bar") // Gets All Bars

            all_bars.forEach(one_bar => one_bar.classList.remove("active")) // Removes The Active Class From All Bars
            bar.classList.add("active") // Adds The Active Class
        }

        else {
            one_post.style.display = "block"
        }
    })
}