class PlacesController < ApplicationController
  def index
    query = params[:query].to_s.strip

    with_reports = Place.includes(:reports)

    if query.present?
      sql_query = "%#{query}%"
      @places = with_reports.where("name ILIKE :query OR address ILIKE :query", query: sql_query)
      @map_places = Place.where.not(latitude: nil, longitude: nil).includes(:reports)
    else
      @places = with_reports.order(created_at: :desc).limit(4) # UI
      @map_places = with_reports # MAPA
    end

    @markers = @map_places.select { |place| place.latitude.present? && place.longitude.present? }.map do |place|
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

    @reports = @place.reports.includes(:user).order(created_at: :desc)

    if user_signed_in?
      @user_report = @reports.find { |r| r.user_id == current_user.id }
      @report = @user_report || @place.reports.build
    else
      @user_report = nil
      @report = @place.reports.build
    end
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
