// Function For Show The Attachment Report
export function showAttachmentReport(file:File, attachment_report:HTMLParagraphElement):void {
    const MAX_ATTACHMENT_SIZE:number = 25 * 1000 * 1000 // 25MB

    const attachment_name:string = file.name
    const attachment_size:number = file.size

    if(attachment_size <= MAX_ATTACHMENT_SIZE) attachment_report.textContent = `${gettext("Vybraný súbor")}: ${attachment_name}`
    else if(attachment_size > MAX_ATTACHMENT_SIZE) attachment_report.textContent = gettext("Vybraný súbor je príliš veľký.")
    else attachment_report.textContent = gettext("Nie je vybraný žiaden súbor.")
}