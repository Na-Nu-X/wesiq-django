"use strict"

document.addEventListener("DOMContentLoaded", function() {
    // Search Bar

    const search_bar = document.querySelector(".search_bar")
    const search_result = document.querySelector(".search_result")
    const delete_search_bar = document.querySelector(".fa-xmark")

    function renderSearchResult() {
        let searched_text = search_bar.value // Searched Text Value

        // Data - Array of Objects of Pages
        const pages = [
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
        const filtered_pages = pages.filter(function(one_page) {
            return one_page.title.toLowerCase().includes(searched_text.toLowerCase())
        })

        // Renders Result
        filtered_pages.forEach(function(one_page) {
            let search_result_link = document.createElement("a")
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
    delete_search_bar.addEventListener("click", function() {
        search_bar.value = ""
        renderSearchResult()
    })

    // Search Bar Input
    search_bar.addEventListener("input", function(event) {
        renderSearchResult()
    })

    // Login Form

    // Login Form Dialog
    const login_button = document.querySelector(".login_button")
    const no_logged_in_button = document.querySelector(".login")
    const login_form_dialog = document.querySelector(".login_form_dialog")
    const login_form = document.querySelector(".login_form")

    login_button.addEventListener("click", function() {
        login_form_dialog.showModal()
    })

    if(no_logged_in_button) {
        no_logged_in_button.addEventListener("click", function() {
            login_form_dialog.showModal()
        })
    }

    login_form_dialog.addEventListener("click", function(event) {
        const login_form_dimensions = login_form.getBoundingClientRect()

        if (
            event.clientX < login_form_dimensions.left ||
            event.clientX > login_form_dimensions.right ||
            event.clientY < login_form_dimensions.top ||
            event.clientY > login_form_dimensions.bottom
        ) {
            login_form_dialog.close()
        }
    })

    // Form
    login_form.addEventListener("click", function() {
        // Toggle Show / Hide Password

        const password = login_form.querySelector(".password")
        const show_password = login_form.querySelector(".fa-eye-slash")
        const hide_password = login_form.querySelector(".fa-eye")

        show_password.addEventListener("click", function() {
            show_password.style.display = "none"
            hide_password.style.display = "block"

            password.style.webkitTextSecurity = "none"
        })

        hide_password.addEventListener("click", function() {
            hide_password.style.display = "none"
            show_password.style.display = "block"

            password.style.webkitTextSecurity = "disc"
        })
    })

    // Password Reset

    const password_reset = login_form.querySelector(".password_reset")
    const email_address = login_form.querySelector(".email_address")
    const form_report = login_form.querySelector(".form_report")

    password_reset.addEventListener("click", function() {
        if(email_address.value !== "" && email_address.value.includes("@") && email_address.value.includes(".")) {
            form_report.textContent = ""

            document.cookie = `email_address=${email_address.value}; max-age=` + 60 * 10 + "; path=/" // 10 Minutes Timed Cookie With User's Email Address

            document.cookie = `password_reset_timer=${Date.now() + 10 * 60 * 1000}; max-age=` + 60 * 10 + "; path=/" // 10 Minutes Timed Cookie With Timer
        }

        else {
            event.preventDefault()

            form_report.textContent = "Zadajte váš e-mail"
            form_report.classList.add("error")
        }
    })

    // Registration Form

    // Registration Form Dialog
    const registration_button = document.querySelector(".registration_button")
    const registration_form_dialog = document.querySelector(".registration_form_dialog")
    const registration_form = document.querySelector(".registration_form")

    registration_button.addEventListener("click", function() {
        registration_form_dialog.showModal()
    })

    registration_form_dialog.addEventListener("click", function(event) {
        const registration_form_dimensions = registration_form.getBoundingClientRect()

        if (
            event.clientX < registration_form_dimensions.left ||
            event.clientX > registration_form_dimensions.right ||
            event.clientY < registration_form_dimensions.top ||
            event.clientY > registration_form_dimensions.bottom
        ) {
            registration_form_dialog.close()
        }
    })
    
    // Form
    registration_form.addEventListener("click", function() {
        // Toggle Show / Hide Password

        const password = registration_form.querySelector(".password")
        const show_password = registration_form.querySelector(".fa-eye-slash")
        const hide_password = registration_form.querySelector(".fa-eye")

        show_password.addEventListener("click", function() {
            show_password.style.display = "none"
            hide_password.style.display = "block"

            password.style.webkitTextSecurity = "none"
        })

        hide_password.addEventListener("click", function() {
            hide_password.style.display = "none"
            show_password.style.display = "block"

            password.style.webkitTextSecurity = "disc"
        })

        // Random Password Generator

        const generate_password = registration_form.querySelector(".fa-key")

        const alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]
        const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        const special_chars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '=', '+', '[', ']', '{', '}', ';', ':', "'", '"', ',', '.', '<', '>', '/', '?', '\\', '|', '`', '~']

        generate_password.addEventListener("click", function() {
            function shuffleString(string) {
                let array = string.split("")

                for(let i = array.length - 1; i > 0; i--) {
                    let j = Math.floor(Math.random() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]]
                }

                return array.join("");
            }

            let generated_password = ""

            for(let x = 0; x < 5; x++) {
                generated_password = generated_password + alphabet[Math.floor(Math.random() * alphabet.length)] + numbers[Math.floor(Math.random() * numbers.length)] + special_chars[Math.floor(Math.random() * special_chars.length)]
            }

            password.value = shuffleString(generated_password)
        })

        // Copy Password To Clipboard

        const copy_password = registration_form.querySelector(".copy_password")

        copy_password.addEventListener("click", function() {
            password.select()
            password.setSelectionRange(0, password.value.length)
            document.execCommand("copy")
            // navigator.clipboard.writeText(password.value) // Only HTTPS
        })

        // Paste From Clipboard

        const password_check = registration_form.querySelector(".password_check")
        const paste_password = registration_form.querySelector(".paste_password")

        paste_password.addEventListener("click", function() {
            // password_check_input.value = navigator.clipboard.readText() // Only HTTPS
            password_check.value = password.value
        })

        // Password Verification

        const form_report = registration_form.querySelector(".form_report")
        
        document.addEventListener("input", function() {
            if(password.value == password_check.value && password.value != "") {
                form_report.textContent = "Heslá sa zhodujú"
                form_report.classList.remove("error")
                form_report.classList.add("success")
            }

            else if(password.value != password_check.value) {
                form_report.textContent = "Heslá sa nezhodujú"
                form_report.classList.remove("success")
                form_report.classList.add("error")
            }

            else {
                form_report.textContent = ""
            }
        })
    })

    // Profile Dialog

    const profile_button = document.querySelector(".profile_button")
    const profile_dialog = document.querySelector(".profile_dialog")
    const profile = document.querySelector(".profile")

    if(profile_button) {
        profile_button.addEventListener("click", function() {
            profile_dialog.showModal()
        })
    }

    profile_dialog.addEventListener("click", function(event) {
        const profile_dimensions = profile.getBoundingClientRect()

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
    const activity_chart = document.querySelector(".activity_chart")

    const plugin = {
    id: 'customCanvasBackgroundColor',
    beforeDraw: (chart, args, options) => {
        const {ctx} = chart;
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = options.color || '#99ffff';
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
    }
    };
    
    new Chart(activity_chart, {
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
                    //labels: {
                    //    font: {
                    //        size: 15
                    //    }
                    //}
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

        plugins: [plugin],
    })

    // Custom Select Menu - Reviews

    // Fuction For Setting Sort Parameter to URL Address
    function setSortParameter(sort_value) {
        const page_url = new URL(window.location.href) // Gets Current URL

        page_url.searchParams.set("sort", sort_value) // Adds Parameter With Value to The URL

        window.location.href = page_url // Redirects Page
    }

    const sort_select = document.querySelector(".sort_select_menu .select")
    const sort_options_list = document.querySelector(".sort_select_menu .options_list")
    const sort_options = document.querySelectorAll(".sort_select_menu .option")

    sort_select.addEventListener("click", function() {
        sort_options_list.classList.toggle("active")
        sort_select.querySelector(".fa-angle-down").classList.toggle("fa-angle-up")
    })

    sort_options.forEach(function(option) {
        option.addEventListener("click", function() {
            setSortParameter(option.dataset.sort) // Sets sort URL Parameter With Value From data in Options

            sort_options_list.classList.toggle("active")
            sort_select.querySelector(".fa-angle-down").classList.toggle("fa-angle-up")
        })

        // Shows Current Selected Option From List Without Icon
        if(option.classList[1] === "selected") {
            sort_select.querySelector("span").textContent = option.querySelector("span").textContent
        }
    })

    // Fuction For Setting Rating Parameter to URL Address
    function setRatingParameter(rating_value) {
        const page_url = new URL(window.location.href) // Gets Current URL

        page_url.searchParams.set("rating", rating_value) // Adds Parameter With Value to The URL

        window.location.href = page_url // Redirects Page
    }

    const rating_select = document.querySelector(".rating_select_menu .select")
    const rating_options_list = document.querySelector(".rating_select_menu .options_list")
    const rating_options = document.querySelectorAll(".rating_select_menu .option")

    rating_select.addEventListener("click", function() {
        rating_options_list.classList.toggle("active")
        rating_select.querySelector(".fa-angle-down").classList.toggle("fa-angle-up")
    })

    rating_options.forEach(function(option) {
        option.addEventListener("click", function() {
            setRatingParameter(option.dataset.rating) // Sets rating URL Parameter With Value From data in Options

            rating_options_list.classList.toggle("active")
            rating_select.querySelector(".fa-angle-down").classList.toggle("fa-angle-up")
        })

        // Shows Current Selected Option From List Without Icon
        if(option.classList[1] === "selected") {
            rating_select.querySelector("span").innerHTML = option.querySelector("span").innerHTML
        }
    })

    // Refresh Select Menus

    const sort_select_menu_refresh = document.querySelector(".sort_select_menu .refresh .fa-arrow-rotate-right")
    const rating_select_menu_refresh = document.querySelector(".rating_select_menu .refresh .fa-arrow-rotate-right")

    sort_select_menu_refresh.addEventListener("click", function() {
        const page_url = new URL(window.location.href) // Gets Current URL

        // Deletes Parameters In URL
        page_url.searchParams.delete("sort")

        window.location.href = page_url // Redirects Page
    })

    rating_select_menu_refresh.addEventListener("click", function() {
        const page_url = new URL(window.location.href) // Gets Current URL

        // Deletes Parameters In URL
        page_url.searchParams.delete("rating")

        window.location.href = page_url // Redirects Page
    })

    // Reviews

    let run_again = true // Protection Against Multiple Execution Of If Statement

    window.addEventListener("scroll", function() {
        const reviews = document.querySelector(".reviews") // Gets Reviews From HTML
        const reviews_dimensions = reviews.getBoundingClientRect() // Gets Reviews Dimensions
        const navigation_bar = document.querySelector(".navigation_bar") // Gets Navigation Bar From HTML

        // Starts Only If User Scrolls To Reviews To See Them
        if(reviews_dimensions.top - navigation_bar.offsetHeight <= 0 && run_again == true) {
            document.querySelector(".reviews_info_container .average_rating").style.animation = "fade_in_animation 0.5s ease 3s forwards" // Sets Animation In CSS And Makes Average Rating Appear

            // Sets Animation In CSS For Each Review And Makes Them Appear
            const all_reviews = document.querySelectorAll(".reviews .all_reviews .one_review")
            all_reviews.forEach(function(one_review) {
                one_review.style.animation = "fade_in_animation 1s ease-out forwards"
            })

            // Review Graph

            const reviews_graph_columns = document.querySelectorAll(".reviews_info_container .graph .one_column")
            
            // Gets Total Amount Of Reviews
            let total_reviews_amount = 0 // Saves Total Amount Of All Reviews

            reviews_graph_columns.forEach(function(one_column) {
                // HTML Tags
                const counter = one_column.querySelector(".counter")

                total_reviews_amount += parseInt(counter.dataset.amount) // Adds Amount Of Reviews From Each Column To Total Amount
            })

            const max_green = 185 // Color With Maximum Of Green Is rgb(235, 185, 20)

            // Review Graph Animation
            reviews_graph_columns.forEach(function(one_column) {
                // HTML Tags
                const bar = one_column.querySelector(".review_bar")
                const counter = one_column.querySelector(".counter")

                const progress_percentage = ((parseInt(counter.dataset.amount) / total_reviews_amount) * 100).toFixed(2) // Gets Progress Percentage For Each Column

                // Animation's Settings
                const bar_target = parseFloat(progress_percentage) // Saves Each Column's Progress Pecentage As A Float Number
                const animation_duration = 3000 // 3 Seconds Animation
                let start_time = null // Sets Start Time Default Value

                // Function For Ease Out Animation Effect
                function easeOutEffect(t) {
                    return 1 - Math.pow(1 - t, 3)
                }

                // Function For Animation
                function reviewGraphAnimation(time) {
                    if(!start_time) start_time = time

                    const elapsed_time = time - start_time // Animation Elapsed Time
                    const progress = Math.min(elapsed_time / animation_duration, 1) // Animation Progress From 0 To 1
                    const eased = easeOutEffect(progress) // Slows Down Animation At The End (Slows Down Progress Variable)
                    
                    // Makes Color Transition For Progress Bars From rgb(235, 0, 20) To rgb(235, 185, 20)
                    let bars_color = max_green * eased
                    bar.style.setProperty("--color", `rgb(235, ${bars_color}, 20)`)

                    // Each Progress Bar Rendering
                    // Sets Values To Graph In Each Frame Of The Animation
                    bar.style.setProperty("--progress", `${eased * bar_target}%`) // Sets Progress Percentage To Variable In CSS From Data Attribute

                    // Each Review Counter Rendering
                    counter.textContent = parseInt(eased * counter.dataset.amount) // Sets Each Column's Reviews Amount To Its Counter

                    // Calls The Animation Until Its Duration Ends
                    if(progress < 1) {
                        requestAnimationFrame(reviewGraphAnimation)
                    }
                }

                requestAnimationFrame(reviewGraphAnimation) // Calls The Animation For The First Time
            })

            // Average Rating

            // Average Rating Animation
            const average_rating_number_tag = document.querySelector(".reviews_info_container .average_rating .average_rating_number") // Gets Average Rating Number HTML Tag

            // Animation's Settings
            const average_rating_number_target = average_rating_number_tag.textContent // Target Value Of Animation (For Example "425")
            const animation_duration = 3000 // 3 Seconds Animation
            let start_time = null // Sets Start Time Default Value / Delay For Animation Start

            let green = 0 // Start Color Of Stars Is rgb(235, 0, 20)

            // Function For Ease Out Animation Effect
            function easeOutEffect(t) {
                return 1 - Math.pow(1 - t, 3)
            }

            // Function For Animation
            function averageRatingAnimation(time) {
                if(!start_time) start_time = time + 3000 // Starts After 3 Seconds Delay

                const elapsed_time = time - start_time // Animation Elapsed Time
                const progress = Math.min(elapsed_time / animation_duration, 1) // Animation Progress From 0 To 1
                const eased = easeOutEffect(progress) // Slows Down Animation At The End (Slows Down Progress Variable)

                // average_rating_number_tag.innerHTML = "0<span>00</span>" // Renders Start Values To HTML

                // Starts The Animation After Delay Set In Start Time Expires
                if(progress >= 0) {
                    // Average Rating Number Rendering
                    const avg_rating_splitted = ((eased * average_rating_number_target) / 100).toFixed(2).split(".") // Calculates New Values For Average Rating Number For Every Frame Of The Animation In Array Format (For Example ["4", "25"])
                    // Splits Array
                    average_rating_number_tag.innerHTML = `${avg_rating_splitted[0]}<span>${avg_rating_splitted[1]}</span>` // Splits Values From Array And Renders Them To HTML

                    // Stars Rendering
                    const average_rating_number = parseFloat(document.querySelector(".reviews_info_container .average_rating .average_rating_number").textContent) / 100 // Gets Average Rating And Stores It As A Float Number (For Example Converts "425" To 4.25)
                    const average_rating_stars = document.querySelectorAll(".reviews_info_container .average_rating .stars .star") // Gets All 5 Star Icons

                    let rest_from_average_rating_number = average_rating_number // Rest From Average Rating (From 4.25 To 0.25)

                    average_rating_stars.forEach(function(one_star, index) {
                        // Colors Of Stars

                        let star_color_1 = one_star.querySelectorAll("svg linearGradient stop")[0] // Gets Part Of Star Icon
                        let star_color_2 = one_star.querySelectorAll("svg linearGradient stop")[1] // Gets Part Of Star Icon

                        // Set Color Value To Stars
                        star_color_1.setAttribute("stop-color", `rgb(235, ${green}, 20)`)
                        star_color_2.setAttribute("stop-color", `rgb(235, ${green}, 20)`)

                        green = (max_green / 5) * average_rating_number // Changes Color Of Stars By Average Rating (Lower Average Rating - Stars Are More To Red, Higher Average Rating - Stars Are More To Yellow)

                        // Filling Stars
                        
                        let filled_part = one_star.querySelectorAll("svg linearGradient stop")[1] // Gets Part Of Star Icon

                        // Fills Full Stars
                        if(index + 1 <= parseInt(average_rating_number)) {
                            filled_part.setAttribute("offset", "100%")

                            // Saves Rest From Average Rating
                            rest_from_average_rating_number = average_rating_number
                            rest_from_average_rating_number -= index + 1
                        }

                        // Fills Rest From Average Rating
                        else if(index + 1 > parseInt(average_rating_number) && rest_from_average_rating_number !== 0) {
                            filled_part.setAttribute("offset", `${rest_from_average_rating_number.toFixed(2) * 100}%`)

                            rest_from_average_rating_number = 0 // Sets Rest From Average Rating Number To 0 And Stops The Statement
                        }
                    })
                }
                
                // Calls The Animation Until Its Duration Ends
                if(progress < 1) {
                    requestAnimationFrame(averageRatingAnimation)
                }
            }

            requestAnimationFrame(averageRatingAnimation) // Calls The Animation For The First Time

            run_again = false // Ends If Statement
        }
    })

    // Custom Select Menu - Contact Form

    const subject_select_menu = document.querySelector(".subject_select_menu")
    const subject_select = document.querySelector(".subject_select_menu .select")
    const subject_options_list = document.querySelector(".subject_select_menu .options_list")
    const subject_options = document.querySelectorAll(".subject_select_menu .option")

    subject_select.addEventListener("click", function() {
        subject_options_list.classList.toggle("active")
        subject_select.querySelector(".fa-angle-down").classList.toggle("fa-angle-up")
    })

    subject_options.forEach(function(option) {
        option.addEventListener("click", function() {
            sessionStorage.setItem("subject", option.dataset.subject)

            subject_options_list.classList.toggle("active")
            subject_select.querySelector(".fa-angle-down").classList.toggle("fa-angle-up")

            // Remove Selected Class From Options
            subject_options.forEach(function(remove_selected) {
                remove_selected.classList.remove("selected")
            })

            // Shows Current Selected Option From List Without Icon
            if(option.dataset.subject === sessionStorage.getItem("subject")) {
                subject_select.querySelector("span").textContent = option.querySelector("span").textContent
                subject_select_menu.querySelector("input").value = option.querySelector("span").textContent

                option.classList.add("selected") // Adds Selected Class To Selected Option
            }
        })
    })

    // Selected Attachment
        
    const attachment = document.querySelector("#select_attachment")
    const attachment_report = document.querySelector(".attachment_report")

    attachment.addEventListener("change", function(event) {
        const attachment_name = event.target.files[0].name
        const attachment_size = event.target.files[0].size

        if(attachment_size <= 25000000) {
            attachment_report.textContent = `Vybraný súbor: ${attachment_name}`
        }

        else if(attachment_size > 25000000) {
            attachment_report.textContent = "Vybraný súbor je príliš veľký."
        }

        else {
            attachment_report.textContent = "Nie je vybraný žiaden súbor."
        }
    })
})