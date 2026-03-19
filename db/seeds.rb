user = User.find_or_create_by!(email: "test@test.com") do |u|
  u.password = "123456"
end

ze = Place.find_or_create_by!(name: "Bar do Zé") { |p| p.address = "Rua das Flores, 123, Rio de Janeiro" }
Place.find_or_create_by!(name: "Restaurante da Maria") { |p| p.address = "Av. Atlântica, 456, Rio de Janeiro" }
Place.find_or_create_by!(name: "Café Central") { |p| p.address = "Rua XV de Novembro, 789, Rio de Janeiro" }

ze.reports.find_or_create_by!(user: user, category: "Ambiente", status: "positive") { |r| r.description = "Ótimo lugar!" }
ze.reports.find_or_create_by!(user: user, category: "Segurança", status: "positive") { |r| r.description = "Muito seguro." }
