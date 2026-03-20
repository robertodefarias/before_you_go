import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["map", "card", "searchInput"]

  connect() {
    this.defaultCenter = [-14.235, -51.9253]
    this.defaultZoom = 4
    this.map = null
    this.L = null
    this.typingTimer = null
    this.userMarker = null
    this.userLocation = null

    this.loadMap()
  }

  disconnect() {
    if (this.map) {
      this.map.remove()
      this.map = null
    }
  }

  async loadMap() {
    if (!this.hasMapTarget) return

    const leafletModule = await import("https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js")
    this.L = leafletModule

    this.map = this.L.map(this.mapTarget, {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false,
      touchZoom: true
    })

    this.map.setView(this.defaultCenter, this.defaultZoom)

    this.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18
    }).addTo(this.map)

    setTimeout(() => {
      this.map.invalidateSize()
      this.locateUser()
    }, 200)
  }

  locateUser() {
    if (!this.map || !navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        this.userLocation = [coords.latitude, coords.longitude]
        this.placeUserMarker()
        this.frameUserLocation({ animate: false })
      },
      () => {},
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    )
  }

  placeUserMarker() {
    if (!this.map || !this.L || !this.userLocation) return

    if (this.userMarker) {
      this.userMarker.setLatLng(this.userLocation)
      return
    }

    this.userMarker = this.L.circleMarker(this.userLocation, {
      radius: 8,
      weight: 3,
      color: "#ffffff",
      fillColor: "#2563eb",
      fillOpacity: 1
    }).addTo(this.map)
  }

  frameUserLocation({ animate }) {
    if (!this.map || !this.userLocation) return

    const zoom = 13
    const targetLatLng = this.L.latLng(this.userLocation[0], this.userLocation[1])
    const mapSize = this.map.getSize()
    const desiredPoint = this.L.point(mapSize.x * 0.64, mapSize.y * 0.24)
    const screenCenter = this.L.point(mapSize.x / 2, mapSize.y / 2)
    const offset = desiredPoint.subtract(screenCenter)
    const projectedTarget = this.map.project(targetLatLng, zoom)
    const projectedCenter = projectedTarget.subtract(offset)
    const center = this.map.unproject(projectedCenter, zoom)

    this.map.flyTo(center, zoom, {
      animate,
      duration: animate ? 1.2 : 0
    })
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
    if (!this.map) return

    clearTimeout(this.typingTimer)

    this.typingTimer = setTimeout(() => {
      if (this.userLocation) {
        this.frameUserLocation({ animate: true })
      } else {
        this.map.flyTo([-15.78, -47.93], 5, {
          animate: true,
          duration: 1.2
        })
      }
    }, 250)
  }

  resetMap() {
    if (!this.map) return

    if (this.userLocation) {
      this.frameUserLocation({ animate: true })
      return
    }

    this.map.flyTo(this.defaultCenter, this.defaultZoom, {
      animate: true,
      duration: 1
    })
  }
}
