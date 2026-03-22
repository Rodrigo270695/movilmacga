import {
    Dialog,
    DialogPortal,
    DialogOverlay,
    DialogTitle,
} from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
    PdvOperatorsMapView,
    type PdvOperatorsMapFilters,
} from '@/components/dcs/pdv-operators/pdv-operators-map-view';

interface PdvOperatorsMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    mapFilters: PdvOperatorsMapFilters;
}

export function PdvOperatorsMapModal({ isOpen, onClose, mapFilters }: PdvOperatorsMapModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={() => {}}>
            <DialogPortal>
                <DialogOverlay />
                <DialogPrimitive.Content
                    aria-describedby={undefined}
                    className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 flex h-[90vh] w-[95vw] translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden rounded-xl border border-gray-200 shadow-2xl duration-200 sm:h-[92vh] sm:w-[96vw] lg:max-h-[90vh] lg:max-w-[1400px]"
                >
                    <DialogTitle className="sr-only">Mapa PDV - Operadores</DialogTitle>
                    {isOpen && (
                        <PdvOperatorsMapView mapFilters={mapFilters} enabled onClose={onClose} />
                    )}
                </DialogPrimitive.Content>
            </DialogPortal>
        </Dialog>
    );
}
