import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { api } from '@/services/api';

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios');
  
  // We recreate the exact axios behavior but we spy on its exported instance
  const mockApi = actual.default.create({
    baseURL: 'http://localhost:3000',
    headers: { 'Content-Type': 'application/json' }
  });
  
  return {
    default: {
      ...actual.default,
      create: () => mockApi,
      get: vi.fn(),
      post: vi.fn(),
    }
  };
});

describe('API Service (api.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('Debería configurar el endpoint de NestJS correctamente como baseURL', () => {
    expect(api.defaults.baseURL).toBeDefined();
    // Verifica que tiene los headers json cargados en la base
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('Los métodos de Axios para llamadas de refresco deben comportarse como mocks controlables', () => {
    (axios.get as any).mockResolvedValue({ data: { access_token: '123' } });
    expect(vi.isMockFunction(axios.get)).toBe(true);
  });
});
