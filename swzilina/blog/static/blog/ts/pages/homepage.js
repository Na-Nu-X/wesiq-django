import { setObserverAnimation } from "../utils/setObserverAnimation.js";
import { reviewsInfoAnimation } from "../components/reviewsInfoAnimation.js";
import { customSelectMenu } from "../components/customSelectMenu.js";
"use strict";
document.addEventListener("DOMContentLoaded", function () {
    // Search Bar
    const search_bar = document.querySelector(".search_bar");
    const search_result = document.querySelector(".search_result");
    const delete_search_bar = document.querySelector(".fa-xmark");
    function renderSearchResult() {
        let searched_text = search_bar.value; // Searched Text Value
        // Data - Array of Objects of Pages
        const pages = [
            { url: "/", title: "Hlavná stránka" },
            { url: "/prihlasenie", title: "Prihlásenie" },
            { url: "/obnova-hesla", title: "Obnova hesla" },
            { url: "/registracia", title: "Registrácia" },
            { url: "/moj-ucet", title: "Môj účet" },
            { url: "/moje-hodnotenie", title: "Moje hodnotenie" },
            { url: "/blog", title: "Blog" },
        ];
        search_result.innerHTML = ""; // Deletes Search Result
        // Deletes Search Result When Searched Text Value is Empty
        if (searched_text.trim() === "") {
            search_result.innerHTML = "";
            search_bar.style.borderBottom = "1px solid rgb(229.5, 229.5, 229.5)";
            search_bar.style.borderRadius = "5px";
            search_result.style.border = "none";
            search_result.classList.remove("active");
            return;
        }
        // Filters Pages by Searched Text Value
        const filtered_pages = pages.filter(function (one_page) {
            return one_page.title.toLowerCase().includes(searched_text.toLowerCase());
        });
        // Renders Result
        filtered_pages.forEach(function (one_page) {
            let search_result_link = document.createElement("a");
            search_result_link.setAttribute("href", one_page.url);
            search_result_link.textContent = one_page.title;
            search_result.appendChild(search_result_link);
        });
        if (search_result.children.length > 0) {
            search_bar.style.borderRadius = "5px 5px 0px 0px";
            search_bar.style.borderBottom = "none";
            search_result.style.borderBottom = "1px solid rgb(229.5, 229.5, 229.5)";
            search_result.style.borderLeft = "1px solid rgb(229.5, 229.5, 229.5)";
            search_result.style.borderRight = "1px solid rgb(229.5, 229.5, 229.5)";
            search_result.classList.add("active");
        }
        else {
            search_bar.style.border = "1px solid rgb(229.5, 229.5, 229.5)";
            search_bar.style.borderRadius = "5px";
            search_result.style.border = "none";
            search_result.classList.remove("active");
        }
    }
    // Delete Search Bar Icon
    delete_search_bar.addEventListener("click", function () {
        search_bar.value = "";
        renderSearchResult();
    });
    // Search Bar Input
    search_bar.addEventListener("input", function (event) {
        renderSearchResult();
    });
    // Login Form
    // Login Form Dialog
    const login_button = document.querySelector(".login_button");
    const no_logged_in_button = document.querySelector(".login");
    const login_form_dialog = document.querySelector(".login_form_dialog");
    const login_form = document.querySelector(".login_form");
    login_button.addEventListener("click", function () {
        login_form_dialog.showModal();
    });
    if (no_logged_in_button) {
        no_logged_in_button.addEventListener("click", function () {
            login_form_dialog.showModal();
        });
    }
    login_form_dialog.addEventListener("click", function (event) {
        const login_form_dimensions = login_form.getBoundingClientRect();
        if (event.clientX < login_form_dimensions.left ||
            event.clientX > login_form_dimensions.right ||
            event.clientY < login_form_dimensions.top ||
            event.clientY > login_form_dimensions.bottom) {
            login_form_dialog.close();
        }
    });
    // Registration Form
    // Registration Form Dialog
    const registration_button = document.querySelector(".registration_button");
    const registration_form_dialog = document.querySelector(".registration_form_dialog");
    const registration_form = document.querySelector(".registration_form");
    registration_button.addEventListener("click", function () {
        registration_form_dialog.showModal();
    });
    registration_form_dialog.addEventListener("click", function (event) {
        const registration_form_dimensions = registration_form.getBoundingClientRect();
        if (event.clientX < registration_form_dimensions.left ||
            event.clientX > registration_form_dimensions.right ||
            event.clientY < registration_form_dimensions.top ||
            event.clientY > registration_form_dimensions.bottom) {
            registration_form_dialog.close();
        }
    });
    // Profile Dialog
    const profile_button = document.querySelector(".profile_button");
    const profile_dialog = document.querySelector(".profile_dialog");
    const profile = document.querySelector(".profile");
    if (profile_button) {
        profile_button.addEventListener("click", function () {
            profile_dialog.showModal();
        });
    }
    profile_dialog.addEventListener("click", function (event) {
        const profile_dimensions = profile.getBoundingClientRect();
        if (event.clientX < profile_dimensions.left ||
            event.clientX > profile_dimensions.right ||
            event.clientY < profile_dimensions.top ||
            event.clientY > profile_dimensions.bottom) {
            profile_dialog.close();
        }
    });
    // Chart
    const activity_chart = document.querySelector(".activity_chart");
    const plugin = {
        id: 'customCanvasBackgroundColor',
        beforeDraw: (chart, args, options) => {
            const { ctx } = chart;
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
    });
    // Custom Select Menus - Reviews
    const sort_select_menu = document.querySelector(".reviews .select_menus .sort_select_menu"); // Gets Sort Select Menu
    const rating_select_menu = document.querySelector(".reviews .select_menus .rating_select_menu"); // Gets Rating Select Menu
    customSelectMenu(sort_select_menu, "sort"); // Adds Functionality For Sort Select Menu That Sets The Sort URL Parameter
    customSelectMenu(rating_select_menu, "rating"); // Adds Functionality For Rating Select Menu That Sets The Rating URL Parameter
    // Reviews
    // Animate Reviews
    const reviews_info_container = document.querySelector(".reviews .reviews_info_container"); // Gets Reviews Info
    setObserverAnimation(reviews_info_container, false, 1, reviewsInfoAnimation); // Animates Reviews Info
    const all_reviews = document.querySelectorAll(".reviews .all_reviews .one_review"); // Gets All Reviews
    setObserverAnimation(all_reviews); // Animates Each Review From All Reviews
    // Custom Select Menu - Contact Form
    const subject_select_menu = document.querySelector(".subject_select_menu");
    const subject_select = document.querySelector(".subject_select_menu .select");
    const subject_options_list = document.querySelector(".subject_select_menu .options_list");
    const subject_options = document.querySelectorAll(".subject_select_menu .option");
    subject_select.addEventListener("click", function () {
        subject_options_list.classList.toggle("active");
        subject_select.querySelector(".fa-angle-down").classList.toggle("fa-angle-up");
    });
    subject_options.forEach(function (option) {
        option.addEventListener("click", function () {
            sessionStorage.setItem("subject", option.dataset.subject);
            subject_options_list.classList.toggle("active");
            subject_select.querySelector(".fa-angle-down").classList.toggle("fa-angle-up");
            // Removes Selected Class From Options
            subject_options.forEach(function (remove_selected) {
                remove_selected.classList.remove("selected");
            });
            // Shows Current Selected Option From List Without Icon
            if (option.dataset.subject === sessionStorage.getItem("subject")) {
                subject_select.querySelector("span").textContent = option.querySelector("span").textContent;
                subject_select_menu.querySelector("input").value = option.querySelector("span").textContent;
                option.classList.add("selected"); // Adds Selected Class To Selected Option
            }
        });
    });
    // Selected Attachment
    const attachment = document.querySelector("#select_attachment");
    const attachment_report = document.querySelector(".attachment_report");
    attachment.addEventListener("change", function (event) {
        const attachment_name = event.target.files[0].name;
        const attachment_size = event.target.files[0].size;
        if (attachment_size <= 25000000) {
            attachment_report.textContent = `Vybraný súbor: ${attachment_name}`;
        }
        else if (attachment_size > 25000000) {
            attachment_report.textContent = "Vybraný súbor je príliš veľký.";
        }
        else {
            attachment_report.textContent = "Nie je vybraný žiaden súbor.";
        }
    });
});
//# sourceMappingURL=homepage.js.map