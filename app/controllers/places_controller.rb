class PlacesController < ApplicationController
  def index
    @places = Place.all

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
end
