class ApplicationController < ActionController::Base
  before_action :set_locale

  def default_url_options
    { locale: I18n.locale }
  end

  private

  def set_locale
    requested_locale = params[:locale]&.to_sym
    I18n.locale = I18n.available_locales.include?(requested_locale) ? requested_locale : I18n.default_locale
  end
end
