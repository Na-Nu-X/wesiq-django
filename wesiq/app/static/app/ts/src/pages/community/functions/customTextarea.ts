// Function For Get Cursor Position Of The Description
export function getCursorPosition(description:HTMLDivElement):number {
    const selection:Selection|null = window.getSelection() // Gets The Selection

    if(selection!.rangeCount !== 0) {
        const range:Range = selection!.getRangeAt(0)
        const pre_caret_range:Range = range.cloneRange()

        pre_caret_range.selectNodeContents(description)
        pre_caret_range.setEnd(range.endContainer, range.endOffset);

        return pre_caret_range.toString().length
    }

    return 0
}

// Function For Add Focus At End Of The Description
export function focusAtEnd(description:HTMLDivElement):void {
    description.focus()

    if(typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
        const range:Range = document.createRange()

        range.selectNodeContents(description) // Selects All Content
        range.collapse(false) // End Of The Content
        
        const selection:Selection|null = window.getSelection() || null // Gets The Selection

        if(selection) {
            selection.removeAllRanges() // Removes All Selections
            selection.addRange(range) // Applies Selection At The End
        }
    }
}