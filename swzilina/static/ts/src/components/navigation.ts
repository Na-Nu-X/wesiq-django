"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Disappearing Navigation Bar

    const navigation_bar:HTMLElement = document.querySelector(".navigation_bar") as HTMLElement

    function handleScroll():void {
        if(window.innerWidth <= 800) {
            navigation_bar.style.opacity = "1"
            return
        }

        if(window.scrollY > window.innerHeight - navigation_bar.offsetHeight) navigation_bar.style.opacity = "0"
        
        else {
            navigation_bar.style.opacity = "1"
            navigation_bar.style.transition = "0.5s"
        }
    }

    function handleMouseOver():void {
        if(window.innerWidth > 800) {
            navigation_bar.style.opacity = "1"
            navigation_bar.style.transition = "1s"
        }
    }

    function handleMouseOut():void {
        if(window.innerWidth > 800 && window.scrollY > window.innerHeight - navigation_bar.offsetHeight) navigation_bar.style.opacity = "0"
    }

    navigation_bar.addEventListener("mouseover", handleMouseOver)
    navigation_bar.addEventListener("mouseout", handleMouseOut)

    window.addEventListener("scroll", handleScroll)

    // Navigation Bar Icons

    const navigation_icon:HTMLElement = navigation_bar.querySelector("ul i") as HTMLElement
    const navigation_bar_items:NodeListOf<HTMLLIElement> = document.querySelectorAll<HTMLLIElement>(".navigation_bar ul li")

    navigation_icon.addEventListener("click", function():void {
        if(this.classList[1] === "fa-bars") {
            this.classList.remove("fa-bars")
            this.classList.add("fa-xmark")

            navigation_bar_items.forEach((one_item:HTMLLIElement) => one_item.style.display = "block")
            console.log(navigation_bar_items)
        }

        else if(this.classList[1] === "fa-xmark") {
            this.classList.remove("fa-xmark")
            this.classList.add("fa-bars")

            navigation_bar_items.forEach((one_item:HTMLLIElement) => one_item.style.display = "none")
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