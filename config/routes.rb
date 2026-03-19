Rails.application.routes.draw do
  devise_for :users

  scope "(:locale)", locale: /en|pt-BR/ do
    root to: "pages#home"

    resources :places, only: [:index, :show] do
      resources :reports, only: [:new, :create]
    end
  end
end
