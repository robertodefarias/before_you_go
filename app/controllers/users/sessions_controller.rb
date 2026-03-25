class Users::SessionsController < Devise::SessionsController
  def new
    store_location_for(:user, params[:return_to]) if params[:return_to].present?
    super
  end
end
