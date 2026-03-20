Rails.application.routes.draw do
  devise_for :users

  scope "(:locale)", locale: /en|pt-BR/ do
    root to: "pages#home"

    resources :places, only: [:index, :show, :create] do
      resources :reports, only: [:new, :create]
      resources :favorites, only: [:create, :destroy]
    end

    # rota extra para ver todos os favoritos do usuário logado
    get "my_favorites", to: "favorites#index"
  end
end
