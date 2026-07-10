"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Write Review Form

    const stars:NodeListOf<HTMLButtonElement> = document.querySelectorAll<HTMLButtonElement>(".write_review_form .rating button, .edit_review_form .rating button")
    const rating:HTMLInputElement = document.querySelector(".write_review_form .rating input, .edit_review_form .rating input") as HTMLInputElement
    let selected_rating:number = parseInt(rating.value) || 0

    function updateStars(hover_value:number = 0):void {
        stars.forEach(function(one_star:HTMLElement, index:number):void {
            const icon:HTMLElement = one_star.querySelector(".fa-star") as HTMLElement // Gets The Star Icon

            if(hover_value > 0) {
                index < hover_value ? icon.classList.replace("empty", "full") : one_star.classList.replace("full", "empty")
            }

            else {
                index < selected_rating ? icon.classList.replace("empty", "full") : icon.classList.replace("full", "empty")
            }
        })
    }

    stars.forEach(function(one_star:HTMLElement, index:number):void {
        const rating_number:number = index + 1

        one_star.addEventListener("mouseover", () => updateStars(rating_number))
        one_star.addEventListener("mouseout", () => updateStars())

        one_star.addEventListener("click", function():void {
            selected_rating = rating_number
            rating.value = String(rating_number)
            updateStars()
        })
    })

    updateStars()

    // Add Emoji

    // Variables

    const write_review_form:HTMLFormElement = document.querySelector(".reviews .write_review_form_container .write_review_form, .edit_review_form") as HTMLFormElement // Gets The Write Review Form
    const review_container:HTMLDivElement = write_review_form.querySelector(".review_container") as HTMLDivElement // Gets The Review Container
    const review:HTMLTextAreaElement = review_container.querySelector(".review_content") as HTMLTextAreaElement // Gets The Review Textarea
    const add_emoji:HTMLElement = review_container.querySelector(".icons .add_emoji") as HTMLElement // Gets The Add Emoji Icon
    const emoji_picker_container:HTMLDivElement = review_container.querySelector(".emoji_picker_container") as HTMLDivElement // Gets The Emoji Picker Container
    const picker:Element = emoji_picker_container.querySelector("emoji-picker") as Element // Gets The Emoji Picker

    // Events

    add_emoji.addEventListener("mousedown", event => event.preventDefault()) // Prevents Default Behaviour
    // emoji_picker_container.addEventListener("mousedown", event => event.preventDefault()) // Prevents Default Behaviour

    // Add Emoji Icon Click Functionality
    add_emoji.addEventListener("click", function(event:PointerEvent):void {
        event.stopPropagation() // Prevents The Closing Of The Emoji Picker Container
        emoji_picker_container.classList.toggle("hidden") // Shows Or Hides The Emoji Picker Container
    })

    // Picker Emoji Click Functionality
    picker.addEventListener("emoji-click", function(event:Event):void {
        const custom_event:CustomEvent<{
            unicode:string
        }> = event as CustomEvent<{ unicode: string }>
    
        const emoji:string = custom_event.detail.unicode // Gets The Clicked Emoji

        const start:number = review.selectionStart
        const end:number = review.selectionEnd
        const text:string = review.value

        review.value = text.substring(0, start) + emoji + text.substring(end) // Places The Emoji To The Cursor Position Of Review Textarea
        review.selectionStart = review.selectionEnd = start + emoji.length // Sets The Cursor Of Review Textarea Position Behind The Placed Emoji
        review.focus() // Focuses The Review Textarea
    })

    // Global Event Delegations

    // Document Click Functionality
    document.addEventListener("click", function(event:PointerEvent):void {
        // When The User Clicks Outside The Emoji Picker Container
        if(
            !(event.target as HTMLDivElement).classList.contains("emoji_picker_container") &&
            !(event.target as HTMLDivElement).closest(".emoji_picker_container")
        ) {
            emoji_picker_container.classList.add("hidden") // Hides The Emoji Picker Container
            return
        }
    })
})