"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Navigation

    //Variables

    const navigation_bar:HTMLElement = document.querySelector(".navigation_bar") as HTMLElement // Gets The Navigation Bar
    const navigation_bar_items:NodeListOf<HTMLLIElement> = navigation_bar.querySelectorAll<HTMLLIElement>(".navigation_bar ul li") // Gets All Navigation Bar Items
    const hamburger:HTMLElement = navigation_bar.querySelector(".hamburger") as HTMLElement // Gets The Hamburger Icon

    const SCREEN_HEIGHT:number = window.innerHeight - navigation_bar.offsetHeight // Gets The Screen Height (Without Navigation Bar)

    // Events

    // Window Scroll Functionality (Disappearing Navigation Bar)
    window.addEventListener("scroll", function():void {
        this.scrollY >= SCREEN_HEIGHT ? navigation_bar.style.opacity = "0" : navigation_bar.style.opacity = "1" // Hides Or Shows The Navigation Bar
    })

    // Navigation Bar Mouse Over Functionality
    navigation_bar.addEventListener("mouseover", () => navigation_bar.style.opacity = "1")

    // Navigation Bar Mouse Out Functionality
    navigation_bar.addEventListener("mouseout", function():void {
        if(window.scrollY >= SCREEN_HEIGHT) this.style.opacity = "0" // Hides The Navigation Bar
    })

    // Window Resize Functionalities
    window.addEventListener("resize", function():void {
        if(this.innerWidth > 800) {
            navigation_bar_items.forEach((one_item:HTMLLIElement) => one_item.style.display = "inline-block") // Shows Inline Block Version Of Navigation Bar Items
            hamburger.classList.replace("fa-xmark", "fa-bars") // Shows The Bars Icon
        }

        else if(this.innerWidth <= 800 && hamburger.classList.contains("fa-xmark")) navigation_bar_items.forEach((one_item:HTMLLIElement) => one_item.style.display = "block") // Shows Block Version Of Navigation Bar Items
        else if(this.innerWidth <= 800 && hamburger.classList.contains("fa-bars")) navigation_bar_items.forEach((one_item:HTMLLIElement) => one_item.style.display = "none") // Hides Navigation Bar Items
    })

    // Hamburger Icon Click Functionalities
    hamburger.addEventListener("click", function():void {
        // Expands The Navigation Bar
        if(this.classList.contains("fa-bars")) {
            this.classList.replace("fa-bars", "fa-xmark") // Shows The X Icon
            navigation_bar_items.forEach((one_item:HTMLLIElement) => one_item.style.display = "block") // Shows Block Version Of Navigation Bar Items
        }

        // Shrinks The Navigation Bar
        else if(this.classList.contains("fa-xmark")) {
            this.classList.replace("fa-xmark", "fa-bars") // Shows The Bars Icon

            navigation_bar_items.forEach((one_item:HTMLLIElement) => one_item.style.display = "none") // Hides Navigation Bar Items
        }
    })

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
                top: scroll_to.getBoundingClientRect().top + window.scrollY - navigation_bar.offsetHeight,
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