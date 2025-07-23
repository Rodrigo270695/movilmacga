import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-react';

interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface PaginationProps {
    data: PaginationData;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
}

export function Pagination({ data, onPageChange, onPerPageChange }: PaginationProps) {
    const { current_page, last_page, per_page, total, from, to } = data;

    const getVisiblePages = () => {
        const pages = [];
        const maxVisible = 5; // Máximo de páginas visibles en mobile
        const sidePages = Math.floor(maxVisible / 2);

        let start = Math.max(1, current_page - sidePages);
        let end = Math.min(last_page, current_page + sidePages);

        // Ajustar si estamos cerca del inicio o final
        if (current_page <= sidePages) {
            end = Math.min(last_page, maxVisible);
        }
        if (current_page >= last_page - sidePages) {
            start = Math.max(1, last_page - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        return pages;
    };

    const visiblePages = getVisiblePages();

    if (last_page <= 1) {
        return null; // No mostrar paginación si solo hay una página
    }

    return (
        <div className="border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                
                {/* Información de resultados */}
                <div className="flex items-center justify-center sm:justify-start">
                    <p className="text-xs sm:text-sm text-gray-700">
                        Mostrando <span className="font-medium">{from || 0}</span> a{' '}
                        <span className="font-medium">{to || 0}</span> de{' '}
                        <span className="font-medium">{total}</span> resultados
                    </p>
                </div>

                {/* Controles de paginación */}
                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    
                    {/* Selector de elementos por página */}
                    <div className="flex items-center space-x-2">
                        <span className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">Por página:</span>
                        <Select value={per_page.toString()} onValueChange={(value) => onPerPageChange(parseInt(value))}>
                            <SelectTrigger className="w-16 h-8 cursor-pointer">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5" className="cursor-pointer">5</SelectItem>
                                <SelectItem value="10" className="cursor-pointer">10</SelectItem>
                                <SelectItem value="25" className="cursor-pointer">25</SelectItem>
                                <SelectItem value="50" className="cursor-pointer">50</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Navegación de páginas */}
                    <div className="flex items-center space-x-1">
                        
                        {/* Primera página */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(1)}
                            disabled={current_page === 1}
                            className="h-8 w-8 p-0 hidden sm:flex cursor-pointer"
                            title="Primera página"
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>

                        {/* Página anterior */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(current_page - 1)}
                            disabled={current_page === 1}
                            className="h-8 w-8 p-0 cursor-pointer"
                            title="Página anterior"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {/* Mostrar "..." si hay páginas saltadas al inicio */}
                        {visiblePages[0] > 1 && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onPageChange(1)}
                                    className="h-8 w-8 p-0 hidden sm:flex cursor-pointer"
                                >
                                    1
                                </Button>
                                {visiblePages[0] > 2 && (
                                    <span className="hidden sm:flex h-8 w-8 items-center justify-center">
                                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                    </span>
                                )}
                            </>
                        )}

                        {/* Páginas visibles */}
                        {visiblePages.map((page) => (
                            <Button
                                key={page}
                                variant={page === current_page ? "default" : "outline"}
                                size="sm"
                                onClick={() => onPageChange(page)}
                                className={`h-8 w-8 p-0 cursor-pointer ${
                                    page === current_page 
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
                                        : ''
                                }`}
                            >
                                {page}
                            </Button>
                        ))}

                        {/* Mostrar "..." si hay páginas saltadas al final */}
                        {visiblePages[visiblePages.length - 1] < last_page && (
                            <>
                                {visiblePages[visiblePages.length - 1] < last_page - 1 && (
                                    <span className="hidden sm:flex h-8 w-8 items-center justify-center">
                                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                    </span>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onPageChange(last_page)}
                                    className="h-8 w-8 p-0 hidden sm:flex cursor-pointer"
                                >
                                    {last_page}
                                </Button>
                            </>
                        )}

                        {/* Página siguiente */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(current_page + 1)}
                            disabled={current_page === last_page}
                            className="h-8 w-8 p-0 cursor-pointer"
                            title="Página siguiente"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>

                        {/* Última página */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(last_page)}
                            disabled={current_page === last_page}
                            className="h-8 w-8 p-0 hidden sm:flex cursor-pointer"
                            title="Última página"
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Información de página actual (solo móvil) */}
                    <div className="flex sm:hidden">
                        <span className="text-xs text-gray-500">
                            Página {current_page} de {last_page}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
