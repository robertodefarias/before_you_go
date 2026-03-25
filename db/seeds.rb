# Desabilita geocoding durante o seed — coordenadas já definidas manualmente
Place.skip_callback(:validation, :after, :geocode)

user = User.find_or_create_by!(email: "test@test.com") do |u|
  u.password = "123456"
end
user.update!(first_name: "João") if user.first_name.blank?

ana    = User.find_or_create_by!(email: "ana@test.com")    { |u| u.password = "123456"; u.first_name = "Ana" }
carlos = User.find_or_create_by!(email: "carlos@test.com") { |u| u.password = "123456"; u.first_name = "Carlos" }

ze = Place.find_or_create_by!(name: "Bar do Zé") { |p| p.address = "Rua das Flores, 123, Rio de Janeiro" }
Place.find_or_create_by!(name: "Restaurante da Maria") { |p| p.address = "Av. Atlântica, 456, Rio de Janeiro" }
Place.find_or_create_by!(name: "Café Central") { |p| p.address = "Rua XV de Novembro, 789, Rio de Janeiro" }

ze.reports.find_or_create_by!(user: user, category: "Ambiente", status: "positive") { |r| r.description = "Ótimo lugar, ambiente muito agradável e acolhedor para todos os públicos." }
ze.reports.find_or_create_by!(user: user, category: "Segurança", status: "positive") { |r| r.description = "Muito seguro, equipe sempre presente e atenta a qualquer situação." }

# Bruno:
# --- LOCAL VERDE (Safe) ---
# Usamos find_or_create_by para o lugar também, assim não duplica no mapa
lapa = Place.find_or_create_by!(name: "Lapa Safe Bar", address: "Av. Mem de Sá, 10, Rio de Janeiro")
if lapa.reports.empty?
  lapa.reports.create!(user: user, category: "Geral", status: "positive", description: "Muito seguro, ambiente tranquilo e equipe sempre presente para ajudar.")
  lapa.reports.create!(user: user, category: "Assédio", status: "positive", description: "Equipe nota 10, sempre atentos e prontos para intervir em qualquer situação.")
end
# --- LOCAL VERMELHO (Unsafe) ---
perigoso = Place.find_or_create_by!(name: "Club Alerta", address: "Rua da Passagem, 50, Rio de Janeiro")
if perigoso.reports.empty?
  perigoso.reports.create!(user: user, category: "Assédio", status: "negative", description: "Tive problemas sérios aqui, situação de assédio sem nenhuma intervenção da equipe.")
  perigoso.reports.create!(user: user, category: "Segurança", status: "negative", description: "Falta iluminação e a revista na entrada é completamente inexistente, muito perigoso.")
end
# --- LOCAL MISTO (Para testar o critério de desempate) ---
misto = Place.find_or_create_by!(name: "Bar de Teste Misto", address: "Rua Voluntários da Pátria, 100, Rio de Janeiro")
if misto.reports.empty?
  misto.reports.create!(user: user, category: "Geral", status: "positive", description: "O lugar é legal no geral, boa música e atendimento razoável durante a semana.")
  misto.reports.create!(user: user, category: "Preconceito", status: "negative", description: "Ambiente pouco inclusivo, percebi claramente discriminação por parte de alguns funcionários.")
end

