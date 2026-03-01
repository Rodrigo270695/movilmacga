import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/components/ui/toast';
import { ConfirmToggleModal } from './confirm-toggle-modal';
import { ConfirmDeleteModal } from './confirm-delete-modal';
import {
    Folder,
    Edit,
    Power,
    CheckCircle2,
    XCircle,
    Search,
    X,
    Calendar,
    Contact,
    Filter,
    Trash2
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

interface Operator {
    id: number;
    name: string;
    description?: string | null;
    color?: string | null;
    status?: boolean;
    created_at: string;
}

interface PaginatedOperators {
    data: Operator[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface OperatorsTableProps {
    operators: PaginatedOperators;
    onEdit: (operator: Operator) => void;
    userPermissions: string[];
    filters?: { search?: string };
}

export function OperatorsTable({ operators, onEdit, userPermissions, filters }: OperatorsTableProps) {
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [confirmToggleOperator, setConfirmToggleOperator] = useState<Operator | null>(null);
    const [confirmDeleteOperator, setConfirmDeleteOperator] = useState<Operator | null>(null);
    const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

    const hasPermission = (permission: string): boolean => userPermissions.includes(permission);

    useEffect(() => {
        if (searchDebounce) clearTimeout(searchDebounce);
        const timeout = setTimeout(() => {
            router.get(route('dcs.operators.index'), { search: searchTerm || undefined, page: 1 }, { preserveState: true, preserveScroll: true, replace: true });
        }, 500);
        setSearchDebounce(timeout);
        return () => { if (timeout) clearTimeout(timeout); };
    }, [searchTerm]);

    const clearFilters = () => {
        setSearchTerm('');
        router.get(route('dcs.operators.index'), {}, { preserveState: true, preserveScroll: true });
    };

    const handleToggleStatus = (operator: Operator) => {
        if (!hasPermission('gestor-operador-cambiar-estado')) {
            addToast({ type: 'error', title: 'Sin permisos', message: 'No tienes permisos para cambiar el estado de operadores.', duration: 4000 });
            return;
        }
        setConfirmToggleOperator(operator);
    };

    const handleOpenDeleteModal = (operator: Operator) => {
        if (!hasPermission('gestor-operador-eliminar')) {
            addToast({ type: 'error', title: 'Sin permisos', message: 'No tienes permisos para eliminar operadores.', duration: 4000 });
            return;
        }
        setConfirmDeleteOperator(operator);
    };

    const handlePageChange = (page: number) => {
        router.get(route('dcs.operators.index'), { search: searchTerm || undefined, page, per_page: operators.per_page }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get(route('dcs.operators.index'), { search: searchTerm || undefined, page: 1, per_page: perPage }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const getStatusConfig = (status?: boolean) => {
        if (status === false) return { variant: 'secondary' as const, icon: XCircle, text: 'Inactivo', className: 'text-red-700 bg-red-50 border-red-200' };
        return { variant: 'secondary' as const, icon: CheckCircle2, text: 'Activo', className: 'text-green-700 bg-green-50 border-green-200' };
    };

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const OperatorActions = ({ operator }: { operator: Operator }) => (
        <>
            {hasPermission('gestor-operador-editar') && (
                <Button variant="outline" size="sm" onClick={() => onEdit(operator)} className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-200 cursor-pointer" title="Editar operador">
                    <Edit className="w-4 h-4 text-blue-600" />
                </Button>
            )}
            {hasPermission('gestor-operador-cambiar-estado') && (
                <Button variant="outline" size="sm" onClick={() => handleToggleStatus(operator)} className={`h-8 w-8 p-0 cursor-pointer ${operator.status === false ? 'hover:bg-green-50 hover:border-green-200' : 'hover:bg-red-50 hover:border-red-200'}`} title={operator.status === false ? 'Activar operador' : 'Desactivar operador'}>
                    <Power className={`w-4 h-4 ${operator.status === false ? 'text-green-600' : 'text-red-600'}`} />
                </Button>
            )}
            {hasPermission('gestor-operador-eliminar') && (
                <Button variant="outline" size="sm" onClick={() => handleOpenDeleteModal(operator)} className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200 cursor-pointer" title="Eliminar operador">
                    <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
            )}
        </>
    );

    const filteredOperators = operators.data;

    return (
        <>
            <Card className="bg-white border border-gray-200 shadow-sm">
                <div className="border-b border-gray-200 bg-gray-50/50 px-4 sm:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div className="flex items-center gap-3">
                            <Folder className="w-5 h-5 text-gray-600" />
                            <h3 className="text-base sm:text-lg font-medium text-gray-900">Operadores del Sistema</h3>
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
                                {searchTerm ? `${operators.total} filtrados` : `${operators.total} total`}
                            </Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input type="text" placeholder="Buscar por nombre o descripción..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm" />
                                {searchTerm && <button type="button" onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" title="Limpiar búsqueda"><X className="w-4 h-4" /></button>}
                            </div>
                            {searchTerm && <Button variant="outline" size="sm" onClick={clearFilters} className="text-xs hover:bg-gray-50 cursor-pointer flex-shrink-0" title="Limpiar filtros"><Filter className="w-3 h-3 mr-1" /> Limpiar</Button>}
                        </div>
                    </div>
                </div>

                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Operador</th>
                                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Creación</th>
                                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredOperators.map((operator) => {
                                const statusConfig = getStatusConfig(operator.status);
                                return (
                                    <tr key={operator.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                                                    <Contact className="w-5 h-5 text-sky-600" />
                                                </div>
                                                <div className="text-sm font-medium text-gray-900">{operator.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div
                                                className="w-8 h-8 rounded-full border border-gray-300 inline-block"
                                                style={{ backgroundColor: operator.color || '#6366f1' }}
                                                title={operator.color || ''}
                                            />
                                        </td>
                                        <td className="px-6 py-4"><div className="text-sm text-gray-600 max-w-xs truncate" title={operator.description || ''}>{operator.description || '—'}</div></td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge className={statusConfig.className}><statusConfig.icon className="w-3 h-3 mr-1" />{statusConfig.text}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1 text-sm text-gray-900"><Calendar className="w-3 h-3 text-gray-400" />{formatDate(operator.created_at)}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-1"><OperatorActions operator={operator} /></div></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="sm:hidden divide-y divide-gray-200">
                    {filteredOperators.map((operator) => {
                        const statusConfig = getStatusConfig(operator.status);
                        return (
                            <div key={operator.id} className="p-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0"><Contact className="w-5 h-5 text-sky-600" /></div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-900 truncate">{operator.name}</h4>
                                                <p className="text-xs text-gray-500 truncate">{operator.description || 'Sin descripción'}</p>
                                            </div>
                                            <div
                                                className="w-7 h-7 rounded-full border border-gray-300 flex-shrink-0"
                                                style={{ backgroundColor: operator.color || '#6366f1' }}
                                                title={operator.color || ''}
                                            />
                                        </div>
                                        <Badge className={`${statusConfig.className} flex-shrink-0`}><statusConfig.icon className="w-3 h-3 mr-1" />{statusConfig.text}</Badge>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-500"><Calendar className="w-3 h-3" /> Creado: {formatDate(operator.created_at)}</div>
                                    <div className="flex items-center justify-end gap-1 pt-2 border-t border-gray-100"><OperatorActions operator={operator} /></div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredOperators.length === 0 && (
                    <div className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center"><Folder className="w-8 h-8 text-gray-400" /></div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">{searchTerm ? 'No se encontraron resultados' : 'No hay operadores'}</h3>
                                <p className="text-gray-500 text-sm">{searchTerm ? 'Intenta con otros términos de búsqueda' : 'Crea un nuevo operador para comenzar'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {operators.last_page > 1 && <Pagination data={operators} onPageChange={handlePageChange} onPerPageChange={handlePerPageChange} />}
            </Card>

            <ConfirmToggleModal isOpen={!!confirmToggleOperator} onClose={() => setConfirmToggleOperator(null)} operator={confirmToggleOperator} />
            <ConfirmDeleteModal isOpen={!!confirmDeleteOperator} onClose={() => setConfirmDeleteOperator(null)} operator={confirmDeleteOperator} />
        </>
    );
}
