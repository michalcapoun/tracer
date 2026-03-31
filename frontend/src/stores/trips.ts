import { defineStore } from 'pinia'
import { ref } from 'vue'
import { tripsApi, type Trip } from '../lib/api'

export const useTripsStore = defineStore('trips', () => {
  const trips = ref<Trip[]>([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    trips.value = await tripsApi.getAll()
    loading.value = false
  }

  async function remove(id: string) {
    await tripsApi.delete(id)
    trips.value = trips.value.filter((t) => t.id !== id)
  }

  async function duplicate(id: string) {
    const original = trips.value.find((t) => t.id === id)
    if (!original) return
    await tripsApi.create({
      name: original.name,
      description: original.description,
      waypoints: original.waypoints.map(({ name, lat, lng, order, distance_to_next_km, notes, mapy_place_id }) => ({
        name, lat, lng, order, distance_to_next_km, notes, mapy_place_id,
      })),
    })
    await fetchAll()
  }

  return { trips, loading, fetchAll, remove, duplicate }
})
