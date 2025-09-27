import type { PropsWithChildren, ReactNode } from 'react';
import './table.css';

interface TableProps {
  emptyState?: ReactNode;
  columns: string[];
}

export const Table = ({ columns, emptyState, children }: PropsWithChildren<TableProps>) => (
  <div className="ui-table__wrapper">
    <table className="ui-table">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column} scope="col">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {children ? children : <tr><td colSpan={columns.length}>{emptyState}</td></tr>}
      </tbody>
    </table>
  </div>
);
