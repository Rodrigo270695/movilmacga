import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin } from 'lucide-react';

interface Operator {
    id: number;
    name: string;
    color?: string | null;
}

interface PdvOperator {
    id: number;
    pivot?: { status: boolean };
}

interface PdvModel {
    id: number;
    point_name: string;
    client_name: string;
    route?: {
        circuit?: {
            name: string;
            zonal?: { name: string };
        };
    };
    operators?: PdvOperator[];
}

interface Props {
    pdvs: { data: PdvModel[] };
    operators: Operator[];
    assignments: Record<string, Record<string, boolean>>;
    onAssignmentChange: (pdvId: number, operatorId: number, checked: boolean) => void;
    canEdit: boolean;
}

export function PdvOperatorsMobileCards({
    pdvs,
    operators,
    assignments,
    onAssignmentChange,
    canEdit,
}: Props) {
    const getZonalCircuit = (pdv: PdvModel) => {
        const z = pdv.route?.circuit?.zonal?.name ?? '';
        const c = pdv.route?.circuit?.name ?? '';
        const t = [z, c].filter(Boolean).join(' / ');
        return t || '—';
    };

    const getStatus = (pdvId: number, operatorId: number) => {
        return assignments[String(pdvId)]?.[String(operatorId)] ?? false;
    };

    if (!pdvs.data?.length) {
        return (
            <div className="text-center py-12 text-gray-500">
                <p>No hay PDVs que coincidan con los filtros.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {pdvs.data.map((pdv) => (
                <Card
                    key={pdv.id}
                    className="overflow-hidden border border-gray-200 shadow-sm border-l-4 border-l-pink-500"
                >
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="w-9 h-9 bg-pink-100 rounded flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-4 h-4 text-pink-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">{pdv.point_name}</h3>
                                <p className="text-sm text-gray-600 truncate">{pdv.client_name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{getZonalCircuit(pdv)}</p>
                            </div>
                        </div>
                        <div className="border-t border-gray-100 pt-3">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                Operadores
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {operators.map((op) => {
                                    const opColor = op.color || '#6366f1';
                                    return (
                                        <label
                                            key={op.id}
                                            className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-gray-50 cursor-pointer"
                                        >
                                            <div
                                                style={{ ['--operator-color']: opColor } as React.CSSProperties}
                                            >
                                                <Checkbox
                                                    checked={getStatus(pdv.id, op.id)}
                                                    onCheckedChange={(checked) =>
                                                        onAssignmentChange(pdv.id, op.id, !!checked)
                                                    }
                                                    disabled={!canEdit}
                                                    className="cursor-pointer data-[state=checked]:bg-[var(--operator-color)] data-[state=checked]:border-[var(--operator-color)] flex-shrink-0"
                                                />
                                            </div>
                                            <span className="text-sm text-gray-700 truncate">{op.name}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
