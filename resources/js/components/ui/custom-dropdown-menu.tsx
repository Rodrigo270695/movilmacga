import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropdownMenuOption {
    label: string | React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive';
    disabled?: boolean;
}

interface DropdownMenuSeparator {
    type: 'separator';
}

type DropdownMenuItem = DropdownMenuOption | DropdownMenuSeparator;

interface CustomDropdownMenuProps {
    trigger?: React.ReactNode;
    items: DropdownMenuItem[];
    align?: 'start' | 'end' | 'center';
    className?: string;
}

export function CustomDropdownMenu({
    trigger,
    items,
    align = 'end',
    className
}: CustomDropdownMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<any>(null);

    // Manejar clic fuera del dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Manejar teclas
    const handleKeyDown = (event: React.KeyboardEvent) => {
        switch (event.key) {
            case 'Escape':
                setIsOpen(false);
                triggerRef.current?.focus();
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                setIsOpen(!isOpen);
                break;
        }
    };

    // Combinar manejadores de eventos
    const combinedOnClick = (event: React.MouseEvent) => {
        event.preventDefault();
        setIsOpen(!isOpen);
    };

    const combinedOnKeyDown = (event: React.KeyboardEvent) => {
        handleKeyDown(event);
    };

    const handleItemClick = (item: DropdownMenuOption) => {
        if (!item.disabled) {
            item.onClick();
            setIsOpen(false);
        }
    };

    const getAlignmentClass = () => {
        switch (align) {
            case 'start':
                return 'left-0';
            case 'center':
                return 'left-1/2 transform -translate-x-1/2';
            case 'end':
            default:
                return 'right-0';
        }
    };

    return (
        <div ref={dropdownRef} className={cn("relative inline-block", className)}>
            {/* Trigger */}
            {trigger ? (
                React.cloneElement(trigger as React.ReactElement, {
                    onClick: combinedOnClick,
                    onKeyDown: combinedOnKeyDown,
                    'aria-haspopup': "menu",
                    'aria-expanded': isOpen,
                    ref: triggerRef
                })
            ) : (
                <button
                    ref={triggerRef}
                    type="button"
                    onClick={combinedOnClick}
                    onKeyDown={combinedOnKeyDown}
                    className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                >
                    <MoreHorizontal className="h-4 w-4" />
                </button>
            )}

            {/* Dropdown Menu */}
            {isOpen && (
                <div className={cn(
                    "absolute z-50 mt-1 w-48 rounded-md border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95",
                    getAlignmentClass()
                )}>
                    <div className="p-1">
                        {items.map((item, index) => {
                            if ('type' in item && item.type === 'separator') {
                                return (
                                    <div
                                        key={`separator-${index}`}
                                        className="my-1 h-px bg-border"
                                    />
                                );
                            }

                            const menuItem = item as DropdownMenuOption;
                            return (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleItemClick(menuItem)}
                                    disabled={menuItem.disabled}
                                    className={cn(
                                        "w-full text-left rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                                        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                        menuItem.variant === 'destructive' && "text-destructive hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground",
                                        menuItem.disabled && "pointer-events-none opacity-50"
                                    )}
                                >
                                    {menuItem.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// Componentes de compatibilidad para facilitar la migración
export function CustomDropdownMenuTrigger({
    children,
    asChild,
    ...props
}: {
    children: React.ReactNode;
    asChild?: boolean;
    [key: string]: any;
}) {
    if (asChild) {
        return React.cloneElement(children as React.ReactElement, props);
    }
    return <button {...props}>{children}</button>;
}
