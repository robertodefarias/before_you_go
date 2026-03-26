class Report < ApplicationRecord
  belongs_to :user
  belongs_to :place

  validates :description, presence: true
  validates :description, length: { minimum: 30, allow_blank: true }

end
