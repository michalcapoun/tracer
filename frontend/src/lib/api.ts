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

export const routeApi = {
  optimize: async (waypoints: Array<{ lat: number; lng: number; name: string }>) => {
    const { data, error } = await supabase.functions.invoke('route-proxy', {
      body: { waypoints },
    })
    if (error) throw error
    return data
  },
}
