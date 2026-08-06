'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { IngestedDataset, DataRow, ColumnType, DataSchema } from '@/lib/types';

interface WorkspaceContextProps {
  datasetId: string | null;
  dataset: IngestedDataset | null;
  setDataset: (dataset: IngestedDataset | null) => void;
  rawRows: DataRow[];
  setRawRows: (rows: DataRow[]) => void;
  cleanedRows: DataRow[];
  setCleanedRows: (rows: DataRow[]) => void;
  headers: string[];
  setHeaders: (headers: string[]) => void;
  types: Record<string, ColumnType>;
  setTypes: (types: Record<string, ColumnType>) => void;
  schema: DataSchema[];
  setSchema: (schema: DataSchema[]) => void;
  appliedOps: Set<string>;
  setAppliedOps: (ops: Set<string>) => void;
  userRole: 'admin' | 'de' | 'da' | 'bi' | 'ml';
  setUserRole: (role: 'admin' | 'de' | 'da' | 'bi' | 'ml') => void;
  loading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextProps | undefined>(undefined);

export function WorkspaceProvider({ children, initialDatasetId }: { children: React.ReactNode, initialDatasetId: string }) {
  const [datasetId, setDatasetId] = useState<string | null>(initialDatasetId);
  const [dataset, setDataset] = useState<IngestedDataset | null>(null);
  const [rawRows, setRawRows] = useState<DataRow[]>([]);
  const [cleanedRows, setCleanedRows] = useState<DataRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [types, setTypes] = useState<Record<string, ColumnType>>({});
  const [schema, setSchema] = useState<DataSchema[]>([]);
  const [appliedOps, setAppliedOps] = useState<Set<string>>(new Set());
  const [userRole, setUserRole] = useState<'admin' | 'de' | 'da' | 'bi' | 'ml'>('admin');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDataset() {
      if (!initialDatasetId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/datasets/${initialDatasetId}`);
        if (res.ok) {
          const data = await res.json();
          setDataset(data);
          setRawRows(data.rows || []);
          setCleanedRows(data.rows || []);
          setHeaders(data.headers || []);
          setTypes(data.types || {});
          setSchema(data.schema || []);
          setAppliedOps(new Set(data.appliedOps || []));
        }
      } catch (err) {
        console.error('Failed to load dataset:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDataset();
  }, [initialDatasetId]);

  return (
    <WorkspaceContext.Provider value={{
      datasetId, dataset, setDataset,
      rawRows, setRawRows,
      cleanedRows, setCleanedRows,
      headers, setHeaders,
      types, setTypes,
      schema, setSchema,
      appliedOps, setAppliedOps,
      userRole, setUserRole,
      loading
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
