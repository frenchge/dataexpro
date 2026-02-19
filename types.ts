
export interface ColumnDefinition {
  id: string;
  header: string;
}

export interface ExtractionRecord {
  id: string;
  [key: string]: string | number;
}

export interface ExtractionSchema {
  columns: ColumnDefinition[];
}

export type ExtractionMode = 'pdf' | 'web' | 'text';

export interface SyncSettings {
  enabled: boolean;
  webhookUrl: string;
  convexUrl?: string;
  convexEnabled?: boolean;
}

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface AppState {
  records: ExtractionRecord[];
  columns: ColumnDefinition[];
  isLoading: boolean;
  error: string | null;
  syncSettings: SyncSettings;
  syncStatus: SyncStatus;
  convexSyncStatus: SyncStatus;
}
