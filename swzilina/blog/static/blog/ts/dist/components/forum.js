import { sendPOST } from "../services/sendPOST.js";
// Function For Toggle Like And Cancel Like
function toggleLike(icon, counter, id) {
    icon.addEventListener("click", function () {
        // If The Heart Is Empty
        if (icon.classList.contains("fa-regular")) {
            icon.classList.replace("fa-regular", "fa-solid"); // Adds Filled Heart Image
            icon.style.color = "#df3535"; // Fills The Heart With Red Color
            counter.textContent = String(parseInt(counter.textContent) + 1); // Adds 1 Like To The Counter By Clicking On The Empty Heart
            sendPOST(`/like-comment/${id}`); // Sends Liked Commet ID As A POST Data To Like Comment Page
        }
        // If The Heart Is Already Clicked
        else if (icon.classList.contains("fa-solid")) {
            icon.classList.replace("fa-solid", "fa-regular"); // Adds Empty Heart Image
            icon.style.color = "#999999"; // Fills The Heart With Gray Color
            counter.textContent = String(parseInt(counter.textContent) - 1); // Subtracts 1 Like To The Counter By Clicking On The Already Clicked Heart
            sendPOST(`/cancel-like-comment/${id}`); // Sends Liked Commet ID As A POST Data To Cancel Like Comment Page
        }
    });
}
// Function For Toggle Show And Hide Reply Form
function toggleReply(icon, form) {
    icon.addEventListener("click", function () {
        form.classList.toggle("visible"); // Shows And Hides The Form
        if (form.classList.contains("visible"))
            icon.classList.replace("fa-reply", "fa-xmark"); // Shows Close Icon
        else if (!form.classList.contains("visible"))
            icon.classList.replace("fa-xmark", "fa-reply"); // Shows Reply Icon
    });
}
// Function For Add Functionality For Comments
export function commentFunctionality(one_comment) {
    const one_comment_id = one_comment.dataset.id; // Gets Comment ID From The Data Value
    if (!one_comment_id)
        return;
    // LIKE
    const heart = one_comment.querySelector(".interactions .likes .fa-heart"); // Gets Heart Icon
    const likes_counter = one_comment.querySelector(".interactions .likes .likes_counter"); // Gets Like Counter
    // If User Already Liked The Comment
    if (heart.classList.contains("fa-solid"))
        heart.style.color = "#df3535"; // Fills The Heart With Red Color
    toggleLike(heart, likes_counter, one_comment_id); // Adds Or Removes Like From The Comment
    // REPLY
    const reply = one_comment.querySelector(".interactions .reply .fa-solid"); // Gets Reply Icon
    const reply_comment_form = one_comment.querySelector(".reply_comment_form"); // Gets Reply Comment Form
    toggleReply(reply, reply_comment_form); // Shows / Hides Reply Comment Form
    // REPORT
    const flag = one_comment.querySelector(".interactions .report .fa-flag");
    flag.addEventListener("click", function () {
        sendPOST(`/report-comment/${one_comment_id}`); // Sends Reported Commet ID As A POST Data To Report Comment Page
    });
}
//# sourceMappingURL=forum.js.map