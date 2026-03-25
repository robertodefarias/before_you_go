import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["popup"]

  connect() {
    mapboxgl.accessToken = this.element.dataset.mapboxKey

    const markers = JSON.parse(this.element.dataset.markers || "[]")

    this.map = new mapboxgl.Map({
      container: this.element.querySelector("#map"),
      style: "mapbox://styles/mapbox/streets-v12",
      center: markers.length > 0 ? [markers[0].lng, markers[0].lat] : [-46.63, -23.55],
      zoom: 10
    })

    this.markers = markers.map((marker) => {
      const popupEl = this.popupTargets.find((el) => el.dataset.placeId == marker.id)
      const markerColor = this.resolveMarkerColor(marker.pin_color)

      const mapMarker = new mapboxgl.Marker({ color: markerColor })
        .setLngLat([marker.lng, marker.lat])
        .setPopup(popupEl ? new mapboxgl.Popup().setHTML(popupEl.innerHTML) : null)
        .addTo(this.map)

      return { placeId: marker.id, marker: mapMarker }
    })

    const params = new URLSearchParams(window.location.search)
    const lat = parseFloat(params.get("lat"))
    const lng = parseFloat(params.get("lng"))

    if (!isNaN(lat) && !isNaN(lng)) {
      this.map.once("load", () => {
        this.map.flyTo({ center: [lng, lat], zoom: 15, speed: 1.5 })

        if (!isNaN(lat) && !isNaN(lng)) {
          this.map.once("load", () => {
            this.map.flyTo({ center: [lng, lat], zoom: 15, speed: 1.5 })
          })
        }
      })
    }

    this.map.on("click", (e) => this.clickMap(e))

    this.map.on("mouseenter", "poi-label", () => {
      this.map.getCanvas().style.cursor = "pointer"
    })

    this.map.on("mouseleave", "poi-label", () => {
      this.map.getCanvas().style.cursor = ""
    })
  }

  resolveMarkerColor(pinColor) {
    const colorMap = {
      "green-light": "#86efac",
      "green-medium": "#22c55e",
      "green-strong": "#15803d",
      "red-light": "#fca5a5",
      "red-medium": "#ef4444",
      "red-strong": "#b91c1c",
      "gray": "#9ca3af",
      "yellow-user": "#f59e0b"
    }

    return colorMap[pinColor] || "#9ca3af"
  }

  flyTo(event) {
    const lat = parseFloat(event.currentTarget.dataset.lat)
    const lng = parseFloat(event.currentTarget.dataset.lng)
    const placeId = event.currentTarget.dataset.placeId

    this.map.flyTo({
      center: [lng, lat],
      zoom: 15,
      speed: 1.5
    })

    this.map.once("moveend", () => {
      const markerPopup = this.markers.find((m) => m.placeId == placeId)
      if (markerPopup && markerPopup.marker.getPopup()) {
        markerPopup.marker.getPopup().addTo(this.map)
      }
    })
  }

  zoomToPlace(event) {
    const { lat, lng } = event.detail

    if (this.tempMarker) this.tempMarker.remove()

    this.tempMarker = new mapboxgl.Marker({ color: "#3b82f6" })
      .setLngLat([lng, lat])
      .addTo(this.map)

    this.map.flyTo({
      center: [lng, lat],
      zoom: 15,
      speed: 1.5
    })
  }

  geolocate() {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        if (this.userMarker) this.userMarker.remove()

        this.userMarker = new mapboxgl.Marker({
          color: this.resolveMarkerColor("yellow-user")
        })
          .setLngLat([lng, lat])
          .addTo(this.map)

        this.map.flyTo({
          center: [lng, lat],
          zoom: 14,
          speed: 1.5
        })
      },
      (error) => {
        console.error("Geolocation error:", error.code, error.message)
      },
      { timeout: 10000 }
    )
  }

  escape(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
  }

  clickMap(event) {
    const features = this.map.queryRenderedFeatures(event.point, {
      layers: ["poi-label"]
    })

    if (!features.length) return

    const feature = features[0]
    const name = feature.properties.name || "Local sem nome"
    const lng = event.lngLat.lng
    const lat = event.lngLat.lat

    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}&language=pt&types=address`)
      .then((res) => res.json())
      .then((data) => {
        const address = data.features[0]?.place_name || ""

        new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: "420px"
        })
          .setLngLat(event.lngLat)
          .setHTML(`
            <div class="map-popup-card">
              <div class="map-popup-status map-popup-status--neutral"></div>

              <div class="map-popup-body">
                <div class="map-popup-header">
                  <span class="map-popup-badge">Atenção</span>
                  <h3 class="map-popup-title">${this.escape(name)}</h3>
                </div>

                <p class="map-popup-text">
                  Ainda não há relatos para este local.
                </p>

                <div class="map-popup-footer">
                  <button
                    type="button"
                    class="map-popup-button"
                    data-action="click->map#addPlace"
                    data-name="${this.escape(name)}"
                    data-address="${this.escape(address)}"
                    data-lat="${lat}"
                    data-lng="${lng}">
                    Adicionar primeira review
                  </button>
                </div>
              </div>
            </div>
          `)
          .addTo(this.map)
      })
      .catch((err) => console.error("Erro no reverse geocoding:", err))
  }

  addPlace(event) {
    event.preventDefault()

    const { name, address, lat, lng } = event.currentTarget.dataset
    const locale = document.documentElement.lang || "pt-BR"

    fetch(`/${locale}/places`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content
      },
      body: JSON.stringify({ name, address, latitude: lat, longitude: lng })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          window.location.href = `/${locale}/places/${data.place_id}`
        }
      })
      .catch((err) => console.error("Erro ao adicionar local:", err))
  }
}
