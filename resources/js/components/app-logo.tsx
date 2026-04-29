import { usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';

export default function AppLogo() {
    const { theme } = usePage<SharedData>().props;

    const logo = theme?.logo ?? '/logo.png';
    const name = theme?.name ?? 'App';

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-transparent">
                <img
                    src={logo}
                    alt={name}
                    className="size-5 object-contain"
                />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">{name}</span>
            </div>
        </>
    );
}
