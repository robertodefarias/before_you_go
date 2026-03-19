import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["popup"]

  connect() {
    mapboxgl.accessToken = this.element.dataset.mapboxKey

    const markers = JSON.parse(this.element.dataset.markers)

    this.map = new mapboxgl.Map({
      container: this.element.querySelector("#map"),
      style: 'mapbox://styles/mapbox/streets-v12',
      center: markers.length > 0 ? [markers[0].lng, markers[0].lat] : [-46.63, -23.55],
      zoom: 10
    })

    this.markers = markers.map(marker => {
      const popupEl = this.popupTargets.find(el => el.dataset.placeId == marker.id)

      const mapMarker = new mapboxgl.Marker({ color: marker.pin_color })
        .setLngLat([marker.lng, marker.lat])
        .setPopup(new mapboxgl.Popup().setHTML(popupEl.innerHTML))
        .addTo(this.map)

      return { placeId: marker.id, marker: mapMarker }
    })
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
      const markerPopup = this.markers.find(m => m.placeId == placeId)
      if (markerPopup) markerPopup.marker.getPopup().addTo(this.map)
    })
  }
}
