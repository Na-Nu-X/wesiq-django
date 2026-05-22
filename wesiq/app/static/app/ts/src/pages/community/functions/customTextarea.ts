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

// Function For Create Range After Element
function createRangeAfterElement(element:Element):Range {
    const range:Range = document.createRange()

    range.setStartAfter(element)
    range.collapse(true)

    return range
}

// Function For Find Cursor Range In The Description
function findCursorRange(description:HTMLDivElement, position:number):Range|null {
    const walker:TreeWalker = document.createTreeWalker(description, NodeFilter.SHOW_TEXT)
    let remaining:number = position
    let text_node:Text|null = walker.nextNode() as Text|null

    while(text_node) {
        const node_length:number = text_node.length
        const non_editable_parent:HTMLElement|null = text_node.parentElement?.closest("[contenteditable=\"false\"]") as HTMLElement|null

        if(remaining <= node_length) {
            const range:Range = document.createRange()

            // Places Cursor After Tag / Hashtag Span So Backspace Keeps Working
            if(non_editable_parent && remaining > 0) {
                return createRangeAfterElement(non_editable_parent)
            }

            range.setStart(text_node, remaining)
            range.setEnd(text_node, remaining)

            return range
        }

        remaining -= node_length
        text_node = walker.nextNode() as Text|null
    }

    if(position >= description.innerText.length) {
        const range:Range = document.createRange()
        const last_child:ChildNode|null = description.lastChild

        if(last_child instanceof HTMLElement && last_child.matches("[contenteditable=\"false\"]")) {
            return createRangeAfterElement(last_child)
        }

        range.selectNodeContents(description)
        range.collapse(false)

        return range
    }

    return null
}

// Function For Set Cursor Position In The Description
export function setCursorPosition(description:HTMLDivElement, position:number):void {
    const selection:Selection|null = window.getSelection()

    if(!selection) return

    const range:Range|null = findCursorRange(description, position)

    if(range) {
        selection.removeAllRanges()
        selection.addRange(range)
        description.focus()

        return
    }

    focusAtEnd(description)
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