<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BusinessFormRequest;
use App\Models\BusinessForm;
use App\Models\Business;
use App\Models\FormField;
use App\Models\FormSection;
use App\Traits\HasBusinessScope;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BusinessFormController extends Controller
{
    use HasBusinessScope;

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Verificar permisos específicos
        if (!auth()->user()?->can('gestor-formularios-ver')) {
            abort(403, 'No tienes permisos para ver los formularios.');
        }

        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        $businessFilter = $request->get('business_filter');
        $statusFilter = $request->get('status_filter');
        $businessId = $request->get('business_id'); // Para filtrar por negocio específico

        $query = BusinessForm::with('business')
            ->withCount(['sections', 'activeSections', 'fields', 'activeFields']);

        // Aplicar filtros de scope automáticos
        $query = $this->applyBusinessScope($query, 'business_id');

        // Filtrar por búsqueda
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('business', function ($businessQuery) use ($search) {
                      $businessQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Filtrar por negocio específico (prioridad sobre business_filter)
        if ($businessId) {
            $query->where('business_id', $businessId);
        } elseif ($businessFilter && $businessFilter !== 'all') {
            $query->where('business_id', $businessFilter);
        }

        // Filtrar por estado
        if ($statusFilter !== null && $statusFilter !== '') {
            $query->where('is_active', $statusFilter === 'active');
        }

        $forms = $query->orderBy('name')->paginate($perPage);

        // Obtener negocios disponibles para el filtro
        $businesses = $this->getAvailableBusinesses();

        return Inertia::render('admin/business-forms/index', [
            'forms' => $forms,
            'businesses' => $businesses,
            'businessScope' => $this->getBusinessScope(),
            'filters' => [
                'search' => $search,
                'business_filter' => $businessFilter,
                'status_filter' => $statusFilter,
                'per_page' => $perPage,
                'business_id' => $businessId,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        // Verificar permisos
        if (!auth()->user()?->can('gestor-formularios-crear')) {
            abort(403, 'No tienes permisos para crear formularios.');
        }

        // Obtener negocios disponibles
        $businesses = $this->getAvailableBusinesses();

        // Si se especifica un business_id, preseleccionarlo
        $preselectedBusinessId = $request->get('business_id');

        return Inertia::render('admin/business-forms/create', [
            'businesses' => $businesses,
            'businessScope' => $this->getBusinessScope(),
            'preselectedBusinessId' => $preselectedBusinessId,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(BusinessFormRequest $request)
    {
        // Verificar permisos
        if (!auth()->user()?->can('gestor-formularios-crear')) {
            abort(403, 'No tienes permisos para crear formularios.');
        }

        $form = BusinessForm::create([
            'business_id' => $request->business_id,
            'name' => $request->name,
            'description' => $request->description,
            'is_active' => $request->is_active ?? true,
            'settings' => $request->settings ?? [],
        ]);

        // Preservar el filtro por negocio si existe
        $redirectParams = [];
        if ($request->business_id) {
            $redirectParams['business_id'] = $request->business_id;
        }

        // Si es una petición AJAX, devolver JSON
        if ($request->header('X-Inertia')) {
            return back()->with('success', "Formulario '{$form->name}' creado exitosamente.");
        }

        return redirect()->route('admin.business-forms.index', $redirectParams)
            ->with('success', "Formulario '{$form->name}' creado exitosamente.");
    }

    /**
     * Display the specified resource.
     */
    public function show(BusinessForm $businessForm)
    {
        // Verificar permisos
        if (!auth()->user()?->can('gestor-formularios-ver')) {
            abort(403, 'No tienes permisos para ver formularios.');
        }

        // Verificar scope
        if (!$this->canAccessBusiness($businessForm->business_id)) {
            abort(403, 'No tienes acceso a este formulario.');
        }

        $businessForm->load([
            'business',
            'sections.fields' => function ($query) {
                $query->orderBy('order_index');
            }
        ]);

        return Inertia::render('admin/business-forms/show', [
            'form' => $businessForm,
            'businessScope' => $this->getBusinessScope(),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(BusinessForm $businessForm)
    {
        // Verificar permisos
        if (!auth()->user()?->can('gestor-formularios-editar')) {
            abort(403, 'No tienes permisos para editar formularios.');
        }

        // Verificar scope
        if (!$this->canAccessBusiness($businessForm->business_id)) {
            abort(403, 'No tienes acceso a este formulario.');
        }

        $businessForm->load([
            'business',
            'sections.fields' => function ($query) {
                $query->orderBy('order_index');
            }
        ]);

        // Obtener negocios disponibles
        $businesses = $this->getAvailableBusinesses();

        return Inertia::render('admin/business-forms/edit', [
            'form' => $businessForm,
            'businesses' => $businesses,
            'businessScope' => $this->getBusinessScope(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(BusinessFormRequest $request, BusinessForm $businessForm)
    {
        // Verificar permisos
        if (!auth()->user()?->can('gestor-formularios-editar')) {
            abort(403, 'No tienes permisos para editar formularios.');
        }

        // Verificar scope
        if (!$this->canAccessBusiness($businessForm->business_id)) {
            abort(403, 'No tienes acceso a este formulario.');
        }

        $businessForm->update([
            'business_id' => $request->business_id,
            'name' => $request->name,
            'description' => $request->description,
            'is_active' => $request->is_active,
            'settings' => $request->settings ?? [],
        ]);

        // Preservar el filtro por negocio si existe
        $redirectParams = [];
        if ($request->business_id) {
            $redirectParams['business_id'] = $request->business_id;
        }

        // Si es una petición AJAX, devolver JSON
        if ($request->header('X-Inertia')) {
            return back()->with('success', "Formulario '{$businessForm->name}' actualizado exitosamente.");
        }

        return redirect()->route('admin.business-forms.index', $redirectParams)
            ->with('success', "Formulario '{$businessForm->name}' actualizado exitosamente.");
    }

    /**
     * Toggle the status of the specified resource.
     */
    public function toggleStatus(BusinessForm $businessForm)
    {
        // Verificar permisos
        if (!auth()->user()?->can('gestor-formularios-cambiar-estado')) {
            abort(403, 'No tienes permisos para cambiar el estado de formularios.');
        }

        // Verificar scope
        if (!$this->canAccessBusiness($businessForm->business_id)) {
            abort(403, 'No tienes acceso a este formulario.');
        }

        $businessForm->update([
            'is_active' => !$businessForm->is_active
        ]);

        $statusText = $businessForm->is_active ? 'activado' : 'desactivado';

        // Preservar el filtro por negocio usando el business_id del formulario
        $redirectParams = [];
        if ($businessForm->business_id) {
            $redirectParams['business_id'] = $businessForm->business_id;
        }

        // Si es una petición de Inertia.js, devolver respuesta JSON
        if (request()->header('X-Inertia')) {
            return back()->with('success', "Formulario {$statusText} exitosamente.");
        }

        return redirect()->route('admin.business-forms.index', $redirectParams)
            ->with('success', "Formulario {$statusText} exitosamente.");
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(BusinessForm $businessForm)
    {
        // Verificar permisos
        if (!auth()->user()?->can('gestor-formularios-eliminar')) {
            abort(403, 'No tienes permisos para eliminar formularios.');
        }

        // Verificar scope
        if (!$this->canAccessBusiness($businessForm->business_id)) {
            abort(403, 'No tienes acceso a este formulario.');
        }

        $formName = $businessForm->name;
        $businessId = $businessForm->business_id; // Guardar el business_id antes de eliminar
        $businessForm->delete();

        // Preservar el filtro por negocio usando el business_id del formulario eliminado
        $redirectParams = [];
        if ($businessId) {
            $redirectParams['business_id'] = $businessId;
        }

        // Siempre devolver back() para peticiones de Inertia
        return back()->with('success', "Formulario '{$formName}' eliminado exitosamente.");
    }

    /**
     * Verificar si el usuario puede acceder al negocio
     */
    private function canAccessBusiness($businessId): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        if ($this->hasBusinessRestriction()) {
            return in_array($businessId, $this->getBusinessIds());
        }

        return true;
    }

    /**
     * Mostrar la vista de gestión de campos de un formulario
     */
    public function fieldsIndex(BusinessForm $businessForm)
    {
        // Cargar el formulario con sus relaciones
        $businessForm->load([
            'business',
            'sections' => function ($query) {
                $query->orderBy('order_index');
            },
            'sections.fields' => function ($query) {
                $query->orderBy('order_index');
            }
        ]);

        // Verificar que el formulario se cargó correctamente
        if (!$businessForm->business) {
            abort(404, 'El negocio asociado al formulario no existe.');
        }

        // Debug: Log para verificar que las secciones se cargan
        \Log::info('BusinessForm sections loaded:', [
            'form_id' => $businessForm->id,
            'sections_count' => $businessForm->sections->count(),
            'sections' => $businessForm->sections->toArray()
        ]);

        return Inertia::render('admin/business-forms/fields/index', [
            'form' => $businessForm,
            'businessScope' => $this->getBusinessScope(),
        ]);
    }

    /**
     * Almacenar un nuevo campo
     */
    public function storeField(Request $request, BusinessForm $businessForm)
    {
        // Debug: Log para verificar los datos recibidos
        \Log::info('StoreField request data:', $request->all());

        // Verificar permisos
        if (!auth()->user()?->can('gestor-formularios-editar')) {
            abort(403, 'No tienes permisos para editar formularios.');
        }

        // Verificar scope
        if (!$this->canAccessBusiness($businessForm->business_id)) {
            abort(403, 'No tienes acceso a este formulario.');
        }

        // Validación básica
        $request->validate([
            'form_section_id' => 'required|exists:form_sections,id',
            'field_type' => 'required|string|in:text,number,select,checkbox,image,pdf,location,signature',
            'label' => 'required|string|max:255',
            'placeholder' => 'nullable|string|max:255',
            'is_required' => 'boolean',
            'is_active' => 'boolean',
            'options' => 'nullable|array',
            'min_value' => 'nullable|numeric',
            'max_value' => 'nullable|numeric',
            'file_types' => 'nullable|string',
            'max_file_size' => 'nullable|integer',
        ]);

        $field = FormField::create([
            'form_section_id' => $request->form_section_id,
            'field_type' => $request->field_type,
            'label' => $request->label,
            'placeholder' => $request->placeholder,
            'is_required' => $request->is_required ?? false,
            'is_active' => $request->is_active ?? true,
            'options' => $request->options ?? [],
            'min_value' => $request->min_value,
            'max_value' => $request->max_value,
            'file_types' => $request->file_types,
            'max_file_size' => $request->max_file_size,
            'order_index' => FormField::where('form_section_id', $request->form_section_id)->max('order_index') + 1,
        ]);

        return back()->with('success', "Campo '{$field->label}' creado exitosamente.");
    }

    /**
     * Actualizar un campo
     */
    public function updateField(Request $request, BusinessForm $businessForm, FormField $field)
    {
        // Verificar permisos
        if (!auth()->user()?->can('gestor-formularios-editar')) {
            abort(403, 'No tienes permisos para editar formularios.');
        }

        // Verificar scope
        if (!$this->canAccessBusiness($businessForm->business_id)) {
            abort(403, 'No tienes acceso a este formulario.');
        }

        // Validación básica
        $request->validate([
            'field_type' => 'required|string|in:text,number,select,checkbox,image,pdf,location,signature',
            'label' => 'required|string|max:255',
            'placeholder' => 'nullable|string|max:255',
            'is_required' => 'boolean',
            'is_active' => 'boolean',
            'options' => 'nullable|array',
            'min_value' => 'nullable|numeric',
            'max_value' => 'nullable|numeric',
            'file_types' => 'nullable|string',
            'max_file_size' => 'nullable|integer',
        ]);

        $field->update([
            'field_type' => $request->field_type,
            'label' => $request->label,
            'placeholder' => $request->placeholder,
            'is_required' => $request->is_required ?? false,
            'is_active' => $request->is_active ?? true,
            'options' => $request->options ?? [],
            'min_value' => $request->min_value,
            'max_value' => $request->max_value,
            'file_types' => $request->file_types,
            'max_file_size' => $request->max_file_size,
        ]);

        return back()->with('success', "Campo '{$field->label}' actualizado exitosamente.");
    }

    /**
     * Eliminar un campo
     */
    public function destroyField(BusinessForm $businessForm, FormField $field)
    {
        // Verificar permisos
        if (!auth()->user()?->can('gestor-formularios-editar')) {
            abort(403, 'No tienes permisos para editar formularios.');
        }

        // Verificar scope
        if (!$this->canAccessBusiness($businessForm->business_id)) {
            abort(403, 'No tienes acceso a este formulario.');
        }

        $fieldName = $field->label;
        $field->delete();

        return back()->with('success', "Campo '{$fieldName}' eliminado exitosamente.");
    }

    /**
     * Almacenar una nueva sección
     */
    public function storeSection(Request $request, BusinessForm $businessForm)
    {
        // Verificar permisos
        if (!auth()->user()?->can('gestor-formularios-editar')) {
            abort(403, 'No tienes permisos para editar formularios.');
        }

        // Verificar scope
        if (!$this->canAccessBusiness($businessForm->business_id)) {
            abort(403, 'No tienes acceso a este formulario.');
        }

        // Validación básica
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
        ]);

        $section = FormSection::create([
            'business_form_id' => $businessForm->id,
            'name' => $request->name,
            'description' => $request->description,
            'is_active' => $request->is_active ?? true,
            'order_index' => FormSection::where('business_form_id', $businessForm->id)->max('order_index') + 1,
        ]);

        return back()->with('success', "Sección '{$section->name}' creada exitosamente.");
    }

    /**
     * Actualizar una sección
     */
    public function updateSection(Request $request, BusinessForm $businessForm, FormSection $section)
    {
        // Verificar permisos
        if (!auth()->user()?->can('gestor-formularios-editar')) {
            abort(403, 'No tienes permisos para editar formularios.');
        }

        // Verificar scope
        if (!$this->canAccessBusiness($businessForm->business_id)) {
            abort(403, 'No tienes acceso a este formulario.');
        }

        // Validación básica
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
        ]);

        $section->update([
            'name' => $request->name,
            'description' => $request->description,
            'is_active' => $request->is_active ?? true,
        ]);

        return back()->with('success', "Sección '{$section->name}' actualizada exitosamente.");
    }

    /**
     * Eliminar una sección
     */
    public function destroySection(BusinessForm $businessForm, FormSection $section)
    {
        // Verificar permisos
        if (!auth()->user()?->can('gestor-formularios-editar')) {
            abort(403, 'No tienes permisos para editar formularios.');
        }

        // Verificar scope
        if (!$this->canAccessBusiness($businessForm->business_id)) {
            abort(403, 'No tienes acceso a este formulario.');
        }

        $sectionName = $section->name;
        $section->delete();

        return back()->with('success', "Sección '{$sectionName}' eliminada exitosamente.");
    }
}
