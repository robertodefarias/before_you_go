class Place < ApplicationRecord
  has_many :reports
  has_many :favorites, dependent: :destroy # se o lugar for deletado, remove dos favoritos

  geocoded_by :address
  after_validation :geocode, if: :address_changed?

  def positive_reports_count
    reports.select { |r| r.status == "positive" }.size
  end

  def negative_reports_count
    reports.select { |r| r.status == "negative" }.size
  end
  
  def reports_count
    positive_reports_count + negative_reports_count
  end

  def positive_ratio
    return 0 if reports_count.zero?

    positive_reports_count.to_f / reports_count
  end

  def status
    return "neutral" if reports_count.zero?

    ratio = positive_ratio

    if ratio >= 0.6
      "positive"
    elsif ratio <= 0.4
      "negative"
    else
      "neutral"
    end
  end

  def status_label
    case status
    when "positive" then "Safe"
    when "negative" then "Unsafe"
    else "Neutral"
    end
  end

  def pin_color
    return "gray" if reports_count.zero?

    ratio = positive_ratio

    if ratio >= 0.85
      "green-strong"
    elsif ratio >= 0.7
      "green-medium"
    elsif ratio >= 0.6
      "green-light"
    elsif ratio <= 0.15
      "red-strong"
    elsif ratio <= 0.3
      "red-medium"
    elsif ratio <= 0.4
      "red-light"
    else
      "gray"
    end
  end

end
