import { setObserverAnimation } from "../utils/setObserverAnimation.js"
import { reviewsInfoAnimation } from "../components/reviewsInfoAnimation.js"
import { customSelectMenu } from "../components/customSelectMenu.js"

// Chart
declare const Chart: typeof import("chart.js").Chart;

import type {
    Plugin,
    ChartType,
} from "chart.js"

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
    // Search Bar

    const search_bar:HTMLInputElement = document.querySelector(".search_bar") as HTMLInputElement
    const search_result:HTMLDivElement = document.querySelector(".search_result") as HTMLDivElement
    const delete_search_bar:HTMLElement = document.querySelector(".fa-xmark") as HTMLElement

    function renderSearchResult():void {
        interface Pages {
            url:string,
            title:string
        }

        let searched_text:string = search_bar.value // Searched Text Value

        // Data - Array of Objects of Pages
        const pages:Pages[] = [
            { url: "/", title: "Hlavná stránka" },
            { url: "/prihlasenie", title: "Prihlásenie" },
            { url: "/obnova-hesla", title: "Obnova hesla" },
            { url: "/registracia", title: "Registrácia" },
            { url: "/moj-ucet", title: "Môj účet" },
            { url: "/moje-hodnotenie", title: "Moje hodnotenie" },
            { url: "/blog", title: "Blog" },
        ]

        search_result.innerHTML = "" // Deletes Search Result

        // Deletes Search Result When Searched Text Value is Empty
        if(searched_text.trim() === "") {
            search_result.innerHTML = ""

            search_bar.style.borderBottom = "1px solid rgb(229.5, 229.5, 229.5)"
            search_bar.style.borderRadius = "5px"

            search_result.style.border = "none"
            search_result.classList.remove("active")

            return
        }
        
        // Filters Pages by Searched Text Value
        const filtered_pages:Pages[] = pages.filter(function(one_page:Pages):boolean {
            return one_page.title.toLowerCase().includes(searched_text.toLowerCase())
        })

        // Renders Result
        filtered_pages.forEach(function(one_page:Pages):void {
            let search_result_link:HTMLAnchorElement = document.createElement("a")
            search_result_link.setAttribute("href", one_page.url)
            search_result_link.textContent = one_page.title
            search_result.appendChild(search_result_link)
        })

        if(search_result.children.length > 0) {
            search_bar.style.borderRadius = "5px 5px 0px 0px"
            search_bar.style.borderBottom = "none"

            search_result.style.borderBottom = "1px solid rgb(229.5, 229.5, 229.5)"
            search_result.style.borderLeft = "1px solid rgb(229.5, 229.5, 229.5)"
            search_result.style.borderRight = "1px solid rgb(229.5, 229.5, 229.5)"
            search_result.classList.add("active")
        }
        
        else {
            search_bar.style.border = "1px solid rgb(229.5, 229.5, 229.5)"
            search_bar.style.borderRadius = "5px"

            search_result.style.border = "none"
            search_result.classList.remove("active")
        }
    }

    // Delete Search Bar Icon
    delete_search_bar.addEventListener("click", function():void {
        search_bar.value = ""
        renderSearchResult()
    })

    // Search Bar Input
    search_bar.addEventListener("input", function():void {
        renderSearchResult()
    })

    // Login Form

    // Login Form Dialog
    const login_button:HTMLAnchorElement = document.querySelector(".login_button") as HTMLAnchorElement
    const no_logged_in_button:HTMLAnchorElement = document.querySelector(".login") as HTMLAnchorElement
    const login_form_dialog:HTMLDialogElement = document.querySelector(".login_form_dialog") as HTMLDialogElement
    const login_form:HTMLFormElement = login_form_dialog.querySelector(".login_form") as HTMLFormElement

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
            event.clientY > login_form_dimensions.bottom
        ) {
            login_form_dialog.close()
        }
    })

    // Registration Form

    // Registration Form Dialog
    const registration_button:HTMLAnchorElement = document.querySelector(".registration_button") as HTMLAnchorElement
    const registration_form_dialog:HTMLDialogElement = document.querySelector(".registration_form_dialog") as HTMLDialogElement
    const registration_form:HTMLFormElement = registration_form_dialog.querySelector(".registration_form") as HTMLFormElement

    registration_button.addEventListener("click", function():void {
        registration_form_dialog.showModal()
    })

    registration_form_dialog.addEventListener("click", function(event:PointerEvent):void {
        const registration_form_dimensions:DOMRect = registration_form.getBoundingClientRect()

        if (
            event.clientX < registration_form_dimensions.left ||
            event.clientX > registration_form_dimensions.right ||
            event.clientY < registration_form_dimensions.top ||
            event.clientY > registration_form_dimensions.bottom
        ) {
            registration_form_dialog.close()
        }
    })

    // Profile Dialog

    const profile_button:HTMLAnchorElement = document.querySelector(".profile_button") as HTMLAnchorElement
    const profile_dialog:HTMLDialogElement = document.querySelector(".profile_dialog") as HTMLDialogElement
    const profile:HTMLDivElement = profile_dialog.querySelector(".profile") as HTMLDivElement

    if(profile_button) {
        profile_button.addEventListener("click", function():void {
            profile_dialog.showModal()
        })
    }

    profile_dialog.addEventListener("click", function(event:PointerEvent):void {
        const profile_dimensions:DOMRect = profile.getBoundingClientRect()

        if (
            event.clientX < profile_dimensions.left ||
            event.clientX > profile_dimensions.right ||
            event.clientY < profile_dimensions.top ||
            event.clientY > profile_dimensions.bottom
        ) {
            profile_dialog.close()
        }
    })

    // Chart
    const activity_chart:HTMLCanvasElement = document.querySelector(".activity_chart") as HTMLCanvasElement

    const customCanvasBackgroundColor:Plugin<"line"> = {
    id: 'customCanvasBackgroundColor',
        beforeDraw: (chart, _args, options) => {
            const {ctx} = chart;
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = options.color || '#99ffff';
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
        }
    };
    
    new Chart<"line">(activity_chart, {
        type: "line",
        data: {
            labels: ["PO", "UT", "ST", "ŠT", "PI", "SO", "NE"],
            datasets: [{
                label: "aktivita",
                data: [1.5, 0.5, 2, 1, 0, 1, 0.5],
                borderColor: '#ebb914',
                backgroundColor: '#ffffff',
                borderWidth: 1,
                pointRadius: 3,
            }]
        },
        options: {
            animation: false,

            scales: {
                x: {
                    grid: {
                        // display: false,
                        color: "#999999",
                    },

                    ticks: {
                        font: {
                            size: 15,
                        }
                    }
                },

                y: {
                    //beginAtZero: true,
                    grid: {
                        // display: false,
                        color: "#999999",
                    },

                    ticks: {
                        font: {
                            size: 15,
                        }
                    }
                },
            },

            plugins: {
                customCanvasBackgroundColor: {
                    color: 'transparent',
                },

                legend: {
                    display: false,
                },
            },

            elements: {
                line: {
                    tension: 0,
                },

                point: {
                    pointStyle: "circle",
                    hoverRadius: 5,
                    hoverBorderWidth: 2,
                }
            }
        },

        plugins: [customCanvasBackgroundColor],
    })

    // Custom Select Menus - Reviews

    const sort_select_menu:HTMLDivElement = document.querySelector(".reviews .select_menus .sort_select_menu") as HTMLDivElement // Gets Sort Select Menu
    const rating_select_menu:HTMLDivElement = document.querySelector(".reviews .select_menus .rating_select_menu") as HTMLDivElement // Gets Rating Select Menu

    customSelectMenu(sort_select_menu, "sort") // Adds Functionality For Sort Select Menu That Sets The Sort URL Parameter
    customSelectMenu(rating_select_menu, "rating") // Adds Functionality For Rating Select Menu That Sets The Rating URL Parameter

    // Reviews

    // Animate Reviews
    const reviews_info_container:HTMLDivElement = document.querySelector(".reviews .reviews_info_container") as HTMLDivElement // Gets Reviews Info
    setObserverAnimation(reviews_info_container, false, 1, reviewsInfoAnimation) // Animates Reviews Info

    const all_reviews:NodeListOf<HTMLDivElement> = document.querySelectorAll<HTMLDivElement>(".reviews .all_reviews .one_review") // Gets All Reviews
    setObserverAnimation(all_reviews, true, 0.5) // Animates Each Review From All Reviews

    // Custom Select Menu - Contact Form

    const subject_select_menu:HTMLDivElement = document.querySelector(".subject_select_menu") as HTMLDivElement
    const subject_select:HTMLDivElement = subject_select_menu.querySelector(".select") as HTMLDivElement
    const subject_options_list:HTMLDivElement = subject_select_menu.querySelector(".options_list") as HTMLDivElement
    const subject_options:NodeListOf<HTMLDivElement> = subject_select_menu.querySelectorAll<HTMLDivElement>(".option")

    subject_select.addEventListener("click", function():void {
        subject_options_list.classList.toggle("active");
        (subject_select.querySelector(".fa-angle-down") as HTMLElement).classList.toggle("fa-angle-up")
    })

    subject_options.forEach(function(option:HTMLDivElement):void {
        option.addEventListener("click", function():void {
            if(!option.dataset.subject) return

            sessionStorage.setItem("subject", option.dataset.subject)

            subject_options_list.classList.toggle("active");
            (subject_select.querySelector(".fa-angle-down") as HTMLDivElement).classList.toggle("fa-angle-up")

            // Removes Selected Class From Options
            subject_options.forEach(function(remove_selected:HTMLDivElement):void {
                remove_selected.classList.remove("selected")
            })

            // Shows Current Selected Option From List Without Icon
            if(option.dataset.subject === sessionStorage.getItem("subject")) {
                (subject_select.querySelector("span") as HTMLSpanElement).textContent = (option.querySelector("span") as HTMLSpanElement).textContent;
                (subject_select_menu.querySelector("input") as HTMLInputElement).value = (option.querySelector("span") as HTMLSpanElement).textContent

                option.classList.add("selected") // Adds Selected Class To Selected Option
            }
        })
    })

    // Selected Attachment
        
    const attachment:HTMLInputElement = document.querySelector("#select_attachment") as HTMLInputElement
    const attachment_report:HTMLParagraphElement = document.querySelector(".attachment_report") as HTMLParagraphElement

    attachment.addEventListener("change", function(event:Event):void {
        if(!(event.target instanceof HTMLInputElement)) return
        if(!event.target.files || event.target.files.length === 0) return

        const file = event.target.files[0]

        if(!file) return

        const attachment_name = file.name
        const attachment_size = file.size

        if(attachment_size <= 25000000) attachment_report.textContent = `Vybraný súbor: ${attachment_name}`
        else if(attachment_size > 25000000) attachment_report.textContent = "Vybraný súbor je príliš veľký."
        else attachment_report.textContent = "Nie je vybraný žiaden súbor."
    })
})