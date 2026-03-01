import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface ExpandableButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /**
     * El icono que se mostrará en el botón (de lucide-react)
     */
    icon: LucideIcon;
    /**
     * El texto que aparecerá al hacer hover
     */
    text: string;
    /**
     * Variante del efecto: 'glow' o 'shine'
     * @default 'glow'
     */
    variant?: 'glow' | 'shine';
    /**
     * Props adicionales para el Button de shadcn
     */
    buttonProps?: any;
}

/**
 * ExpandableButton - Botón profesional con efecto de expansión al hover
 *
 * @example
 * ```tsx
 * import { Plus } from 'lucide-react';
 *
 * <ExpandableButton
 *   icon={Plus}
 *   text="Nuevo Rol"
 *   variant="glow"
 *   onClick={() => console.log('clicked')}
 * />
 * ```
 */
export const ExpandableButton = forwardRef<HTMLButtonElement, ExpandableButtonProps>(
    ({ icon: Icon, text, variant = 'glow', className = '', buttonProps, ...props }, ref) => {
        if (variant === 'glow') {
            return (
                <Button
                    ref={ref}
                    className={`group relative bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-sm font-medium cursor-pointer overflow-visible shadow-lg hover:shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] w-11 hover:w-auto hover:pr-5 rounded-lg hover:rounded-xl ${className}`}
                    {...buttonProps}
                    {...props}
                >
                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-lg bg-blue-400 opacity-0 blur-xl transition-all duration-700 group-hover:opacity-50 group-hover:scale-110"></div>

                    <div className="flex items-center justify-center relative z-10">
                        {/* Icono con pulse effect */}
                        <div className="flex items-center justify-center w-11 flex-shrink-0">
                            <Icon className="w-[18px] h-[18px] transition-all duration-700 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] group-hover:scale-125" />
                            {/* Rings pulsantes */}
                            <div className="absolute w-5 h-5 rounded-full border-2 border-white/30 scale-100 opacity-0 group-hover:scale-150 group-hover:opacity-0 transition-all duration-700"></div>
                            <div className="absolute w-5 h-5 rounded-full border-2 border-white/20 scale-100 opacity-0 group-hover:scale-[2] group-hover:opacity-0 transition-all duration-1000 delay-75"></div>
                        </div>

                        {/* Texto con slide desde la derecha */}
                        <div className="relative overflow-hidden max-w-0 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:max-w-[200px]">
                            <span className="inline-block whitespace-nowrap opacity-0 translate-x-full transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:opacity-100 group-hover:translate-x-0 font-medium tracking-wider pl-1">
                                {text}
                            </span>
                        </div>
                    </div>

                    {/* Borde animado */}
                    <div className="absolute inset-0 rounded-lg border-2 border-white/0 group-hover:border-white/20 transition-all duration-700"></div>
                </Button>
            );
        }

        // Variant: 'shine'
        return (
            <Button
                ref={ref}
                className={`group relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2.5 text-sm font-medium cursor-pointer overflow-hidden shadow-md hover:shadow-xl transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] w-11 hover:w-auto hover:px-5 hover:-translate-y-0.5 ${className}`}
                {...buttonProps}
                {...props}
            >
                <div className="flex items-center justify-center relative z-10">
                    <Icon className="w-[18px] h-[18px] flex-shrink-0 transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-90 group-hover:scale-110" />
                    <span className="inline-block max-w-0 overflow-hidden whitespace-nowrap opacity-0 translate-x-3 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:max-w-[200px] group-hover:opacity-100 group-hover:translate-x-0 group-hover:ml-2.5 font-medium tracking-wide">
                        {text}
                    </span>
                </div>
                {/* Efecto de brillo al hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]"></div>
            </Button>
        );
    }
);

ExpandableButton.displayName = 'ExpandableButton';
