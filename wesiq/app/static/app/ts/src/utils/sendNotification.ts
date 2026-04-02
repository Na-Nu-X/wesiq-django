// Function For Send Notification
export function sendNotification(message:string):void {
    Notification.requestPermission().then(function(response:NotificationPermission) {
        if(response === "granted") {
            const notification:Notification = new Notification("Wesiq", {
                body: message,
                icon: "../../static/images/favicon.png",
                tag: "Aktivita",
            })

            notification.addEventListener("error", function():void {
                alert("Notifikáciu sa nepodarilo odoslať.")
            })
        }
    })
}