import { HealthResponse, Repository, FileNode, AnalysisJob } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // Ignore JSON parse errors
    }
    throw new ApiError(response.status, errorMessage);
  }

  return response.json();
}

export const api = {
  checkHealth: () => fetchApi<HealthResponse>('/health'),
  
  analyzeRepository: (githubUrl: string) => 
    fetchApi<Repository>('/api/repositories/analyze', {
      method: 'POST',
      body: JSON.stringify({ github_url: githubUrl }),
    }),
    
  getRepositories: () => fetchApi<any>('/api/repositories'),
  
  getRepository: (id: string) => fetchApi<Repository>(`/api/repositories/${id}`),
  
  getRepositoryFiles: (id: string) => fetchApi<FileNode[]>(`/api/repositories/${id}/files`),
  
  getJobForRepo: (repoId: string) => fetchApi<AnalysisJob>(`/api/jobs/repo/${repoId}`),
  
  getChatHistory: (repoId: string) => fetchApi<any[]>(`/api/repositories/${repoId}/chat/history`),
  
  chatWithRepo: (repoId: string, message: string) => fetchApi<any>(`/api/chat`, {
    method: 'POST',
    body: JSON.stringify({ repo_id: repoId, message }),
  }),
};
