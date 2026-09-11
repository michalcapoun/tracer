import { supabase } from './supabase'

export interface Trip {
  id: string
  name: string
  date?: string | null
  total_distance_km?: number | null
  mapy_link?: string | null
  created_at: string
  deleted_at?: string | null
}

export interface TripForm {
  name: string
  date: string
  total_distance_km: number | ''
  mapy_link: string
}

// Dated today or earlier = history; undated or future = planned.
export function isPast(date?: string | null): boolean {
  return !!date && date <= new Date().toISOString().slice(0, 10)
}

export function isMapyLink(value: string): boolean {
  if (!value.trim()) return true
  try {
    const host = new URL(value.trim()).hostname
    return host.endsWith('mapy.cz') || host.endsWith('mapy.com')
  } catch {
    return false
  }
}

export function toTripPayload(form: TripForm) {
  return {
    name: form.name.trim(),
    date: form.date || null,
    total_distance_km: form.total_distance_km !== '' ? +form.total_distance_km : null,
    mapy_link: form.mapy_link.trim() || null,
  }
}

export const tripsApi = {
  getAll: async (): Promise<Trip[]> => {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  getTrash: async (): Promise<Trip[]> => {
    const expiry = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .not('deleted_at', 'is', null)
      .gte('deleted_at', expiry)
      .order('deleted_at', { ascending: false })
    if (error) throw error
    return data
  },

  getById: async (id: string): Promise<Trip> => {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  create: async (payload: {
    name: string
    date?: string | null
    total_distance_km?: number | null
    mapy_link?: string | null
  }): Promise<Trip> => {
    const { data: trip, error } = await supabase
      .from('trips')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return trip
  },

  update: async (id: string, payload: Partial<Omit<Trip, 'id' | 'created_at'>>): Promise<void> => {
    const { error } = await supabase.from('trips').update(payload).eq('id', id)
    if (error) throw error
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('trips').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
  },

  restore: async (id: string): Promise<void> => {
    const { error } = await supabase.from('trips').update({ deleted_at: null }).eq('id', id)
    if (error) throw error
  },

  permanentDelete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('trips').delete().eq('id', id)
    if (error) throw error
  },
}
