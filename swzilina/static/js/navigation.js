"use strict"

document.addEventListener("DOMContentLoaded", function() {
    // Disappearing Navigation Bar

    const navigation_bar = document.querySelector(".navigation_bar")

    function handleScroll() {
        if(window.innerWidth <= 800) {
            navigation_bar.style.opacity = 1
            return
        }

        if(window.scrollY > window.innerHeight - navigation_bar.offsetHeight) {
            navigation_bar.style.opacity = 0
        } else {
            navigation_bar.style.opacity = 1
            navigation_bar.style.transition = "0.5s"
        }
    }

    function handleMouseOver() {
        if(window.innerWidth > 800) {
            navigation_bar.style.opacity = 1
            navigation_bar.style.transition = "1s"
        }
    }

    function handleMouseOut() {
        if(window.innerWidth > 800 && window.scrollY > window.innerHeight - navigation_bar.offsetHeight) {
            navigation_bar.style.opacity = 0
        }
    }

    navigation_bar.addEventListener("mouseover", handleMouseOver);
    navigation_bar.addEventListener("mouseout", handleMouseOut);

    window.addEventListener("scroll", handleScroll);

    // Navigation Bar Icons

    const navigation_icon = document.querySelector(".navigation_icon")
    const navigation_bar_item = document.querySelectorAll(".navigation_bar ul li")

    navigation_icon.addEventListener("click", function(event) {
        if(document.querySelector(".fa-solid").classList[1] === "fa-bars") {
            document.querySelector(".fa-solid").classList.remove("fa-bars")
            document.querySelector(".fa-solid").classList.add("fa-xmark")

            navigation_bar_item.forEach(function(one_item) {
                one_item.style.display = "block"
            })
        }

        else if(document.querySelector(".fa-solid").classList[1] === "fa-xmark") {
            document.querySelector(".fa-solid").classList.remove("fa-xmark")
            document.querySelector(".fa-solid").classList.add("fa-bars")

            navigation_bar_item.forEach(function(one_item) {
                one_item.style.display = "none"
            })
        }
    })

    // Auto Scroll Buttons

    function autoScrollButtons(button, scroll_to) {
        button.addEventListener("click", function(event){
            event.preventDefault()

            window.scrollTo({
                top: scroll_to.offsetTop - navigation_bar.offsetHeight,
                behavior: "smooth"
            })
        })
    }

    const scroll_contact = document.querySelector(".scroll_contact")
    const contact = document.querySelector(".contact_form")

    const scroll_reviews = document.querySelector(".reviews_info")
    const reviews = document.querySelector(".reviews")

    if(scroll_contact && contact) {
        autoScrollButtons(scroll_contact, contact)
    }

    if(scroll_reviews && reviews) {
        autoScrollButtons(scroll_reviews, reviews)
    }

    // Skip Link

    const skip_link = document.querySelector(".skip_link")
    const content = document.querySelector(".content")

    if(skip_link && content) {
        autoScrollButtons(skip_link, content)
    }
})