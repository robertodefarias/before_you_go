class Place < ApplicationRecord
  has_many :reports
  geocoded_by :address
  after_validation :geocode, if: :address_changed?

  def status
    return "neutral" if reports.empty?

    positive = reports.where(status: "positive").count
    negative = reports.where(status: "negative").count

    positive >= negative ? "positive" : "negative"
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
