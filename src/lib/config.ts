export const isApiMode = () => (import.meta as any).env?.VITE_DATA_MODE === 'api';
export const apiBaseUrl = () => (import.meta as any).env?.VITE_API_BASE_URL || '/api';