# --- 25 LUGARES NO RIO DE JANEIRO ---
places_rj = [
  { name: "Bar Bukowski",          address: "Rua Almirante Gonçalves, 50, Copacabana, Rio de Janeiro",      lat: -22.9678, lng: -43.1870, reports: [{ cat: "Ambiente", status: "positive", desc: "Ambiente super acolhedor e diverso, me senti muito à vontade a noite toda." }] },
  { name: "Club Fosfobox",         address: "Rua Siqueira Campos, 143, Copacabana, Rio de Janeiro",         lat: -22.9712, lng: -43.1838, reports: [{ cat: "Segurança", status: "positive", desc: "Segurança excelente na porta, sem problemas durante toda a noite." }, { cat: "Assédio", status: "negative", desc: "Presenciei uma situação desconfortável perto da pista de dança." }] },
  { name: "Barzin",                address: "Rua Farme de Amoedo, 87, Ipanema, Rio de Janeiro",             lat: -22.9855, lng: -43.1957, reports: [{ cat: "Ambiente", status: "positive", desc: "Lugar muito inclusivo e amigável para a comunidade LGBTQ+." }] },
  { name: "La Carioca Cevicheria", address: "Rua Dias Ferreira, 610, Leblon, Rio de Janeiro",               lat: -22.9841, lng: -43.2258, reports: [{ cat: "Segurança", status: "positive", desc: "Nunca tive nenhum problema aqui, equipe sempre atenta." }] },
  { name: "Bar Urca",              address: "Rua Cândido Gaffrée, 205, Urca, Rio de Janeiro",               lat: -22.9509, lng: -43.1677, reports: [{ cat: "Ambiente", status: "positive", desc: "Vista linda e ambiente tranquilo, ótimo para ir com amigos." }] },
  { name: "Empório 37",            address: "Rua Dias Ferreira, 37, Leblon, Rio de Janeiro",                lat: -22.9832, lng: -43.2237, reports: [{ cat: "Preconceito", status: "negative", desc: "Fui mal atendido depois que o funcionário percebeu que eu era gay, situação constrangedora." }, { cat: "Ambiente", status: "positive", desc: "Geralmente tranquilo e agradável, mas a experiência pode variar bastante dependendo do dia." }] },
  { name: "Cine Joia",             address: "Praça Tiradentes, 79, Centro, Rio de Janeiro",                 lat: -22.9093, lng: -43.1785, reports: [{ cat: "Segurança", status: "positive", desc: "Shows ótimos e ambiente seguro, staff muito presente." }] },
  { name: "Casa da Matriz",        address: "Rua Henrique Novaes, 107, Botafogo, Rio de Janeiro",           lat: -22.9497, lng: -43.1868, reports: [{ cat: "Assédio", status: "negative", desc: "Sofri assédio verbal e ninguém da equipe tomou nenhuma atitude." }] },
  { name: "Bar dos Descasados",    address: "Rua Áurea, 80, Santa Teresa, Rio de Janeiro",                  lat: -22.9217, lng: -43.1774, reports: [{ cat: "Ambiente", status: "positive", desc: "Ambiente boêmio e muito acolhedor, me senti em casa." }] },
  { name: "Mirindiba",             address: "Rua Paschoal Carlos Magno, 138, Santa Teresa, Rio de Janeiro", lat: -22.9231, lng: -43.1812, reports: [{ cat: "Segurança", status: "positive", desc: "Lugar charmoso e muito tranquilo, fui várias vezes e nunca tive nenhum incidente." }] },
  { name: "Choperia Bracarense",   address: "Rua José Linhares, 85, Leblon, Rio de Janeiro",                lat: -22.9819, lng: -43.2273, reports: [{ cat: "Preconceito", status: "negative", desc: "Percebi olhares e comentários preconceituosos de outros clientes." }] },
  { name: "Garota de Ipanema Bar", address: "Rua Vinicius de Moraes, 49, Ipanema, Rio de Janeiro",          lat: -22.9847, lng: -43.1977, reports: [{ cat: "Ambiente", status: "positive", desc: "Clássico carioca, ambiente relaxado e sem julgamentos." }] },
  { name: "The Week Rio",          address: "Rua Sacadura Cabral, 154, Saúde, Rio de Janeiro",              lat: -22.8964, lng: -43.1839, reports: [{ cat: "Segurança", status: "positive", desc: "Estrutura de segurança impecável, me senti muito protegido a noite toda." }, { cat: "Ambiente", status: "positive", desc: "Melhor clube LGBTQ+ do Rio, ambiente muito inclusivo e acolhedor." }] },
  { name: "Leviano Bar",           address: "Av. Bartolomeu Mitre, 370, Leblon, Rio de Janeiro",            lat: -22.9826, lng: -43.2302, reports: [{ cat: "Assédio", status: "negative", desc: "Assédio constante por parte de um grupo de clientes sem intervenção da equipe." }] },
  { name: "Jobi Bar",              address: "Av. Ataulfo de Paiva, 1166, Leblon, Rio de Janeiro",           lat: -22.9807, lng: -43.2265, reports: [{ cat: "Ambiente", status: "positive", desc: "Botequim tradicional, pessoal muito simpático e sem frescura." }] },
  { name: "Lapa 40 Graus",         address: "Rua do Riachuelo, 97, Lapa, Rio de Janeiro",                   lat: -22.9127, lng: -43.1817, reports: [{ cat: "Violência", status: "negative", desc: "Briga séria dentro do estabelecimento e segurança demorou muito para agir." }] },
  { name: "Bar do Mineiro",        address: "Rua Paschoal Carlos Magno, 99, Santa Teresa, Rio de Janeiro",  lat: -22.9224, lng: -43.1803, reports: [{ cat: "Ambiente", status: "positive", desc: "Comida boa e ambiente familiar, sem nenhuma ocorrência." }] },
  { name: "Venga!",                address: "Rua Farme de Amoedo, 41, Ipanema, Rio de Janeiro",             lat: -22.9849, lng: -43.1950, reports: [{ cat: "Ambiente", status: "positive", desc: "Bar LGBTQ+ friendly, staff muito atencioso e ambiente seguro." }] },
  { name: "Clube dos Democratas", address: "Rua Riachuelo, 91, Lapa, Rio de Janeiro",                       lat: -22.9133, lng: -43.1810, reports: [{ cat: "Segurança", status: "positive", desc: "Baile tradicional, movimento intenso mas equipe bem preparada." }] },
  { name: "Scenarium",             address: "Rua do Lavradio, 20, Lapa, Rio de Janeiro",                    lat: -22.9106, lng: -43.1789, reports: [{ cat: "Preconceito", status: "negative", desc: "Funcionário foi grosseiro ao ver dois homens se beijando, situação horrível." }, { cat: "Ambiente", status: "positive", desc: "Decoração incrível e samba ao vivo imperdível, uma experiência única." }] },
  { name: "Bar Lagoa",             address: "Av. Epitácio Pessoa, 1674, Lagoa, Rio de Janeiro",             lat: -22.9714, lng: -43.2109, reports: [{ cat: "Ambiente", status: "positive", desc: "Vista para a lagoa maravilhosa, ambiente calmo e agradável." }] },
  { name: "Palaphita Kitch",       address: "Av. Epitácio Pessoa, Quiosque 20, Lagoa, Rio de Janeiro",      lat: -22.9689, lng: -43.2142, reports: [{ cat: "Segurança", status: "positive", desc: "Ambiente ao ar livre bem monitorado, me senti seguro." }] },
  { name: "Melt Bar",              address: "Rua General Urquiza, 102, Leblon, Rio de Janeiro",             lat: -22.9798, lng: -43.2241, reports: [{ cat: "Assédio", status: "negative", desc: "Situação de assédio ignorada pelos seguranças na entrada." }] },
  { name: "Maze Inn Bar",          address: "Rua Tavares Bastos, 414, Catete, Rio de Janeiro",              lat: -22.9297, lng: -43.1753, reports: [{ cat: "Ambiente", status: "positive", desc: "Vista incrível do morro, ambiente diverso e super receptivo." }] },
  { name: "Baixo Gávea",          address: "Praça Santos Dumont, Gávea, Rio de Janeiro",                    lat: -22.9751, lng: -43.2333, reports: [{ cat: "Segurança", status: "positive", desc: "Área movimentada mas com boa presença de segurança." }, { cat: "Ambiente", status: "positive", desc: "Ponto de encontro clássico, muito agitado e divertido." }] }
]

places_rj.each do |data|
  place = Place.find_or_create_by!(name: data[:name]) do |p|
    p.address   = data[:address]
    p.latitude  = data[:lat]
    p.longitude = data[:lng]
  end

  next unless place.reports.empty?

  data[:reports].each do |r|
    place.reports.create!(user: user, category: r[:cat], status: r[:status], description: r[:desc])
  end
end

