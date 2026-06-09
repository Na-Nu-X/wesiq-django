interface Pages {
    id:number,
    url:string,
    title:string,
    keywords:string[],
    icon: string,
    is_from_history:boolean
}

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Variables

    const search_container:HTMLDivElement = document.querySelector(".search_container") as HTMLDivElement // Gets The Search Container
    const search_bar_container:HTMLDivElement = search_container.querySelector(".search_bar_container") as HTMLDivElement // Gets The Search Bar Container
    const search_bar:HTMLInputElement = search_bar_container.querySelector(".search_bar") as HTMLInputElement // Gets The Search Bar Input
    const search_result_container:HTMLDivElement = search_container.querySelector(".search_result_container") as HTMLDivElement // Gets The Search Result Container
    const delete_search_bar:HTMLButtonElement = search_bar_container.querySelector(".delete_search_bar") as HTMLButtonElement // Gets The Delete Search Bar Button

    const MAX_HISTORY_LENGTH = 3 // Sets Maximum Search History Length
    let focused_search_result_index:number = 0 // Focused Search Result Index

    // Data - Array of Objects of Pages
    const pages:Pages[] = [
        { id: 1, url: "/", title: gettext("Hlavná stránka"), keywords: [gettext("Domovská stránka"), gettext("Úvodná stránka")], icon: "<i class='fa-solid fa-house'></i>", is_from_history: false }, // https://fontawesome.com/icons/house
        { id: 2, url: gettext("/prihlasenie"), title: gettext("Prihlásenie"), keywords: [gettext("Prihlásiť sa"), gettext("Autorizovať sa")], icon: "<i class='fa-regular fa-user'></i>", is_from_history: false }, // https://fontawesome.com/icons/user
        { id: 3, url: gettext("/obnova-hesla"), title: gettext("Obnova hesla"), keywords: [gettext("Obnoviť heslo"), gettext("Zmeniť heslo")], icon: "<i class='fa-regular fa-user'></i>", is_from_history: false }, // https://fontawesome.com/icons/user
        { id: 4, url: gettext("/registracia"), title: gettext("Registrácia"), keywords: [gettext("Zaregistrovať sa"), gettext("Vytvoriť účet")], icon: "<i class='fa-regular fa-user'></i>", is_from_history: false }, // https://fontawesome.com/icons/user
        { id: 5, url: gettext("/profil"), title: gettext("Profil"), keywords: [gettext("Môj účet"), gettext("Upraviť účet"), gettext("Zobraziť účet")], icon: "<i class='fa-regular fa-user'></i>", is_from_history: false }, // https://fontawesome.com/icons/user
        { id: 6, url: gettext("/moje-hodnotenie"), title: gettext("Moje hodnotenie"), keywords: [gettext("Moja recenzia"), gettext("Upraviť hodnotenie")], icon: "<i class='fa-regular fa-star'></i>", is_from_history: false }, // https://fontawesome.com/icons/star
        { id: 7, url: gettext("/blog"), title: gettext("Blog"), keywords: [gettext("Články")], icon: "<i class='fa-solid fa-book'></i>", is_from_history: false }, // https://fontawesome.com/icons/book
        { id: 8, url: gettext("/trening"), title: gettext("Tréning"), keywords: [gettext("Aktivita"), gettext("Spustiť aktivitu")], icon: "<i class='fa-solid fa-dumbbell'></i>", is_from_history: false }, // https://fontawesome.com/icons/dumbbell
        { id: 9, url: gettext("/moje-treningove-plany"), title: gettext("Moje tréningové plány"), keywords: [gettext("Vytvoriť tréningový plán"), gettext("Upraviť tréningový plán"), gettext("Odstrániť tréningový plán")], icon: "<i class='fa-solid fa-dumbbell'></i>", is_from_history: false }, // https://fontawesome.com/icons/dumbbell
        { id: 10, url: gettext("/komunita"), title: gettext("Komunita"), keywords: [gettext("Zdieľať príspevok"), gettext("Uverejniť príspevok"), gettext("Nájsť užívateľa")], icon: "<i class='fa-solid fa-people-roof'></i>", is_from_history: false }, // https://fontawesome.com/icons/people-roof
    ]

    // Functions

    // Function For Show Search Results
    function showSearchResult():void {
        search_bar.focus() // Focuses To Search Bar

        // Sets Search Bar Styles
        search_bar.style.borderRadius = "5px 5px 0px 0px"
        search_bar.style.borderBottom = "none"

        // Sets Search Result Container Styles
        search_result_container.style.borderBottom = "1px solid rgb(75, 75, 250, 0.5)"
        search_result_container.style.borderLeft = "1px solid rgb(75, 75, 250, 0.5)"
        search_result_container.style.borderRight = "1px solid rgb(75, 75, 250, 0.5)"

        search_result_container.classList.add("active") // Adds Active Class To Search Result
    }

    // Function For Hide Search Results
    function hideSearchResult():void {
        // Sets Search Bar Styles
        search_bar.style.border = "1px solid rgb(75, 75, 250, 0.5)"
        search_bar.style.borderRadius = "5px"

        // Sets Search Result Container Styles
        search_result_container.style.border = "none"

        search_result_container.classList.remove("active") // Removes Active Class From Search Result
    }

    // Function For Filter Pages By Search History
    function filterPagesBySearchHistory(search_history:string[]):Pages[] {
        const filtered_pages:Pages[] = search_history
            .map(one_id => pages.find(one_page => String(one_page.id) === one_id))
            .filter((one_page):one_page is Pages => one_page !== undefined)

        filtered_pages.forEach((one_page:Pages) => one_page.is_from_history = true) // Flags Filtered Pages That They Are From The History

        return filtered_pages // Returns Filtered Pages
    }

    // Function For Filter Pages By Searched Text
    function filterPagesBySearchedText(searched_text:string):Pages[] {
        // Filters Pages by Searched Text Value
        const filtered_pages:Pages[] = pages.filter(function(one_page:Pages):boolean {
            return (
                one_page.title.toLowerCase().includes(searched_text.toLowerCase()) || // Filters By Titles
                one_page.keywords.some(one_keyword => one_keyword.toLowerCase().includes(searched_text.toLowerCase())) // Filters By Keywords
            )
        })

        filtered_pages.forEach((one_page:Pages) => one_page.is_from_history = false) // Flags Filtered Pages That They Are Not From The History

        return filtered_pages // Returns Filtered Pages
    }

    // Function For Generate Search History
    function generateSearchHistory():void {
        const search_history:string[] = JSON.parse(localStorage.getItem("search_history") || "[]") as string[] // Gets The Search History From The Local Storage

        if(search_history.length === 0) generateSearchResults() // Shows Search Results
        else renderSearchResult(filterPagesBySearchHistory(search_history)) // Renders Search Result (By Search History)
    }

    // Function For Generate Search Results
    function generateSearchResults():void {
        pages.forEach((one_page:Pages) => one_page.is_from_history = false) // Flags Pages That They Are Not From The History

        renderSearchResult(pages) // Renders Search Result (All Pages)
    }

    // Function For Render Search Result By Given Pages
    function renderSearchResult(pages:Pages[]):void {
        search_result_container.innerHTML = "" // Deletes Search Result Container

        // Renders Result
        pages.forEach(function(one_page:Pages):void {
            const search_result:HTMLDivElement = document.createElement("div") // Creates The Search Result
            
            search_result.classList.add("search_result") // Adds Search Result Class
            
            const search_result_link:HTMLAnchorElement = document.createElement("a") // Creates The Link

            search_result_link.dataset["id"] = String(one_page.id) // Stores ID Of Search Result
            search_result_link.setAttribute("href", one_page.url) // Sets URL To The Link

            // If The Page Is Not From History
            if(!one_page.is_from_history) {
                search_result.innerHTML = one_page.icon // Sets Icon
                search_result_link.innerHTML = one_page.title // Sets Title
            }
            
            // If The Page Is From History
            else {
                // search_result.innerHTML = "<i class='delete_from_history fa-solid fa-clock-rotate-left'></i>" // https://fontawesome.com/icons/clock-rotate-left
                search_result_link.innerHTML = one_page.title // Sets Title

                const delete_from_history:HTMLElement = document.createElement("i") // Creates The History Icon
                delete_from_history.classList.add("delete_from_history", "fa-solid", "fa-clock-rotate-left") // https://fontawesome.com/icons/clock-rotate-left
                delete_from_history.ariaHidden = "true"
                search_result.appendChild(delete_from_history) // Appends The History Icon To The Searched Post

                const delete_from_history_hidden:HTMLElement = document.createElement("i") // Creates The Delete From History Icon
                delete_from_history_hidden.classList.add("delete_from_history", "hidden", "fa-solid", "fa-xmark") // https://fontawesome.com/icons/xmark
                delete_from_history_hidden.ariaHidden = "true"
                search_result.appendChild(delete_from_history_hidden) // Appends The Delete From History Icon To The Searched Post
            }

            search_result.appendChild(search_result_link) // Appends Search Result Link To The Search Result
            search_result_container.appendChild(search_result) // Appends Search Result To The Search Result Container
        })

        search_result_container.children.length > 0 ? showSearchResult() : hideSearchResult() // Shows Or Hides Search Result
    }

    // Function For Change Focused Search Result
    function changeFocusedSearchResult(index:number):void {
        const all_search_results:NodeListOf<HTMLDivElement> = search_result_container.querySelectorAll(".search_result") // Gets All Search Results

        focused_search_result_index = index // Updates Focused Search Result Index

        if(index > all_search_results.length - 1) focused_search_result_index = 0 // Sets Focused Search Result Index To Minimum
        if(index < 0) focused_search_result_index = all_search_results.length - 1; // Sets Focused Search Result Index To Maximum

        const link:HTMLAnchorElement = ((all_search_results[focused_search_result_index] as HTMLDivElement).querySelector("a") as HTMLAnchorElement) // Gets The Link

        link.focus() // Focuses Search Result Link
        search_bar.blur() // Removes Focus From The Search Bar
    }

    // Global Event Delegations

    // Search Bar Focus Functionalities
    search_bar.addEventListener("focus", function():void {
        if(this.value.trim() !== "") renderSearchResult(filterPagesBySearchedText(this.value)) // Renders Search Result (By Searched Text)
        else generateSearchHistory() // Generates Search History
    })

    // Search Bar Input Functionality
    search_bar.addEventListener("input", function():void {
        if(this.value.trim() !== "") renderSearchResult(filterPagesBySearchedText(this.value)) // Renders Search Result (By Searched Text)
        else generateSearchHistory() // Generates Search History
    })

    // Search Result Container Key Functionalities
    search_bar.addEventListener("keydown", function(event:KeyboardEvent):void {
        if(event.key === "ArrowUp" || event.key === "ArrowDown") event.preventDefault() // Allows Ordinary Typing To The Input

        if(event.key === "ArrowUp") changeFocusedSearchResult(focused_search_result_index - 1) // Changes Focused Search Result (Shows The Previous Search Result)
        else if(event.key === "ArrowDown") changeFocusedSearchResult(focused_search_result_index + 1) // Changes Focused Search Result (Shows The Next Search Result)

        else if(event.key === "Enter") {
            const all_search_results:NodeListOf<HTMLDivElement> = search_result_container.querySelectorAll(".search_result") // Gets All Search Results
            const link:HTMLAnchorElement = ((all_search_results[focused_search_result_index] as HTMLDivElement).querySelector("a") as HTMLAnchorElement) // Gets The Link
    
            link.click() // Visits The Link
        }
    })

    // Delete Search Bar Icon Click Functionality
    delete_search_bar.addEventListener("click", function():void {
        search_bar.value = "" // Deletes Search Bar Value
        search_result_container.innerHTML = "" // Deletes Search Result Container
        hideSearchResult() // Hides Search Result
    })

    // Search Result Container Click Functionalities
    search_result_container.addEventListener("click", function(event:PointerEvent):void {
        const clicked_search_result_id:string|null = (event.target as HTMLAnchorElement).dataset["id"] || null // Gets The Clicked Search Result ID
        let search_history:string[] = JSON.parse(localStorage.getItem("search_history") || "[]") as string[] // Gets The Search History From The Local Storage

        // Click On The Link
        if(event.target instanceof HTMLAnchorElement) {
            search_history = search_history.filter(one_item => one_item !== clicked_search_result_id) // Removes The Clicked Item From The Search History
            if(clicked_search_result_id) search_history.unshift(clicked_search_result_id) // Updates Search History
            if(search_history.length > MAX_HISTORY_LENGTH) search_history = search_history.slice(0, MAX_HISTORY_LENGTH) // Shows Maximum Of 3 Results From The Search History, Others Will Be Deleted From The Search History

            localStorage.setItem("search_history", JSON.stringify(search_history)) // Saves Updated Search History To The Local Storage
        }

        // Click On The Delete From History Icon
        if((event.target as HTMLElement).classList.contains("delete_from_history")) {
            const search_result_id_for_deletion:string = ((event.target as HTMLAnchorElement).nextSibling as HTMLAnchorElement).dataset["id"] || "" // Gets The Search Result ID Of The Item For Deletion

            search_history = search_history.filter(one_item => one_item !== search_result_id_for_deletion) // Removes The Clicked Item From The Search History

            localStorage.setItem("search_history", JSON.stringify(search_history)) // Saves Updated Search History To The Local Storage

            generateSearchHistory() // Generates Search History
        }
    })

    // Search Result Container Mouse Over Functionality
    search_result_container.addEventListener("mouseover", function(event:MouseEvent):void {
        // Change Appearance Of Delete From History Icon (Shows The X Icon)
        if((event.target as HTMLElement).classList.contains("delete_from_history")) {
            const delete_from_history:HTMLElement = event.target as HTMLElement // Gets The Delete From History Icon

            // Shows The X Icon
            if(delete_from_history.classList.contains("fa-clock-rotate-left")) {
                delete_from_history.classList.add("hidden");
                (delete_from_history.nextSibling as HTMLElement).classList.remove("hidden")
            }
        }
    })

    // Search Result Container Mouse Out Functionality
    search_result_container.addEventListener("mouseout", function(event:MouseEvent):void {
        // Change Appearance Of Delete From History Icon (Shows The Clock Icon)
        if((event.target as HTMLElement).classList.contains("delete_from_history")) {
            const delete_from_history:HTMLElement = event.target as HTMLElement // Gets The Delete From History Icon

            // Shows The Clock Icon
            if(delete_from_history.classList.contains("fa-xmark")) {
                delete_from_history.classList.add("hidden");
                (delete_from_history.previousSibling as HTMLElement).classList.remove("hidden")
            }
        }
    })

    // Search Result Container Key Functionalities
    search_result_container.addEventListener("keydown", function(event:KeyboardEvent):void {
        if(event.key === "ArrowUp" || event.key === "ArrowDown") event.preventDefault()

        if(event.key === "ArrowUp") changeFocusedSearchResult(focused_search_result_index - 1) // Changes Focused Search Result (Shows The Previous Search Result)
        else if(event.key === "ArrowDown") changeFocusedSearchResult(focused_search_result_index + 1) // Changes Focused Search Result (Shows The Next Search Result)
    })

    // Document Click Functionality
    document.addEventListener("click", function(event:PointerEvent):void {
        // When The User Clicks Outside The Search Bar, Search Result Container Or Delete From History Icon
        if(!(event.target as HTMLInputElement).classList.contains("search_bar") && !(event.target as HTMLDivElement).classList.contains("search_result_container") && !(event.target as HTMLElement).classList.contains("delete_from_history")) {
            search_result_container.innerHTML = "" // Deletes Search Result Container
            hideSearchResult() // Hides Search Result
            return
        }
    })
})