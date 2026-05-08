/**
 * Listas de equipos por torneo para autocompletar en el panel admin.
 * Los nombres deben coincidir con como se guardan en la base de datos.
 */
export const TOURNAMENT_TEAMS: Record<string, string[]> = {
  'world-cup-2026': [
    // Grupo A
    'México', 'Sudáfrica', 'Corea del Sur', 'República Checa',
    // Grupo B
    'Canadá', 'Bosnia y Herzegovina', 'Qatar', 'Suiza',
    // Grupo C
    'Brasil', 'Marruecos', 'Haití', 'Escocia',
    // Grupo D
    'Estados Unidos', 'Paraguay', 'Australia', 'Turquía',
    // Grupo E
    'Alemania', 'Curaçao', 'Costa de Marfil', 'Ecuador',
    // Grupo F
    'Holanda', 'Japón', 'Suecia', 'Túnez',
    // Grupo G
    'Bélgica', 'Egipto', 'Irán', 'Nueva Zelanda',
    // Grupo H
    'España', 'Cabo Verde', 'Arabia Saudita', 'Uruguay',
    // Grupo I
    'Francia', 'Senegal', 'Irak', 'Noruega',
    // Grupo J
    'Argentina', 'Argelia', 'Austria', 'Jordania',
    // Grupo K
    'Portugal', 'DR Congo', 'Uzbekistán', 'Colombia',
    // Grupo L
    'Inglaterra', 'Croacia', 'Ghana', 'Panamá',
  ],

  'champions-league-2526': [
    'Real Madrid', 'Manchester City', 'Bayern Múnich', 'Inter de Milán',
    'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen', 'Atlético de Madrid',
    'Barcelona', 'Liverpool', 'Arsenal', 'Aston Villa',
    'Juventus', 'Benfica', 'Club Brujas', 'Paris Saint-Germain',
    'Mónaco', 'Atalanta', 'Brest', 'Feyenoord',
    'Sporting CP', 'PSV Eindhoven', 'Celtic', 'Galatasaray',
    'Estrella Roja', 'Dinamo Zagreb', 'Young Boys', 'Salzburgo',
    'Stuttgart', 'Sparta Praga', 'Girona', 'Slavia Praga',
    'Bolonia', 'Shakhtar Donetsk', 'AC Milán', 'Porto',
  ],

  'europa-league-2526': [
    'Roma', 'Lazio', 'Tottenham', 'Manchester United',
    'Ajax', 'Eintracht Fráncfort', 'Real Sociedad', 'Betis',
    'Lyon', 'Olympique de Marsella', 'Fenerbahçe', 'Besiktas',
    'Panathinaikos', 'Anderlecht', 'Athletic Club', 'Olympiacos',
    'Ferencváros', 'Malmö', 'PAOK', 'Braga',
    'Hoffenheim', 'Maccabi Tel Aviv', 'FCSB', 'Twente',
    'Bodø/Glimt', 'Qarabag', 'Rangers', 'Midtjylland',
    'Sevilla', 'Villarreal', 'Nice', 'Ludogorets',
    'Rigas FS', 'Shamrock Rovers', 'Slavia Praga', 'Steaua Bucarest',
  ],

  'nations-league-2526': [
    // Liga A
    'Francia', 'España', 'Portugal', 'Italia',
    'Alemania', 'Holanda', 'Croacia', 'Suiza',
    'Bélgica', 'Dinamarca', 'Austria', 'Escocia',
    'Turquía', 'República Checa', 'Serbia', 'Hungría',
    // Liga B
    'Polonia', 'Noruega', 'Finlandia', 'Eslovenia',
    'Rumanía', 'Bosnia y Herzegovina', 'Ucrania', 'Georgia',
    'Irlanda', 'Islandia', 'Grecia', 'Suecia',
    'Eslovaquia', 'Bulgaria', 'Montenegro', 'Gales',
    // Liga C
    'Kazajistán', 'Azerbaiyán', 'Kosovo', 'Armenia',
    'Bielorrusia', 'Albania', 'Macedonia del Norte', 'Lituania',
  ],

  'libertadores-2026': [
    // Argentina
    'River Plate', 'Boca Juniors', 'Racing Club', 'San Lorenzo',
    'Estudiantes', 'Independiente', 'Vélez Sarsfield', 'Huracán',
    'Talleres', 'Lanús', 'Belgrano', 'Tigre',
    // Brasil
    'Flamengo', 'Palmeiras', 'Atlético Mineiro', 'Internacional',
    'Fluminense', 'Grêmio', 'Botafogo', 'São Paulo',
    'Cruzeiro', 'Athletico Paranaense', 'Fortaleza', 'Corinthians',
    // Colombia
    'Atlético Nacional', 'Junior', 'Deportivo Cali', 'Santa Fe', 'Millonarios',
    // Chile
    'Colo-Colo', 'Universidad de Chile', 'Universidad Católica',
    // Uruguay
    'Peñarol', 'Nacional',
    // Paraguay
    'Olimpia', 'Cerro Porteño', 'Libertad',
    // Ecuador
    'Barcelona SC', 'Liga de Quito', 'Independiente del Valle',
    // Bolivia
    'Bolívar', 'Always Ready',
    // Perú
    'Universitario', 'Alianza Lima', 'Sporting Cristal',
    // Venezuela
    'Caracas FC', 'Deportivo Táchira',
  ],

  'sudamericana-2026': [
    // Argentina
    'River Plate', 'Boca Juniors', 'Racing Club', 'San Lorenzo',
    'Talleres', 'Defensa y Justicia', 'Lanús', 'Banfield',
    'Godoy Cruz', 'Colón', 'Unión', 'Argentinos Juniors',
    // Brasil
    'Flamengo', 'Palmeiras', 'Atlético Mineiro', 'Internacional',
    'Fluminense', 'Corinthians', 'Vasco da Gama', 'Cruzeiro',
    'Bahia', 'RB Bragantino', 'Cuiabá', 'Atlético Goianiense',
    // Colombia
    'Atlético Nacional', 'Junior', 'Deportivo Cali', 'Millonarios',
    'Deportivo Pereira', 'Envigado',
    // Chile
    'Colo-Colo', 'Universidad de Chile', 'Huachipato', 'Palestino',
    // Uruguay
    'Peñarol', 'Nacional', 'Defensor Sporting',
    // Paraguay
    'Olimpia', 'Cerro Porteño', 'Libertad', 'Guaraní',
    // Ecuador
    'Barcelona SC', 'Liga de Quito', 'El Nacional', 'Aucas',
    // Bolivia
    'Bolívar', 'Always Ready', 'Wilstermann',
    // Perú
    'Universitario', 'Alianza Lima', 'Sporting Cristal', 'Melgar',
  ],

  'copa-america-2028': [
    // CONMEBOL
    'Argentina', 'Brasil', 'Uruguay', 'Colombia', 'Chile',
    'Ecuador', 'Perú', 'Venezuela', 'Bolivia', 'Paraguay',
    // CONCACAF
    'Estados Unidos', 'México', 'Canadá', 'Costa Rica',
    'Jamaica', 'Honduras', 'Panamá', 'El Salvador',
    'Guatemala', 'Trinidad y Tobago', 'Haití', 'Cuba',
    'Surinam', 'Guyana', 'Nicaragua', 'Curaçao',
  ],

  'premier-league-2526': [
    'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford',
    'Brighton', 'Chelsea', 'Crystal Palace', 'Everton',
    'Fulham', 'Ipswich', 'Leicester', 'Liverpool',
    'Manchester City', 'Manchester United', 'Newcastle',
    'Nottingham Forest', 'Southampton', 'Tottenham',
    'West Ham', 'Wolverhampton',
  ],

  'la-liga-2526': [
    'Athletic Club', 'Atlético de Madrid', 'Barcelona',
    'Betis', 'Celta Vigo', 'Espanyol', 'Getafe',
    'Girona', 'Las Palmas', 'Leganés', 'Mallorca',
    'Osasuna', 'Rayo Vallecano', 'Real Madrid',
    'Real Sociedad', 'Sevilla', 'Valencia', 'Valladolid',
    'Villarreal', 'Alavés',
  ],

  'serie-a-2526': [
    'AC Milán', 'Atalanta', 'Bolonia', 'Cagliari',
    'Como', 'Empoli', 'Fiorentina', 'Genoa',
    'Hellas Verona', 'Inter de Milán', 'Juventus',
    'Lazio', 'Lecce', 'Monza', 'Napoli',
    'Parma', 'Roma', 'Torino', 'Udinese', 'Venezia',
  ],

  'bundesliga-2526': [
    'Augsburg', 'Bayer Leverkusen', 'Bayern Múnich', 'Borussia Dortmund',
    'Borussia Mönchengladbach', 'Bochum', 'Bremen',
    'Eintracht Fráncfort', 'Friburgo', 'Hamburgo',
    'Hoffenheim', 'Holstein Kiel', 'RB Leipzig',
    'Maguncia', 'St. Pauli', 'Stuttgart',
    'Unión Berlín', 'Wolfsburgo',
  ],

  'ligue-1-2526': [
    'Angers', 'Auxerre', 'Brest', 'Le Havre',
    'Lens', 'Lille', 'Lyon', 'Olympique de Marsella',
    'Metz', 'Mónaco', 'Montpellier', 'Nantes',
    'Nice', 'Paris Saint-Germain', 'Reims',
    'Rennes', 'Saint-Étienne', 'Strasbourg',
  ],

  'liga-mx-apertura-2026': [
    'América', 'Atlas', 'Atlético de San Luis', 'Chivas',
    'Cruz Azul', 'FC Juárez', 'Mazatlán', 'Monterrey',
    'Necaxa', 'Pachuca', 'Puebla', 'Querétaro',
    'Santos Laguna', 'Tigres', 'Tijuana', 'Toluca',
    'Pumas UNAM', 'León', 'Mineros de Zacatecas', 'Dorados',
  ],

  'liga-betplay-2026-1': [
    'Atlético Nacional', 'Millonarios', 'Santa Fe', 'Junior',
    'Deportivo Cali', 'América de Cali', 'Once Caldas',
    'Deportes Tolima', 'Envigado', 'Rionegro Águilas',
    'Boyacá Chicó', 'Deportivo Pasto', 'Inter Bogotá',
    'Patriotas Boyacá', 'Alianza FC', 'Independiente Medellín',
    'Jaguares de Córdoba', 'Deportivo Pereira',
    'Fortaleza FC', 'Llaneros',
  ],

  'mls-2026': [
    // Eastern Conference
    'Atlanta United', 'Charlotte FC', 'Chicago Fire', 'FC Cincinnati',
    'Columbus Crew', 'D.C. United', 'Inter Miami', 'CF Montréal',
    'New England Revolution', 'NYCFC', 'New York Red Bulls',
    'Orlando City', 'Philadelphia Union', 'Toronto FC',
    // Western Conference
    'Austin FC', 'Colorado Rapids', 'FC Dallas', 'Houston Dynamo',
    'LA Galaxy', 'LAFC', 'Minnesota United', 'Nashville SC',
    'Portland Timbers', 'Real Salt Lake', 'San Jose Earthquakes',
    'Seattle Sounders', 'Sporting KC', 'St. Louis City',
    'Vancouver Whitecaps',
  ],

  'otro': [],
}
