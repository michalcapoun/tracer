import { defineStore } from 'pinia'
import { ref } from 'vue'
import { tripsApi, type Trip } from '../lib/api'

export const useTripsStore = defineStore('trips', () => {
  const trips = ref<Trip[]>([])
  const trash = ref<Trip[]>([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    trips.value = await tripsApi.getAll()
    loading.value = false
  }

  async function fetchTrash() {
    loading.value = true
    trash.value = await tripsApi.getTrash()
    loading.value = false
  }

  async function remove(id: string) {
    const deletedAt = new Date().toISOString()
    await tripsApi.delete(id)
    const trip = trips.value.find((t) => t.id === id)
    if (trip) {
      trash.value.unshift({ ...trip, deleted_at: deletedAt })
    }
    trips.value = trips.value.filter((t) => t.id !== id)
  }

  async function restore(id: string) {
    await tripsApi.restore(id)
    trash.value = trash.value.filter((t) => t.id !== id)
  }

  async function permanentDelete(id: string) {
    await tripsApi.permanentDelete(id)
    trash.value = trash.value.filter((t) => t.id !== id)
  }

  async function duplicate(id: string): Promise<string | undefined> {
    const original = trips.value.find((t) => t.id === id)
    if (!original) return
    const newTrip = await tripsApi.create({
      name: `${original.name.replace(/ \(kopie\)$/, '')} (kopie)`.slice(0, 50),
      mapy_link: original.mapy_link,
      date: original.date,
      total_distance_km: original.total_distance_km,
    })
    await fetchAll()
    return newTrip.id
  }

  return { trips, trash, loading, fetchAll, fetchTrash, remove, restore, permanentDelete, duplicate }
})
