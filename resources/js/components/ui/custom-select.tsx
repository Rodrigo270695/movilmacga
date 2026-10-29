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
    /** Clases extra del panel desplegable (p. ej. ancho mínimo para textos largos) */
    menuClassName?: string;
    /** Permite ver el texto completo en opciones y en el valor seleccionado */
    wrapLabels?: boolean;
}

export function CustomSelect({
    options,
    value,
    onValueChange,
    placeholder = "Seleccionar...",
    className,
    disabled = false,
    menuClassName,
    wrapLabels = false,
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
                    "flex w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm text-left shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    wrapLabels ? "min-h-9 h-auto" : "h-9 whitespace-nowrap",
                    isOpen && "ring-1 ring-ring"
                )}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-labelledby="select-label"
            >
                <span
                    className={cn(
                        "block flex-1 pr-2 text-left",
                        wrapLabels ? "whitespace-normal leading-snug" : "truncate",
                        !selectedOption && "text-muted-foreground"
                    )}
                    title={selectedOption?.label}
                >
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    className={cn(
                        "h-4 w-4 shrink-0 opacity-50 transition-transform duration-200",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            {/* Dropdown Options */}
            {isOpen && (
                <div
                    className={cn(
                        "absolute z-50 mt-1 rounded-md border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95",
                        menuClassName ?? "w-full"
                    )}
                >
                    <div className="max-h-72 overflow-auto rounded-md p-1">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option.value)}
                                className={cn(
                                    "relative flex w-full cursor-default select-none items-start rounded-sm py-2 pl-2 pr-8 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                    selectedValue === option.value && "bg-accent text-accent-foreground"
                                )}
                                role="option"
                                aria-selected={selectedValue === option.value}
                            >
                                <span className={cn("block", wrapLabels ? "whitespace-normal leading-snug" : "truncate")}>
                                    {option.label}
                                </span>
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
