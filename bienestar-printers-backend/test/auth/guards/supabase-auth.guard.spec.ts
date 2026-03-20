import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../../src/modules/users/users.service';

// Para mockear correctamente super.canActivate de una clase mixin en TypeScript,
// interceptamos la librería y sobreescribimos la factoría dinámicamente:
let mockAuthGuardResult = true;
jest.mock('@nestjs/passport', () => ({
  AuthGuard: () => {
    return class MockAuthGuard {
      async canActivate() {
        return mockAuthGuardResult;
      }
    };
  },
}));

import { SupabaseAuthGuard } from '../../../src/auth/guards/supabase-auth.guard';

describe('SupabaseAuthGuard', () => {
  let guard: SupabaseAuthGuard;
  let mockUsersService: any;
  let mockContext: ExecutionContext;
  let mockRequest: any;

  beforeEach(() => {
    mockAuthGuardResult = true; // Reiniciar mock para tests normales

    mockUsersService = {
      findBySupabaseUserId: jest.fn(),
    };

    guard = new SupabaseAuthGuard(mockUsersService);

    mockRequest = { user: null };
    mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('debería arrojar Unauthorized si el JWT interno falla (Passport block)', async () => {
    // Rompemos a propósito la validación base obligando al mock a retornar falso
    mockAuthGuardResult = false;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('debería arrojar "Email is required" o "Invalid Supabase token" si la data del token viene incompleta', async () => {
    mockRequest.user = { sub: 'auth-123' }; // falta email
    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      'Email is required',
    );

    mockRequest.user = { email: 'admin@smiab.com' }; // falta sub
    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      'Invalid Supabase token',
    );
  });

  it('debería arrojar error si el usuario no existe en SAI (Comprobación de Hard Delete)', async () => {
    mockRequest.user = { sub: 'auth-123', email: 'admin@smiab.com' };

    // Devolvemos NULL indicando que la cuenta central SAI fue eliminada o no sincronizada
    mockUsersService.findBySupabaseUserId.mockResolvedValue(null);

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      'El usuario no existe en el sistema central SAI',
    );
  });

  it('debería inyectar "internal", "areaId" y "unitId" al request.user permitiendo el acceso si todo es válido', async () => {
    const supabaseUser = { sub: 'auth-123', email: 'admin@smiab.com' };
    const internalUser = {
      id: 1,
      department_id: 'dep-99',
      unit_id: 'unit-55',
      region_id: 'reg-01',
    };

    // Alistamos el request simulado
    mockRequest.user = supabaseUser;

    mockUsersService.findBySupabaseUserId.mockResolvedValue(internalUser);

    const result = await guard.canActivate(mockContext);

    // Debe dejar pasar la conexión
    expect(result).toBe(true);

    // El request final debe tener mapeado el contrato de datos normalizado
    expect(mockRequest.user.internal).toBe(internalUser);
    expect(mockRequest.user.areaId).toBe('dep-99'); // Prioriza department_id respecto a unit_id
    expect(mockRequest.user.unitId).toBe('unit-55');
  });
});
