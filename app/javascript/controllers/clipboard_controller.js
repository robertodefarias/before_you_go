import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { text: String, success: String, defaultLabel: String }
  static targets = ["label"]

  async copy() {
    try {
      await navigator.clipboard.writeText(this.textValue)
      this.showSuccess()
    } catch (_error) {
      this.fallbackCopy()
    }
  }

  fallbackCopy() {
    const input = document.createElement("textarea")
    input.value = this.textValue
    input.setAttribute("readonly", "")
    input.style.position = "absolute"
    input.style.left = "-9999px"
    document.body.appendChild(input)
    input.select()
    document.execCommand("copy")
    document.body.removeChild(input)
    this.showSuccess()
  }

  showSuccess() {
    if (!this.hasLabelTarget) return

    this.labelTarget.textContent = this.successValue
    clearTimeout(this.resetTimer)
    this.resetTimer = setTimeout(() => {
      this.labelTarget.textContent = this.defaultLabelValue
    }, 1800)
  }

  disconnect() {
    clearTimeout(this.resetTimer)
  }
}