# --- LUGARES PELO BRASIL ---
brasil_places = [
  { name: "Bar Brahma",               address: "Av. São João, 677, Centro, São Paulo, SP",                  lat: -23.5425, lng: -46.6406 },
  { name: "A Barulheira",             address: "Rua Frei Caneca, 916, Consolação, São Paulo, SP",           lat: -23.5548, lng: -46.6531 },
  { name: "The Blue Pub",             address: "Rua Augusta, 765, Consolação, São Paulo, SP",               lat: -23.5521, lng: -46.6484 },
  { name: "Clube Buena Vista",        address: "Rua Aspicuelta, 58, Vila Madalena, São Paulo, SP",          lat: -23.5548, lng: -46.6936 },
  { name: "Bar Balcão",               address: "Rua Dr. Melo Alves, 150, Jardins, São Paulo, SP",           lat: -23.5583, lng: -46.6636 },
  { name: "Pelourinho Bar",           address: "Largo do Pelourinho, 12, Salvador, BA",                     lat: -12.9714, lng: -38.5097 },
  { name: "Beco dos Artistas",        address: "Rua das Laranjeiras, 15, Barra, Salvador, BA",              lat: -13.0054, lng: -38.5321 },
  { name: "Bar do Reggae",            address: "Rua Portas do Carmo, 21, Salvador, BA",                     lat: -12.9748, lng: -38.5118 },
  { name: "Boteco da Praia",          address: "Av. Presidente Vargas, 10, Ponta Negra, Manaus, AM",        lat: -3.0735,  lng: -60.0291 },
  { name: "Studio 5 Club",            address: "Av. Constantino Nery, 3399, Chapada, Manaus, AM",           lat: -3.0919,  lng: -60.0102 },
  { name: "Bar do Ferreira",          address: "Rua da Aurora, 463, Boa Vista, Recife, PE",                 lat: -8.0610,  lng: -34.8994 },
  { name: "Baiúca Bar",               address: "Rua Mamede Simões, 80, Boa Viagem, Recife, PE",             lat: -8.1189,  lng: -34.9003 },
  { name: "Armazém 5",                address: "Rua Professor Walter Baumgarten, 500, Fortaleza, CE",       lat: -3.7327,  lng: -38.5013 },
  { name: "Boteco Praia de Iracema",  address: "Rua dos Tabajaras, 325, Praia de Iracema, Fortaleza, CE",  lat: -3.7270,  lng: -38.5109 },
  { name: "Casa de Shows Náutico",    address: "Av. Boa Viagem, 4070, Boa Viagem, Recife, PE",              lat: -8.1032,  lng: -34.9012 },
  { name: "Opinião",                  address: "Rua José do Patrocínio, 834, Cidade Baixa, Porto Alegre, RS", lat: -30.0408, lng: -51.2199 },
  { name: "Bar Ocidente",             address: "Av. Osvaldo Aranha, 960, Bom Fim, Porto Alegre, RS",        lat: -30.0369, lng: -51.2211 },
  { name: "Toca da Coruja",           address: "Rua Padre Chagas, 342, Moinhos de Vento, Porto Alegre, RS", lat: -30.0291, lng: -51.2024 },
  { name: "Razzmatazz Curitiba",      address: "Rua Mateus Leme, 1200, São Francisco, Curitiba, PR",        lat: -25.4086, lng: -49.2614 },
  { name: "Bar do Victor",            address: "Rua 24 Horas, 52, Centro, Curitiba, PR",                    lat: -25.4296, lng: -49.2714 }
]

brasil_places.each do |data|
  Place.find_or_create_by!(name: data[:name]) do |p|
    p.address   = data[:address]
    p.latitude  = data[:lat]
    p.longitude = data[:lng]
  end
end

# --- 20 REPORTS DO JOÃO ---
joao_reports = [
  { place: "Bar Brahma",              cat: "Ambiente",   status: "positive",  desc: "Ambiente histórico e muito acolhedor, nunca me senti excluído ou desconfortável por lá." },
  { place: "A Barulheira",            cat: "Assédio",    status: "negative",  desc: "Sofri assédio verbal na fila de entrada e nenhum segurança tomou qualquer providência." },
  { place: "The Blue Pub",            cat: "Ambiente",   status: "positive",  desc: "Um dos bares mais inclusivos que já fui em SP, staff muito atencioso e diverso." },
  { place: "Clube Buena Vista",       cat: "Segurança",  status: "positive",  desc: "Segurança bem treinada e presença constante dentro e fora do estabelecimento." },
  { place: "Bar Balcão",              cat: "Preconceito", status: "negative", desc: "Fui mal atendido de forma clara após demonstrar afeto pelo meu namorado." },
  { place: "Pelourinho Bar",          cat: "Ambiente",   status: "positive",  desc: "Lugar lindo com muita cultura local, me senti respeitado e bem-vindo durante toda a noite." },
  { place: "Beco dos Artistas",       cat: "Segurança",  status: "positive",  desc: "Ótima iluminação, movimento saudável e equipe sempre por perto para qualquer necessidade." },
  { place: "Bar do Reggae",           cat: "Assédio",    status: "negative",  desc: "Presenciei cenas de assédio repetidas durante a noite sem nenhuma intervenção da equipe." },
  { place: "Boteco da Praia",         cat: "Ambiente",   status: "positive",  desc: "Vista incrível do Rio Negro e atendimento super simpático, recomendo sem reservas." },
  { place: "Studio 5 Club",           cat: "Segurança",  status: "negative",  desc: "Segurança muito negligente, presenciei situação de risco que foi completamente ignorada." },
  { place: "Bar do Ferreira",         cat: "Ambiente",   status: "positive",  desc: "Bar tradicional de Recife, pessoal muito acolhedor e ambiente sem preconceitos." },
  { place: "Baiúca Bar",              cat: "Preconceito", status: "negative", desc: "Funcionário fez comentário homofóbico na minha frente sem nenhum constrangimento." },
  { place: "Armazém 5",              cat: "Ambiente",   status: "positive",  desc: "Show ao vivo excelente e ambiente bem diverso, me senti muito à vontade durante toda a noite." },
  { place: "Boteco Praia de Iracema", cat: "Segurança",  status: "positive",  desc: "Equipe bem preparada e estrutura de segurança adequada para o tamanho do local." },
  { place: "Casa de Shows Náutico",   cat: "Violência",  status: "negative",  desc: "Testemunhei uma briga séria dentro do estabelecimento e a segurança demorou muito para agir." },
  { place: "Opinião",                 cat: "Ambiente",   status: "positive",  desc: "Casa de shows referência em Porto Alegre, ambiente muito inclusivo e shows incríveis." },
  { place: "Bar Ocidente",            cat: "Assédio",    status: "negative",  desc: "Fui assediado na pista de dança de forma insistente sem nenhuma ajuda da equipe do bar." },
  { place: "Toca da Coruja",          cat: "Segurança",  status: "positive",  desc: "Ambiente tranquilo e bem monitorado, nunca me senti em risco em nenhuma das minhas visitas." },
  { place: "Razzmatazz Curitiba",     cat: "Ambiente",   status: "positive",  desc: "Balada muito inclusiva em Curitiba, diversidade total e sem julgamentos de nenhum tipo." },
  { place: "Bar do Victor",           cat: "Preconceito", status: "negative", desc: "Grupo de clientes fez piadas preconceituosas em voz alta e nenhum funcionário interveio." }
]

