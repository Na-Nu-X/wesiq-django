// Function For Set Observer Animation
export function setObserverAnimation(element:HTMLDivElement|NodeListOf<HTMLDivElement>, threshold:number = 0.5, additional_function?:() => void):void {
    const observer:IntersectionObserver = new IntersectionObserver(
        function(entries:IntersectionObserverEntry[], observer:IntersectionObserver):void {
            entries.forEach(function(one_entry:IntersectionObserverEntry):void {
                if(one_entry.isIntersecting) {
                    one_entry.target.classList.add("animate") // Adds Animation
                    
                    if(additional_function) additional_function() // Calls Additional Function If Is Set

                    observer.unobserve(one_entry.target) // Plays Animation Only Once
                }
            })
        },

        {
            threshold: threshold // Starts Animation At The Given Percentage Of Element Visibility (0 - 0%, 1 - 100%)
        }
    )

    if(element instanceof HTMLDivElement) observer.observe(element) // Observes Only One Element

    else {
        // Observes Multiple Elements
        element.forEach(function(one_element:HTMLDivElement):void {
            observer.observe(one_element)
        })
    }
}