// Function For Set Observer Animation
export function setObserverAnimation(element, multiple_elements = true, threshold = 0.5, additional_function) {
    const observer = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (one_entry) {
            if (one_entry.isIntersecting) {
                one_entry.target.classList.add("animate"); // Adds Animation
                if (additional_function && one_entry.target.classList.contains("animate"))
                    additional_function(); // Calls Additional Function If Is Set
                observer.unobserve(one_entry.target); // Plays Animation Only Once
            }
        });
    }, {
        threshold: threshold // Starts Animation At The Given Percentage Of Element Visibility (0 - 0%, 1 - 100%)
    });
    // Observes Multiple Elements
    if (multiple_elements && element instanceof Array) {
        element.forEach(function (one_element) {
            observer.observe(one_element);
        });
    }
    else if (!multiple_elements && element instanceof HTMLDivElement)
        observer.observe(element); // Observes Only One Element
}
//# sourceMappingURL=setObserverAnimation.js.map