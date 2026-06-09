import { 
    setURLParameter,
    deleteURLParameter 
} from "../utils/modifyURLParameter.js"

// Function For Add Functionality To Custom Select Menu
export function customSelectMenu(select_menu:HTMLDivElement, parameter_name:string, show_icons:boolean = false):void {
    const select:HTMLDivElement = select_menu.querySelector(".select") as HTMLDivElement // Gets Select
    const select_text:HTMLSpanElement = select.querySelector("span") as HTMLSpanElement // Gets Select Text
    const select_icon:HTMLElement = select.querySelector("i") as HTMLElement // Gets Select Icon
    const options_list:HTMLDivElement = select_menu.querySelector(".options_list") as HTMLDivElement // Gets Options List
    const options:NodeListOf<HTMLDivElement> = options_list.querySelectorAll<HTMLDivElement>(".option") // Gets All Options
    const refresh:HTMLButtonElement = select_menu.querySelector(".refresh") as HTMLButtonElement // Gets The Refresh Button

    // Select Click Functionality
    select.addEventListener("click", function():void {
        // Changes Icon
        if(select_icon.classList.contains("fa-angle-down")) select_icon.classList.replace("fa-angle-down", "fa-angle-up")
        else if(select_icon.classList.contains("fa-angle-up")) select_icon.classList.replace("fa-angle-up", "fa-angle-down")

        options_list.classList.toggle("active") // Toggle Show / Hide Options List
        options_list.inert = !options_list.inert // Enables / Disables The Focus
    })

    // Select Keydown Functionality
    select.addEventListener("keydown", function(event:KeyboardEvent):void {
        if(event.key === "Enter") {
            // Changes Icon
            if(select_icon.classList.contains("fa-angle-down")) select_icon.classList.replace("fa-angle-down", "fa-angle-up")
            else if(select_icon.classList.contains("fa-angle-up")) select_icon.classList.replace("fa-angle-up", "fa-angle-down")
    
            options_list.classList.toggle("active") // Toggle Show / Hide Options List
            options_list.inert = !options_list.inert // Enables / Disables The Focus
        }
    })

    // Options Functionalities
    options.forEach(function(one_option:HTMLDivElement):void {
        // Option Click Functionalities
        one_option.addEventListener("click", function():void {
            options_list.classList.remove("active") // Hides Options List
            options_list.inert = !options_list.inert // Enables / Disables The Focus

            if(this.dataset[parameter_name]) setURLParameter(parameter_name, this.dataset[parameter_name]) // Sets Sort URL Parameter With Value From Data In Option
        })

        // Option Keydown Functionalities
        one_option.addEventListener("keydown", function(event:KeyboardEvent):void {
            if(event.key === "Enter") {
                options_list.classList.remove("active") // Hides Options List
                options_list.inert = !options_list.inert // Enables / Disables The Focus
    
                if(this.dataset[parameter_name]) setURLParameter(parameter_name, this.dataset[parameter_name]) // Sets Sort URL Parameter With Value From Data In Option
            }
        })

        if(one_option.classList[1] === "selected") {
            select_text.textContent = (one_option.querySelector("span") as HTMLSpanElement).textContent // Shows Current Selected Option From List Without Icon

            if(show_icons) select_text.innerHTML = (one_option.querySelector("span") as HTMLSpanElement).innerHTML // Shows Current Selected Option From List With Icons
        }
    })

    // Refresh Button Click Functionality
    refresh.addEventListener("click", function():void {
        deleteURLParameter(parameter_name) // Deletes Parameter In The URL
    })
}