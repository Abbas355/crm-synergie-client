import React from "react";
import {
  Table,
  TableBody,
  TableCell as UITableCell,
  TableHead as UITableHead,
  TableHeader as UITableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStatusInfo } from "@/components/clients/client-status-select";

// Composant de ligne avec couleur en fonction du statut
export const StatusTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { status?: string }
>(({ className, status = "nouveau", ...props }, ref) => {
  const statusInfo = getStatusInfo(status);
  const baseRowClass = "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors";
  const colorClass = statusInfo?.color || "bg-white";
  
  return (
    <TableRow
      ref={ref}
      className={`${baseRowClass} ${colorClass} ${className}`}
      {...props}
    />
  );
});
StatusTableRow.displayName = "StatusTableRow";

// Composants de cellule avec statut
export const StatusTableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>((props, ref) => {
  return <UITableCell ref={ref} {...props} />;
});
StatusTableCell.displayName = "StatusTableCell";

// Composant d'en-tête de tableau avec statut
export const StatusTableHeader = UITableHeader;

// Composant de cellule d'en-tête avec statut
export const StatusTableHeaderCell = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>((props, ref) => {
  return <UITableHead ref={ref} {...props} />;
});
StatusTableHeaderCell.displayName = "StatusTableHeaderCell";

// Types pour le tableau avec statuts
interface StatusTableProps<T> {
  columns: {
    header: string;
    accessorKey: keyof T | ((row: T) => React.ReactNode);
    className?: string;
  }[];
  data: T[];
  getRowStatus: (row: T) => string;
  onRowClick?: (row: T) => void;
  getRowProps?: (row: T) => any;
  emptyMessage?: string;
}

// Composant de tableau avec statuts
export function StatusTable<T extends { id?: number | string }>({
  columns,
  data,
  getRowStatus,
  onRowClick,
  getRowProps = () => ({}),
  emptyMessage = "Aucune donnée disponible."
}: StatusTableProps<T>) {
  return (
    <div className="relative w-full overflow-auto">
      <Table>
        <UITableHeader>
          <TableRow>
            {columns.map((column, idx) => (
              <UITableHead 
                key={idx} 
                className={column.className}
              >
                {column.header}
              </UITableHead>
            ))}
          </TableRow>
        </UITableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <UITableCell 
                colSpan={columns.length} 
                className="h-24 text-center text-gray-500"
              >
                {emptyMessage}
              </UITableCell>
            </TableRow>
          ) : (
            data.map((row, idx) => (
              <StatusTableRow
                key={row.id ?? idx}
                status={getRowStatus(row)}
                className={onRowClick ? "cursor-pointer" : ""}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                {...getRowProps(row)}
              >
                {columns.map((column, colIdx) => (
                  <UITableCell key={colIdx}>
                    {typeof column.accessorKey === "function"
                      ? column.accessorKey(row)
                      : row[column.accessorKey] as React.ReactNode}
                  </UITableCell>
                ))}
              </StatusTableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}