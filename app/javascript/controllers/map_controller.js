import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["popup"]

  connect() {
    // Configura o token de acesso do Mapbox
    mapboxgl.accessToken = this.element.dataset.mapboxKey

    // Lê os markers do atributo data-markers (JSON)
    const markers = JSON.parse(this.element.dataset.markers)

    // Inicializa o mapa centrado no primeiro lugar ou em São Paulo como fallback
    this.map = new mapboxgl.Map({
      container: this.element.querySelector("#map"),
      style: 'mapbox://styles/mapbox/streets-v12',
      center: markers.length > 0 ? [markers[0].lng, markers[0].lat] : [-46.63, -23.55],
      zoom: 10
    })

    // Cria os pins no mapa para cada lugar do banco
    this.markers = markers.map(marker => {
      // Encontra o popup correspondente ao lugar pelo ID
      const popupEl = this.popupTargets.find(el => el.dataset.placeId == marker.id)

      // Cria o pin colorido com popup e adiciona ao mapa
      const mapMarker = new mapboxgl.Marker({ color: marker.pin_color })
        .setLngLat([marker.lng, marker.lat])
        .setPopup(popupEl ? new mapboxgl.Popup().setHTML(popupEl.innerHTML) : null)
        .addTo(this.map)

      // Retorna referência do marker e ID do lugar para uso posterior
      return { placeId: marker.id, marker: mapMarker }
    })

    // Centraliza no lugar buscado via home (lat/lng na URL)
    const params = new URLSearchParams(window.location.search)
    const lat = parseFloat(params.get("lat"))
    const lng = parseFloat(params.get("lng"))
    if (!isNaN(lat) && !isNaN(lng)) {
      this.map.once("load", () => {
        this.map.flyTo({ center: [lng, lat], zoom: 15, speed: 1.5 })
        new mapboxgl.Marker({ color: "#3b82f6" }).setLngLat([lng, lat]).addTo(this.map)
      })
    }

    // Registra clique no mapa para reverse geocoding
    this.map.on("click", (e) => this.clickMap(e))

    // Muda cursor para pointer ao passar em cima de um POI
    this.map.on("mouseenter", "poi-label", () => {
      this.map.getCanvas().style.cursor = "pointer"
    })

    // Volta cursor padrão ao sair do POI
    this.map.on("mouseleave", "poi-label", () => {
      this.map.getCanvas().style.cursor = ""
    })
  }

  // Voa até o lugar quando o usuário clica num card da lista
  flyTo(event) {
    const lat = parseFloat(event.currentTarget.dataset.lat)
    const lng = parseFloat(event.currentTarget.dataset.lng)
    const placeId = event.currentTarget.dataset.placeId

    this.map.flyTo({
      center: [lng, lat],
      zoom: 15,
      speed: 1.5
    })

    // Abre o popup do lugar após a animação terminar
    this.map.once("moveend", () => {
      const markerPopup = this.markers.find(m => m.placeId == placeId)
      if (markerPopup) markerPopup.marker.getPopup().addTo(this.map)
    })
  }

  // Voa até o lugar buscado via Mapbox Search e adiciona pin temporário azul
  zoomToPlace(event) {
    const { lat, lng } = event.detail

    // Remove pin temporário anterior se existir
    if (this.tempMarker) this.tempMarker.remove()

    // Cria pin azul temporário para indicar o local buscado
    this.tempMarker = new mapboxgl.Marker({ color: "#3b82f6" })
      .setLngLat([lng, lat])
      .addTo(this.map)

    this.map.flyTo({
      center: [lng, lat],
      zoom: 15,
      speed: 1.5
    })
  }

  // Centraliza o mapa na localização atual do usuário
  geolocate() {
    // Verifica se o browser suporta geolocalização
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        // Remove pin de localização anterior se existir
        if (this.userMarker) this.userMarker.remove()

        // Cria pin roxo para indicar a posição do usuário
        this.userMarker = new mapboxgl.Marker({ color: "#8b5cf6" })
          .setLngLat([lng, lat])
          .addTo(this.map)

        this.map.flyTo({
          center: [lng, lat],
          zoom: 14,
          speed: 1.5
        })
      },
      error => {
        console.error("Geolocation error:", error.code, error.message)
      },
      { timeout: 10000 }
    )
  }

  // Escapa caracteres HTML para evitar XSS em conteúdo inserido no popup
  escape(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
  }

  // Busca informações do local clicado e exibe popup com botão de adicionar
  clickMap(event) {
    const features = this.map.queryRenderedFeatures(event.point, {
      layers: ["poi-label"]
    })

    if (!features.length) return

    const feature = features[0]
    const name = feature.properties.name || "Local sem nome"
    const category = feature.properties.category_en || ""
    const lng = event.lngLat.lng
    const lat = event.lngLat.lat

    // Busca endereço via reverse geocoding
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}&language=pt&types=address`)
      .then(res => res.json())
      .then(data => {
        const address = data.features[0]?.place_name || ""

        new mapboxgl.Popup({
  closeButton: true,
  closeOnClick: true,
  maxWidth: "420px"
})
  .setLngLat(event.lngLat)
  .setHTML(`
    <div class="mapbox-popup-card mapbox-popup-card--empty">
      <div class="mapbox-popup-card__header mapbox-popup-card__header--stack">
        <div>
          <span class="mapbox-popup-card__eyebrow">Local encontrado</span>
          <h3 class="mapbox-popup-card__title">${this.escape(name)}</h3>
          ${category ? `<p class="mapbox-popup-card__category">${this.escape(category)}</p>` : ""}
        </div>
        <span class="mapbox-popup-card__badge mapbox-popup-card__badge--neutral">Sem reviews</span>
      </div>

      <p class="mapbox-popup-card__address">${this.escape(address)}</p>

      <div class="mapbox-popup-card__empty">
        <p class="mapbox-popup-card__empty-title">Ainda não há reviews</p>
        <p class="mapbox-popup-card__empty-text">
          Seja a primeira pessoa a adicionar contexto para este local.
        </p>
      </div>

      <button
         type="button"
         class="mapbox-popup-card__button"
         data-action="click->map#addPlace"
         data-name="${this.escape(name)}"
         data-address="${this.escape(address)}"
         data-lat="${lat}"
         data-lng="${lng}">
         Adicionar primeira review
      </button>
    </div>
  `)
  .addTo(this.map)
      })
      .catch(err => console.error("Erro no reverse geocoding:", err))
  }

  // Cria o place no banco e redireciona para a página do lugar
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
    .then(res => res.json())
    .then(data => {
      if (data.success) window.location.href = `/${locale}/places/${data.place_id}`
    })
    .catch(err => console.error("Erro ao adicionar local:", err))
  }
}