joao_reports.each do |r|
  place = Place.find_by!(name: r[:place])
  next if place.reports.exists?(user: user)
  place.reports.create!(user: user, category: r[:cat], status: r[:status], description: r[:desc])
end

# --- 20 REPORTS DA ANA ---
ana_reports = [
  { place: "Bar Brahma",              cat: "Segurança",   status: "positive",  desc: "Fui várias vezes e sempre me senti muito segura, a equipe é muito atenta e respeitosa." },
  { place: "A Barulheira",            cat: "Ambiente",    status: "positive",  desc: "Gosto muito do ambiente despojado e da diversidade de público que encontro sempre por lá." },
  { place: "The Blue Pub",            cat: "Preconceito", status: "negative",  desc: "Ouvi comentários transfóbicos de um grupo de clientes que não foram repreendidos pela equipe." },
  { place: "Clube Buena Vista",       cat: "Assédio",     status: "negative",  desc: "Sofri assédio físico na pista e o segurança minimizou a situação quando pedi ajuda." },
  { place: "Bar Balcão",              cat: "Ambiente",    status: "positive",  desc: "Ótimo para encontrar amigos, música boa e ambiente bem tranquilo e sem tensão nenhuma." },
  { place: "Pelourinho Bar",          cat: "Preconceito", status: "negative",  desc: "Atendente fez comentário lesbofóbico de forma velada que me deixou muito desconfortável." },
  { place: "Beco dos Artistas",       cat: "Ambiente",    status: "positive",  desc: "Lugar muito charmoso com arte local por toda parte, me senti super bem recebida." },
  { place: "Bar do Reggae",           cat: "Segurança",   status: "positive",  desc: "Apesar do movimento intenso a equipe de segurança estava sempre por perto e atenta." },
  { place: "Boteco da Praia",         cat: "Assédio",     status: "negative",  desc: "Fui assediada verbalmente por outros clientes de forma repetida durante toda a noite." },
  { place: "Studio 5 Club",           cat: "Ambiente",    status: "positive",  desc: "Clube animado com boa diversidade de público, gostei bastante da experiência em geral." },
  { place: "Bar do Ferreira",         cat: "Violência",   status: "negative",  desc: "Testemunhei uma agressão física próxima ao banheiro que deixou todos muito assustados." },
  { place: "Baiúca Bar",              cat: "Ambiente",    status: "positive",  desc: "Ambiente à beira-mar muito gostoso, atendimento simpático e sem nenhum episódio negativo." },
  { place: "Armazém 5",              cat: "Preconceito", status: "negative",  desc: "Seguranças foram seletivos e preconceituosos na entrada, barrei junto com amigas trans." },
  { place: "Boteco Praia de Iracema", cat: "Ambiente",    status: "positive",  desc: "Vista linda do pôr do sol e clima muito descontraído, ótimo para sair sem preocupação." },
  { place: "Casa de Shows Náutico",   cat: "Segurança",   status: "positive",  desc: "Shows grandes e estrutura de segurança adequada, me senti protegida durante todo o evento." },
  { place: "Opinião",                 cat: "Assédio",     status: "negative",  desc: "Sofri assédio persistente por parte de um cliente e a equipe não deu atenção à situação." },
  { place: "Bar Ocidente",            cat: "Ambiente",    status: "positive",  desc: "Bom Fim tem uma energia única e o Bar Ocidente reflete isso, muito inclusivo e divertido." },
  { place: "Toca da Coruja",          cat: "Preconceito", status: "negative",  desc: "Fui ignorada pelo garçom enquanto mesas ao redor eram atendidas claramente por preferência." },
  { place: "Razzmatazz Curitiba",     cat: "Segurança",   status: "positive",  desc: "Equipe de segurança bem treinada, me abordaram de forma respeitosa quando pedi ajuda." },
  { place: "Bar do Victor",           cat: "Ambiente",    status: "positive",  desc: "Lugar charmoso no centro de Curitiba, ótimo para uma saída tranquila sem preocupações." }
]

ana_reports.each do |r|
  place = Place.find_by!(name: r[:place])
  next if place.reports.exists?(user: ana)
  place.reports.create!(user: ana, category: r[:cat], status: r[:status], description: r[:desc])
end

