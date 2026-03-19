class Place < ApplicationRecord
  has_many :reports
  has_many :favorites, dependent: :destroy # se o lugar for deletado, remove dos favoritos
  geocoded_by :address
  after_validation :geocode, if: :address_changed?

  def status
    return "neutral" if reports.empty?

    positive = reports.where(status: "positive").count
    negative = reports.where(status: "negative").count

    positive >= negative ? "positive" : "negative"
  end

  def status_label
    case status
    when "positive" then "Safe"
    when "negative" then "Unsafe"
    else "Neutral"
    end
  end

  def pin_color
    case status
    when "positive" then "green"
    when "negative" then "red"
    else
      "gray"
    end
  end
end
