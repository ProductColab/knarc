import { useState, useCallback } from 'react';
import { insertJsonData, createTableFromJson } from '../utils/ingest';

interface IngestOptions {
  table: string;
  schema?: string;
  replace?: boolean;
  createIfNotExists?: boolean;
}

interface UseIngestResult {
  ingest: <T extends object>(data: T | T[], options: IngestOptions) => Promise<void>;
  createTable: <T extends object>(data: T | T[], options: IngestOptions) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export function useIngest(): UseIngestResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const ingest = useCallback(async <T extends object>(
    data: T | T[],
    options: IngestOptions
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      await insertJsonData(data, options);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTable = useCallback(async <T extends object>(
    data: T | T[],
    options: IngestOptions
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      await createTableFromJson(data, options);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    ingest,
    createTable,
    isLoading,
    error
  };
}