# --- 20 REPORTS DO CARLOS ---
carlos_reports = [
  { place: "Bar Brahma",              cat: "Preconceito", status: "negative",  desc: "Funcionário foi visivelmente grosseiro após perceber que eu e meu parceiro éramos um casal." },
  { place: "A Barulheira",            cat: "Segurança",   status: "positive",  desc: "Nunca tive problemas, segurança sempre presente e equipe muito bem treinada para a função." },
  { place: "The Blue Pub",            cat: "Assédio",     status: "negative",  desc: "Presenciei cenas de assédio que foram completamente ignoradas pelos funcionários presentes." },
  { place: "Clube Buena Vista",       cat: "Ambiente",    status: "positive",  desc: "Melhor bar da Vila Madalena na minha opinião, ambiente super acolhedor e sem preconceito." },
  { place: "Bar Balcão",              cat: "Segurança",   status: "positive",  desc: "Excelente estrutura, saída bem monitorada e sem situações de risco em nenhuma das visitas." },
  { place: "Pelourinho Bar",          cat: "Violência",   status: "negative",  desc: "Assisti a uma briga que envolveu agressão física e a segurança levou muito tempo para agir." },
  { place: "Beco dos Artistas",       cat: "Preconceito", status: "negative",  desc: "Grupo de clientes fez comentários homofóbicos em voz alta por longos minutos sem interrupção." },
  { place: "Bar do Reggae",           cat: "Ambiente",    status: "positive",  desc: "Reggae ao vivo e público muito diverso e receptivo, me senti completamente à vontade." },
  { place: "Boteco da Praia",         cat: "Segurança",   status: "positive",  desc: "Apesar de ser em área mais periférica me senti seguro, equipe muito bem preparada." },
  { place: "Studio 5 Club",           cat: "Assédio",     status: "negative",  desc: "Assédio recorrente na pista de dança com omissão completa da equipe de segurança presente." },
  { place: "Bar do Ferreira",         cat: "Ambiente",    status: "positive",  desc: "Bar boêmio à beira do rio com muito charme, público diverso e sem qualquer tipo de julgamento." },
  { place: "Baiúca Bar",              cat: "Segurança",   status: "positive",  desc: "Boa estrutura de segurança para o tamanho do bar, me senti tranquilo durante toda a visita." },
  { place: "Armazém 5",              cat: "Ambiente",    status: "positive",  desc: "Fortaleza tem uma cena noturna incrível e o Armazém 5 é um dos melhores exemplos disso." },
  { place: "Boteco Praia de Iracema", cat: "Assédio",     status: "negative",  desc: "Fui abordado de forma insistente por um cliente sem que ninguém da equipe interferisse." },
  { place: "Casa de Shows Náutico",   cat: "Ambiente",    status: "positive",  desc: "Estrutura impecável para shows, ambiente bem organizado e sem episódios negativos registrados." },
  { place: "Opinião",                 cat: "Preconceito", status: "negative",  desc: "Seguranças fizeram comentário desnecessário sobre minha aparência na entrada do evento." },
  { place: "Bar Ocidente",            cat: "Segurança",   status: "positive",  desc: "Ótima equipe de segurança e ambiente muito bem iluminado, nunca me senti inseguro por lá." },
  { place: "Toca da Coruja",          cat: "Ambiente",    status: "positive",  desc: "Bar elegante e muito tranquilo em Moinhos de Vento, atendimento excepcional e sem incidentes." },
  { place: "Razzmatazz Curitiba",     cat: "Violência",   status: "negative",  desc: "Presenciei uma confusão séria próxima à saída que assustou muita gente, mal gerenciada." },
  { place: "Bar do Victor",           cat: "Segurança",   status: "positive",  desc: "Centro de Curitiba e mesmo assim me senti seguro a noite toda, boa estrutura de controle." }
]

carlos_reports.each do |r|
  place = Place.find_by!(name: r[:place])
  next if place.reports.exists?(user: carlos)
  place.reports.create!(user: carlos, category: r[:cat], status: r[:status], description: r[:desc])
end

# --- 30 NOVOS LUGARES PELO BRASIL ---
novos_lugares = [
  { name: "Bar Beirute BH",           address: "Rua Antônio de Albuquerque, 514, Savassi, Belo Horizonte, MG", lat: -19.9363, lng: -43.9344 },
  { name: "Café com Letras",           address: "Rua Antônio de Albuquerque, 781, Savassi, Belo Horizonte, MG", lat: -19.9371, lng: -43.9355 },
  { name: "Bukowski BH",              address: "Rua Fernandes Tourinho, 358, Savassi, Belo Horizonte, MG",     lat: -19.9378, lng: -43.9361 },
  { name: "Manifesto Bar",            address: "Rua Antônio de Albuquerque, 399, Savassi, Belo Horizonte, MG", lat: -19.9357, lng: -43.9340 },
  { name: "Bar Brasília",             address: "SCLS 412, Bloco C, Asa Sul, Brasília, DF",                     lat: -15.8267, lng: -47.9218 },
  { name: "Clube do Choro",           address: "SEPS 713/913, Asa Sul, Brasília, DF",                          lat: -15.8214, lng: -47.9176 },
  { name: "Antro Pub",                address: "CLN 408, Bloco D, Asa Norte, Brasília, DF",                    lat: -15.7631, lng: -47.8892 },
  { name: "Hangar 110",               address: "SHS Quadra 6, Setor Hoteleiro Sul, Brasília, DF",              lat: -15.7939, lng: -47.8828 },
  { name: "John Bull Pub",            address: "Rua Felipe Schmidt, 58, Centro, Florianópolis, SC",            lat: -27.5935, lng: -48.5490 },
  { name: "Bar do Ataliba",           address: "Rua Bocaiúva, 1508, Centro, Florianópolis, SC",                lat: -27.5952, lng: -48.5480 },
  { name: "Dado Bier Floripa",        address: "Rodovia SC-401, 2356, Santo Antônio, Florianópolis, SC",       lat: -27.5514, lng: -48.5024 },
  { name: "Goianésia Bar",            address: "Rua 3, 840, Setor Oeste, Goiânia, GO",                         lat: -16.6799, lng: -49.2577 },
  { name: "Aramará Bar",              address: "Rua T-37, 1200, Setor Bueno, Goiânia, GO",                     lat: -16.7023, lng: -49.2641 },
  { name: "Ver-o-Peso Bar",           address: "Av. Castilhos França, 180, Cidade Velha, Belém, PA",           lat: -1.4507,  lng: -48.5028 },
  { name: "Estação das Docas",        address: "Bulevar Castilhos França, Campina, Belém, PA",                 lat: -1.4480,  lng: -48.4998 },
  { name: "Bar do Meio",              address: "Rua Chile, 120, Praia do Meio, Natal, RN",                     lat: -5.7836,  lng: -35.1981 },
  { name: "Barcas Bar",               address: "Av. Presidente Café Filho, 10, Praia do Forte, Natal, RN",    lat: -5.7718,  lng: -35.1989 },
  { name: "Slow Bar",                 address: "Rua Coração de Jesus, 46, Centro, João Pessoa, PB",            lat: -7.1197,  lng: -34.8816 },
  { name: "Café Epitácio",            address: "Av. Epitácio Pessoa, 4946, Tambaú, João Pessoa, PB",           lat: -7.1198,  lng: -34.8387 },
  { name: "Jaraguá Bar",              address: "Rua Sá e Albuquerque, 30, Jaraguá, Maceió, AL",               lat: -9.6627,  lng: -35.7352 },
  { name: "Bar do Francis",           address: "Rua Engenheiro Paulo Brandão Nogueira, 80, Jatiúca, Maceió, AL", lat: -9.6219, lng: -35.7043 },
  { name: "Buritis Bar",              address: "Rua Barão do Rio Branco, 15, Centro, Campo Grande, MS",        lat: -20.4697, lng: -54.6201 },
  { name: "Pub 540",                  address: "Av. Afonso Pena, 2270, Centro, Campo Grande, MS",              lat: -20.4644, lng: -54.6155 },
  { name: "Bar Central Vitória",      address: "Rua Sete de Setembro, 507, Centro, Vitória, ES",               lat: -20.3155, lng: -40.3128 },
  { name: "Bohemia Club",             address: "Rua Joaquim Lírio, 80, Praia do Canto, Vitória, ES",           lat: -20.2983, lng: -40.3041 },
  { name: "Antigamente Bar",          address: "Rua da Paz, 230, Centro Histórico, São Luís, MA",              lat: -2.5283,  lng: -44.3018 },
  { name: "Bar do Nelson",            address: "Av. Litorânea, 12, Calhau, São Luís, MA",                      lat: -2.4978,  lng: -44.2621 },
  { name: "Casa Mágica",              address: "Rua do Giz, 42, Centro Histórico, São Luís, MA",               lat: -2.5291,  lng: -44.3025 },
  { name: "Quixabeira Bar",           address: "Rua das Laranjeiras, 311, Pituba, Salvador, BA",               lat: -12.9908, lng: -38.4579 },
  { name: "Ó do Borogodó",            address: "Rua Inácio Acioli, 1, Lapa, São Paulo, SP",                   lat: -23.5353, lng: -46.6424 }
]

