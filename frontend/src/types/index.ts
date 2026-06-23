export interface HealthResponse {
  status: string;
  version: string;
  database: string;
  redis: string;
  timestamp: string;
}

export interface Repository {
  id: string;
  name: string;
  github_url: string;
  branch: string;
  commit_hash?: string;
  status: 'QUEUED' | 'PROCESSING' | 'READY' | 'FAILED';
  primary_language?: string;
  total_files: number;
  total_lines: number;
  language_stats?: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface AnalysisJob {
  id: string;
  repo_id: string;
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  current_step?: string;
  progress_percentage: number;
  error_message?: string;
  files_scanned: number;
  files_ignored: number;
  secrets_skipped: number;
  languages_detected: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface FileNode {
  id: string;
  repo_id: string;
  path: string;
  language?: string;
  size_bytes: number;
  line_count: number;
  is_indexed: boolean;
  created_at: string;
}
