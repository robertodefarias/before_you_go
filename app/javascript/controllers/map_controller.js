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
        .setPopup(new mapboxgl.Popup().setHTML(popupEl.innerHTML))
        .addTo(this.map)

      // Retorna referência do marker e ID do lugar para uso posterior
      return { placeId: marker.id, marker: mapMarker }
    })

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

    navigator.geolocation.getCurrentPosition(position => {
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
    })
  }

  // Busca informações do local clicado via Mapbox Reverse Geocoding
  // Busca informações do local clicado via Mapbox Reverse Geocoding
    clickMap(event) {
    // Busca features do mapa no ponto clicado
    const features = this.map.queryRenderedFeatures(event.point, {
      layers: ["poi-label"]
    })

    // Só abre popup se clicou em um estabelecimento
    if (!features.length) return

    const feature = features[0]
    const name = feature.properties.name || "Local sem nome"
    const category = feature.properties.category_en || feature.properties.type || ""

    new mapboxgl.Popup()
      .setLngLat(event.lngLat)
      .setHTML(`
        <strong>${name}</strong>
        ${category ? `<p><em>${category}</em></p>` : ""}
      `)
      .addTo(this.map)
  }
}
