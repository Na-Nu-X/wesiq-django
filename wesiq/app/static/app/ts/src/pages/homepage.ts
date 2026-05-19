import { setObserverAnimation } from "../utils/setObserverAnimation.js"
import { reviewsInfoAnimation } from "../components/reviewsInfoAnimation.js"
import { customSelectMenu } from "../components/customSelectMenu.js"
import { sendPOST } from "../services/sendPOST.js"
import { displayMessage } from "../utils/displayMessage.js"

interface loadReviewsResponse {
    success:boolean,
    has_next:boolean,
    reviews_html:string,
    message:string
}

// Chart
declare const Chart: typeof import("chart.js").Chart

import type {
    Plugin,
    ChartType
} from "chart.js"
import { hideVideoLoader } from "./community/functions/feed.js"

type CustomCanvasBackgroundColorOptions = {
    color?:string
}

declare module "chart.js" {
    interface PluginOptionsByType<TType extends ChartType> {
        customCanvasBackgroundColor?: CustomCanvasBackgroundColorOptions
    }
}

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Login Form

    // Login Form Dialog
    const login_button:HTMLAnchorElement = document.querySelector(".login_button") as HTMLAnchorElement // Gets The Login Button
    const no_logged_in_button:HTMLAnchorElement = document.querySelector(".login") as HTMLAnchorElement // Gets The No Logged In Button
    const login_form_dialog:HTMLDialogElement = document.querySelector(".login_form_dialog") as HTMLDialogElement // Gets The Login Form Dialog
    const login_form:HTMLFormElement = login_form_dialog.querySelector(".login_form") as HTMLFormElement // Gets The Login Form

    login_button.addEventListener("click", function():void {
        login_form_dialog.showModal()
    })

    if(no_logged_in_button) {
        no_logged_in_button.addEventListener("click", function():void {
            login_form_dialog.showModal()
        })
    }

    login_form_dialog.addEventListener("click", function(event:PointerEvent):void {
        const login_form_dimensions:DOMRect = login_form.getBoundingClientRect()

        if (
            event.clientX < login_form_dimensions.left ||
            event.clientX > login_form_dimensions.right ||
            event.clientY < login_form_dimensions.top ||
            event.clientY > login_form_dimensions.bottom ||
            (event.target as HTMLAnchorElement).classList.contains("back") ||
            ((event.target as HTMLElement).parentNode as HTMLAnchorElement).classList.contains("back")
        ) {
            this.close()
        }
    })

    // Registration Form

    // Registration Form Dialog
    const registration_button:HTMLAnchorElement = document.querySelector(".registration_button") as HTMLAnchorElement // Gets The Registration Button
    const registration_form_dialog:HTMLDialogElement = document.querySelector(".registration_form_dialog") as HTMLDialogElement // Gets The Registration Form Dialog
    const registration_form:HTMLFormElement = registration_form_dialog.querySelector(".registration_form") as HTMLFormElement // Gets The Registration Form

    registration_button.addEventListener("click", function():void {
        registration_form_dialog.showModal()
    })

    registration_form_dialog.addEventListener("click", function(event:PointerEvent):void {
        const registration_form_dimensions:DOMRect = registration_form.getBoundingClientRect()

        if (
            event.clientX < registration_form_dimensions.left ||
            event.clientX > registration_form_dimensions.right ||
            event.clientY < registration_form_dimensions.top ||
            event.clientY > registration_form_dimensions.bottom ||
            (event.target as HTMLAnchorElement).classList.contains("back") ||
            ((event.target as HTMLElement).parentNode as HTMLAnchorElement).classList.contains("back")
        ) {
            this.close()
        }
    })

    // Custom Select Menus - Reviews

    const sort_select_menu:HTMLDivElement = document.querySelector(".reviews .select_menus .sort_select_menu") as HTMLDivElement // Gets Sort Select Menu
    const rating_select_menu:HTMLDivElement = document.querySelector(".reviews .select_menus .rating_select_menu") as HTMLDivElement // Gets Rating Select Menu

    customSelectMenu(sort_select_menu, "sort") // Adds Functionality For Sort Select Menu That Sets The Sort URL Parameter
    customSelectMenu(rating_select_menu, "rating", true) // Adds Functionality For Rating Select Menu That Sets The Rating URL Parameter

    // Reviews

    const all_reviews_container:HTMLDivElement = document.querySelector(".reviews .all_reviews") as HTMLDivElement // Gets The All Reviews Container
    
    const load_reviews_buttons:HTMLDivElement|null = document.querySelector(".reviews .load_reviews_buttons") as HTMLDivElement // Gets The Load Reviews Buttons Container

    // If There Are Some More Reviews
    if(load_reviews_buttons) {
        const first_reviews:NodeListOf<HTMLDivElement> = all_reviews_container.querySelectorAll<HTMLDivElement>(".one_review") // Gets All Reviews

        // Load More Reviews Button Click Functionality
        load_reviews_buttons.addEventListener("click", async function(event:PointerEvent):Promise<void> {
            // Load More Reviews
            if((event.target as HTMLButtonElement).classList.contains("load_more_reviews")) {
                const load_more_reviews:HTMLButtonElement = load_reviews_buttons.querySelector(".load_more_reviews") as HTMLButtonElement // Gets The Load More Reviews Button
                const next_page:number = Number(load_more_reviews.dataset["page"]) // Gets The Number Of The Next Page
    
                load_more_reviews.textContent = gettext("Načítavam...")
                load_more_reviews.disabled = true // Disables The Button
    
                try {
                    const load_reviews_response:loadReviewsResponse = await sendPOST(`${window.location.pathname}?reviews-page=${next_page}`, null, "load-reviews")

                    console.log(load_reviews_response)
            
                    // If The Response Isn't Success
                    if(!load_reviews_response.success) {
                        displayMessage(load_reviews_response.message, "error") // Displays The Error Message
                        load_more_reviews.textContent = gettext("Zobraziť viac")
                        load_more_reviews.disabled = false // Enables The Button
                        return
                    }
    
                    all_reviews_container.insertAdjacentHTML("beforeend", load_reviews_response.reviews_html) // Appends The HTML With Loaded Reviews To The All Reviews Container
    
                    // Creates The Hide Loaded Reviews Button If Isn't Already In The DOM
                    if(!load_reviews_buttons.querySelector(".hide_loaded_reviews")) {
                        const hide_loaded_reviews = document.createElement("button") // Creates The Hide Loaded Reviews Button
                        hide_loaded_reviews.classList.add("hide_loaded_reviews") // Adds The Hide Loaded Reviews Class
                        hide_loaded_reviews.textContent = gettext("Skryť recenzie")
                        load_reviews_buttons.appendChild(hide_loaded_reviews) // Appends The Hide Loaded Reviews Button To The Load Reviews Buttons Container
                    }
    
                    const all_reviews:NodeListOf<HTMLDivElement> = all_reviews_container.querySelectorAll<HTMLDivElement>(".one_review") // Gets All Reviews
                    all_reviews.forEach(one_review => one_review.classList.add("animate")) // Shows New Loaded Reviews
    
                    if(load_reviews_response.has_next) {
                        load_more_reviews.dataset["page"] = String(next_page + 1) // Updates The Number Of The Next Page
                        load_more_reviews.textContent = gettext("Zobraziť viac")
                        load_more_reviews.disabled = false // Enables The Button
                    }
                    
                    else load_more_reviews.remove() // Removes The Load More Reviews Button From The DOM If There Is No More Reviews To Load
                }
            
                catch {
                    displayMessage("Pri hľadaní recenzií došlo k chybe.", "error") // Displays The Error Message
                    load_more_reviews.textContent = gettext("Zobraziť viac")
                    load_more_reviews.disabled = false // Enables The Button
                }
            }

            // Hide Loaded Reviews
            else if((event.target as HTMLButtonElement).classList.contains("hide_loaded_reviews")) {
                const hide_loaded_reviews:HTMLButtonElement = event.target as HTMLButtonElement // Gets The Hide Loaded Reviews Button
                const all_reviews:NodeListOf<HTMLDivElement> = all_reviews_container.querySelectorAll<HTMLDivElement>(".one_review") // Gets All Reviews

                // Gets All Loaded Reviews
                const all_loaded_reviews:HTMLDivElement[] = [...all_reviews].filter(function(one_review:HTMLDivElement):HTMLDivElement|undefined {
                    if(![...first_reviews].includes(one_review)) {
                        return one_review
                    }
                })

                all_loaded_reviews.forEach(one_review => one_review.remove()) // Removes All Loaded Reviews From The DOM
                hide_loaded_reviews.remove() // Removes The Hide Loaded Reviews Button From The DOM

                // Creates The Load More Reviews Button If Isn't Already In The DOM
                if(!load_reviews_buttons.querySelector(".load_more_reviews")) {
                    const load_more_reviews = document.createElement("button") // Creates The Load More Reviews Button
                    load_more_reviews.classList.add("load_more_reviews") // Adds The Load More Reviews Class
                    load_more_reviews.textContent = gettext("Zobraziť viac")
                    load_reviews_buttons.appendChild(load_more_reviews) // Appends The Load More Reviews Button To The Load Reviews Buttons Container
                }

                (load_reviews_buttons.querySelector(".load_more_reviews") as HTMLButtonElement).dataset["page"] = "2" // Stores And Sets The Number Of The Next Page Back To Default
            }
        })
    }

    // Animate Reviews
    const reviews_info_container:HTMLDivElement = document.querySelector(".reviews .reviews_info_container") as HTMLDivElement // Gets Reviews Info
    setObserverAnimation(reviews_info_container, 1, reviewsInfoAnimation) // Animates Reviews Info

    const all_reviews:NodeListOf<HTMLDivElement> = all_reviews_container.querySelectorAll<HTMLDivElement>(".one_review") // Gets All Reviews
    setObserverAnimation(all_reviews) // Animates Each Review From All Reviews

    // Custom Select Menu - Contact Form

    const subject_select_menu:HTMLDivElement = document.querySelector(".subject_select_menu") as HTMLDivElement
    const subject_select:HTMLDivElement = subject_select_menu.querySelector(".select") as HTMLDivElement
    const subject_options_list:HTMLDivElement = subject_select_menu.querySelector(".options_list") as HTMLDivElement
    const subject_options:NodeListOf<HTMLDivElement> = subject_select_menu.querySelectorAll<HTMLDivElement>(".option")

    subject_select.addEventListener("click", function():void {
        subject_options_list.classList.toggle("active");
        (this.querySelector(".fa-angle-down") as HTMLElement).classList.toggle("fa-angle-up")
    })

    subject_options.forEach(function(option:HTMLDivElement):void {
        option.addEventListener("click", function():void {
            if(!this.dataset["subject"]) return

            sessionStorage.setItem("subject", this.dataset["subject"])

            subject_options_list.classList.toggle("active");
            (subject_select.querySelector(".fa-angle-down") as HTMLDivElement).classList.toggle("fa-angle-up")

            // Removes Selected Class From Options
            subject_options.forEach(function(remove_selected:HTMLDivElement):void {
                remove_selected.classList.remove("selected")
            })

            // Shows Current Selected Option From List Without Icon
            if(this.dataset["subject"] === sessionStorage.getItem("subject")) {
                (subject_select.querySelector("span") as HTMLSpanElement).textContent = (this.querySelector("span") as HTMLSpanElement).textContent;
                (subject_select_menu.querySelector("input") as HTMLInputElement).value = (this.querySelector("span") as HTMLSpanElement).textContent

                this.classList.add("selected") // Adds Selected Class To Selected Option
            }
        })
    })

    // Selected Attachment
        
    const attachment:HTMLInputElement = document.querySelector("#select_attachment") as HTMLInputElement
    const attachment_report:HTMLParagraphElement = document.querySelector(".attachment_report") as HTMLParagraphElement

    // Function For Show The Attachment Report
    function showAttachmentReport(file:File):void {
        const MAX_ATTACHMENT_SIZE:number = 25 * 1000 * 1000 // 25MB

        const attachment_name:string = file.name
        const attachment_size:number = file.size

        if(attachment_size <= MAX_ATTACHMENT_SIZE) attachment_report.textContent = `${gettext("Vybraný súbor")}: ${attachment_name}`
        else if(attachment_size > MAX_ATTACHMENT_SIZE) attachment_report.textContent = gettext("Vybraný súbor je príliš veľký.")
        else attachment_report.textContent = gettext("Nie je vybraný žiaden súbor.")
    }

    // Attachment Change Functionalities
    attachment.addEventListener("change", function(event:Event):void {
        if(!(event.target instanceof HTMLInputElement)) return
        if(!event.target.files || event.target.files.length === 0) return

        const file:File|null = event.target.files[0] || null

        if(!file) return
        
        showAttachmentReport(file) // Shows The Attachment Report
    })

    // Message Container Drag & Drop Functionalities

    const message_container:HTMLDivElement = document.querySelector(".message_container") as HTMLDivElement // Gets The Message Container

    message_container.addEventListener("dragover", function(event:DragEvent):void {
        event.preventDefault() // Prevents Default Behaviour
        
        this.classList.add("drag_active") // Adds Drag Animation
    })

    message_container.addEventListener("dragleave", function():void {
        this.classList.remove("drag_active") // Removes Drag Animation
    })

    message_container.addEventListener("drop", function(event:DragEvent):void {
        event.preventDefault() // Prevents Default Behaviour

        this.classList.remove("drag_active") // Removes Drag Animation

        const file = (event.dataTransfer!.files)[0] as File // Gets New Dragged File
        const data_transfer:DataTransfer = new DataTransfer() // Creates New Data Transfer

        data_transfer.items.add(file) // Adds File To The Stored File Data
        attachment.files = data_transfer.files // Synchronizes Selected Files With Stored File Data

        showAttachmentReport(file) // Shows The Attachment Report
    })
})