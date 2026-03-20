import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["panel", "toggle"]

  connect() {
    this.handleResize()
  }

  toggle() {
    const expanded = this.toggleTarget.getAttribute("aria-expanded") === "true"
    this.setExpanded(!expanded)
  }

  close() {
    this.setExpanded(false)
  }

  handleResize() {
    if (window.innerWidth > 768) {
      this.setExpanded(false, { forceDesktop: true })
    }
  }

  setExpanded(expanded, options = {}) {
    if (this.hasToggleTarget) {
      this.toggleTarget.setAttribute("aria-expanded", expanded ? "true" : "false")
    }

    if (!this.hasPanelTarget) return

    if (options.forceDesktop && window.innerWidth > 768) {
      this.panelTarget.removeAttribute("data-open")
      return
    }

    if (expanded) {
      this.panelTarget.setAttribute("data-open", "true")
    } else {
      this.panelTarget.removeAttribute("data-open")
    }
  }
}
