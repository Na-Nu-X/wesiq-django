"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    const navigation_bar:HTMLElement = document.querySelector(".navigation_bar") as HTMLElement // Gets The Navigation Bar
    const navigation_bar_items:NodeListOf<HTMLLIElement> = document.querySelectorAll<HTMLLIElement>(".navigation_bar ul li")
    const hamburger:HTMLElement = navigation_bar.querySelector(".hamburger") as HTMLElement // Gets The Hamburger Icon

    const screen_height:number = window.innerHeight - navigation_bar.offsetHeight // Gets The Screen Height (Without Navigation Bar)

    // Window Scroll Functionality (Disappearing Navigation Bar)
    window.addEventListener("scroll", function():void {
        this.scrollY >= screen_height ? navigation_bar.style.opacity = "0" : navigation_bar.style.opacity = "1" // Hides Or Shows The Navigation Bar
    })

    // Change Appearance Of The Navigation Bar

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

    function autoScrollButtons(button:HTMLElement, scroll_to:HTMLElement):void {
        button.addEventListener("click", function(event:PointerEvent):void {
            event.preventDefault()

            window.scrollTo({
                top: scroll_to.offsetTop - navigation_bar.offsetHeight,
                behavior: "smooth"
            })
        })
    }

    const scroll_contact:HTMLAnchorElement = document.querySelector(".scroll_contact") as HTMLAnchorElement
    const contact:HTMLFormElement = document.querySelector(".contact_form") as HTMLFormElement

    const scroll_reviews:HTMLDivElement = document.querySelector(".reviews_info") as HTMLDivElement
    const reviews:HTMLDivElement = document.querySelector(".reviews") as HTMLDivElement

    if(scroll_contact && contact) autoScrollButtons(scroll_contact, contact)
    if(scroll_reviews && reviews) autoScrollButtons(scroll_reviews, reviews)

    // Skip Link

    const skip_link:HTMLAnchorElement = document.querySelector(".skip_link") as HTMLAnchorElement
    const content:HTMLElement = document.querySelector(".content") as HTMLElement

    if(skip_link && content) autoScrollButtons(skip_link, content)
})