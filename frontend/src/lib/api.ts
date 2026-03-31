import { supabase } from './supabase'

export interface Waypoint {
  id?: string
  trip_id?: string
  name: string
  lat: number
  lng: number
  order: number
  visited?: boolean
  visited_at?: string
}

export interface Trip {
  id: string
  name: string
  description?: string
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

  create: async (payload: { name: string; description?: string; waypoints: Omit<Waypoint, 'id' | 'trip_id'>[] }): Promise<Trip> => {
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({ name: payload.name, description: payload.description })
      .select()
      .single()
    if (tripError) throw tripError

    const { error: wpError } = await supabase
      .from('waypoints')
      .insert(payload.waypoints.map((w) => ({ ...w, trip_id: trip.id })))
    if (wpError) throw wpError

    return trip
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