novos_lugares.each do |data|
  Place.find_or_create_by!(name: data[:name]) do |p|
    p.address   = data[:address]
    p.latitude  = data[:lat]
    p.longitude = data[:lng]
  end
end

# --- 30 REPORTS DO JOÃO (novos lugares, distribuição variada) ---
joao_extra = [
  { place: "Bar Beirute BH",      cat: "Ambiente",    status: "positive",  desc: "Clássico de BH, ambiente muito acolhedor e diverso, frequento há anos sem nenhum problema." },
  { place: "Bar Beirute BH",      cat: "Segurança",   status: "positive",  desc: "Equipe sempre atenta e presente, nunca vi nenhuma situação de risco no local." },
  { place: "Café com Letras",     cat: "Ambiente",    status: "positive",  desc: "Espaço cultural incrível em BH, muito inclusivo e com eventos para todos os públicos." },
  { place: "Bukowski BH",         cat: "Assédio",     status: "negative",  desc: "Sofri assédio verbal na fila e a equipe não tomou nenhuma atitude quando relatei." },
  { place: "Manifesto Bar",       cat: "Ambiente",    status: "positive",  desc: "Nome condiz com a proposta, ambiente muito político e acolhedor para a diversidade." },
  { place: "Bar Brasília",        cat: "Segurança",   status: "positive",  desc: "Bar tradicional de Brasília, equipe bem treinada e ambiente sem nenhum tipo de tensão." },
  { place: "Clube do Choro",      cat: "Ambiente",    status: "positive",  desc: "Música ao vivo maravilhosa e ambiente muito respeitoso, me senti completamente à vontade." },
  { place: "Antro Pub",           cat: "Preconceito", status: "negative",  desc: "Ouvi comentários homofóbicos de um grupo de clientes que não foram repreendidos por ninguém." },
  { place: "Hangar 110",          cat: "Violência",   status: "negative",  desc: "Presenciei uma briga séria no banheiro que a segurança demorou muito tempo para conter." },
  { place: "John Bull Pub",       cat: "Ambiente",    status: "positive",  desc: "Pub inglês muito charmoso em Floripa, público diverso e equipe super receptiva." },
  { place: "Bar do Ataliba",      cat: "Segurança",   status: "positive",  desc: "Local tranquilo no centro de Florianópolis, me senti seguro em todas as minhas visitas." },
  { place: "Dado Bier Floripa",   cat: "Ambiente",    status: "positive",  desc: "Estrutura ótima, ambiente bem organizado e sem nenhum episódio negativo que eu tenha presenciado." },
  { place: "Goianésia Bar",       cat: "Assédio",     status: "negative",  desc: "Assédio recorrente na pista sem qualquer intervenção da equipe de segurança do local." },
  { place: "Aramará Bar",         cat: "Ambiente",    status: "positive",  desc: "Ótimo bar no Setor Bueno, público diverso e atendimento excelente em todas as visitas." },
  { place: "Ver-o-Peso Bar",      cat: "Segurança",   status: "positive",  desc: "Ambiente à beira do porto muito charmoso e bem monitorado, me senti seguro a noite toda." },
  { place: "Estação das Docas",   cat: "Ambiente",    status: "positive",  desc: "Estrutura impecável em Belém, muito inclusivo e com ótima programação cultural noturna." },
  { place: "Bar do Meio",         cat: "Preconceito", status: "negative",  desc: "Funcionário fez piada preconceituosa sobre minha aparência na frente de outros clientes." },
  { place: "Barcas Bar",          cat: "Ambiente",    status: "positive",  desc: "Vista linda para o mar em Natal, ambiente descontraído e público bem diverso e receptivo." },
  { place: "Slow Bar",            cat: "Segurança",   status: "positive",  desc: "Bar tranquilo em João Pessoa, equipe sempre atenta e ambiente sem nenhum tipo de tensão." },
  { place: "Café Epitácio",       cat: "Ambiente",    status: "positive",  desc: "Frente ao mar em Tambaú, ótimo para uma saída segura e relaxada com amigos ou casal." },
  { place: "Jaraguá Bar",         cat: "Violência",   status: "negative",  desc: "Testemunhei agressão física próxima à saída sem nenhuma reação rápida da segurança." },
  { place: "Bar do Francis",      cat: "Ambiente",    status: "positive",  desc: "Jatiúca tem ótimos bares e esse é um dos melhores, ambiente muito acolhedor e inclusivo." },
  { place: "Buritis Bar",         cat: "Segurança",   status: "positive",  desc: "Campo Grande tem uma cena noturna crescente e o Buritis é referência de ambiente seguro." },
  { place: "Bar Central Vitória", cat: "Ambiente",    status: "positive",  desc: "Centro histórico de Vitória tem muito charme, bar acolhedor e sem nenhum episódio negativo." },
  { place: "Bohemia Club",        cat: "Assédio",     status: "negative",  desc: "Assédio físico na pista e segurança recusou ajuda dizendo que era brincadeira entre conhecidos." },
  { place: "Antigamente Bar",     cat: "Ambiente",    status: "positive",  desc: "Centro histórico de São Luís é lindo e o bar reflete isso com ambiente muito acolhedor." },
  { place: "Bar do Nelson",       cat: "Segurança",   status: "positive",  desc: "Beira-mar do Calhau com boa estrutura de segurança, me senti tranquilo durante toda a noite." },
  { place: "Casa Mágica",         cat: "Preconceito", status: "negative",  desc: "Atendimento claramente diferenciado para pessoas LGBTQ+, situação muito desconfortável." },
  { place: "Quixabeira Bar",      cat: "Ambiente",    status: "positive",  desc: "Pituba é o bairro mais animado de Salvador, bar com ótimo ambiente e público diverso." },
  { place: "Ó do Borogodó",       cat: "Ambiente",    status: "positive",  desc: "Samba na Lapa paulistana com muito charme, ambiente acolhedor e sem nenhum tipo de preconceito." }
]

