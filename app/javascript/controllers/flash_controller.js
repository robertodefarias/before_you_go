import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    // Faz o flash desaparecer sozinho após 5 segundos
    setTimeout(() => {
      this.dismiss()
    }, 3000)
  }

  dismiss() {
    // Adiciona uma animação de saída suave antes de remover
    this.element.style.transition = "opacity 0.5s ease, transform 0.5s ease"
    this.element.style.opacity = "0"
    this.element.style.transform = "translateX(100px)"

    // Remove do DOM após a animação
    setTimeout(() => {
      this.element.remove()
    }, 500)
  }
}
