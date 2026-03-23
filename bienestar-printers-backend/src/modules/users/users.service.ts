import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service';

import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

/**
 * @class UsersService
 * @description Servicio encargado de la gestión de usuarios y su vinculación con Supabase Auth.
 * Proporciona métodos para buscar identidades internas basadas en el ID único de Supabase.
 */
@Injectable()
export class UsersService {
  constructor(private readonly supabase: SupabaseService) { }

  /**
   * @method findBySupabaseUserId
   * @description Busca un usuario en la tabla 'public.users' utilizando su ID de Supabase.
   * Utiliza el Admin Client para ignorar políticas RLS, ya que la gestión de usuarios es externa (SAI).
   * 
   * @param {string} supabaseUserId - El ID de usuario (sub) proporcionado por Supabase Auth.
   * @returns {Promise<any | null>} El registro del usuario o null si no existe.
   * @throws Error si ocurre un fallo inesperado en la base de datos (excluyendo 'No encontrado').
   */
  async findBySupabaseUserId(supabaseUserId: string) {

    const client = this.supabase.getAdminClient();

    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('supabase_user_id', supabaseUserId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data ?? null;
  }

  /**
   * @method createFromSupabase
   * @description Registra un nuevo usuario en la base de datos interna a partir de un payload de Supabase.
   * Nota: Este método se mantiene por compatibilidad, aunque la política actual prefiere la gestión centralizada en SAI.
   * 
   * @param {Object} payload - Datos básicos del usuario.
   * @param {string} payload.supabaseUserId - ID del proveedor de identidad.
   * @param {string} payload.email - Correo electrónico institucional.
   * @param {number} [payload.areaId] - ID opcional de la unidad/área inicial.
   * @returns {Promise<any>} El registro creado.
   */
  async createFromSupabase(payload: {
    supabaseUserId: string;
    email: string;
    areaId?: number;
  }) {
    const client = this.supabase.getAdminClient();

    const { data, error } = await client
      .from('users')
      .insert({
        supabase_user_id: payload.supabaseUserId,
        email: payload.email,
        role: 'user',
        unit_id: payload.areaId ?? null, // Map legacy areaId to unit_id for now
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}
