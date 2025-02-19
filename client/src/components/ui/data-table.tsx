import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  Row,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey: string
  carrierFilter?: {
    value: string
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
    options: { value: string; label: string }[]
  }
  dateFilter?: {
    startDate: string;
    endDate: string;
    onStartDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onEndDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  };
  statusFilter?: {
    value: string;
    onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { value: string; label: string }[];
  };
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  defaultSort,
  onRowClick,
  dateFilter,
  statusFilter,
  carrierFilter,
}: DataTableProps<TData, TValue>) {
  const [filtering, setFiltering] = useState("")
  const [sorting, setSorting] = useState<SortingState>(defaultSort || [])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter: filtering,
      sorting,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFiltering,
    enableSorting: true,
  })

  return (
    <div>
      <div className="flex items-center gap-4 py-4">
        {searchKey && (
          <Input
            placeholder={`Search ${searchKey}...`}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        )}
        {carrierFilter && (
          <select
            value={carrierFilter.value}
            onChange={carrierFilter.onChange}
            className="h-8 w-[200px] rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
          >
            {carrierFilter.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
        {dateFilter && (
          <>
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={dateFilter.onStartDateChange}
              className="h-10 px-3 py-2 bg-background border border-input rounded-md text-sm"
            />
            <span>to</span>
            <input
              type="date"
              value={dateFilter.endDate}
              onChange={dateFilter.onEndDateChange}
              className="h-10 px-3 py-2 bg-background border border-input rounded-md text-sm"
            />
          </>
        )}
        {statusFilter && (
          <select
            value={statusFilter.value}
            onChange={statusFilter.onChange}
            className="h-10 px-3 py-2 bg-background border border-input rounded-md text-sm"
          >
            {statusFilter.options.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead 
                      key={header.id}
                      className={header.column.getCanSort() ? "cursor-pointer select-none" : ""}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {{
                        desc: ' 🔼',
                        asc: ' 🔽',
                      }[header.column.getIsSorted() as string] ?? null}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow 
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? "cursor-pointer hover:bg-muted" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  )
}