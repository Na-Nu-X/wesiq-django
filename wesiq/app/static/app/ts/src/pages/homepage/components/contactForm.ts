import { showAttachmentReport } from "../functions/showAttachmentReport.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Custom Select Menu - Contact Form

    // Variables

    const subject_select_menu:HTMLDivElement = document.querySelector(".subject_select_menu") as HTMLDivElement
    const subject_select:HTMLDivElement = subject_select_menu.querySelector(".select") as HTMLDivElement
    const subject_options_list:HTMLDivElement = subject_select_menu.querySelector(".options_list") as HTMLDivElement
    const subject_options:NodeListOf<HTMLDivElement> = subject_select_menu.querySelectorAll<HTMLDivElement>(".option")

    // Events

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

    // Variables
        
    const attachment:HTMLInputElement = document.querySelector("#select_attachment") as HTMLInputElement
    const attachment_report:HTMLParagraphElement = document.querySelector(".attachment_report") as HTMLParagraphElement

    // Events

    // Attachment Change Functionalities
    attachment.addEventListener("change", function(event:Event):void {
        if(!(event.target instanceof HTMLInputElement)) return
        if(!event.target.files || event.target.files.length === 0) return

        const file:File|null = event.target.files[0] || null

        if(!file) return
        
        showAttachmentReport(file, attachment_report) // Shows The Attachment Report
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

        showAttachmentReport(file, attachment_report) // Shows The Attachment Report
    })
})