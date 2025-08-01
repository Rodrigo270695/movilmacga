import { Appearance, useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { LucideIcon, Monitor, Moon, Sun } from 'lucide-react';
import { HTMLAttributes } from 'react';

export default function AppearanceToggleTab({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    // Solo mostrar tema claro ya que está forzado
    const tabs: { value: Appearance; icon: LucideIcon; label: string }[] = [
        { value: 'light', icon: Sun, label: 'Claro' },
        // { value: 'dark', icon: Moon, label: 'Oscuro' }, // Deshabilitado
        // { value: 'system', icon: Monitor, label: 'Sistema' }, // Deshabilitado
    ];

    return (
        <div className={cn('inline-flex gap-1 rounded-lg bg-neutral-100 p-1', className)} {...props}>
            {tabs.map(({ value, icon: Icon, label }) => (
                <div
                    key={value}
                    className={cn(
                        'flex items-center rounded-md px-3.5 py-1.5',
                        'bg-white shadow-xs cursor-default', // Siempre activo y no clickeable
                    )}
                >
                    <Icon className="-ml-1 h-4 w-4" />
                    <span className="ml-1.5 text-sm">{label}</span>
                    <span className="ml-2 text-xs text-green-600 font-medium">(Forzado)</span>
                </div>
            ))}

            {/* Mostrar mensaje informativo */}
            <div className="ml-3 flex items-center text-xs text-gray-500">
                <span>El sistema está configurado para usar solo tema claro</span>
            </div>
        </div>
    );
}
