import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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

export function PdvOperatorsTable({ pdvs, operators, assignments, onAssignmentChange, canEdit }: Props) {
    const getZonalCircuit = (pdv: PdvModel) => {
        const z = pdv.route?.circuit?.zonal?.name ?? '';
        const c = pdv.route?.circuit?.name ?? '';
        const t = [z, c].filter(Boolean).join(' / ');
        return t || '—';
    };

    const getStatus = (pdvId: number, operatorId: number) => {
        return assignments[String(pdvId)]?.[String(operatorId)] ?? false;
    };

    return (
        <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                PDV
                            </TableHead>
                            <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                Cliente
                            </TableHead>
                            <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                Zonal / Circuito
                            </TableHead>
                            {operators.map((op) => (
                                <TableHead
                                    key={op.id}
                                    className="text-xs font-medium text-gray-500 uppercase tracking-wider text-center whitespace-nowrap"
                                >
                                    {op.name}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white divide-y divide-gray-200">
                        {pdvs.data.map((pdv) => (
                            <TableRow key={pdv.id} className="hover:bg-gray-50">
                                <TableCell className="whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-pink-100 rounded flex items-center justify-center flex-shrink-0">
                                            <MapPin className="w-4 h-4 text-pink-600" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">{pdv.point_name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm text-gray-700">{pdv.client_name}</TableCell>
                                <TableCell className="text-sm text-gray-600">{getZonalCircuit(pdv)}</TableCell>
                                {operators.map((op) => {
                                    const opColor = op.color || '#6366f1';
                                    return (
                                        <TableCell key={op.id} className="text-center">
                                            <div
                                                className="flex justify-center"
                                                style={{ ['--operator-color']: opColor } as React.CSSProperties}
                                            >
                                                <Checkbox
                                                    checked={getStatus(pdv.id, op.id)}
                                                    onCheckedChange={(checked) =>
                                                        onAssignmentChange(pdv.id, op.id, !!checked)
                                                    }
                                                    disabled={!canEdit}
                                                    className="cursor-pointer data-[state=checked]:bg-[var(--operator-color)] data-[state=checked]:border-[var(--operator-color)]"
                                                />
                                            </div>
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {pdvs.data.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <p>No hay PDVs que coincidan con los filtros.</p>
                </div>
            )}
        </Card>
    );
}
