import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import zonesService from '@/services/endpoints/zones'
import medicinesService from '@/services/endpoints/medicines'
import type { Zone, Medicine } from '@/types'

export const useLookupsStore = defineStore('lookups', () => {
  const zones = ref<Zone[]>([])
  const medicines = ref<Medicine[]>([])
  const loaded = ref(false)
  const loading = ref(false)

  const zoneNameById = computed(() => {
    const map = new Map<number, string>()
    for (const zone of zones.value) {
      map.set(zone.id, zone.name)
    }
    return map
  })

  const medicineNameById = computed(() => {
    const map = new Map<number, string>()
    for (const medicine of medicines.value) {
      map.set(medicine.id, medicine.name)
    }
    return map
  })

  async function ensureLoaded(force = false): Promise<void> {
    if (loaded.value && !force) return
    if (loading.value) return

    loading.value = true
    try {
      const [zonesResponse, medicinesResponse] = await Promise.all([
        zonesService.getAll(),
        medicinesService.getAll(),
      ])

      zones.value = Array.isArray(zonesResponse) ? zonesResponse : []
      medicines.value = Array.isArray(medicinesResponse) ? medicinesResponse : []
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  return {
    zones,
    medicines,
    loaded,
    loading,
    zoneNameById,
    medicineNameById,
    ensureLoaded,
  }
})

