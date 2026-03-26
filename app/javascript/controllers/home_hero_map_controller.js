import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["map", "card", "searchInput", "userPin"]

  connect() {
    this.defaultCenter = { lng: -51.9253, lat: -14.235, zoom: 4 }
    this.focusCenter = { lng: -47.93, lat: -15.78, zoom: 5 }
    this.demoMarkers = []
    this.demoMarkerCache = new Map()
    this.typingTimer = null
    this.userLocation = null
    this.map = null
    this.demoMapMarkers = []
    this.pendingImage = null
    this.lastViewport = null
    this.markerRequestId = 0
    this.handleResize = this.handleResize.bind(this)

    this.locateUser()
    window.addEventListener("resize", this.handleResize)
  }

  disconnect() {
    clearTimeout(this.typingTimer)
    clearTimeout(this.geoFallbackTimer)
    window.removeEventListener("resize", this.handleResize)
    this.pendingImage = null
    this.destroyInteractiveMap()
  }

  locateUser() {
    if (!navigator.geolocation) {
      this.renderMap(this.defaultCenter)
      return
    }

    this.geoFallbackTimer = setTimeout(() => {
      if (!this.userLocation) this.renderMap(this.defaultCenter)
    }, 2000)

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        clearTimeout(this.geoFallbackTimer)
        this.userLocation = { lng: coords.longitude, lat: coords.latitude }
        this.showUserPin()
        this.renderMap(this.userViewport(false))
      },
      () => {
        clearTimeout(this.geoFallbackTimer)
        if (!this.userLocation) this.renderMap(this.defaultCenter)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    )
  }

  handleInput() {
    const hasText = this.searchInputTarget.value.trim().length > 0

    if (hasText) {
      this.element.classList.add("home-page--searching")
      this.focusMap()
    } else {
      this.element.classList.remove("home-page--searching")
      this.resetMap()
    }
  }

  handleFocus() {
    if (this.searchInputTarget.value.trim().length > 0) {
      this.element.classList.add("home-page--searching")
    }
  }

  handleBlur() {
    if (this.searchInputTarget.value.trim().length === 0) {
      this.element.classList.remove("home-page--searching")
      this.resetMap()
    }
  }

  focusMap() {
    clearTimeout(this.typingTimer)

    this.typingTimer = setTimeout(() => {
      if (this.userLocation) {
        this.renderMap(this.userViewport(true))
      } else {
        this.renderMap(this.focusCenter)
      }
    }, 250)
  }

  resetMap() {
    if (this.userLocation) {
      this.renderMap(this.userViewport(true))
      return
    }

    this.renderMap(this.defaultCenter)
  }

  renderMap({ lng, lat, zoom }) {
    if (!this.hasMapTarget || !this.mapboxToken) return

    const width = Math.min(Math.max(Math.round(this.mapTarget.clientWidth || 1280), 1), 1280)
    const height = Math.min(Math.max(Math.round(this.mapTarget.clientHeight || 900), 1), 1280)
    const viewport = this.userLocation
      ? this.staticViewportForPin({ lng, lat, zoom }, width, height)
      : { lng, lat, zoom }
    const center = `${viewport.lng},${viewport.lat},${viewport.zoom},0`
    this.lastViewport = viewport
    this.demoMarkers = []
    this.resolveDemoMarkers(viewport, width, height)

    if (this.map) {
      this.map.easeTo({ center: [viewport.lng, viewport.lat], zoom: viewport.zoom, duration: 500 })
      this.syncInteractiveDemoMarkers()
      return
    }

    this.loadStaticMap(this.staticMapUrl(center, width, height, false), viewport)
  }

  userViewport(focused) {
    return {
      lng: focused ? this.userLocation.lng - 0.12 : this.userLocation.lng,
      lat: focused ? this.userLocation.lat - 0.06 : this.userLocation.lat,
      zoom: focused ? 12.4 : 12
    }
  }

  staticViewportForPin(viewport, width, height) {
    const targetPoint = {
      x: width * 0.68,
      y: height * 0.26
    }
    const screenCenter = {
      x: width / 2,
      y: height / 2
    }
    const offset = {
      x: targetPoint.x - screenCenter.x,
      y: targetPoint.y - screenCenter.y
    }
    const scale = 512 * (2 ** viewport.zoom)
    const projectedTarget = this.projectMercator(this.userLocation.lng, this.userLocation.lat, scale)
    const projectedCenter = {
      x: projectedTarget.x - offset.x,
      y: projectedTarget.y - offset.y
    }

    return {
      ...this.unprojectMercator(projectedCenter.x, projectedCenter.y, scale),
      zoom: viewport.zoom
    }
  }

  projectMercator(lng, lat, scale) {
    const limitedLat = Math.max(Math.min(lat, 85.05112878), -85.05112878)
    const x = (lng + 180) / 360 * scale
    const sinLat = Math.sin((limitedLat * Math.PI) / 180)
    const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale

    return { x, y }
  }

  unprojectMercator(x, y, scale) {
    const lng = x / scale * 360 - 180
    const n = Math.PI - (2 * Math.PI * y) / scale
    const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))

    return { lng, lat }
  }

  showUserPin() {
    if (!this.hasUserPinTarget) return

    this.userPinTarget.hidden = false
  }

  visibleDemoMarkers(viewport, width, height) {
    return this.screenAnchorCandidates(width, height).map(({ x, y }) =>
      this.coordinateFromScreenPoint(viewport, width, height, x, y)
    )
  }

  screenAnchorCandidates(width, height) {
    const xCandidates = [0.50, 0.54, 0.58, 0.62, 0.66, 0.70]
    const yCandidates = [0.08, 0.12, 0.16, 0.20, 0.24, 0.28, 0.32, 0.36, 0.40, 0.44, 0.48, 0.52]
    const blockedAreas = this.blockedScreenAreas()
    const margin = { x: Math.max(36 / width, 0.02), y: Math.max(42 / height, 0.03) }
    const candidates = []

    yCandidates.forEach((y) => {
      xCandidates.forEach((x) => {
        if (this.pointInsideBlockedArea(x, y, blockedAreas, margin)) return
        candidates.push({ x, y })
      })
    })

    const sortedCandidates = candidates.sort((a, b) => this.anchorPriorityScore(a) - this.anchorPriorityScore(b))

    return this.distributeScreenAnchors(sortedCandidates, width, height)
  }

  blockedScreenAreas() {
    const mapRect = this.mapTarget.getBoundingClientRect()

    return this.cardTargets
      .map((card) => card.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0)
      .map((rect) => ({
        left: (rect.left - mapRect.left) / mapRect.width,
        right: (rect.right - mapRect.left) / mapRect.width,
        top: (rect.top - mapRect.top) / mapRect.height,
        bottom: (rect.bottom - mapRect.top) / mapRect.height
      }))
  }

  pointInsideBlockedArea(x, y, blockedAreas, margin) {
    return blockedAreas.some((area) =>
      x >= area.left - margin.x &&
      x <= area.right + margin.x &&
      y >= area.top - margin.y &&
      y <= area.bottom + margin.y
    )
  }

  anchorPriorityScore({ x, y }) {
    return Math.abs(x - 0.64) + (Math.abs(y - 0.24) * 1.2)
  }

  distributeScreenAnchors(candidates, width, height) {
    const selected = []

    candidates.forEach((candidate) => {
      if (selected.length === 0) {
        selected.push(candidate)
        return
      }

      if (selected.some((anchor) => this.screenDistance(anchor, candidate, width, height) < 0.14)) return
      selected.push(candidate)
    })

    return selected.length >= 12 ? selected : candidates
  }

  screenDistance(a, b, width, height) {
    const deltaX = (a.x - b.x) * width
    const deltaY = (a.y - b.y) * height
    return Math.sqrt(deltaX ** 2 + deltaY ** 2) / Math.max(width, height)
  }

  resolveDemoMarkers(viewport, width, height) {
    if (!this.userLocation) return

    const cacheKey = this.demoMarkerCacheKey(viewport, width, height)
    const cachedMarkers = this.demoMarkerCache.get(cacheKey)

    if (cachedMarkers) {
      this.demoMarkers = cachedMarkers
      this.syncInteractiveDemoMarkers()
      return
    }

    const requestId = ++this.markerRequestId
    const candidateCoordinates = this.visibleDemoMarkers(viewport, width, height)

    this.findResolvedDemoMarkers(candidateCoordinates).then((resolvedMarkers) => {
      if (requestId !== this.markerRequestId) return

      this.demoMarkerCache.set(cacheKey, resolvedMarkers)
      this.demoMarkers = resolvedMarkers

      if (this.map) {
        this.syncInteractiveDemoMarkers()
        return
      }

      const center = `${viewport.lng},${viewport.lat},${viewport.zoom},0`
      this.loadStaticMap(this.staticMapUrl(center, width, height, true), viewport)
    })
  }

  demoMarkerCacheKey(viewport, width, height) {
    return [
      viewport.lng.toFixed(3),
      viewport.lat.toFixed(3),
      viewport.zoom.toFixed(2),
      width,
      height
    ].join(":")
  }

  async filterValidDemoMarkers(markers) {
    const validatedMarkers = []

    for (const marker of markers) {
      const resolvedMarker = await this.resolveValidMarkerLocation(marker.lng, marker.lat)
      if (resolvedMarker) validatedMarkers.push(resolvedMarker)
    }

    return validatedMarkers
  }

  async findResolvedDemoMarkers(candidateCoordinates) {
    const colors = ["#0d6a41", "#57c885", "#d12f39"]
    const validatedMarkers = await this.filterValidDemoMarkers(candidateCoordinates)

    return validatedMarkers
      .slice(0, colors.length)
      .map((marker, index) => ({ ...marker, color: colors[index] }))
  }

  async resolveValidMarkerLocation(lng, lat) {
    try {
      const params = new URLSearchParams({
        access_token: this.mapboxToken,
        language: "pt",
        limit: 3
      })
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?${params.toString()}`
      )

      if (!response.ok) return null

      const data = await response.json()
      const features = Array.isArray(data.features) ? data.features : []

      for (const feature of features) {
        if (!this.landFeature(feature)) continue

        const center = Array.isArray(feature.center) ? feature.center : null
        if (center && center.length === 2) {
          return { lng: center[0], lat: center[1] }
        }

        return { lng, lat }
      }

      return null
    } catch (_error) {
      return null
    }
  }

  landFeature(feature) {
    if (!feature) return false

    const validPlaceTypes = ["address", "street", "neighborhood", "locality", "place", "district", "poi"]
    const placeTypes = Array.isArray(feature.place_type) ? feature.place_type : []
    const contextTexts = Array.isArray(feature.context)
      ? feature.context.map((item) => `${item.id || ""} ${item.text || ""}`.toLowerCase()).join(" ")
      : ""
    const featureText = `${feature.text || ""} ${feature.place_name || ""}`.toLowerCase()
    const rejectsWater = /(ocean|sea|water|praia|beach|mar|atlantic)/.test(`${featureText} ${contextTexts}`)

    return placeTypes.some((type) => validPlaceTypes.includes(type)) && !rejectsWater
  }

  coordinateFromScreenPoint(viewport, width, height, xRatio, yRatio) {
    const scale = 512 * (2 ** viewport.zoom)
    const screenCenter = {
      x: width / 2,
      y: height / 2
    }
    const targetPoint = {
      x: width * xRatio,
      y: height * yRatio
    }
    const projectedCenter = this.projectMercator(viewport.lng, viewport.lat, scale)
    const projectedTarget = {
      x: projectedCenter.x + (targetPoint.x - screenCenter.x),
      y: projectedCenter.y + (targetPoint.y - screenCenter.y)
    }

    return this.unprojectMercator(projectedTarget.x, projectedTarget.y, scale)
  }

  syncInteractiveDemoMarkers() {
    this.demoMapMarkers.forEach((marker) => marker.remove())
    this.demoMapMarkers = []

    if (!this.map || !this.userLocation || this.demoMarkers.length === 0) return

    this.demoMapMarkers = this.demoMarkers.map(({ lng, lat, color }) =>
      new mapboxgl.Marker({ color })
        .setLngLat([lng, lat])
        .addTo(this.map)
    )
  }

  handleResize() {
    if (this.map) {
      this.map.resize()
    }

    if (this.lastViewport) {
      this.renderMap(this.lastViewport)
    }
  }

  loadStaticMap(url, viewport) {
    const image = new Image()
    this.pendingImage = image

    image.onload = () => {
      if (this.pendingImage !== image || this.map) return
      this.mapTarget.style.backgroundImage = `url("${url}")`
    }

    image.onerror = () => {
      if (this.pendingImage !== image) return
      this.initializeInteractiveMap(viewport)
    }

    image.src = url
  }

  initializeInteractiveMap(viewport) {
    if (this.map || typeof mapboxgl === "undefined") return

    mapboxgl.accessToken = this.mapboxToken
    this.mapTarget.style.backgroundImage = "none"
    this.mapTarget.classList.add("hero-live-map--interactive")

    this.map = new mapboxgl.Map({
      container: this.mapTarget,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [viewport.lng, viewport.lat],
      zoom: viewport.zoom,
      attributionControl: false
    })

    this.map.scrollZoom.disable()
    this.map.dragRotate.disable()
    this.map.touchZoomRotate.disableRotation()

    this.syncInteractiveDemoMarkers()
  }

  destroyInteractiveMap() {
    if (!this.map) return

    this.demoMapMarkers.forEach((marker) => marker.remove())
    this.demoMapMarkers = []
    this.map.remove()
    this.map = null
    this.mapTarget.classList.remove("hero-live-map--interactive")
  }

  staticMapUrl(center, width, height, showDemoMarkers = false) {
    const overlays = showDemoMarkers && this.demoMarkers.length > 0
      ? `${this.demoMarkers
          .map(({ lng, lat, color }) => `pin-s+${color.replace("#", "")}(${lng},${lat})`)
          .join(",")}/`
      : ""

    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${overlays}${center}/${width}x${height}?access_token=${this.mapboxToken}`
  }

  get mapboxToken() {
    return this.element.dataset.mapboxKey
  }
}
