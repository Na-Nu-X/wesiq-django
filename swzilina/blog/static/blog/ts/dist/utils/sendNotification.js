// Function For Send Notification
export function sendNotification(message) {
    Notification.requestPermission().then(function (response) {
        if (response === "granted") {
            const notification = new Notification("Street Workout Žilina", {
                body: message,
                icon: "../../static/images/favicon.png",
                tag: "Aktivita",
            });
            notification.addEventListener("error", function () {
                alert("Notifikáciu sa nepodarilo odoslať.");
            });
        }
    });
}
//# sourceMappingURL=sendNotification.js.map