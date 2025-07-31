import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomDialogProps {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}

interface CustomDialogContentProps {
    className?: string;
    children: React.ReactNode;
    onClose?: () => void;
    style?: React.CSSProperties;
}

interface CustomDialogHeaderProps {
    className?: string;
    children: React.ReactNode;
}

interface CustomDialogTitleProps {
    className?: string;
    children: React.ReactNode;
}

interface CustomDialogDescriptionProps {
    className?: string;
    children: React.ReactNode;
}

interface CustomDialogFooterProps {
    className?: string;
    children: React.ReactNode;
}

export function CustomDialog({ open, onOpenChange, children }: CustomDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    // Manejar ESC key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && open) {
                onOpenChange?.(false);
            }
        };

        if (open) {
            document.addEventListener('keydown', handleEscape);
            // Prevenir scroll del body
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [open, onOpenChange]);

    // Manejar clic en backdrop
    const handleBackdropClick = (event: React.MouseEvent) => {
        if (event.target === event.currentTarget) {
            onOpenChange?.(false);
        }
    };

    if (!open) return null;

    return (
        <div
            ref={dialogRef}
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={handleBackdropClick}
        >
            {/* Backdrop/Overlay */}
            <div className="fixed inset-0 bg-black/80 animate-in fade-in-0" />

            {/* Content Container */}
            <div className="relative z-50 w-full max-w-[calc(100%-2rem)] sm:max-w-6xl">
                {children}
            </div>
        </div>
    );
}

export function CustomDialogContent({
    className,
    children,
    onClose,
    style
}: CustomDialogContentProps) {
    return (
        <div
            className={cn(
                "bg-background animate-in fade-in-0 zoom-in-95 relative grid w-full gap-4 rounded-lg border p-6 shadow-lg duration-200",
                className
            )}
            style={style}
        >
            {children}

            {/* Close Button */}
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>
            )}
        </div>
    );
}

export function CustomDialogHeader({ className, children }: CustomDialogHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-2 text-center sm:text-left", className)}>
            {children}
        </div>
    );
}

export function CustomDialogTitle({ className, children }: CustomDialogTitleProps) {
    return (
        <h2 className={cn("text-lg font-semibold leading-none", className)}>
            {children}
        </h2>
    );
}

export function CustomDialogDescription({ className, children }: CustomDialogDescriptionProps) {
    return (
        <p className={cn("text-sm text-muted-foreground", className)}>
            {children}
        </p>
    );
}

export function CustomDialogFooter({ className, children }: CustomDialogFooterProps) {
    return (
        <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}>
            {children}
        </div>
    );
}
