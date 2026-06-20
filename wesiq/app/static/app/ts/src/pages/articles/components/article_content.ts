import { setObserverAnimation } from "../../../utils/setObserverAnimation.js"

document.addEventListener("DOMContentLoaded", function():void {
    // Article Feed

    // Variables

    const article_content:HTMLDivElement = document.querySelector(".article_content") as HTMLDivElement // Gets The Article Content Container
    const all_sections:NodeListOf<HTMLElement> = article_content.querySelectorAll<HTMLElement>("section") // Gets All Sections

    // Initialization

    setObserverAnimation(all_sections, 0.2) // Animates The Sections
})