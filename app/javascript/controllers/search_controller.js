import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input", "suggestions"]
  static values = { mapboxKey: String }

  connect() {
    this.timeout = null
  }

  search() {
    clearTimeout(this.timeout)
    const query = this.inputTarget.value

    if (query.length < 3) {
      this.suggestionsTarget.innerHTML = ""
      return
    }

    this.timeout = setTimeout(() => {
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${this.mapboxKeyValue}&language=pt&country=BR&types=poi,address`)
        .then(res => res.json())
        .then(data => this.showSuggestions(data.features))
    }, 300)
  }

  showSuggestions(features) {
    this.suggestionsTarget.innerHTML = ""

    features.forEach(feature => {
      const div = document.createElement("div")
      div.classList.add("suggestion-item")
      div.textContent = feature.place_name
      div.addEventListener("click", () => this.selectPlace(feature))
      this.suggestionsTarget.appendChild(div)
    })
  }

  selectPlace(feature) {
    const [lng, lat] = feature.center
    const name = feature.place_name

    this.inputTarget.value = name
    this.suggestionsTarget.innerHTML = ""

    // Dispara evento para o map controller voar até o local
    this.dispatch("placeSelected", {
      detail: { lat, lng, name }
    })
  }
}
