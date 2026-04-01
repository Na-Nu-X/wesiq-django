import { setObserverAnimation } from "../utils/setObserverAnimation.js"
import { reviewsInfoAnimation } from "../components/reviewsInfoAnimation.js"
import { customSelectMenu } from "../components/customSelectMenu.js"

// Chart
declare const Chart: typeof import("chart.js").Chart

import type {
    Plugin,
    ChartType
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

    const search_bar:HTMLInputElement = document.querySelector(".search_bar") as HTMLInputElement // Gets Search Bar
    const search_result:HTMLDivElement = document.querySelector(".search_result") as HTMLDivElement // Gets Search Result
    const delete_search_bar:HTMLElement = document.querySelector(".fa-xmark") as HTMLElement // Gets Delete Search Bar Icon

    interface Pages {
        id:number,
        url:string,
        title:string,
        icon: string,
        is_from_history:boolean
    }

    // Data - Array of Objects of Pages
    const pages:Pages[] = [
        { id: 1, url: "/", title: gettext("Hlavná stránka"), icon: "<i class='fa-solid fa-house'></i>", is_from_history: false }, // https://fontawesome.com/icons/house
        { id: 2, url: gettext("/prihlasenie"), title: gettext("Prihlásenie"), icon: "<i class='fa-regular fa-user'></i>", is_from_history: false }, // https://fontawesome.com/icons/user
        { id: 3, url: gettext("/obnova-hesla"), title: gettext("Obnova hesla"), icon: "<i class='fa-regular fa-user'></i>", is_from_history: false }, // https://fontawesome.com/icons/user
        { id: 4, url: gettext("/registracia"), title: gettext("Registrácia"), icon: "<i class='fa-regular fa-user'></i>", is_from_history: false }, // https://fontawesome.com/icons/user
        { id: 5, url: gettext("/moj-ucet"), title: gettext("Môj účet"), icon: "<i class='fa-regular fa-user'></i>", is_from_history: false }, // https://fontawesome.com/icons/user
        { id: 6, url: gettext("/moje-hodnotenie"), title: gettext("Moje hodnotenie"), icon: "<i class='fa-regular fa-star'></i>", is_from_history: false }, // https://fontawesome.com/icons/star
        { id: 7, url: gettext("/blog"), title: gettext("Blog"), icon: "<i class='fa-solid fa-book'></i>", is_from_history: false }, // https://fontawesome.com/icons/book
        { id: 8, url: gettext("/trening"), title: gettext("Tréning"), icon: "<i class='fa-solid fa-dumbbell'></i>", is_from_history: false }, // https://fontawesome.com/icons/dumbbell
        { id: 9, url: gettext("/moje-treningove-plany"), title: gettext("Moje tréningové plány"), icon: "<i class='fa-solid fa-dumbbell'></i>", is_from_history: false }, // https://fontawesome.com/icons/dumbbell
    ]

    // Function For Render Search Result
    function renderSearchResult(filtered_pages:Pages[]):void {
        // Renders Result
        filtered_pages.forEach(function(one_page:Pages):void {
            let container:HTMLDivElement = document.createElement("div")

            let search_result_link:HTMLAnchorElement = document.createElement("a")

            search_result_link.dataset["id"] = String(one_page.id) // Stores ID Of Search Result
            search_result_link.setAttribute("href", one_page.url)

            // If The Page Is Not From History
            if(!one_page.is_from_history) {
                container.innerHTML = one_page.icon
                search_result_link.innerHTML = one_page.title
            }
            
            // If The Page Is From History
            else {
                container.innerHTML = "<i class='fa-solid fa-clock-rotate-left'></i>" // https://fontawesome.com/icons/clock-rotate-left
                search_result_link.innerHTML = one_page.title
            }

            container.appendChild(search_result_link)
            search_result.appendChild(container)
        })

        if(search_result.children.length > 0) {
            search_bar.focus()

            search_bar.style.borderRadius = "5px 5px 0px 0px"
            search_bar.style.borderBottom = "none"

            search_result.style.borderBottom = "1px solid rgb(75, 75, 250, 0.5)"
            search_result.style.borderLeft = "1px solid rgb(75, 75, 250, 0.5)"
            search_result.style.borderRight = "1px solid rgb(75, 75, 250, 0.5)"
            search_result.classList.add("active")
        }
        
        else {
            search_bar.style.border = "1px solid rgb(75, 75, 250, 0.5)"
            search_bar.style.borderRadius = "5px"

            search_result.style.border = "none"
            search_result.classList.remove("active")
        }
    }
    
    // Function For Filter Search Result By Searched Text
    function filterSearchResult():void {
        let searched_text:string = search_bar.value // Searched Text Value

        search_result.innerHTML = "" // Deletes Search Result

        // Deletes Search Result When Searched Text Value is Empty
        if(searched_text.trim() === "") {
            search_result.innerHTML = ""

            search_bar.style.borderBottom = "1px solid rgb(75, 75, 250, 0.5)"
            search_bar.style.borderRadius = "5px"

            search_result.style.border = "none"
            search_result.classList.remove("active")

            return
        }
        
        // Filters Pages by Searched Text Value
        const filtered_pages:Pages[] = pages.filter(function(one_page:Pages):boolean {
            return one_page.title.toLowerCase().includes(searched_text.toLowerCase())
        })

        filtered_pages.forEach((one_page:Pages) => one_page.is_from_history = false) // Flags Filtered Pages That They Are Not From The History

        renderSearchResult(filtered_pages) // Renders Search Result
    }

    function focusSearchBar():void {
        // Shows Search Bar History
        if(search_bar.value === "") {
            const search_bar_history:string[] = JSON.parse(localStorage.getItem("search_bar_history") || "[]") as string[] // Gets The Search Bar History From The Local Storage
            
            search_result.innerHTML = "" // Deletes Search Result

            // Shows All Available Pages When The Search History Is Empty
            if(search_bar_history.length === 0) {
                pages.forEach((one_page:Pages) => one_page.is_from_history = false) // Flags Filtered Pages That They Are Not From The History

                renderSearchResult(pages) // Renders Search Result (Reversed, In Order To Show Latest Result From The History On The Top)
            }

            // Shows Search Bar History Results
            else {
                // Filters Pages by IDs In Search Bar History In The Local Storage
                const filtered_pages:Pages[] = search_bar_history
                    .map(one_id => pages.find(one_page => String(one_page.id) === one_id))
                    .filter((one_page):one_page is Pages => one_page !== undefined)

                filtered_pages.forEach((one_page:Pages) => one_page.is_from_history = true) // Flags Filtered Pages That They Are From The History

                renderSearchResult(filtered_pages) // Renders Search Result (Reversed, In Order To Show Latest Result From The History On The Top)
            }
        }

        else filterSearchResult() // Filters Search Result By Searched Text
    }

    // Delete Search Bar Icon
    delete_search_bar.addEventListener("click", function():void {
        search_bar.value = "" // Deletes Search Bar Value
        search_result.innerHTML = "" // Deletes Search Result

        search_bar.style.borderBottom = "1px solid rgb(75, 75, 250, 0.5)"
        search_bar.style.borderRadius = "5px"

        search_result.style.border = "none"
        search_result.classList.remove("active")
    })

    // Search Bar Input
    search_bar.addEventListener("input", function():void {
        filterSearchResult() // Filters Search Result By Searched Text
    })

    // If The User Clicks To Search Result
    search_result.addEventListener("click", function(event):void {
        const clicked_search_result_id:string = (event.target as HTMLAnchorElement).dataset["id"] || "" // Gets The Clicked Search Result ID
        let search_bar_history:string[] = JSON.parse(localStorage.getItem("search_bar_history") || "[]") as string[] // Gets The Search Bar History From The Local Storage

        // Removes Item From The History
        if((event.target as HTMLElement).classList.contains("fa-xmark")) {
            const search_result_id_for_deletion:string = ((event.target as HTMLAnchorElement).nextSibling as HTMLAnchorElement).dataset["id"] || "" // Gets The Search Result ID Of The Item For Deletion
            search_bar_history = search_bar_history.filter(one_item => one_item !== search_result_id_for_deletion) // Removes The Item From The History

            localStorage.setItem("search_bar_history", JSON.stringify(search_bar_history)) // Saves Updated Search Bar History To The Local Storage

            focusSearchBar()
        }

        // Stores Clicked Search Result To The Search Bar History
        else {
            search_bar_history = search_bar_history.filter(one_item => one_item !== clicked_search_result_id) // Removes The Clicked Item From The History
            search_bar_history.unshift(clicked_search_result_id) // Updates Search Bar History
            if(search_bar_history.length > 3) search_bar_history = search_bar_history.slice(0, 3) // Shows Maximum Of 3 Results From The History, Others Will Be Deleted From The History

            localStorage.setItem("search_bar_history", JSON.stringify(search_bar_history)) // Saves Updated Search Bar History To The Local Storage
        }
    })

    // If User Click Inside The Search Bar
    search_bar.addEventListener("focus", function():void {
        focusSearchBar()
    })

    // If User Clicks Outside The Search Bar
    document.addEventListener("click", function(event:PointerEvent):void {
        if(!(event.target as HTMLInputElement).classList.contains("search_bar") && !(event.target as HTMLDivElement).classList.contains("search_result") && !(event.target as HTMLElement).classList.contains("fa-xmark")) {
            search_result.innerHTML = "" // Deletes Search Result

            search_bar.style.borderBottom = "1px solid rgb(75, 75, 250, 0.5)"
            search_bar.style.borderRadius = "5px"

            search_result.style.border = "none"
            search_result.classList.remove("active")

            return
        }
    })

    // Change Remove Item From The History Icon Functionality
    search_result.addEventListener("mouseover", function(event:MouseEvent):void {
        if((event.target as HTMLElement).classList.contains("fa-clock-rotate-left")) {
            const icon:HTMLElement = event.target as HTMLElement // Gets The Remove From Search History Icon

            icon.classList.replace("fa-clock-rotate-left", "fa-xmark") // Shows The X Icon
        }
    })

    search_result.addEventListener("mouseout", function(event:MouseEvent):void {
        if((event.target as HTMLElement).classList.contains("fa-xmark")) {
            const icon:HTMLElement = event.target as HTMLElement // Gets The Remove From Search History Icon

            icon.classList.replace("fa-xmark", "fa-clock-rotate-left") // Shows The Clock Icon
        }
    })

    let focused_search_result_index:number = 0 // Focused Search Result Index

    search_result.addEventListener("wheel", function(event:WheelEvent):void {
        event.preventDefault() // Stop Scrolling

        if(event.deltaY < 0) changeFocusedSearchResult(focused_search_result_index + 1) // Changes Focused Search Result (Shows Next Search Result)
        if(event.deltaY > 0) changeFocusedSearchResult(focused_search_result_index - 1) // Changes Focused Search Result (Shows Previous Search Result)
    })

    // Function For Change Focused Search Result
    function changeFocusedSearchResult(index:number):void {
        const all_search_results:NodeListOf<HTMLAnchorElement> = search_result.querySelectorAll("a")

        focused_search_result_index = index // Updates Focused Search Result Index

        if(index > all_search_results.length - 1) focused_search_result_index = 0 // Sets Focused Search Result Index To Minimum
        if(index < 0) focused_search_result_index = all_search_results.length - 1; // Sets Focused Search Result Index To Maximum

        (all_search_results[focused_search_result_index] as HTMLAnchorElement).focus() // Focuses Search Result
    }

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
            event.clientY > login_form_dimensions.bottom ||
            (event.target as HTMLAnchorElement).classList.contains("back") ||
            ((event.target as HTMLElement).parentNode as HTMLAnchorElement).classList.contains("back")
        ) {
            this.close()
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
            event.clientY > registration_form_dimensions.bottom ||
            (event.target as HTMLAnchorElement).classList.contains("back") ||
            ((event.target as HTMLElement).parentNode as HTMLAnchorElement).classList.contains("back")
        ) {
            this.close()
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
            this.close()
        }
    })

    // Chart
    const activity_chart:HTMLCanvasElement = document.querySelector(".activity_chart") as HTMLCanvasElement

    const customCanvasBackgroundColor:Plugin<"line"> = {
    id: 'customCanvasBackgroundColor',
        beforeDraw: (chart, _args, options) => {
            const {ctx} = chart
            ctx.save()
            ctx.globalCompositeOperation = 'destination-over'
            ctx.fillStyle = options["color"] || "#99ffff"
            ctx.fillRect(0, 0, chart.width, chart.height)
            ctx.restore()
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
    customSelectMenu(rating_select_menu, "rating", true) // Adds Functionality For Rating Select Menu That Sets The Rating URL Parameter

    // Reviews

    // Animate Reviews
    const reviews_info_container:HTMLDivElement = document.querySelector(".reviews .reviews_info_container") as HTMLDivElement // Gets Reviews Info
    setObserverAnimation(reviews_info_container, 1, reviewsInfoAnimation) // Animates Reviews Info

    const all_reviews:NodeListOf<HTMLDivElement> = document.querySelectorAll<HTMLDivElement>(".reviews .all_reviews .one_review") // Gets All Reviews
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

    attachment.addEventListener("change", function(event:Event):void {
        if(!(event.target instanceof HTMLInputElement)) return
        if(!event.target.files || event.target.files.length === 0) return

        const file = event.target.files[0]

        if(!file) return

        const attachment_name = file.name
        const attachment_size = file.size

        if(attachment_size <= 25000000) attachment_report.textContent = `${gettext("Vybraný súbor")}: ${attachment_name}`
        else if(attachment_size > 25000000) attachment_report.textContent = gettext("Vybraný súbor je príliš veľký.")
        else attachment_report.textContent = gettext("Nie je vybraný žiaden súbor.")
    })
})