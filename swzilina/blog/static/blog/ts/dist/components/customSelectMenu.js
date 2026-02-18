import { setURLParameter, deleteURLParameter } from "../utils/modifyURLParameter.js";
// Function For Add Functionality To Custom Select Menu
export function customSelectMenu(select_menu, parameter_name) {
    const select = select_menu.querySelector(".select"); // Gets Select
    const select_text = select.querySelector("span"); // Gets Select Text
    const select_icon = select.querySelector("i"); // Gets Select Icon
    const options_list = select_menu.querySelector(".options_list"); // Gets Options List
    const options = options_list.querySelectorAll(".option"); // Gets All Options
    select.addEventListener("click", function () {
        // Changes Icon
        if (select_icon.classList.contains("fa-angle-down")) {
            select_icon.classList.replace("fa-angle-down", "fa-angle-up");
        }
        else if (select_icon.classList.contains("fa-angle-up")) {
            select_icon.classList.replace("fa-angle-up", "fa-angle-down");
        }
        options_list.classList.toggle("active"); // Toggle Show / Hide Options List
    });
    options.forEach(function (one_option) {
        one_option.addEventListener("click", function () {
            options_list.classList.remove("active"); // Hides Options List
            setURLParameter(parameter_name, one_option.dataset[parameter_name]); // Sets Sort URL Parameter With Value From Data In Option
        });
        // Shows Current Selected Option From List Without Icon
        if (one_option.classList[1] === "selected") {
            select_text.textContent = one_option.querySelector("span").textContent;
        }
    });
    // Refresh
    const refresh_icon = select_menu.querySelector(".refresh i");
    refresh_icon.addEventListener("click", function () {
        deleteURLParameter(parameter_name); // Deletes Parameter In The URL
    });
}
//# sourceMappingURL=customSelectMenu.js.map