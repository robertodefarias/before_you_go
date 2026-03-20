import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input", "suggestions"]
  static values = { mapboxKey: String }

  connect() {
    this.timeout = null
    this.abortController = null
    this.features = []
    this.activeIndex = -1
  }

  disconnect() {
    clearTimeout(this.timeout)
    this.abortOngoingRequest()
  }

  search() {
    clearTimeout(this.timeout)

    const query = this.inputTarget.value.trim()
    this.activeIndex = -1

    if (query.length < 3) {
      this.clearSuggestions()
      this.setState("idle")
      return
    }

    if (!this.mapboxKeyValue) {
      this.renderMessage(this.localeText("searchUnavailable"))
      this.setState("error")
      return
    }

    this.setState("loading")
    this.renderMessage(this.localeText("loading"))

    this.timeout = setTimeout(() => this.fetchSuggestions(query), 250)
  }

  onKeydown(event) {
    if (!this.features.length) return

    if (event.key === "ArrowDown") {
      event.preventDefault()
      this.activeIndex = (this.activeIndex + 1) % this.features.length
      this.renderSuggestions()
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      this.activeIndex = (this.activeIndex - 1 + this.features.length) % this.features.length
      this.renderSuggestions()
    } else if (event.key === "Enter" && this.activeIndex >= 0) {
      event.preventDefault()
      this.selectPlace(this.features[this.activeIndex])
    } else if (event.key === "Escape") {
      this.clearSuggestions()
      this.setState("idle")
    }
  }

  fetchSuggestions(query) {
    this.abortOngoingRequest()
    this.abortController = new AbortController()

    fetch(this.urlFor(query), { signal: this.abortController.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        this.features = Array.isArray(data.features) ? data.features.slice(0, 5) : []

        if (this.features.length === 0) {
          this.renderMessage(this.localeText("empty"))
          this.setState("empty")
          return
        }

        this.setState("results")
        this.renderSuggestions()
      })
      .catch(error => {
        if (error.name === "AbortError") return

        this.features = []
        this.renderMessage(this.localeText("error"))
        this.setState("error")
      })
      .finally(() => {
        this.abortController = null
      })
  }

  renderSuggestions() {
    this.suggestionsTarget.innerHTML = ""

    this.features.forEach((feature, index) => {
      const button = document.createElement("button")
      button.type = "button"
      button.className = "suggestion-item"
      if (index === this.activeIndex) button.classList.add("suggestion-item-active")

      button.textContent = feature.place_name
      button.setAttribute("role", "option")
      button.setAttribute("aria-selected", index === this.activeIndex ? "true" : "false")
      button.dataset.suggestionIndex = index

      this.suggestionsTarget.appendChild(button)
    })
  }

  clearSuggestions() {
    this.features = []
    this.activeIndex = -1
    this.suggestionsTarget.innerHTML = ""
  }

  renderMessage(message) {
    this.features = []
    this.activeIndex = -1
    this.suggestionsTarget.innerHTML = `<div class="search-feedback">${message}</div>`
  }

  selectPlace(feature) {
    const [lng, lat] = feature.center
    const name = feature.place_name

    this.inputTarget.value = name
    this.clearSuggestions()
    this.setState("idle")

    const mapEl = document.querySelector('[data-controller~="map"]')

    if (mapEl) {
      this.dispatch("placeSelected", {
        detail: { lat, lng, name }
      })
    } else {
      const locale = document.documentElement.lang || ""
      const prefix = locale ? `/${locale}` : ""
      window.location.href = `${prefix}/places?lat=${lat}&lng=${lng}`
    }
  }

  setState(state) {
    this.element.dataset.searchState = state
  }

  abortOngoingRequest() {
    if (this.abortController) this.abortController.abort()
  }

  handleSuggestionMouseover(e) {
    const btn = e.target.closest("[data-suggestion-index]")
    if (!btn) return
    const index = parseInt(btn.dataset.suggestionIndex)
    if (index === this.activeIndex) return
    this.activeIndex = index
    this.suggestionsTarget.querySelectorAll(".suggestion-item").forEach((el, i) => {
      el.classList.toggle("suggestion-item-active", i === index)
      el.setAttribute("aria-selected", i === index ? "true" : "false")
    })
  }

  handleSuggestionMousedown(e) {
    const btn = e.target.closest("[data-suggestion-index]")
    if (!btn) return
    e.preventDefault()
    const index = parseInt(btn.dataset.suggestionIndex)
    this.selectPlace(this.features[index])
  }

  handleDocumentClick(event) {
    if (!this.element.contains(event.target)) {
      this.clearSuggestions()
      this.setState("idle")
    }
  }

  urlFor(query) {
    const language = document.documentElement.lang === "en" ? "en" : "pt"
    return `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${this.mapboxKeyValue}&language=${language}&country=BR&types=poi,address`
  }

  localeText(key) {
    const portuguese = document.documentElement.lang !== "en"
    const texts = {
      loading: portuguese ? "Buscando sugestões..." : "Searching suggestions...",
      empty: portuguese ? "Nenhuma sugestão encontrada." : "No suggestions found.",
      error: portuguese ? "Não foi possível carregar sugestões agora." : "Could not load suggestions right now.",
      searchUnavailable: portuguese ? "Busca indisponível no momento." : "Search is currently unavailable."
    }

    return texts[key]
  }
}
