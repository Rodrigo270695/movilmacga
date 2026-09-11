import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin } from 'lucide-react';

interface PdvRow {
    id: number;
    point_name: string;
    client_name: string;
    visits_week: number;
    visits_month: number;
    programmed_month: number;
    visit_days: string;
    route?: {
        name: string;
        code: string;
        circuit?: {
            name: string;
            zonal?: {
                name: string;
            };
        };
    };
}

interface Paginated {
    data: PdvRow[];
    total: number;
}

interface Props {
    pdvs: Paginated;
}

export function FrecuenciaTable({ pdvs }: Props) {
    return (
        <Card className="overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CalendarDays className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-900">Detalle por PDV</h3>
                        <p className="text-xs text-gray-500">{pdvs.total} PDVs en el período</p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">PDV</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ruta / Circuito</th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Días</th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Semana</th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Q mes</th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Prog. mes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {pdvs.data.map((pdv) => (
                            <tr key={pdv.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{pdv.point_name}</div>
                                            <div className="text-xs text-gray-500">{pdv.client_name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="text-sm text-gray-900">{pdv.route?.name || '-'}</div>
                                    <div className="text-xs text-blue-600">{pdv.route?.circuit?.name}</div>
                                    <div className="text-xs text-gray-400">{pdv.route?.circuit?.zonal?.name}</div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="text-xs text-gray-700">{pdv.visit_days || '—'}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                                        {pdv.visits_week} / sem
                                    </Badge>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="text-sm font-semibold text-blue-700">{pdv.visits_month}</span>
                                </td>
                                <td className="px-4 py-3 text-center hidden sm:table-cell">
                                    <span className="text-sm text-gray-600">{pdv.programmed_month}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {pdvs.data.length === 0 && (
                <div className="text-center py-10 text-sm text-gray-500">
                    No hay PDVs con los filtros aplicados.
                </div>
            )}
        </Card>
    );
}
