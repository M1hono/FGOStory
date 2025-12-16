export interface NavLink {
    icon?: NavIcon | NavThemeIcon
    badge?:
        |string
        |   {
                text?: string
                type?: 'info' | 'tip' | 'warning' | 'danger'
            }
    title: string
    desc?: string
    link: string
}
    
export interface NavData {
    title: string
    items: NavLink[]
}

export type NavIcon = string | NavSvg

export interface NavSvg {
    svg: string
}

export interface NavThemeIcon {
    dark: NavIcon
    light: NavIcon
}