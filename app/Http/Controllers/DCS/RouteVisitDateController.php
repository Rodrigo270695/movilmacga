<?php

namespace App\Http\Controllers\DCS;

use App\Http\Controllers\Controller;
use App\Models\Route;
use App\Models\RouteVisitDate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RouteVisitDateController extends Controller
{
    /**
     * Mostrar el calendario de fechas de visita para una ruta.
     */
    public function index(Route $route): Response
    {
        // Verificar permisos
        if (!auth()->user()?->can('gestor-ruta-fechas-visita')) {
            abort(403, 'No tienes permisos para gestionar fechas de visita de rutas.');
        }

        // Cargar la ruta con sus relaciones
        $route->load(['circuit.zonal', 'visitDates' => function ($query) {
            $query->orderBy('visit_date');
        }]);

        // Obtener el año actual o el solicitado
        $year = request('year', now()->year);

        // Obtener las fechas de visita para el año especificado
        $visitDates = $route->visitDates()
            ->forYear($year)
            ->orderBy('visit_date')
            ->get();

        // Preparar datos para el calendario
        $calendarData = $this->prepareCalendarData($year, $visitDates);

        return Inertia::render('dcs/routes/visit-dates/index', [
            'route' => $route,
            'year' => $year,
            'calendarData' => $calendarData,
            'visitDates' => $visitDates,
            'businessScope' => $this->getBusinessScope(),
        ]);
    }

    /**
     * Almacenar múltiples fechas de visita.
     */
    public function store(Request $request, Route $route)
    {
        // Verificar permisos
        if (!auth()->user()?->can('gestor-ruta-fechas-visita')) {
            abort(403, 'No tienes permisos para gestionar fechas de visita de rutas.');
        }

        $request->validate([
            'dates' => 'required|array',
            'dates.*' => 'required|date',
            'notes' => 'nullable|string|max:1000',
        ]);

        DB::transaction(function () use ($request, $route) {
            foreach ($request->dates as $date) {
                // Evitar duplicados
                RouteVisitDate::firstOrCreate([
                    'route_id' => $route->id,
                    'visit_date' => $date,
                ], [
                    'is_active' => true,
                    'notes' => $request->notes,
                ]);
            }
        });

        return back()->with('success', 'Fechas de visita agregadas exitosamente.');
    }

    /**
     * Actualizar una fecha de visita específica.
     */
    public function update(Request $request, Route $route, RouteVisitDate $visitDate)
    {
        // Verificar permisos
        if (!auth()->user()?->can('gestor-ruta-fechas-visita')) {
            abort(403, 'No tienes permisos para gestionar fechas de visita de rutas.');
        }

        $request->validate([
            'is_active' => 'boolean',
            'notes' => 'nullable|string|max:1000',
        ]);

        $visitDate->update($request->only(['is_active', 'notes']));

        return back()->with('success', 'Fecha de visita actualizada exitosamente.');
    }

    /**
     * Eliminar una fecha de visita.
     */
    public function destroy(Route $route, RouteVisitDate $visitDate)
    {
        // Verificar permisos
        if (!auth()->user()?->can('gestor-ruta-fechas-visita')) {
            abort(403, 'No tienes permisos para gestionar fechas de visita de rutas.');
        }

        $visitDate->delete();

        return back()->with('success', 'Fecha de visita eliminada exitosamente.');
    }

    /**
     * Eliminar múltiples fechas de visita.
     */
    public function destroyMultiple(Request $request, Route $route)
    {
        // Verificar permisos
        if (!auth()->user()?->can('gestor-ruta-fechas-visita')) {
            abort(403, 'No tienes permisos para gestionar fechas de visita de rutas.');
        }

        // Si se envían fechas específicas, eliminar solo esas
        if ($request->has('dates') && is_array($request->dates) && !empty($request->dates)) {
            $request->validate([
                'dates' => 'array',
                'dates.*' => 'date',
            ]);

            $route->visitDates()
                ->whereIn('visit_date', $request->dates)
                ->delete();

            return back()->with('success', 'Fechas de visita eliminadas exitosamente.');
        }

        // Si no se envían fechas específicas, eliminar todas las fechas de la ruta
        $route->visitDates()->delete();

        return back()->with('success', 'Todas las fechas de visita eliminadas exitosamente.');
    }

    /**
     * Obtener fechas de visita para un rango específico.
     */
    public function getDatesForRange(Request $request, Route $route)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $visitDates = $route->visitDates()
            ->dateRange($request->start_date, $request->end_date)
            ->orderBy('visit_date')
            ->get();

        return response()->json($visitDates);
    }

    /**
     * Preparar datos del calendario para el frontend.
     */
    private function prepareCalendarData(int $year, $visitDates): array
    {
        $calendar = [];

        for ($month = 1; $month <= 12; $month++) {
            $monthData = [
                'month' => $month,
                'monthName' => date('F', mktime(0, 0, 0, $month, 1, $year)),
                'monthNameSpanish' => $this->getMonthNameSpanish($month),
                'weeks' => [],
            ];

            $firstDay = mktime(0, 0, 0, $month, 1, $year);
            $daysInMonth = date('t', $firstDay);
            $firstDayOfWeek = date('w', $firstDay); // 0 = Sunday, 1 = Monday, etc.

            $week = [];

            // Agregar días vacíos al inicio si es necesario
            for ($i = 0; $i < $firstDayOfWeek; $i++) {
                $week[] = null;
            }

            // Agregar todos los días del mes
            for ($day = 1; $day <= $daysInMonth; $day++) {
                $date = date('Y-m-d', mktime(0, 0, 0, $month, $day, $year));
                $visitDate = $visitDates->where('visit_date', $date)->first();

                $week[] = [
                    'day' => $day,
                    'date' => $date,
                    'isWeekend' => in_array(date('w', strtotime($date)), [0, 6]), // 0 = Sunday, 6 = Saturday
                    'hasVisit' => $visitDate ? true : false,
                    'visitData' => $visitDate,
                    'isToday' => $date === now()->format('Y-m-d'),
                    'isPast' => $date < now()->format('Y-m-d'),
                ];

                // Si la semana está completa (7 días), agregarla al mes
                if (count($week) === 7) {
                    $monthData['weeks'][] = $week;
                    $week = [];
                }
            }

            // Agregar la última semana si tiene días
            if (!empty($week)) {
                // Completar con días vacíos si es necesario
                while (count($week) < 7) {
                    $week[] = null;
                }
                $monthData['weeks'][] = $week;
            }

            $calendar[] = $monthData;
        }

        return $calendar;
    }

    /**
     * Obtener nombre del mes en español.
     */
    private function getMonthNameSpanish(int $month): string
    {
        $months = [
            1 => 'Enero',
            2 => 'Febrero',
            3 => 'Marzo',
            4 => 'Abril',
            5 => 'Mayo',
            6 => 'Junio',
            7 => 'Julio',
            8 => 'Agosto',
            9 => 'Septiembre',
            10 => 'Octubre',
            11 => 'Noviembre',
            12 => 'Diciembre',
        ];

        return $months[$month] ?? '';
    }

    /**
     * Obtener el scope de negocio del usuario.
     */
    private function getBusinessScope(): array
    {
        $user = auth()->user();

        if (!$user) {
            return [];
        }

        // Si es super admin, puede ver todo
        if ($user->hasRole('Super Admin')) {
            return [];
        }

        // Si tiene asignaciones de negocio específicas
        if ($user->businessAssignments->isNotEmpty()) {
            return [
                'business_ids' => $user->businessAssignments->pluck('business_id')->toArray(),
            ];
        }

        return [];
    }
}
