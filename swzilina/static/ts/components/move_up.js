"use strict";
document.addEventListener("DOMContentLoaded", function () {
    // Move Up
    const move_up = document.querySelector(".move_up");
    window.addEventListener("scroll", function () {
        if (window.scrollY >= 1000) {
            move_up.style.opacity = "1";
            move_up.style.visibility = "visible";
        }
        else {
            move_up.style.opacity = "0";
            move_up.style.visibility = "hidden";
        }
    });
    move_up.addEventListener("click", function () {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
});
export {};
//# sourceMappingURL=move_up.js.map