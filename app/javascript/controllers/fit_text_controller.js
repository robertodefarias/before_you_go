import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    min: { type: Number, default: 20 },
    max: { type: Number, default: 52 }
  }

  connect() {
    this.handleResize = this.fit.bind(this)
    this.resizeObserver = new ResizeObserver(this.handleResize)
    this.resizeObserver.observe(this.element)

    if (this.element.parentElement) {
      this.resizeObserver.observe(this.element.parentElement)
    }

    requestAnimationFrame(() => this.fit())
  }

  disconnect() {
    this.resizeObserver?.disconnect()
  }

  fit() {
    const availableWidth = this.element.parentElement?.clientWidth || this.element.clientWidth

    if (!availableWidth) return

    let low = this.minValue
    let high = this.maxValue
    let best = low

    while (low <= high) {
      const size = Math.floor((low + high) / 2)
      this.element.style.fontSize = `${size}px`

      if (this.element.scrollWidth <= availableWidth) {
        best = size
        low = size + 1
      } else {
        high = size - 1
      }
    }

    this.element.style.fontSize = `${best}px`
  }
}
