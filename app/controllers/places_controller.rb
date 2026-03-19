class PlacesController < ApplicationController
  def index
    query = params[:query].to_s.strip

    if query.present?
      sql_query = "%#{query}%"
      @places = Place.where("name ILIKE :query OR address ILIKE :query", query: sql_query)
    else
      @places = Place.all
    end

    @markers = @places.select { |place| place.latitude.present? && place.longitude.present? }.map do |place|
      {
        id: place.id,
        lat: place.latitude,
        lng: place.longitude,
        name: place.name,
        address: place.address,
        status: place.status,
        pin_color: place.pin_color
      }
    end
  end

  def show
    @place = Place.find(params[:id])
    @reports = @place.reports
    @report = Report.new
  end

  def create
    @place = Place.new(place_params)

    if @place.save
      render json: { success: true, place_id: @place.id }
    else
      render json: { success: false, errors: @place.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def place_params
    params.permit(:name, :address, :latitude, :longitude)
  end
end
