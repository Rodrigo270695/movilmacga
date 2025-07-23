import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast = { ...toast, id };
        setToasts(prev => [...prev, newToast]);

        // Auto remove after duration
        setTimeout(() => {
            removeToast(id);
        }, toast.duration || 5000);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

function ToastContainer() {
    const { toasts, removeToast } = useToast();

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map((toast) => (
                <ToastComponent
                    key={toast.id}
                    toast={toast}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
}

function ToastComponent({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        // Trigger entrance animation
        setTimeout(() => setIsVisible(true), 10);
    }, []);

    const handleClose = () => {
        setIsLeaving(true);
        setTimeout(onClose, 300); // Wait for exit animation
    };

    const getToastConfig = (type: Toast['type']) => {
        switch (type) {
            case 'success':
                return {
                    icon: CheckCircle2,
                    className: 'bg-green-50 border-green-200 text-green-800',
                    iconColor: 'text-green-600'
                };
            case 'error':
                return {
                    icon: XCircle,
                    className: 'bg-red-50 border-red-200 text-red-800',
                    iconColor: 'text-red-600'
                };
            case 'warning':
                return {
                    icon: AlertCircle,
                    className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
                    iconColor: 'text-yellow-600'
                };
            case 'info':
                return {
                    icon: Info,
                    className: 'bg-blue-50 border-blue-200 text-blue-800',
                    iconColor: 'text-blue-600'
                };
        }
    };

    const config = getToastConfig(toast.type);
    const IconComponent = config.icon;

    return (
        <div
            className={`
                relative flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-sm
                transform transition-all duration-300 ease-out
                ${config.className}
                ${isVisible && !isLeaving
                    ? 'translate-x-0 opacity-100 scale-100'
                    : 'translate-x-full opacity-0 scale-95'
                }
            `}
        >
            <IconComponent className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />

            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium">{toast.title}</h4>
                {toast.message && (
                    <p className="text-sm mt-1 opacity-90">{toast.message}</p>
                )}
            </div>

            <button
                onClick={handleClose}
                className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors cursor-pointer"
                title="Cerrar"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
