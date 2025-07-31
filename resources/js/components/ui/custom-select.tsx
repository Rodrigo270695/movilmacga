import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
    value: string;
    label: string;
}

interface CustomSelectProps {
    options: SelectOption[];
    value?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function CustomSelect({
    options,
    value,
    onValueChange,
    placeholder = "Seleccionar...",
    className,
    disabled = false
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(value || '');
    const selectRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    // Encontrar la opción seleccionada
    const selectedOption = options.find(option => option.value === selectedValue);

    // Manejar clic fuera del componente
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
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

    // Sincronizar con el prop value
    useEffect(() => {
        setSelectedValue(value || '');
    }, [value]);

    const handleToggle = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
        }
    };

    const handleSelect = (optionValue: string) => {
        setSelectedValue(optionValue);
        setIsOpen(false);
        onValueChange?.(optionValue);
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (disabled) return;

        switch (event.key) {
            case 'Enter':
            case ' ':
                event.preventDefault();
                setIsOpen(!isOpen);
                break;
            case 'Escape':
                setIsOpen(false);
                triggerRef.current?.focus();
                break;
            case 'ArrowDown':
                event.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                }
                break;
            case 'ArrowUp':
                event.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                }
                break;
        }
    };

    return (
        <div ref={selectRef} className={cn("relative", className)}>
            {/* Trigger Button */}
            <button
                ref={triggerRef}
                type="button"
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className={cn(
                    "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    isOpen && "ring-1 ring-ring"
                )}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-labelledby="select-label"
            >
                <span className={cn(
                    "block truncate",
                    !selectedOption && "text-muted-foreground"
                )}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    className={cn(
                        "h-4 w-4 opacity-50 transition-transform duration-200",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            {/* Dropdown Options */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95">
                    <div className="max-h-60 overflow-auto rounded-md p-1">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option.value)}
                                className={cn(
                                    "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                    selectedValue === option.value && "bg-accent text-accent-foreground"
                                )}
                                role="option"
                                aria-selected={selectedValue === option.value}
                            >
                                <span className="block truncate">{option.label}</span>
                                {selectedValue === option.value && (
                                    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                                        <Check className="h-4 w-4" />
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
