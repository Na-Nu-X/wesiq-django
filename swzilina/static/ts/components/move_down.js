"use strict";
document.addEventListener("DOMContentLoaded", function () {
    // Move Down
    const move_down = document.querySelector(".move_down");
    const navigation_bar = document.querySelector(".navigation_bar");
    move_down.addEventListener("click", function () {
        window.scrollTo({
            top: window.innerHeight - navigation_bar.offsetHeight,
            behavior: "smooth"
        });
    });
    window.addEventListener("scroll", function () {
        if (window.scrollY > 0) {
            move_down.style.opacity = "0";
            move_down.style.visibility = "hidden";
        }
        else {
            move_down.style.opacity = "1";
            move_down.style.visibility = "visible";
        }
    });
});
export {};
//# sourceMappingURL=move_down.js.map