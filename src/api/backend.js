/* Backend API client for Frontend-map-making
 * Provides typed helpers for all documented endpoints using Fetch API.
 *
 * Endpoints implemented:
 * - GET    /api/map
 * - GET    /api/map/{id}
 * - POST   /api/map?name=...
 * - DELETE /api/map/{id}
 * - GET    /api/floor/{floorId}
 * - POST   /api/floor
 * - DELETE /api/floor/{floorId}
 * - POST   /api/cell/update
 */

/**
 * Base URL of the backend API.
 * You can override via Vite env (VITE_BACKEND_URL) if needed.
 */

// AZURE API Temp disabled
// export const BASE_URL =
//   (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL) ||
//   'https://backend-map-frd3e5bch9bvgjef.canadacentral-01.azurewebsites.net'

// Using LocalHost as backend for now.
export const BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL) ||
  'https://localhost:7219'

/**
 * Join base URL and a path safely (avoids double slashes).
 * @param {string} path
 * @returns {string}
 */
function withBase(path) {
  const base = BASE_URL.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

/**
 * Generic HTTP request helper with JSON handling and timeout.
 * - Parses JSON for non-204 responses when possible
 * - Throws on non-2xx status with a descriptive error
 *
 * @template T
 * @param {string} url
 * @param {RequestInit & { timeout?: number }} [options]
 * @returns {Promise<T|null>} Returns null for 204 No Content
 */
async function http(url, options = {}) {
  const { timeout = 15000, headers, ...rest } = options
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const res = await fetch(url, {
      ...rest,
      headers: {
        Accept: 'application/json',
        ...headers,
      },
      signal: controller.signal,
    })

    // 204 No Content
    if (res.status === 204) return null

    // Try to parse JSON if content-type hints it
    const contentType = res.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')
    const data = isJson ? await res.json() : await res.text()

    if (!res.ok) {
      const message =
        isJson && data && typeof data.message === 'string'
          ? data.message
          : typeof data === 'string' && data.length < 300
            ? data
            : `HTTP ${res.status} ${res.statusText}`
      const error = new Error(message)
      error.status = res.status
      error.body = data
      throw error
    }

    return /** @type {T} */ (data)
  } finally {
    clearTimeout(id)
  }
}

// ===== Models (JSDoc) =====

/** @typedef {Object} Cell
 *  @property {number} id
 *  @property {number} x
 *  @property {number} y
 *  @property {boolean} isFilled
 *  @property {number} floorId
 */

/** @typedef {Object} Floor
 *  @property {number} id
 *  @property {string} name
 *  @property {number} number
 *  @property {number} dimensionX
 *  @property {number} dimensionY
 *  @property {number} mapId
 *  @property {Cell[]} cells
 */

/** @typedef {Object} MapModel
 *  @property {number} id
 *  @property {string} name
 *  @property {Floor[]} floors
 *  @property {number} numberOfFloors
 */

/** @typedef {Object} FloorDTO
 *  @property {string} name
 *  @property {number} number
 *  @property {number} dimensionX
 *  @property {number} dimensionY
 *  @property {number} mapId
 */

/** @typedef {Object} CellUpdateDTO
 *  @property {number} x
 *  @property {number} y
 *  @property {boolean} isFilled
 */

/** @typedef {Object} CellsDTO
 *  @property {number} floorId
 *  @property {CellUpdateDTO[]} cells
 */

// ===== Map endpoints =====

/**
 * GET /api/map
 * @returns {Promise<MapModel[]>}
 */
export function getMaps() {
  return http(withBase('/api/map'))
}

/**
 * GET /api/map/{id}
 * @param {number} id
 * @returns {Promise<MapModel>}
 */
export function getMapById(id) {
  if (id == null) throw new Error('getMapById: id is required')
  return http(withBase(`/api/map/${encodeURIComponent(id)}`))
}

/**
 * POST /api/map?name=...
 * Creates a new map. Name is passed via query or form (simple binding).
 * @param {string} name
 * @returns {Promise<MapModel>}
 */
export function createMap(name) {
  if (!name || !name.trim()) throw new Error('createMap: name is required')
  const url = new URL(withBase('/api/map'))
  url.searchParams.set('name', name.trim())
  return http(url.toString(), { method: 'POST' })
}

/**
 * DELETE /api/map/{id}
 * @param {number} id
 * @returns {Promise<boolean>} true on success
 */
export async function deleteMap(id) {
  if (id == null) throw new Error('deleteMap: id is required')
  await http(withBase(`/api/map/${encodeURIComponent(id)}`), { method: 'DELETE' })
  return true
}

/**
 * PUT /api/map/UpdateMap/{id}
 * @param {number} id
 * @param {string} newName
 * @returns {Promise<boolean>} true on success
 */
export async function editMap(id, newName) {
  if (id == null) throw new Error('editMap: id is required')
  if (!newName || !newName.trim()) throw new Error('editMap: newName is required')

  await http(withBase(`api/map/UpdateMap/${encodeURIComponent(id)}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newName.trim() }),
  })
  return true
}

// ===== Floor endpoints =====

/**
 * GET /api/floor/{floorId}
 * @param {number} floorId
 * @returns {Promise<Floor>}
 */
export function getFloorById(floorId) {
  if (floorId == null) throw new Error('getFloorById: floorId is required')
  return http(withBase(`/api/floor/${encodeURIComponent(floorId)}`))
}

/**
 * POST /api/floor
 * @param {FloorDTO} dto
 * @returns {Promise<Floor>} Created floor (with generated cells)
 */
export function createFloor(dto) {
  if (!dto) throw new Error('createFloor: dto is required')
  return http(withBase('/api/floor'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  })
}

/**
 * DELETE /api/floor/{floorId}
 * @param {number} floorId
 * @returns {Promise<boolean>} true on success
 */
export async function deleteFloor(floorId) {
  if (floorId == null) throw new Error('deleteFloor: floorId is required')
  await http(withBase(`/api/floor/${encodeURIComponent(floorId)}`), { method: 'DELETE' })
  return true
}

/** PUT /api/floor/{floorId}
 * @param {number} floorId
 * @param {FloorDTO} dto
 * @returns {Promise<boolean>} true on success
 */
export async function editFloor(floorId, dto) {
  if (floorId == null) throw new Error('editFloor: floorId is required')
  if (!dto) throw new Error('editFloor: dto is required')

  await http(withBase(`api/floor/${encodeURIComponent(floorId)}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  })
  return true
}

// ===== Cell endpoints =====

/**
 * POST /api/cell/update
 * Bulk update cells for a floor.
 * @param {CellsDTO} dto
 * @returns {Promise<boolean>} true on success (204 No Content)
 */
export async function updateCells(dto) {
  if (!dto) throw new Error('updateCells: dto is required')
  await http(withBase('/api/cell/update'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  })
  return true
}

// Default export for convenience
export default {
  BASE_URL,
  getMaps,
  getMapById,
  createMap,
  deleteMap,
  getFloorById,
  createFloor,
  deleteFloor,
  updateCells,
}
