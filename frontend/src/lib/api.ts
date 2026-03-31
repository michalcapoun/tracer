import { supabase } from './supabase'

export interface Waypoint {
  id?: string
  trip_id?: string
  name: string
  lat: number
  lng: number
  order: number
  distance_to_next_km?: number | null
  notes?: string | null
  mapy_place_id?: string | null
}

export interface Trip {
  id: string
  name: string
  description?: string | null
  date?: string | null
  total_distance_km?: number | null
  total_duration_min?: number | null
  created_at: string
  waypoints: Waypoint[]
}

export const tripsApi = {
  getAll: async (): Promise<Trip[]> => {
    const { data, error } = await supabase
      .from('trips')
      .select('*, waypoints(*)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  getById: async (id: string): Promise<Trip> => {
    const { data, error } = await supabase
      .from('trips')
      .select('*, waypoints(*)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  create: async (payload: {
    name: string
    description?: string | null
    date?: string | null
    total_distance_km?: number | null
    total_duration_min?: number | null
    waypoints: Omit<Waypoint, 'id' | 'trip_id'>[]
  }): Promise<Trip> => {
    const { waypoints, ...tripData } = payload

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert(tripData)
      .select()
      .single()
    if (tripError) throw tripError

    if (waypoints.length > 0) {
      const { error: wpError } = await supabase
        .from('waypoints')
        .insert(waypoints.map((w) => ({ ...w, trip_id: trip.id })))
      if (wpError) throw wpError
    }

    return trip
  },

  update: async (id: string, payload: Partial<Omit<Trip, 'id' | 'created_at' | 'waypoints'>>): Promise<void> => {
    const { error } = await supabase.from('trips').update(payload).eq('id', id)
    if (error) throw error
  },

  delete: async (id: string): Promise<void> => {
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
