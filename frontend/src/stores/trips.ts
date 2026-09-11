import { computed, reactive, ref } from 'vue'
import { tripsApi, type Trip } from '../lib/api'

function createTripsStore() {
  const trips = ref<Trip[]>([])
  const trash = ref<Trip[]>([])
  const pending = ref(0)
  const loading = computed(() => pending.value > 0)

  // Counts in-flight fetches so parallel ones don't hide each other's indicator.
  async function track<T>(request: Promise<T>): Promise<T> {
    pending.value++
    try {
      return await request
    } finally {
      pending.value--
    }
  }

  async function fetchAll() {
    trips.value = await track(tripsApi.getAll())
  }

  async function fetchTrash() {
    trash.value = await track(tripsApi.getTrash())
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
    trips.value.unshift(newTrip)
    return newTrip.id
  }

  return { trips, trash, loading, fetchAll, fetchTrash, remove, restore, permanentDelete, duplicate }
}

// One shared instance for the app; reactive() unwraps the refs just like Pinia did.
const store = reactive(createTripsStore())

export const useTripsStore = () => store
