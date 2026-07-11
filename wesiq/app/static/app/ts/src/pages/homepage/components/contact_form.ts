import { showAttachmentReport } from "../functions/showAttachmentReport.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Custom Select Menu

    // Variables

    const contact_form:HTMLFormElement = document.querySelector(".contact_form") as HTMLFormElement // Gets The Contact Form
    const subject_select_menu:HTMLDivElement = contact_form.querySelector(".subject_select_menu") as HTMLDivElement // Gets The Subject Select Menu
    const subject_select:HTMLDivElement = subject_select_menu.querySelector(".select") as HTMLDivElement // Gets The Selected Subject Container
    const subject_options_list:HTMLDivElement = subject_select_menu.querySelector(".options_list") as HTMLDivElement // Gets The Subject Options List
    const subject_options:NodeListOf<HTMLDivElement> = subject_select_menu.querySelectorAll<HTMLDivElement>(".option") // Gets All The Subject Options

    // Events

    // Subject Select Click Functionality
    subject_select.addEventListener("click", function():void {
        subject_options_list.classList.toggle("active")
        subject_options_list.inert = !subject_options_list.inert; // Enables / Disables The Focus
        (this.querySelector(".fa-angle-down") as HTMLElement).classList.toggle("fa-angle-up")
    })

    // Subject Select Keydown Functionality
    subject_select.addEventListener("keydown", function(event:KeyboardEvent):void {
        if(event.key === "Enter") {
            subject_options_list.classList.toggle("active")
            subject_options_list.inert = !subject_options_list.inert; // Enables / Disables The Focus
            (this.querySelector(".fa-angle-down") as HTMLElement).classList.toggle("fa-angle-up")
        }
    })

    // Subject Options FunctionalitIES
    subject_options.forEach(function(one_option:HTMLDivElement):void {
        // Option Click Functionalities
        one_option.addEventListener("click", function():void {
            if(!this.dataset["subject"]) return

            sessionStorage.setItem("subject", this.dataset["subject"])

            subject_options_list.classList.toggle("active")
            subject_options_list.inert = !subject_options_list.inert; // Enables / Disables The Focus
            (subject_select.querySelector(".fa-angle-down") as HTMLDivElement).classList.toggle("fa-angle-up")

            // Removes Selected Class From Options
            subject_options.forEach(function(remove_selected:HTMLDivElement):void {
                remove_selected.classList.remove("selected")
            })

            // Shows Current Selected Option From List Without Icon
            if(this.dataset["subject"] === sessionStorage.getItem("subject")) {
                (subject_select.querySelector("span") as HTMLSpanElement).textContent = (this.querySelector("span") as HTMLSpanElement).textContent;
                (subject_select_menu.querySelector("input") as HTMLInputElement).value = this.dataset["subject"]

                this.classList.add("selected") // Adds Selected Class To Selected Option
            }
        })

        // Option Keydown Functionalities
        one_option.addEventListener("keydown", function(event:KeyboardEvent):void {
            if(event.key === "Enter") {
                if(!this.dataset["subject"]) return

                sessionStorage.setItem("subject", this.dataset["subject"])

                subject_options_list.classList.toggle("active")
                subject_options_list.inert = !subject_options_list.inert; // Enables / Disables The Focus
                (subject_select.querySelector(".fa-angle-down") as HTMLDivElement).classList.toggle("fa-angle-up")

                // Removes Selected Class From Options
                subject_options.forEach(function(remove_selected:HTMLDivElement):void {
                    remove_selected.classList.remove("selected")
                })

                // Shows Current Selected Option From List Without Icon
                if(this.dataset["subject"] === sessionStorage.getItem("subject")) {
                    (subject_select.querySelector("span") as HTMLSpanElement).textContent = (this.querySelector("span") as HTMLSpanElement).textContent;
                    (subject_select_menu.querySelector("input") as HTMLInputElement).value = this.dataset["subject"]

                    this.classList.add("selected") // Adds Selected Class To Selected Option
                }
            }
        })
    })

    // Selected Attachment

    // Variables
    
    const message_container:HTMLDivElement = document.querySelector(".message_container") as HTMLDivElement // Gets The Message Container
    const attachment:HTMLDivElement = message_container.querySelector(".attachment") as HTMLDivElement // Gets The Attachment Container
    const attachment_input:HTMLInputElement = attachment.querySelector("#select_attachment") as HTMLInputElement // Gets The Attachment Input
    const attachment_label:HTMLLabelElement = attachment.querySelector("label") as HTMLLabelElement // Gets The Attachment Label
    const attachment_report:HTMLParagraphElement = attachment.querySelector(".attachment_report") as HTMLParagraphElement // Gets The Attachment Report

    // Events

    // Attachment Input Change Functionalities
    attachment_input.addEventListener("change", function(event:Event):void {
        if(!(event.target instanceof HTMLInputElement)) return
        if(!event.target.files || event.target.files.length === 0) return

        const file:File|null = event.target.files[0] || null

        if(!file) return
        
        showAttachmentReport(file, attachment_report) // Shows The Attachment Report
    })

    // Attachment Label Keydown Functionality
    attachment_label.addEventListener("keydown", function(event:KeyboardEvent):void {
        if(event.key === "Enter") attachment_input.click() // Opens The Select File Dialog
    })

    // Message Container Drag Over Functionality
    message_container.addEventListener("dragover", function(event:DragEvent):void {
        event.preventDefault() // Prevents Default Behaviour
        this.classList.add("drag_active") // Adds Drag Animation
    })

    // Message Container Drag Leave Functionality
    message_container.addEventListener("dragleave", () => message_container.classList.remove("drag_active")) // Removes Drag Animation

    // Message Container Drop Functionality
    message_container.addEventListener("drop", function(event:DragEvent):void {
        event.preventDefault() // Prevents Default Behaviour

        this.classList.remove("drag_active") // Removes Drag Animation

        const file = (event.dataTransfer!.files)[0] as File // Gets New Dragged File
        const data_transfer:DataTransfer = new DataTransfer() // Creates New Data Transfer

        data_transfer.items.add(file) // Adds File To The Stored File Data
        attachment_input.files = data_transfer.files // Synchronizes Selected Files With Stored File Data

        showAttachmentReport(file, attachment_report) // Shows The Attachment Report
    })
})