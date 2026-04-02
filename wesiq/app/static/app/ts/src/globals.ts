declare global {
    // Translation
    
    function gettext(message:string):string
    function ngettext(singular:string, plural:string, count:number):string
    function interpolate(fmt:string, obj:any[] | object, named?:boolean):string
}

export {};