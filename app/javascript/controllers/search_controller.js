import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input", "suggestions"]
  static values = { mapboxKey: String }

  connect() {
    this.timeout = null
    this.abortController = null
    this.suggestions = []
    this.activeIndex = -1
    this.sessionToken = this.generateSessionToken()
  }

  disconnect() {
    clearTimeout(this.timeout)
    this.abortOngoingRequest()
  }

  handleDocumentClick(event) {
    if (!this.element.contains(event.target)) {
      this.clearSuggestions()
      this.setState("idle")
    }
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
    if (!this.suggestions.length) return

    if (event.key === "ArrowDown") {
      event.preventDefault()
      this.activeIndex = (this.activeIndex + 1) % this.suggestions.length
      this.renderSuggestions()
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      this.activeIndex = (this.activeIndex - 1 + this.suggestions.length) % this.suggestions.length
      this.renderSuggestions()
    } else if (event.key === "Enter" && this.activeIndex >= 0) {
      event.preventDefault()
      this.retrieveAndSelect(this.suggestions[this.activeIndex])
    } else if (event.key === "Escape") {
      this.clearSuggestions()
      this.setState("idle")
    }
  }

  fetchSuggestions(query) {
    this.abortOngoingRequest()
    this.abortController = new AbortController()

    fetch(this.suggestUrl(query), { signal: this.abortController.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        this.suggestions = Array.isArray(data.suggestions) ? data.suggestions.slice(0, 5) : []

        if (this.suggestions.length === 0) {
          this.renderMessage(this.localeText("empty"))
          this.setState("empty")
          return
        }

        this.setState("results")
        this.renderSuggestions()
      })
      .catch(error => {
        if (error.name === "AbortError") return

        this.suggestions = []
        this.renderMessage(this.localeText("error"))
        this.setState("error")
      })
      .finally(() => {
        this.abortController = null
      })
  }

  retrieveAndSelect(suggestion) {
    fetch(this.retrieveUrl(suggestion.mapbox_id))
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        const feature = data.features?.[0]
        const fullName = suggestion.place_formatted
          ? `${suggestion.name} — ${suggestion.place_formatted}`
          : suggestion.name

        this.inputTarget.value = fullName
        this.clearSuggestions()
        this.setState("idle")
        this.sessionToken = this.generateSessionToken()

        const locale = document.documentElement.lang || ""
        const prefix = locale ? `/${locale}` : ""

        if (!feature) {
          window.location.href = `${prefix}/places`
          return
        }

        const [lng, lat] = feature.geometry.coordinates
        const mapEl = document.querySelector('[data-controller~="map"]')

        if (mapEl) {
          this.dispatch("placeSelected", { detail: { lat, lng, name: fullName } })
        } else {
          window.location.href = `${prefix}/places?lat=${lat}&lng=${lng}`
        }
      })
      .catch(() => {
        const locale = document.documentElement.lang || ""
        const prefix = locale ? `/${locale}` : ""
        window.location.href = `${prefix}/places`
      })
  }

  renderSuggestions() {
    this.suggestionsTarget.innerHTML = ""
    this.suggestions.forEach((suggestion, index) => {
      const button = document.createElement("button")
      button.type = "button"
      button.className = "suggestion-item"
      if (index === this.activeIndex) button.classList.add("suggestion-item-active")

      button.textContent = `${suggestion.name} — ${this.formatAddress(suggestion)}`

      button.setAttribute("role", "option")
      button.setAttribute("aria-selected", index === this.activeIndex ? "true" : "false")
      button.dataset.suggestionIndex = index
      button.dataset.action = "mouseover->search#highlightSuggestion mousedown->search#pickSuggestion"

      this.suggestionsTarget.appendChild(button)
    })
  }

  highlightSuggestion(event) {
    const index = parseInt(event.currentTarget.dataset.suggestionIndex)
    if (index === this.activeIndex) return
    this.activeIndex = index
    this.suggestionsTarget.querySelectorAll(".suggestion-item").forEach((el, i) => {
      el.classList.toggle("suggestion-item-active", i === index)
      el.setAttribute("aria-selected", i === index ? "true" : "false")
    })
  }

  pickSuggestion(event) {
    event.preventDefault()
    const index = parseInt(event.currentTarget.dataset.suggestionIndex)
    this.retrieveAndSelect(this.suggestions[index])
  }

  formatAddress(suggestion) {
    const ctx = suggestion.context || {}
    const neighborhood = ctx.neighborhood?.name
    const city = ctx.place?.name
    const parts = [neighborhood, city].filter(Boolean)
    return parts.length > 0 ? parts.join(", ") : (suggestion.place_formatted || "")
  }

  clearSuggestions() {
    this.suggestions = []
    this.activeIndex = -1
    this.suggestionsTarget.innerHTML = ""
  }

  renderMessage(message) {
    this.suggestions = []
    this.activeIndex = -1
    this.suggestionsTarget.innerHTML = `<div class="search-feedback">${message}</div>`
  }

  setState(state) {
    this.element.dataset.searchState = state
  }

  abortOngoingRequest() {
    if (this.abortController) this.abortController.abort()
  }

  suggestUrl(query) {
    const language = document.documentElement.lang === "en" ? "en" : "pt"
    const params = new URLSearchParams({
      q: query,
      access_token: this.mapboxKeyValue,
      session_token: this.sessionToken,
      language,
      country: "BR",
      types: "poi,address",
      limit: 5
    })
    return `https://api.mapbox.com/search/searchbox/v1/suggest?${params}`
  }

  retrieveUrl(mapboxId) {
    const params = new URLSearchParams({
      access_token: this.mapboxKeyValue,
      session_token: this.sessionToken
    })
    return `https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}?${params}`
  }

  generateSessionToken() {
    return crypto.randomUUID()
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
