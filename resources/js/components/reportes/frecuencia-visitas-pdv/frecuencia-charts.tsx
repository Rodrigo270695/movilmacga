import { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    BarElement,
    CategoryScale,
    Legend,
    LinearScale,
    Tooltip,
    type ChartOptions,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Card } from '@/components/ui/card';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export interface ChartPayload {
    total_pdvs: number;
    avg_week: number;
    avg_month: number;
    q_month_total: number;
    by_week: Array<{ key: string; label: string; pdvs: number; month?: number }>;
    by_zonal: Array<{ id: number; name: string; pdvs: number; avg_week: number; avg_month: number; q_month: number }>;
    by_circuit: Array<{ id: number; name: string; pdvs: number; avg_week: number; avg_month: number; q_month: number }>;
    by_weekday: Array<{ dow: number; label: string; pdvs: number }>;
}

const colors = ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e3a8a'];
const weekColors = ['#d1d5db', '#93c5fd', '#60a5fa', '#2563eb', '#1d4ed8', '#1e3a8a'];

const font = { family: 'ui-sans-serif, system-ui, sans-serif' };

const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'bottom', labels: { font, boxWidth: 12 } },
        tooltip: { bodyFont: font, titleFont: font },
    },
};

const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: { bodyFont: font, titleFont: font },
    },
    scales: {
        x: { ticks: { font, maxRotation: 45, minRotation: 0 } },
        y: { beginAtZero: true, ticks: { font, precision: 0 } },
    },
};

interface Props {
    charts: ChartPayload;
}

export function FrecuenciaCharts({ charts }: Props) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return <div className="h-72 bg-gray-50 rounded-lg" />;
    }

    const weekWithData = charts.by_week.filter((w) => w.pdvs > 0 || w.key !== '0');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 print:grid-cols-2 print:break-inside-avoid">
            <Card className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">PDVs por frecuencia semanal</h3>
                <p className="text-xs text-gray-500 mb-3">3 visitas/semana = 12 visitas/mes</p>
                <div className="h-64">
                    <Doughnut
                        options={doughnutOptions}
                        data={{
                            labels: weekWithData.map((w) => w.label),
                            datasets: [{
                                data: weekWithData.map((w) => w.pdvs),
                                backgroundColor: weekColors.slice(0, weekWithData.length),
                                borderWidth: 0,
                            }],
                        }}
                    />
                </div>
            </Card>

            <Card className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Q de visitas al mes</h3>
                <p className="text-xs text-gray-500 mb-3">Cantidad de PDVs según visitas mensuales (sem × 4)</p>
                <div className="h-64">
                    <Bar
                        options={barOptions}
                        data={{
                            labels: charts.by_week.filter((w) => w.key !== '0').map((w) => `${w.month} vis/mes`),
                            datasets: [{
                                label: 'PDVs',
                                data: charts.by_week.filter((w) => w.key !== '0').map((w) => w.pdvs),
                                backgroundColor: colors,
                                borderRadius: 6,
                            }],
                        }}
                    />
                </div>
            </Card>

            <Card className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">PDVs por día de la semana</h3>
                <p className="text-xs text-gray-500 mb-3">Cuántos PDVs tienen visita programada cada día</p>
                <div className="h-64">
                    <Bar
                        options={barOptions}
                        data={{
                            labels: charts.by_weekday.map((d) => d.label),
                            datasets: [{
                                label: 'PDVs',
                                data: charts.by_weekday.map((d) => d.pdvs),
                                backgroundColor: '#3b82f6',
                                borderRadius: 6,
                            }],
                        }}
                    />
                </div>
            </Card>

            <Card className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Q mensual por zonal</h3>
                <p className="text-xs text-gray-500 mb-3">Suma de visitas/mes (Integratel) de los PDVs</p>
                <div className="h-64">
                    <Bar
                        options={barOptions}
                        data={{
                            labels: charts.by_zonal.map((z) => z.name),
                            datasets: [{
                                label: 'Q mes',
                                data: charts.by_zonal.map((z) => z.q_month),
                                backgroundColor: '#1d4ed8',
                                borderRadius: 6,
                            }],
                        }}
                    />
                </div>
            </Card>
        </div>
    );
}
