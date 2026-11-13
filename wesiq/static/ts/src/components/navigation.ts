"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Navigation

    // Variables

    const navigation_bar:HTMLElement = document.querySelector(".navigation_bar") as HTMLElement // Gets The Navigation Bar (Top Bar On Wide Screens, Bottom Tab Bar On Narrow Screens)

    // Functions

    // Function For Get The Height Covered By The Navigation Bar At The Top Of The Screen
    function getTopOffset():number {
        return navigation_bar.getBoundingClientRect().top <= 0 ? navigation_bar.offsetHeight : 0 // The Bottom Tab Bar Doesn't Cover The Top
    }

    // Auto Scroll Buttons

    // Variables

    const scroll_contact:HTMLAnchorElement|null = navigation_bar.querySelector(".scroll_contact") as HTMLAnchorElement || null // Gets The Scroll Contact Button
    const contact:HTMLFormElement|null = document.querySelector(".contact_form") as HTMLFormElement || null // Gets The Contact Form

    const scroll_reviews:HTMLButtonElement|null = document.querySelector(".reviews_info") as HTMLButtonElement || null // Gets The Scroll Reviews Button
    const reviews:HTMLDivElement|null = document.querySelector(".reviews") as HTMLDivElement || null // Gets The Reviews Container

    const scroll_feed:HTMLAnchorElement|null = navigation_bar.querySelector(".scroll_feed") as HTMLAnchorElement || null // Gets The Scroll Feed Button
    const feed:HTMLDivElement|null = document.querySelector(".feed") as HTMLDivElement || null // Gets The Feed Container

    // Functions

    // Function For Initialize The Scroll
    function initializeScroll(button:HTMLElement, scroll_to:HTMLElement):void {
        // Button Click Functionality
        button.addEventListener("click", function(event:PointerEvent):void {
            event.preventDefault()

            window.scrollTo({
                top: scroll_to.getBoundingClientRect().top + window.scrollY - getTopOffset(),
                behavior: "smooth"
            })
        })
    }

    // Initialization

    if(scroll_contact && contact) initializeScroll(scroll_contact, contact) // Initializes The Scroll
    if(scroll_reviews && reviews) initializeScroll(scroll_reviews, reviews) // Initializes The Scroll
    if(scroll_feed && feed) initializeScroll(scroll_feed, feed) // Initializes The Scroll

    // Skip Link

    // Variables

    const skip_link:HTMLAnchorElement = document.querySelector(".skip_link") as HTMLAnchorElement
    const content:HTMLElement = document.querySelector(".content") as HTMLElement

    // Initialization

    if(skip_link && content) initializeScroll(skip_link, content) // Initializes The Scroll
})