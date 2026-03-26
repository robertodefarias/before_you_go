class Report < ApplicationRecord
  belongs_to :user
  belongs_to :place

  validates :description, presence: true
  validates :description, length: { minimum: 30, allow_blank: true }

  after_create_commit :enqueue_translation
  after_update_commit :enqueue_translation, if: :saved_change_to_description?

  CATEGORY_KEYS = {
    "Ambiente"    => "ambiente",
    "Segurança"   => "seguranca",
    "Preconceito" => "preconceito",
    "Assédio"     => "assedio",
    "Violência"   => "violencia",
    "Outros"      => "outros",
    "Geral"       => "geral"
  }.freeze

  def translated_category
    key = CATEGORY_KEYS[category]
    key ? I18n.t("reports.categories.#{key}") : category
  end

  def translated_description(locale = I18n.locale)
    case locale.to_s
    when "en"
      description_en.presence || description
    when "pt-BR"
      description_pt_br.presence || description
    else
      description
    end
  end

  private

  def enqueue_translation
    TranslateReportJob.perform_later(id)
  end
end
