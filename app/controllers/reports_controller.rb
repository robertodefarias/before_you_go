class ReportsController < ApplicationController
  before_action :authenticate_user!

  def create
    @place = Place.find(params[:list_id])
    @report = Report.new(report_params)
    @report.place = @place
    @report.user = current_user

    if @report.save
      redirect_to list_path(@place), notice: "Report created."
    else
      @reports = @place.reports
      render "places/show", status: :unprocessable_entity
    end
  end

  private

  def report_params
    params.require(:report).permit(:category, :status, :description)
  end
end
