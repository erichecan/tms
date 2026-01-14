
import React from 'react';
import { useTranslation } from 'react-i18next';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    className?: string;
    style?: React.CSSProperties;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    className,
    style
}) => {
    const { t } = useTranslation();

    // Helper to generate page numbers with ellipsis
    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            // Calculate start and end of current range
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);

            // Adjust if at the beginning
            if (currentPage <= 3) {
                end = 4;
            }

            // Adjust if at the end
            if (currentPage >= totalPages - 2) {
                start = totalPages - 3;
            }

            // Add ellipsis before start if needed
            if (start > 2) {
                pages.push('...');
            }

            // Add pages in range
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            // Add ellipsis after end if needed
            if (end < totalPages - 1) {
                pages.push('...');
            }

            // Always show last page
            pages.push(totalPages);
        }

        return pages;
    };

    if (totalItems === 0) return null;

    return (
        <div
            className={`pagination-container ${className || ''}`}
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '32px',
                padding: '0 8px',
                ...style
            }}
        >
            <div style={{ color: 'var(--slate-500)', fontSize: '13px', fontWeight: 600 }}>
                {t('common.pagination.showing', {
                    start: Math.min((currentPage - 1) * pageSize + 1, totalItems),
                    end: Math.min(currentPage * pageSize, totalItems),
                    total: totalItems
                })}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
                <button
                    onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className={`btn-secondary ${currentPage === 1 ? 'opacity-50 pointer-events-none' : ''}`}
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                    {t('common.pagination.previous')}
                </button>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {getPageNumbers().map((page, i) => (
                        <button
                            key={i}
                            onClick={() => typeof page === 'number' ? onPageChange(page) : undefined}
                            disabled={typeof page !== 'number'}
                            style={{
                                width: '36px', height: '36px', borderRadius: '10px', border: 'none',
                                cursor: typeof page === 'number' ? 'pointer' : 'default',
                                background: currentPage === page ? 'var(--primary-grad)' : 'var(--slate-100)',
                                color: currentPage === page ? 'white' : 'var(--slate-600)',
                                fontWeight: 700, fontSize: '13px', transition: 'all 0.2s',
                                opacity: typeof page !== 'number' ? 0.5 : 1
                            }}
                        >
                            {page}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`btn-secondary ${currentPage === totalPages ? 'opacity-50 pointer-events-none' : ''}`}
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                    {t('common.pagination.next')}
                </button>
            </div>
        </div>
    );
};
