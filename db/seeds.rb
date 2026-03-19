user = User.find_or_create_by!(email: "test@test.com") do |u|
  u.password = "123456"
end

ze = Place.create(name: "Bar do Zé", address: "Rua das Flores, 123, Rio de Janeiro")
Place.create(name: "Restaurante da Maria", address: "Av. Atlântica, 456, Rio de Janeiro")
Place.create(name: "Café Central", address: "Rua XV de Novembro, 789, Rio de Janeiro")

ze.reports.create(user: user, category: "Ambiente", status: "positive", description: "Ótimo lugar!")
ze.reports.create(user: user, category: "Segurança", status: "positive", description: "Muito seguro.")

# Bruno:
# --- LOCAL VERDE (Safe) ---
# Usamos find_or_create_by para o lugar também, assim não duplica no mapa
lapa = Place.find_or_create_by!(name: "Lapa Safe Bar", address: "Av. Mem de Sá, 10, Rio de Janeiro")
if lapa.reports.empty?
  lapa.reports.create!(user: user, category: "Geral", status: "positive", description: "Muito seguro!")
  lapa.reports.create!(user: user, category: "Assédio", status: "positive", description: "Equipe nota 10.")
end
# --- LOCAL VERMELHO (Unsafe) ---
perigoso = Place.find_or_create_by!(name: "Club Alerta", address: "Rua da Passagem, 50, Rio de Janeiro")
if perigoso.reports.empty?
  perigoso.reports.create!(user: user, category: "Assédio", status: "negative", description: "Tive problemas aqui.")
  perigoso.reports.create!(user: user, category: "Segurança", status: "negative", description: "Falta iluminação e revista.")
end
# --- LOCAL MISTO (Para testar o critério de desempate) ---
misto = Place.find_or_create_by!(name: "Bar de Teste Misto", address: "Rua Voluntários da Pátria, 100, Rio de Janeiro")
if misto.reports.empty?
  misto.reports.create!(user: user, category: "Geral", status: "positive", description: "O lugar é legal.")
  misto.reports.create!(user: user, category: "Preconceito", status: "negative", description: "Ambiente pouco inclusivo.")
end
