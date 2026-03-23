import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["map", "card", "searchInput", "userPin"]

  connect() {
    this.defaultCenter = { lng: -51.9253, lat: -14.235, zoom: 4 }
    this.focusCenter = { lng: -47.93, lat: -15.78, zoom: 5 }
    this.typingTimer = null
    this.userLocation = null

    this.renderMap(this.defaultCenter)
    this.locateUser()
  }

  disconnect() {
    clearTimeout(this.typingTimer)
  }

  locateUser() {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        this.userLocation = { lng: coords.longitude, lat: coords.latitude }
        this.showUserPin()
        this.renderMap(this.userViewport(false))
      },
      () => {},
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

    const width = 1280
    const height = 900
    const viewport = this.userLocation
      ? this.staticViewportForPin({ lng, lat, zoom }, width, height)
      : { lng, lat, zoom }
    const center = `${viewport.lng},${viewport.lat},${viewport.zoom},0`

    this.mapTarget.style.backgroundImage = `url("${this.staticMapUrl(center, width, height)}")`
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

  staticMapUrl(center, width, height) {
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${center}/${width}x${height}?access_token=${this.mapboxToken}`
  }

  get mapboxToken() {
    return this.element.dataset.mapboxKey
  }
}