joao_extra.each do |r|
  place = Place.find_by!(name: r[:place])
  next if place.reports.exists?(user: user)
  place.reports.create!(user: user, category: r[:cat], status: r[:status], description: r[:desc])
end

# --- 30 REPORTS DA ANA (novos lugares + alguns RJ, distribuição variada) ---
ana_extra = [
  { place: "Bar Beirute BH",      cat: "Preconceito", status: "negative",  desc: "Fui ignorada pelo garçom de forma sistemática enquanto homens ao redor eram atendidos rapidamente." },
  { place: "Café com Letras",     cat: "Segurança",   status: "positive",  desc: "Espaço muito seguro e bem iluminado, equipe atenta e nunca tive nenhum problema por lá." },
  { place: "Bukowski BH",         cat: "Ambiente",    status: "positive",  desc: "Gosto muito do ambiente alternativo do Bukowski BH, muito inclusivo e sem julgamentos." },
  { place: "Bar Brasília",        cat: "Assédio",     status: "negative",  desc: "Fui assediada de forma insistente e o segurança disse que eu devia estar exagerando na situação." },
  { place: "Clube do Choro",      cat: "Ambiente",    status: "positive",  desc: "Música ao vivo incrível e público muito respeitoso, uma das melhores experiências que tive." },
  { place: "Antro Pub",           cat: "Segurança",   status: "positive",  desc: "Pub animado com equipe de segurança bem presente, me senti protegida durante toda a noite." },
  { place: "John Bull Pub",       cat: "Preconceito", status: "negative",  desc: "Comentário lesbofóbico de um funcionário na hora de atender, situação horrível e constrangedora." },
  { place: "Bar do Ataliba",      cat: "Ambiente",    status: "positive",  desc: "Lugar super charmoso no centro de Floripa, público diverso e atendimento sem nenhum problema." },
  { place: "Goianésia Bar",       cat: "Segurança",   status: "positive",  desc: "Goiânia tem evoluído muito e o Goianésia reflete isso com ambiente bem monitorado e seguro." },
  { place: "Ver-o-Peso Bar",      cat: "Assédio",     status: "negative",  desc: "Assédio verbal por parte de um grupo de clientes que a equipe se recusou a retirar do local." },
  { place: "Estação das Docas",   cat: "Ambiente",    status: "positive",  desc: "Uma das experiências mais agradáveis que tive no Norte do Brasil, muito inclusivo e bonito." },
  { place: "Bar do Meio",         cat: "Segurança",   status: "positive",  desc: "Equipe bem treinada em Natal, ambiente seguro e nunca presenciei nenhuma situação de risco." },
  { place: "Slow Bar",            cat: "Ambiente",    status: "positive",  desc: "Bar alternativo muito bacana em João Pessoa, ótima programação e ambiente totalmente inclusivo." },
  { place: "Jaraguá Bar",         cat: "Ambiente",    status: "positive",  desc: "O bairro Jaraguá tem muita história e o bar reflete isso com ambiente acolhedor e diverso." },
  { place: "Buritis Bar",         cat: "Preconceito", status: "negative",  desc: "Seguranças fizeram comentário sobre minha roupa na entrada de forma claramente discriminatória." },
  { place: "Bar Central Vitória", cat: "Segurança",   status: "positive",  desc: "Centro de Vitória com boa estrutura de segurança, equipe presente e atenta a tudo." },
  { place: "Bohemia Club",        cat: "Ambiente",    status: "positive",  desc: "Praia do Canto é ótima em Vitória e o Bohemia tem ambiente muito agradável e sem problemas." },
  { place: "Antigamente Bar",     cat: "Violência",   status: "negative",  desc: "Presenciei cena de violência verbal grave que a equipe demorou muito para controlar." },
  { place: "Bar do Nelson",       cat: "Ambiente",    status: "positive",  desc: "Melhor experiência que tive em São Luís, vista linda do calhau e ambiente muito tranquilo." },
  { place: "Quixabeira Bar",      cat: "Assédio",     status: "negative",  desc: "Assédio constante na pista sem que nenhum funcionário tivesse tomado qualquer providência." },
  { place: "Ó do Borogodó",       cat: "Ambiente",    status: "positive",  desc: "Samba de raiz em SP com muito respeito e diversidade, me senti completamente à vontade." },
  { place: "Bar Bukowski",        cat: "Segurança",   status: "positive",  desc: "Copacabana pode ser intensa mas o Bukowski tem boa estrutura de segurança e equipe preparada." },
  { place: "Barzin",              cat: "Ambiente",    status: "positive",  desc: "Referência LGBTQ+ em Ipanema, ambiente super acolhedor e sem qualquer tipo de preconceito." },
  { place: "Venga!",              cat: "Segurança",   status: "positive",  desc: "Staff incrível, sempre atentos a qualquer situação, me senti muito segura em todas as visitas." },
  { place: "The Week Rio",        cat: "Preconceito", status: "negative",  desc: "Seguranças fizeram seleção claramente discriminatória na porta com base na aparência das pessoas." },
  { place: "Cine Joia",           cat: "Ambiente",    status: "positive",  desc: "Shows incríveis no centro do Rio com ambiente muito diverso e equipe sempre atenta ao público." },
  { place: "Bar dos Descasados",  cat: "Assédio",     status: "negative",  desc: "Sofri assédio em Santa Teresa e ninguém da equipe tomou atitude mesmo quando pedi ajuda." },
  { place: "Mirindiba",           cat: "Ambiente",    status: "positive",  desc: "Santa Teresa encanta e o Mirindiba mais ainda, ambiente charmoso e totalmente inclusivo." },
  { place: "Bar Lagoa",           cat: "Segurança",   status: "positive",  desc: "Vista linda para a Lagoa Rodrigo de Freitas com equipe atenta e ambiente muito tranquilo." },
  { place: "Maze Inn Bar",        cat: "Ambiente",    status: "positive",  desc: "Vista do Catete é linda e o bar tem um clima muito especial, público diverso e acolhedor." }
]

