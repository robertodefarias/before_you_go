class ReportsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_report, only: [:edit, :update, :destroy]
  before_action :check_owner, only: [:edit, :update, :destroy]

  def create
    @place = Place.find(params[:place_id])
    @report = Report.new(report_params)
    @report.place = @place
    @report.user = current_user

    if @report.save
      redirect_to place_path(@place), notice: (I18n.locale == :"pt-BR" ? "Relato enviado com sucesso!" : "Report created.")
    else
      @reports = @place.reports
      render "places/show", status: :unprocessable_entity
    end
  end

  def edit
    @place = @report.place
  end

  def update
    if @report.update(report_params)
      redirect_to place_path(@report.place), notice: "Relato atualizado"
    else
      @place = @report.place
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @place = @report.place
    @report.destroy
    redirect_to place_path(@place), notice: (I18n.locale == :"pt-BR" ? "Relato removido com sucesso!" : "Report deleted.")
  end

  private

  def set_report
    @place = Place.find(params[:place_id])
    @report = Report.find(params[:id])
  end

  def check_owner
    unless @report.user == current_user
      redirect_to places_path, alert: "Voce nao tem permissao para isso"
    end
  end

  def report_params
    params.require(:report).permit(:category, :status, :description)
  end
end
