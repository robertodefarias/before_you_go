import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["popup"]

  connect() {
    mapboxgl.accessToken = this.element.dataset.mapboxKey

    const markers = JSON.parse(this.element.dataset.markers)

    const map = new mapboxgl.Map({
      container: this.element.querySelector("#map"),
      style: "mapbox://styles/mapbox/streets-v12",
      center: markers.length > 0 ? [markers[0].lng, markers[0].lat] : [-46.63, -23.55],
      zoom: 12
    })

    markers.forEach(marker => {
      const popupEl = this.popupTargets.find(el => el.dataset.placeId == marker.id)

      new mapboxgl.Marker({ color: marker.pin_color })
        .setLngLat([marker.lng, marker.lat])
        .setPopup(new mapboxgl.Popup().setHTML(popupEl.innerHTML))
        .addTo(map)
    })
  }
}
