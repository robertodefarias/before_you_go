class TranslateReportJob < ApplicationJob
  queue_as :default

  def perform(report_id)
    report = Report.find_by(id: report_id)
    return unless report&.description.present?

    key = ENV.fetch("DEEPL_API_KEY")
    DeepL.configure do |config|
      config.auth_key = key
      config.host = key.end_with?(":fx") ? "https://api-free.deepl.com" : "https://api.deepl.com"
    end

    translation_en = DeepL.translate(report.description, nil, "EN-US")
    translation_pt = DeepL.translate(report.description, nil, "PT-BR")

    report.update_columns(
      description_en: translation_en.text,
      description_pt_br: translation_pt.text
    )
  end
end
