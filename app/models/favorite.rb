class Favorite < ApplicationRecord
  belongs_to :user
  belongs_to :place

  # garante que o usuário não favorite o mesmo lugar duas vezes
  validates :user_id, uniqueness: { scope: :place_id }
end
