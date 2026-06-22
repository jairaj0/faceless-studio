// Types shared between main (backend) and renderer (frontend) for project I/O.

export interface SaveResult {
  path?: string;
  canceled?: boolean;
}

export interface OpenResult {
  path: string;
  json: string;
}

export interface RecoverySnapshot {
  savedAt: number; // epoch ms of the autosave
  name: string;
  json: string; // the serialized project file
}