ana_extra.each do |r|
  place = Place.find_by!(name: r[:place])
  next if place.reports.exists?(user: ana)
  place.reports.create!(user: ana, category: r[:cat], status: r[:status], description: r[:desc])
end

# --- 30 REPORTS DO CARLOS (novos lugares + alguns RJ, distribuição variada) ---
carlos_extra = [
  { place: "Manifesto Bar",       cat: "Segurança",   status: "positive",  desc: "Savassi é animado e o Manifesto tem boa estrutura de segurança, me senti tranquilo a noite toda." },
  { place: "Bukowski BH",         cat: "Segurança",   status: "positive",  desc: "Nunca tive problemas no Bukowski BH, equipe sempre presente e atenta a qualquer situação." },
  { place: "Café com Letras",     cat: "Preconceito", status: "negative",  desc: "Atendente fez comentário desnecessário sobre minha aparência na frente de outros clientes." },
  { place: "Hangar 110",          cat: "Ambiente",    status: "positive",  desc: "Estrutura impressionante em Brasília, ambiente bem diverso e equipe muito bem preparada." },
  { place: "Antro Pub",           cat: "Ambiente",    status: "positive",  desc: "Um dos melhores pubs de Brasília, alternativo e muito inclusivo, nunca tive problemas." },
  { place: "Bar Brasília",        cat: "Preconceito", status: "negative",  desc: "Funcionário foi claramente discriminatório ao nos atender depois de ver que éramos um casal." },
  { place: "Dado Bier Floripa",   cat: "Segurança",   status: "positive",  desc: "Estrutura muito boa em Florianópolis, equipe bem treinada e ambiente sem situações de risco." },
  { place: "Bar do Ataliba",      cat: "Assédio",     status: "negative",  desc: "Sofri assédio verbal no banheiro e ao reclamar o funcionário disse que eu havia entendido errado." },
  { place: "Aramará Bar",         cat: "Violência",   status: "negative",  desc: "Briga entre clientes com chutes e socos e a segurança demorou minutos para aparecer e agir." },
  { place: "Estação das Docas",   cat: "Segurança",   status: "positive",  desc: "Complexo bem organizado em Belém com boa segurança, me senti protegido durante toda a visita." },
  { place: "Ver-o-Peso Bar",      cat: "Ambiente",    status: "positive",  desc: "Experiência única à beira do porto histórico de Belém, ambiente muito acolhedor e inclusivo." },
  { place: "Barcas Bar",          cat: "Preconceito", status: "negative",  desc: "Grupo de clientes fez comentários homofóbicos altos sem que nenhum funcionário intervisse." },
  { place: "Bar do Meio",         cat: "Ambiente",    status: "positive",  desc: "Barzinho simples e muito gostoso em Natal, público diverso e atendimento sem nenhum problema." },
  { place: "Café Epitácio",       cat: "Assédio",     status: "negative",  desc: "Assédio insistente por parte de um cliente que a equipe ignorou completamente durante horas." },
  { place: "Bar do Francis",      cat: "Segurança",   status: "positive",  desc: "Jatiúca é animado e o Bar do Francis tem boa estrutura de segurança para o tamanho do local." },
  { place: "Pub 540",             cat: "Ambiente",    status: "positive",  desc: "Campo Grande surpreende com esse pub muito animado e ambiente bem inclusivo e diverso." },
  { place: "Buritis Bar",         cat: "Ambiente",    status: "positive",  desc: "Um dos melhores bares de Campo Grande, ambiente acolhedor e nunca presenciei episódio negativo." },
  { place: "Bohemia Club",        cat: "Segurança",   status: "positive",  desc: "Vitória tem uma cena noturna incrível e o Bohemia é referência de segurança e bom ambiente." },
  { place: "Antigamente Bar",     cat: "Ambiente",    status: "positive",  desc: "São Luís tem uma magia única e o Antigamente captura isso muito bem, ambiente acolhedor." },
  { place: "Casa Mágica",         cat: "Segurança",   status: "positive",  desc: "Centro histórico de São Luís bem monitorado, equipe atenta e ambiente sem situações de risco." },
  { place: "Quixabeira Bar",      cat: "Ambiente",    status: "positive",  desc: "Pituba é o coração noturno de Salvador e o Quixabeira tem o melhor ambiente do bairro." },
  { place: "Ó do Borogodó",       cat: "Preconceito", status: "negative",  desc: "Segurança recusou entrada de amigos trans sem qualquer justificativa plausível ou explicação." },
  { place: "Club Fosfobox",       cat: "Ambiente",    status: "positive",  desc: "Clube icônico de Copacabana com público muito diverso e ambiente que respeita todos." },
  { place: "La Carioca Cevicheria", cat: "Segurança", status: "positive",  desc: "Leblon tem fama de exclusivo mas o La Carioca é bem tranquilo e a equipe é sempre atenta." },
  { place: "Bar Urca",            cat: "Ambiente",    status: "positive",  desc: "Vista da Baía de Guanabara incomparável, ambiente familiar e super tranquilo sem incidentes." },
  { place: "Lapa 40 Graus",       cat: "Assédio",     status: "negative",  desc: "Assédio na pista ignorado pela equipe mesmo depois de eu ter pedido ajuda explicitamente." },
  { place: "Jobi Bar",            cat: "Ambiente",    status: "positive",  desc: "Botequim clássico do Leblon, pessoal super simpático e ambiente sem nenhuma tensão ou problema." },
  { place: "Palaphita Kitch",     cat: "Assédio",     status: "negative",  desc: "Fui assediado verbalmente de forma insistente e o segurança se recusou a intervir na situação." },
  { place: "Clube dos Democratas", cat: "Ambiente",   status: "positive",  desc: "Baile de carnaval com muita diversidade e alegria, equipe bem preparada e ambiente acolhedor." },
  { place: "Choperia Bracarense", cat: "Violência",   status: "negative",  desc: "Testemunhei agressão física grave dentro do estabelecimento sem resposta rápida da segurança." }
]

carlos_extra.each do |r|
  place = Place.find_by!(name: r[:place])
  next if place.reports.exists?(user: carlos)
  place.reports.create!(user: carlos, category: r[:cat], status: r[:status], description: r[:desc])
end
