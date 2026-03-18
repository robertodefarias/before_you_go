user = User.find_or_create_by!(email: "test@test.com") do |u|
  u.password = "123456"
end

ze = Place.create(name: "Bar do Zé", address: "Rua das Flores, 123, Rio de Janeiro")
Place.create(name: "Restaurante da Maria", address: "Av. Atlântica, 456, Rio de Janeiro")
Place.create(name: "Café Central", address: "Rua XV de Novembro, 789, Rio de Janeiro")

ze.reports.create(user: user, category: "Ambiente", status: "positive", description: "Ótimo lugar!")
ze.reports.create(user: user, category: "Segurança", status: "positive", description: "Muito seguro.")
