// Types shared between main (backend) and renderer (frontend) for project I/O.

export interface SaveResult {
  path?: string;
  canceled?: boolean;
}

export interface OpenResult {
  path: string;
  json: string;
}
