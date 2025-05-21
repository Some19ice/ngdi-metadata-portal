"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
// We'll create this toolbar component later if needed for global filtering.
// import { DataTableToolbar } from "@/components/ui/data-table-toolbar"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  // Server-side pagination props
  pageCount?: number // Total number of pages
  rowCount?: number // Total number of rows
  currentPage?: number // Current page (1-indexed)
  pageSize?: number // Rows per page
  onPageChange?: (page: number) => void // Callback for page changes
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  pageCount,
  rowCount,
  currentPage,
  pageSize,
  onPageChange
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination: pageCount // If server-side, pagination state is managed outside
        ? {
            pageIndex: currentPage ? currentPage - 1 : 0, // react-table is 0-indexed
            pageSize: pageSize || 10
          }
        : undefined
    },
    manualPagination: !!pageCount, // Enable manual pagination if pageCount is provided
    manualSorting: true, // Always true for server-side sorting via column headers
    pageCount: pageCount, // Pass pageCount for server-side pagination
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(), // Keep for client-side if server-side fails or mixed mode
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues()
  })

  // When server-side pagination is active, table.setPageIndex will call onPageChange
  React.useEffect(() => {
    if (
      onPageChange &&
      typeof table.getState().pagination.pageIndex === "number" &&
      currentPage
    ) {
      // This effect is to sync the URL-driven currentPage to the table's internal state if needed
      // However, with manualPagination, direct calls to onPageChange are preferred.
      // Let's adjust DataTablePagination to call onPageChange directly.
    }
  }, [table.getState().pagination.pageIndex, onPageChange, currentPage])

  return (
    <div className="space-y-4">
      {/* {showToolbar && searchKey && (
        <DataTableToolbar table={table} searchKey={searchKey} />
      )} */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {pageCount && onPageChange && (
        <DataTablePagination
          table={table}
          onPageChange={onPageChange}
          currentPage={currentPage}
        />
      )}
    </div>
  )
}
