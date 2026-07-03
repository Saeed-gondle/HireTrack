"use client";
import { createContext, useContext, useState } from "react";
import { createPortal } from "react-dom";
import { HiEllipsisVertical } from "react-icons/hi2";

interface MenusContextType {
    openId: string;
    open: (id: string) => void;
    close: () => void;
    position: { x: number; y: number };
    setPosition: (position: { x: number; y: number }) => void;
}

const MenusContext = createContext<MenusContextType | null>(null);

function Menus({ children }: { children: React.ReactNode }) {
    const [openId, setOpenId] = useState<string>("");
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const close = () => setOpenId("");
    const open = (id: string) => setOpenId(id);
    return (
        <MenusContext.Provider value={{ openId, open, close, position, setPosition }}>
            {children}
        </MenusContext.Provider>
    );
}

/* Menu — flex row, aligned center, content pushed to the right */
function Menu({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-end">
            {children}
        </div>
    );
}

/* Toggle — icon button that opens / closes the list */
function Toggle({ id, children }: { id: string, children?: React.ReactNode }) {
    const context = useContext(MenusContext);

    if (!context) {
        throw new Error("useContext must be used within a Menus component");
    }

    const { open, close, openId, setPosition } = context;

    function handleClick(e: React.MouseEvent) {
        e.stopPropagation();
        const rect = (e.target as HTMLElement).closest("button")!.getBoundingClientRect();
        setPosition({
            x: window.innerWidth - rect.width - rect.x,
            y: rect.y + rect.height + 8,
        });
        openId === "" || openId !== id ? open(id) : close();
    }

    return (
        <button
            onClick={handleClick}
            className="
                bg-transparent border-none p-[0.4rem]
                rounded-[var(--border-radius-sm)]
                translate-x-[0.8rem]
                transition-all duration-200
                hover:bg-[var(--color-grey-100)]
                [&_svg]:w-[2.4rem] [&_svg]:h-[2.4rem] [&_svg]:text-[var(--color-grey-700)]
            "
        >
            {children ? children : <HiEllipsisVertical />}
        </button>
    );
}

/* List — portal-rendered dropdown positioned via inline style */
function List({ id, children }: { id: string; children: React.ReactNode }) {
    const { openId, position, close } = useContext(MenusContext);

    if (openId !== id) return null;

    return createPortal(
        <ul
            style={{ right: `${position.x}px`, top: `${position.y}px` }}
            className="
                fixed
                bg-gray-100
                border-1 border-gray-200
                rounded-md
            "
        >
            {children}
        </ul>,
        document.body
    );
}

/* Button — full-width list item button */
function Button({
    children,
    icon,
    onClick,
}: {
    children: React.ReactNode;
    icon?: React.ReactNode;
    onClick?: () => void;
}) {
    const { close } = useContext(MenusContext);

    function handleClick() {
        onClick?.();
        close();
    }

    return (
        <li>
            <button
                onClick={handleClick}
                className="
                    w-full text-left
                    px-[2.4rem] py-[1.2rem] text-[1rem]
                    transition-all duration-200
                    flex items-center gap-[1.6rem]
                    hover:bg-[var(--color-grey-50)]
                    [&_svg]:w-[1rem] [&_svg]:h-[1rem]
                    [&_svg]:text-[var(--color-grey-400)]
                    [&_svg]:transition-all [&_svg]:duration-300
                    cursor-pointer
                    hover:bg-gray-200
                    hover:text-black
                    hover:border-none
                    hover:outline-none
                "
            >
                {icon}
                <span>{children}</span>
            </button>
        </li>
    );
}

Menus.Menu = Menu;
Menus.Toggle = Toggle;
Menus.List = List;
Menus.Button = Button;
export { Menu, Toggle, List, Button };
export default Menus;