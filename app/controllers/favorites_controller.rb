class FavoritesController < ApplicationController
  before_action :authenticate_user!

  def index
    @favorites = current_user.favorite_places
  end

  def create
    @place = Place.find(params[:place_id])
    @favorite = Favorite.new(user: current_user, place: @place)

    if @favorite.save
      redirect_to @place, notice: "Lugar salvo nos favoritos!"
    else
      redirect_to @place, alert: "Não foi possível salvar."
    end
  end

  def destroy
    @favorite = current_user.favorites.find(params[:id])
    @place = @favorite.place
    @favorite.destroy
    redirect_to @place, notice: "Removido dos favoritos."
  end
end
