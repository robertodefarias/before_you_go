import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["popup"]

  connect() {
    mapboxgl.accessToken = this.element.dataset.mapboxKey

    const markers = JSON.parse(this.element.dataset.markers || "[]")

    const params = new URLSearchParams(window.location.search)
    const lat = parseFloat(params.get("lat"))
    const lng = parseFloat(params.get("lng"))
    const hasFocus = !isNaN(lat) && !isNaN(lng)

    this.map = new mapboxgl.Map({
      container: this.element.querySelector("#map"),
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-51.9253, -14.235],
      zoom: hasFocus ? 2 : 1
    })

    // Constrói markers mas só adiciona ao mapa após a animação cinematográfica
    this.markers = markers.map((marker) => {
      const popupEl = this.popupTargets.find((el) => el.dataset.placeId == marker.id)
      const markerColor = this.resolveMarkerColor(marker.pin_color)

      const mapMarker = new mapboxgl.Marker({ color: markerColor })
        .setLngLat([marker.lng, marker.lat])
        .setPopup(popupEl ? new mapboxgl.Popup().setHTML(popupEl.innerHTML) : null)

      if (hasFocus) mapMarker.addTo(this.map)

      return { placeId: marker.id, marker: mapMarker, name: marker.name }
    })

    this.map.once("load", () => {
      if (hasFocus) {
        this.map.flyTo({ center: [lng, lat], zoom: 15, speed: 1.5 })
        return
      }

      // Efeito cinematográfico: zoom lento até o Brasil, depois aparecem os pins
      this.map.easeTo({ center: [-51.9253, -14.235], zoom: 3, duration: 3500, easing: t => t * (2 - t) })

      this.map.once("moveend", () => {
        this.markers.forEach(({ marker }) => {
          marker.addTo(this.map)
          const el = marker.getElement()
          el.style.opacity = "0"
          el.style.transition = "opacity 0.6s ease"
          requestAnimationFrame(() => requestAnimationFrame(() => { el.style.opacity = "1" }))
        })
      })
    })

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
    const { lat, lng, name } = event.detail

    // Try to find an app place by name first (before "—" is the place name)
    const searchTerm = name.split("—")[0].trim().toLowerCase()
    const nameMatch = this.markers.find(m =>
      m.name && (
        m.name.toLowerCase().includes(searchTerm) ||
        searchTerm.includes(m.name.toLowerCase())
      )
    )

    if (nameMatch && nameMatch.marker.getPopup()) {
      const pos = nameMatch.marker.getLngLat()
      this.map.flyTo({ center: [pos.lng, pos.lat], zoom: 15, speed: 1.5 })
      this.map.once("moveend", () => nameMatch.marker.getPopup().addTo(this.map))
      return
    }

    if (this.tempMarker) this.tempMarker.remove()

    this.map.flyTo({
      center: [lng, lat],
      zoom: 15,
      speed: 1.5
    })

    this.map.once("moveend", () => {
      const existingMarker = this.markers.find(m => {
        const pos = m.marker.getLngLat()
        return Math.abs(pos.lat - lat) < 0.001 && Math.abs(pos.lng - lng) < 0.001
      })

      if (existingMarker && existingMarker.marker.getPopup()) {
        existingMarker.marker.getPopup().addTo(this.map)
        return
      }

      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}&language=pt&types=address`)
        .then(res => res.json())
        .then(data => {
          const address = data.features[0]?.place_name || ""

          new mapboxgl.Popup({ closeButton: true, closeOnClick: true, maxWidth: "420px" })
            .setLngLat([lng, lat])
            .setHTML(`
              <div class="map-popup-card">
                <div class="map-popup-status map-popup-status--neutral"></div>
                <div class="map-popup-body">
                  <div class="map-popup-header">
                    <span class="map-popup-badge">Atenção</span>
                    <h3 class="map-popup-title">${this.escape(name)}</h3>
                  </div>
                  <p class="map-popup-text">Ainda não há relatos para este local.</p>
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
        .catch(err => console.error("Erro ao buscar endereço:", err))
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
                data-lat="${lat}"
                data-lng="${lng}">
                Adicionar primeira review
              </button>
            </div>
          </div>
        </div>
      `)
      .addTo(this.map)
  }

  addPlace(event) {
    event.preventDefault()

    const { name, lat, lng } = event.currentTarget.dataset
    const locale = document.documentElement.lang || "pt-BR"

    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}&language=pt&types=address`)
      .then((res) => res.json())
      .then((data) => {
        const address = data.features[0]?.place_name || name

        return fetch(`/${locale}/places`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content
          },
          body: JSON.stringify({ name, address, latitude: lat, longitude: lng })
        })
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
