class PlacesController < ApplicationController
  def index
    @places = Place.all

    @markers = @places.map do |place|
      {
        lat: place.latitude,
        lng: place.longitude
      }
    end
  end

  def show
    @place = Place.find(params[:id])
    @reports = @place.reports
    @report = Report.new
  end
end
