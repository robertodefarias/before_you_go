class Place < ApplicationRecord
  has_many :reports
  geocoded_by :address
  after_validation :geocode
end
