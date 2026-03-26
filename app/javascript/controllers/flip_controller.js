import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { open: Boolean }

  connect() {
    if (this.openValue) this.element.classList.add("is-flipped")
  }

  toggle() {
    this.element.classList.toggle("is-flipped")
  }
}
