import { sql } from 'drizzle-orm';
import { cities, countries } from '@shared/schema';
import { db } from './db';

// Comprehensive cities dataset organized by country code
// Each country has 5-20 cities based on population/importance
const WORLD_CITIES_DATA: Record<string, string[]> = {
  // Large countries (>100M population) - 15-20 cities
  'US': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Washington'],
  'CN': ['Shanghai', 'Beijing', 'Chongqing', 'Tianjin', 'Guangzhou', 'Shenzhen', 'Wuhan', 'Dongguan', 'Chengdu', 'Nanjing', 'Foshan', 'Shenyang', 'Hangzhou', 'Xian', 'Harbin', 'Qingdao', 'Changchun', 'Jinan', 'Kunming', 'Zhengzhou'],
  'IN': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri', 'Patna', 'Vadodara'],
  'ID': ['Jakarta', 'Surabaya', 'Medan', 'Bandung', 'Bekasi', 'Tangerang', 'Depok', 'Semarang', 'Palembang', 'Makassar', 'South Tangerang', 'Batam', 'Bogor', 'Pekanbaru', 'Bandar Lampung', 'Malang', 'Padang', 'Denpasar', 'Samarinda', 'Tasikmalaya'],
  'BR': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre', 'Belém', 'Goiânia', 'Guarulhos', 'Campinas', 'São Luis', 'São Gonçalo', 'Maceió', 'Duque de Caxias', 'Natal', 'Campo Grande'],
  'PK': ['Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Gujranwala', 'Peshawar', 'Multan', 'Hyderabad', 'Islamabad', 'Quetta', 'Bahawalpur', 'Sargodha', 'Sialkot', 'Sukkur', 'Larkana', 'Sheikhupura', 'Rahim Yar Khan', 'Jhang', 'Gujrat', 'Kasur'],
  'NG': ['Lagos', 'Kano', 'Ibadan', 'Kaduna', 'Port Harcourt', 'Benin City', 'Maiduguri', 'Zaria', 'Aba', 'Jos', 'Ilorin', 'Oyo', 'Enugu', 'Abeokuta', 'Abuja', 'Sokoto', 'Onitsha', 'Warri', 'Okene', 'Calabar'],
  'BD': ['Dhaka', 'Chittagong', 'Khulna', 'Rajshahi', 'Sylhet', 'Rangpur', 'Barisal', 'Comilla', 'Gazipur', 'Narayanganj', 'Tangail', 'Jessore', 'Mymensingh', 'Bogra', 'Dinajpur', 'Cox Bazar', 'Brahmanbaria', 'Kushtia', 'Pabna', 'Faridpur'],
  'RU': ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Nizhny Novgorod', 'Kazan', 'Chelyabinsk', 'Omsk', 'Samara', 'Rostov-on-Don', 'Ufa', 'Krasnoyarsk', 'Perm', 'Voronezh', 'Volgograd', 'Krasnodar', 'Saratov', 'Tyumen', 'Tolyatti', 'Izhevsk'],
  'MX': ['Mexico City', 'Ecatepec', 'Guadalajara', 'Puebla', 'Tijuana', 'León', 'Juárez', 'Zapopan', 'Monterrey', 'Nezahualcóyotl', 'Chihuahua', 'Naucalpan', 'Mérida', 'Álvaro Obregón', 'San Luis Potosí', 'Aguascalientes', 'Hermosillo', 'Saltillo', 'Mexicali', 'Culiacán'],

  // Medium countries (10M-100M population) - 10-12 cities
  'JP': ['Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe', 'Kyoto', 'Kawasaki', 'Saitama', 'Hiroshima', 'Sendai'],
  'PH': ['Manila', 'Quezon City', 'Davao', 'Caloocan', 'Cebu City', 'Zamboanga', 'Taguig', 'Antipolo', 'Pasig', 'Cagayan de Oro', 'Parañaque', 'Las Piñas'],
  'ET': ['Addis Ababa', 'Dire Dawa', 'Mek\'ele', 'Adama', 'Awasa', 'Bahir Dar', 'Gondar', 'Dessie', 'Jimma', 'Jijiga', 'Shashamane', 'Nekemte'],
  'VN': ['Ho Chi Minh City', 'Hanoi', 'Hai Phong', 'Da Nang', 'Bien Hoa', 'Hue', 'Nha Trang', 'Can Tho', 'Rach Gia', 'Quy Nhon', 'Vung Tau', 'Thai Nguyen'],
  'TR': ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Adana', 'Gaziantep', 'Konya', 'Antalya', 'Kayseri', 'Mersin', 'Eskisehir', 'Diyarbakir'],
  'IR': ['Tehran', 'Mashhad', 'Isfahan', 'Karaj', 'Shiraz', 'Tabriz', 'Qom', 'Ahvaz', 'Kermanshah', 'Urmia', 'Rasht', 'Zahedan'],
  'DE': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig', 'Bremen', 'Dresden'],
  'TH': ['Bangkok', 'Samut Prakan', 'Mueang Nonthaburi', 'Udon Thani', 'Chon Buri', 'Nakhon Ratchasima', 'Chiang Mai', 'Hat Yai', 'Pak Kret', 'Si Racha', 'Phra Pradaeng', 'Lampang'],
  'GB': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Leeds', 'Sheffield', 'Edinburgh', 'Bristol', 'Cardiff', 'Leicester', 'Coventry'],
  'FR': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Montpellier', 'Strasbourg', 'Bordeaux', 'Lille', 'Rennes', 'Reims'],
  'IT': ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Bari', 'Catania', 'Venice', 'Verona'],
  'TZ': ['Dar es Salaam', 'Mwanza', 'Arusha', 'Dodoma', 'Mbeya', 'Morogoro', 'Tanga', 'Kahama', 'Tabora', 'Zanzibar City', 'Kigoma', 'Moshi'],
  'ZA': ['Cape Town', 'Johannesburg', 'Durban', 'Pretoria', 'Port Elizabeth', 'Pietermaritzburg', 'Benoni', 'Tembisa', 'East London', 'Vereeniging', 'Bloemfontein', 'Boksburg'],
  'MM': ['Yangon', 'Mandalay', 'Naypyidaw', 'Mawlamyine', 'Bago', 'Pathein', 'Monywa', 'Meiktila', 'Myitkyina', 'Dawei', 'Myeik', 'Hpa-An'],
  'KE': ['Nairobi', 'Mombasa', 'Nakuru', 'Eldoret', 'Kisumu', 'Thika', 'Malindi', 'Kitale', 'Garissa', 'Kakamega', 'Nyeri', 'Machakos'],
  'KR': ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Suwon', 'Ulsan', 'Changwon', 'Goyang', 'Yongin', 'Seongnam'],
  'CO': ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Cúcuta', 'Bucaramanga', 'Pereira', 'Santa Marta', 'Ibagué', 'Pasto', 'Manizales'],
  'ES': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao', 'Alicante', 'Córdoba'],
  'UG': ['Kampala', 'Gulu', 'Lira', 'Mbarara', 'Jinja', 'Bwizibwera', 'Mbale', 'Mukono', 'Kasese', 'Masaka', 'Entebbe', 'Njeru'],
  'AR': ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'San Miguel de Tucumán', 'La Plata', 'Mar del Plata', 'Salta', 'Santa Fe', 'San Juan', 'Resistencia', 'Santiago del Estero'],
  'DZ': ['Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Djelfa', 'Sétif', 'Sidi Bel Abbès', 'Biskra', 'Tébessa', 'El Khroub'],
  'SD': ['Khartoum', 'Omdurman', 'Khartoum North', 'Nyala', 'Port Sudan', 'Kassala', 'El Obeid', 'Wad Madani', 'El Fasher', 'Kosti', 'Sennar', 'Dongola'],
  'UA': ['Kyiv', 'Kharkiv', 'Odessa', 'Dnipro', 'Donetsk', 'Zaporizhzhia', 'Lviv', 'Kryvyi Rih', 'Mykolaiv', 'Mariupol', 'Luhansk', 'Vinnytsya'],
  'IQ': ['Baghdad', 'Basra', 'Mosul', 'Erbil', 'Abu Ghraib', 'Kirkuk', 'Najaf', 'Karbala', 'Nasiriyah', 'Amarah', 'Diwaniyah', 'Kut'],
  'AF': ['Kabul', 'Kandahar', 'Herat', 'Mazar-i-Sharif', 'Jalalabad', 'Kunduz', 'Taloqan', 'Puli Khumri', 'Charikar', 'Khost', 'Gardez', 'Bamyan'],
  'PL': ['Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk', 'Szczecin', 'Bydgoszcz', 'Lublin', 'Katowice', 'Białystok', 'Częstochowa'],
  'CA': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener', 'London', 'Victoria'],
  'MA': ['Casablanca', 'Rabat', 'Fès', 'Marrakech', 'Agadir', 'Tangier', 'Meknès', 'Oujda', 'Kenitra', 'Tetouan', 'Safi', 'Mohammedia'],
  'SA': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Tabuk', 'Buraydah', 'Khamis Mushait', 'Hail', 'Hafar Al-Batin', 'Jubail'],
  'UZ': ['Tashkent', 'Namangan', 'Samarkand', 'Andijan', 'Nukus', 'Bukhara', 'Qarshi', 'Kokand', 'Chirchiq', 'Margilan', 'Urgench', 'Jizzakh'],
  'PE': ['Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Huancayo', 'Piura', 'Iquitos', 'Cusco', 'Chimbote', 'Huánuco', 'Tacna', 'Juliaca'],
  'AO': ['Luanda', 'Huambo', 'Lobito', 'Benguela', 'Kuito', 'Lubango', 'Malanje', 'Namibe', 'Soyo', 'Cabinda', 'Uíge', 'Sumbe'],
  'MY': ['Kuala Lumpur', 'George Town', 'Ipoh', 'Shah Alam', 'Petaling Jaya', 'Johor Bahru', 'Kuching', 'Kota Kinabalu', 'Klang', 'Kajang', 'Seremban', 'Iskandar Puteri'],
  'MZ': ['Maputo', 'Matola', 'Beira', 'Nampula', 'Chimoio', 'Nacala', 'Quelimane', 'Tete', 'Xai-Xai', 'Lichinga', 'Pemba', 'Inhambane'],
  'GH': ['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Atsiaman', 'Tema', 'Teshie', 'Cape Coast', 'Sekondi', 'Obuasi', 'Medina', 'Koforidua'],
  'YE': ['Sanaa', 'Aden', 'Taiz', 'Hodeidah', 'Ibb', 'Dhamar', 'Mukalla', 'Hajjah', 'Amran', 'Saada', 'Sayyan', 'Zinjibar'],
  'NP': ['Kathmandu', 'Pokhara', 'Lalitpur', 'Bharatpur', 'Biratnagar', 'Birgunj', 'Dharan', 'Butwal', 'Hetauda', 'Nepalgunj', 'Itahari', 'Dhangadhi'],
  'VE': ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Ciudad Guayana', 'Barcelona', 'Maturín', 'Maracay', 'Ciudad Bolívar', 'Cumana', 'Mérida', 'San Cristóbal'],
  'MG': ['Antananarivo', 'Toamasina', 'Antsirabe', 'Fianarantsoa', 'Mahajanga', 'Toliara', 'Antsiranana', 'Ambovombe', 'Morondava', 'Nosy Be', 'Sambava', 'Manakara'],
  'CM': ['Douala', 'Yaoundé', 'Garoua', 'Kousseri', 'Bamenda', 'Maroua', 'Bafoussam', 'Mokolo', 'Ngaoundéré', 'Bertoua', 'Loum', 'Kumba'],
  'AU': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Sunshine Coast', 'Wollongong', 'Hobart', 'Geelong'],
  'KP': ['Pyongyang', 'Hamhung', 'Chongjin', 'Nampo', 'Wonsan', 'Sinuiju', 'Tanchon', 'Kaechon', 'Kaesong', 'Sariwon', 'Sunchon', 'Hyesan'],
  'NE': ['Niamey', 'Zinder', 'Maradi', 'Agadez', 'Tahoua', 'Dosso', 'Arlit', 'Tillabéri', 'Diffa', 'Tera', 'Madaoua', 'Tessaoua'],
  'LK': ['Colombo', 'Dehiwala-Mount Lavinia', 'Moratuwa', 'Sri Jayawardenepura Kotte', 'Negombo', 'Kandy', 'Kalmunai', 'Trincomalee', 'Galle', 'Jaffna', 'Batticaloa', 'Matara'],
  'BF': ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Ouahigouya', 'Banfora', 'Tenkodogo', 'Kaya', 'Dori', 'Fada N\'gourma', 'Gaoua', 'Réo', 'Zorgo'],
  'ML': ['Bamako', 'Sikasso', 'Mopti', 'Koutiala', 'Ségou', 'Kayes', 'Gao', 'Kati', 'Tombouctou', 'Markala', 'Bafoulabé', 'Kolokani'],
  'RO': ['Bucharest', 'Cluj-Napoca', 'Timişoara', 'Iaşi', 'Constanţa', 'Craiova', 'Brașov', 'Galați', 'Ploiești', 'Oradea', 'Braila', 'Arad'],
  'MW': ['Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba', 'Kasungu', 'Mangochi', 'Karonga', 'Salima', 'Balaka', 'Luchenza', 'Nsanje', 'Chiradzulu'],
  'CL': ['Santiago', 'Puente Alto', 'Antofagasta', 'Viña del Mar', 'Valparaíso', 'Talcahuano', 'San Bernardo', 'Temuco', 'Iquique', 'Concepción', 'Rancagua', 'Arica'],
  'KZ': ['Almaty', 'Nur-Sultan', 'Shymkent', 'Aktobe', 'Taraz', 'Pavlodar', 'Ust-Kamenogorsk', 'Semey', 'Atyrau', 'Kostanay', 'Petropavl', 'Oral'],
  'ZM': ['Lusaka', 'Kitwe', 'Ndola', 'Kabwe', 'Chingola', 'Mufulira', 'Luanshya', 'Arusha', 'Kasama', 'Chipata', 'Livingstone', 'Solwezi'],
  'GT': ['Guatemala City', 'Villa Nueva', 'Quetzaltenango', 'Petapa', 'San Juan Sacatepéquez', 'Quiché', 'Villa Canales', 'Escuintla', 'Chinautla', 'Chimaltenango', 'Huehuetenango', 'Amatitlán'],
  'EC': ['Guayaquil', 'Quito', 'Cuenca', 'Santo Domingo', 'Machala', 'Durán', 'Manta', 'Portoviejo', 'Ambato', 'Riobamba', 'Loja', 'Esmeraldas'],
  'SY': ['Aleppo', 'Damascus', 'Homs', 'Latakia', 'Hama', 'Deir ez-Zor', 'Raqqa', 'As-Suwayda', 'Douma', 'Daraa', 'Al-Hasakah', 'Tartus'],
  'NL': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Tilburg', 'Groningen', 'Almere', 'Breda', 'Nijmegen', 'Enschede', 'Haarlem'],
  'SN': ['Dakar', 'Pikine', 'Touba', 'Thiès', 'Kaolack', 'Saint-Louis', 'Mbour', 'Ziguinchor', 'Diourbel', 'Tambacounda', 'Rufisque', 'Kolda'],
  'KH': ['Phnom Penh', 'Siem Reap', 'Battambang', 'Sihanoukville', 'Poipet', 'Kampong Cham', 'Ta Khmau', 'Pursat', 'Kampong Speu', 'Kratie', 'Stung Treng', 'Kep'],
  'TD': ['N\'Djamena', 'Moundou', 'Sarh', 'Abéché', 'Kelo', 'Koumra', 'Pala', 'Am Timan', 'Bongor', 'Mongo', 'Melfi', 'Ati'],
  'SO': ['Mogadishu', 'Hargeisa', 'Bosaso', 'Galkayo', 'Merca', 'Jamame', 'Borama', 'Kismayo', 'Afgooye', 'Baidoa', 'Garowe', 'Berbera'],
  'ZW': ['Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Epworth', 'Gweru', 'Kwekwe', 'Kadoma', 'Masvingo', 'Chinhoyi', 'Norton', 'Marondera'],
  'GN': ['Conakry', 'Nzérékoré', 'Kankan', 'Kindia', 'Labe', 'Siguiri', 'Kouroussa', 'Boké', 'Mamou', 'Faranah', 'Kissidougou', 'Dabola'],
  'RW': ['Kigali', 'Butare', 'Gitarama', 'Musanze', 'Gisenyi', 'Byumba', 'Cyangugu', 'Kibungo', 'Ruhengeri', 'Kibuye', 'Gabiro', 'Kayonza'],
  'BJ': ['Cotonou', 'Abomey-Calavi', 'Djougou', 'Porto-Novo', 'Parakou', 'Bohicon', 'Kandi', 'Lokossa', 'Ouidah', 'Abomey', 'Natitingou', 'Savalou'],
  'BI': ['Bujumbura', 'Gitega', 'Muyinga', 'Ruyigi', 'Ngozi', 'Rutana', 'Kayanza', 'Muramvya', 'Makamba', 'Bururi', 'Cibitoke', 'Bubanza'],
  'TN': ['Tunis', 'Sfax', 'Sousse', 'Ettadhamen', 'Kairouan', 'Gabès', 'Bizerte', 'Ariana', 'Gafsa', 'El Mourouj', 'Monastir', 'Ben Arous'],
  'BE': ['Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège', 'Bruges', 'Namur', 'Leuven', 'Mons', 'Aalst', 'Mechelen', 'La Louvière'],
  'HT': ['Port-au-Prince', 'Cap-Haïtien', 'Delmas', 'Les Cayes', 'Pétion-Ville', 'Gonaïves', 'Saint-Marc', 'Jacmel', 'Jérémie', 'Fort-de-France', 'Hinche', 'Léogâne'],
  'BO': ['La Paz', 'Santa Cruz', 'Cochabamba', 'Oruro', 'Sucre', 'Potosí', 'Tarija', 'Sacaba', 'Quillacollo', 'El Alto', 'Montero', 'Trinidad'],
  'CU': ['Havana', 'Santiago de Cuba', 'Camagüey', 'Holguín', 'Santa Clara', 'Guantánamo', 'Bayamo', 'Las Tunas', 'Cienfuegos', 'Pinar del Río', 'Matanzas', 'Ciego de Ávila'],
  'SS': ['Juba', 'Malakal', 'Wau', 'Yei', 'Aweil', 'Kuacjok', 'Bentiu', 'Bor', 'Yambio', 'Torit', 'Rumbek', 'Kapoeta'],
  'DO': ['Santo Domingo', 'Santiago', 'La Vega', 'San Pedro de Macorís', 'San Cristóbal', 'Puerto Plata', 'La Romana', 'Baní', 'Bonao', 'San Francisco de Macorís', 'Higüey', 'Azua'],
  'CZ': ['Prague', 'Brno', 'Ostrava', 'Plzen', 'Liberec', 'Olomouc', 'České Budějovice', 'Hradec Králové', 'Ústí nad Labem', 'Pardubice', 'Zlín', 'Havířov'],
  'GR': ['Athens', 'Thessaloniki', 'Patras', 'Piraeus', 'Larissa', 'Heraklion', 'Peristeri', 'Kallithea', 'Acharnes', 'Kalamaria', 'Nikaia', 'Glyfada'],
  'JO': ['Amman', 'Zarqa', 'Irbid', 'Russeifa', 'Wadi as-Sir', 'Aqaba', 'Madaba', 'Sahab', 'Mafraq', 'Jerash', 'Karak', 'Tafilah'],
  'PT': ['Lisbon', 'Porto', 'Amadora', 'Braga', 'Setúbal', 'Coimbra', 'Queluz', 'Funchal', 'Cacém', 'Vila Nova de Gaia', 'Loures', 'Felgueiras'],
  'AZ': ['Baku', 'Ganja', 'Sumqayit', 'Mingachevir', 'Qaradag', 'Shirvan', 'Nakhchivan', 'Lankaran', 'Shaki', 'Yevlakh', 'Salyan', 'Qazakh'],
  'SE': ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås', 'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping', 'Lund', 'Umeå'],
  'HN': ['Tegucigalpa', 'San Pedro Sula', 'Choloma', 'La Ceiba', 'El Progreso', 'Choluteca', 'Comayagua', 'Puerto Cortés', 'La Lima', 'Danlí', 'Siguatepeque', 'Juticalpa'],
  'AE': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Khor Fakkan', 'Dibba Al-Fujairah', 'Dibba Al-Hisn', 'Kalba'],
  'HU': ['Budapest', 'Debrecen', 'Szeged', 'Miskolc', 'Pécs', 'Győr', 'Nyíregyháza', 'Kecskemét', 'Székesfehérvár', 'Szombathely', 'Érd', 'Tatabánya'],
  'TJ': ['Dushanbe', 'Khujand', 'Kulob', 'Qurghonteppa', 'Istaravshan', 'Kanibadam', 'Tursunzoda', 'Isfara', 'Panjakent', 'Rogun', 'Vahdat', 'Yovon'],
  'BY': ['Minsk', 'Gomel', 'Mogilev', 'Vitebsk', 'Grodno', 'Brest', 'Babruysk', 'Baranovichi', 'Borisov', 'Pinsk', 'Orsha', 'Mozyr'],
  'AT': ['Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck', 'Klagenfurt', 'Villach', 'Wels', 'Sankt Pölten', 'Dornbirn', 'Steyr', 'Wiener Neustadt'],
  'PG': ['Port Moresby', 'Lae', 'Mount Hagen', 'Popondetta', 'Madang', 'Wewak', 'Vanimo', 'Kimbe', 'Kerema', 'Daru', 'Mendi', 'Goroka'],
  'RS': ['Belgrade', 'Novi Sad', 'Niš', 'Zemun', 'Kragujevac', 'Subotica', 'Pančevo', 'Čačak', 'Novi Pazar', 'Zrenjanin', 'Leskovac', 'Užice'],
  'CH': ['Zürich', 'Geneva', 'Basel', 'Bern', 'Lausanne', 'Winterthur', 'Lucerne', 'St. Gallen', 'Lugano', 'Biel/Bienne', 'Thun', 'Köniz'],
  'IL': ['Jerusalem', 'Tel Aviv', 'Haifa', 'Rishon LeZion', 'Petah Tikva', 'Ashdod', 'Netanya', 'Beersheba', 'Bnei Brak', 'Holon', 'Ramat Gan', 'Ashkelon'],
  'TG': ['Lomé', 'Sokodé', 'Kara', 'Kpalimé', 'Atakpamé', 'Dapaong', 'Tsévié', 'Aného', 'Sansanné-Mango', 'Bassar', 'Tchamba', 'Niamtougou'],
  'SL': ['Freetown', 'Bo', 'Kenema', 'Koidu', 'Makeni', 'Lunsar', 'Port Loko', 'Waterloo', 'Kabala', 'Kailahun', 'Yengema', 'Magburaka'],
  'HK': ['Hong Kong', 'Kowloon', 'Tsuen Wan', 'Yuen Long Kau Hui', 'Tung Chung', 'Tai Po', 'Sha Tin', 'Fanling', 'Tin Shui Wai', 'Tseung Kwan O', 'Ma On Shan', 'Sheung Shui'],
  'LA': ['Vientiane', 'Pakse', 'Savannakhet', 'Luang Prabang', 'Phonsavan', 'Thakhek', 'Muang Xay', 'Phongsali', 'Attapeu', 'Sainyabuli', 'Salavan', 'Sekong'],
  'PY': ['Asunción', 'Ciudad del Este', 'San Lorenzo', 'Luque', 'Capiatá', 'Lambaré', 'Fernando de la Mora', 'Limpio', 'Nemby', 'Encarnación', 'Mariano Roque Alonso', 'Pedro Juan Caballero'],
  'BG': ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Ruse', 'Stara Zagora', 'Pleven', 'Sliven', 'Dobrich', 'Shumen', 'Pernik', 'Haskovo'],
  'LY': ['Tripoli', 'Benghazi', 'Misrata', 'Tarhuna', 'Bayda', 'Zawiya', 'Zliten', 'Ajdabiya', 'Tobruk', 'Sabha', 'Gharyan', 'Sirte'],
  'LB': ['Beirut', 'Ra\'s Bayrut', 'Tripoli', 'Sidon', 'Tyre', 'Nabatieh', 'Jounieh', 'Zahle', 'Baalbek', 'Bint Jbeil', 'Aley', 'Bcharre'],

  // Smaller countries - 5-8 cities
  'NI': ['Managua', 'León', 'Masaya', 'Chinandega', 'Matagalpa'],
  'KG': ['Bishkek', 'Osh', 'Jalal-Abad', 'Karakol', 'Tokmok'],
  'SV': ['San Salvador', 'Soyapango', 'Santa Ana', 'San Miguel', 'Mejicanos'],
  'TM': ['Ashgabat', 'Turkmenbashi', 'Daşoguz', 'Mary', 'Balkanabat'],
  'SG': ['Singapore', 'Jurong East', 'Woodlands', 'Tampines', 'Sengkang'],
  'DK': ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg'],
  'FI': ['Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Oulu'],
  'CG': ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Kayes', 'Owando'],
  'SK': ['Bratislava', 'Košice', 'Prešov', 'Žilina', 'Banská Bystrica'],
  'NO': ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Bærum'],
  'OM': ['Muscat', 'Seeb', 'Salalah', 'Bawshar', 'Sohar'],
  'CR': ['San José', 'Cartago', 'Puntarenas', 'Limón', 'Alajuela'],
  'LR': ['Monrovia', 'Gbarnga', 'Kakata', 'Bensonville', 'Harper'],
  'IE': ['Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford'],
  'CF': ['Bangui', 'Bimbo', 'Berbérati', 'Carnot', 'Bambari'],
  'NZ': ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga'],
  'MR': ['Nouakchott', 'Nouadhibou', 'Néma', 'Kaédi', 'Zouérat'],
  'PA': ['Panama City', 'San Miguelito', 'Tocumen', 'David', 'Arraiján'],
  'KW': ['Kuwait City', 'Al Ahmadi', 'Hawalli', 'As Salimiyah', 'Sabah as Salim'],
  'HR': ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar'],
  'MD': ['Chișinău', 'Tiraspol', 'Bălți', 'Bender', 'Rîbnița'],
  'GE': ['Tbilisi', 'Batumi', 'Kutaisi', 'Rustavi', 'Gori'],
  'ER': ['Asmara', 'Keren', 'Massawa', 'Assab', 'Mendefera'],
  'UY': ['Montevideo', 'Salto', 'Paysandú', 'Las Piedras', 'Rivera'],
  'BA': ['Sarajevo', 'Banja Luka', 'Tuzla', 'Zenica', 'Mostar'],
  'MN': ['Ulaanbaatar', 'Erdenet', 'Darkhan', 'Choibalsan', 'Murun'],
  'AM': ['Yerevan', 'Gyumri', 'Vanadzor', 'Vagharshapat', 'Abovyan'],
  'JM': ['Kingston', 'Spanish Town', 'Portmore', 'Montego Bay', 'May Pen'],
  'QA': ['Doha', 'Al Rayyan', 'Umm Salal', 'Al Wakrah', 'Al Khor'],
  'AL': ['Tirana', 'Durrës', 'Vlorë', 'Elbasan', 'Shkodër'],
  'LT': ['Vilnius', 'Kaunas', 'Klaipėda', 'Šiauliai', 'Panevėžys'],
  'NA': ['Windhoek', 'Rundu', 'Walvis Bay', 'Swakopmund', 'Oshakati'],
  'GM': ['Banjul', 'Serekunda', 'Brikama', 'Bakau', 'Farafenni'],
  'BW': ['Gaborone', 'Francistown', 'Molepolole', 'Maun', 'Selebi-Phikwe'],
  'GA': ['Libreville', 'Port-Gentil', 'Franceville', 'Oyem', 'Moanda'],
  'LS': ['Maseru', 'Teyateyaneng', 'Mafeteng', 'Hlotse', 'Mohale\'s Hoek'],
  'MK': ['Skopje', 'Kumanovo', 'Prilep', 'Tetovo', 'Veles'],
  'SI': ['Ljubljana', 'Maribor', 'Celje', 'Kranj', 'Velenje'],
  'GW': ['Bissau', 'Gabú', 'Bafatá', 'Bissorã', 'Bolama'],
  'LV': ['Riga', 'Daugavpils', 'Liepāja', 'Jelgava', 'Jūrmala'],
  'BH': ['Manama', 'Riffa', 'Muharraq', 'Hamad Town', 'A\'ali'],
  'GQ': ['Malabo', 'Bata', 'Ebebiyin', 'Aconibe', 'Añisok'],
  'TT': ['Port of Spain', 'Chaguanas', 'San Fernando', 'Arima', 'Point Fortin'],
  'EE': ['Tallinn', 'Tartu', 'Narva', 'Pärnu', 'Kohtla-Järve'],
  'TL': ['Dili', 'Dare', 'Baucau', 'Maliana', 'Suai'],
  'MU': ['Port Louis', 'Beau Bassin-Rose Hill', 'Vacoas-Phoenix', 'Curepipe', 'Quatre Bornes'],
  'CY': ['Nicosia', 'Limassol', 'Larnaca', 'Famagusta', 'Paphos'],
  'SZ': ['Mbabane', 'Manzini', 'Big Bend', 'Malkerns', 'Nhlangano'],
  'DJ': ['Djibouti', 'Ali Sabieh', 'Dikhil', 'Tadjoura', 'Obock'],
  'FJ': ['Suva', 'Nadi', 'Lautoka', 'Labasa', 'Ba'],
  'KM': ['Moroni', 'Mutsamudu', 'Fomboni', 'Domoni', 'Mirontsy'],
  'GY': ['Georgetown', 'Linden', 'New Amsterdam', 'Anna Regina', 'Bartica'],
  'BT': ['Thimphu', 'Phuntsholing', 'Punakha', 'Wangdue', 'Samdrup Jongkhar'],
  'SB': ['Honiara', 'Gizo', 'Auki', 'Kirakira', 'Buala'],
  'MO': ['Macau', 'Taipa', 'Coloane', 'Cotai', 'Nossa Senhora de Fátima'],
  'ME': ['Podgorica', 'Nikšić', 'Pljevlja', 'Bijelo Polje', 'Cetinje'],
  'LU': ['Luxembourg', 'Esch-sur-Alzette', 'Differdange', 'Dudelange', 'Ettelbruck'],
  'SR': ['Paramaribo', 'Lelydorp', 'Nieuw Nickerie', 'Moengo', 'Nieuw Amsterdam'],
  'CV': ['Praia', 'Mindelo', 'Santa Maria', 'Assomada', 'Porto Novo'],
  'FM': ['Palikir', 'Weno', 'Tofol', 'Kolonia', 'Nett'],
  'MV': ['Malé', 'Addu City', 'Fuvahmulah', 'Kulhudhuffushi', 'Thinadhoo'],
  'MT': ['Valletta', 'Birkirkara', 'Mosta', 'Qormi', 'Zabbar'],
  'BN': ['Bandar Seri Begawan', 'Kuala Belait', 'Seria', 'Tutong', 'Bangar'],
  'BZ': ['Belize City', 'San Ignacio', 'Orange Walk', 'Dangriga', 'Corozal'],
  'BS': ['Nassau', 'Lucaya', 'Freeport', 'West End', 'Coopers Town'],
  'IS': ['Reykjavik', 'Kópavogur', 'Hafnarfjörður', 'Akureyri', 'Reykjanesbær'],
  'VU': ['Port Vila', 'Luganville', 'Isangel', 'Sola', 'Lakatoro'],
  'BB': ['Bridgetown', 'Speightstown', 'Oistins', 'Bathsheba', 'Holetown'],
  'WS': ['Apia', 'Salelologa', 'Mulifanua', 'Leulumoega', 'Lufilufi'],
  'LC': ['Castries', 'Bisee', 'Vieux Fort', 'Micoud', 'Soufriere'],
  'KI': ['South Tarawa', 'Betio', 'Bikenibeu', 'Teaoraereke', 'Bairiki'],
  'GD': ['Saint George\'s', 'Gouyave', 'Grenville', 'Victoria', 'Saint David\'s'],
  'VC': ['Kingstown', 'Georgetown', 'Barrouallie', 'Port Elizabeth', 'Layou'],
  'AW': ['Oranjestad', 'Babijn', 'Angochi', 'Paradera', 'San Nicolas'],
  'TO': ['Nuku\'alofa', 'Neiafu', 'Haveluloto', 'Vaini', 'Pangai'],
  'SC': ['Victoria', 'Anse Boileau', 'Beau Vallon', 'Cascade', 'Anse Royale'],
  'AG': ['St. John\'s', 'All Saints', 'Piggotts', 'Liberta', 'Potter\'s Village'],
  'AD': ['Andorra la Vella', 'Escaldes-Engordany', 'Encamp', 'Sant Julià de Lòria', 'La Massana'],
  'DM': ['Roseau', 'Portsmouth', 'Berekua', 'Saint Joseph', 'Wesley'],
  'MC': ['Monaco', 'Monte Carlo', 'La Condamine', 'Fontvieille', 'Monaco-Ville'],
  'LI': ['Vaduz', 'Schaan', 'Balzers', 'Triesen', 'Eschen'],
  'SM': ['San Marino', 'Serravalle', 'Borgo Maggiore', 'Domagnano', 'Fiorentino'],
  'PW': ['Ngerulmud', 'Koror', 'Airai', 'Melekeok', 'Ngaraard'],
  'TV': ['Funafuti', 'Asau', 'Lolua', 'Savave', 'Tanrake'],
  'NR': ['Yaren', 'Baiti', 'Anabar', 'Ijuw', 'Meneng'],
  'VA': ['Vatican City']
};

async function seedWorldCities() {
  console.log('🌍 Starting world cities seeding...');

  try {
    // Get all countries for ID mapping
    const allCountries = await db.select().from(countries);
    const countryMap = new Map(allCountries.map((c: any) => [c.code, c.id]));

    console.log(`📊 Found ${allCountries.length} countries in database`);

    let totalCitiesAdded = 0;
    let processedCountries = 0;
    let skippedCountries = 0;

    // Process cities in batches for each country
    for (const [countryCode, cityNames] of Object.entries(WORLD_CITIES_DATA)) {
      const countryId = countryMap.get(countryCode);
      
      if (!countryId) {
        console.log(`⚠️  Skipping ${countryCode} - country not found in database`);
        skippedCountries++;
        continue;
      }

      // Prepare city data (matching actual database schema)
      const cityData = cityNames.map(cityName => ({
        countryId,
        name: cityName,
        countryCode,
        isMajor: true // All seeded cities are considered major
      }));

      try {
        // Insert cities in batches with conflict handling
        await db.insert(cities).values(cityData).onConflictDoNothing();
        totalCitiesAdded += cityData.length;
        processedCountries++;
        
        console.log(`✅ Added ${cityData.length} cities for ${countryCode}`);
      } catch (error: any) {
        console.log(`❌ Failed to add cities for ${countryCode}:`, error);
        skippedCountries++;
      }
    }

    console.log('🎉 World cities seeding completed!');
    console.log(`📈 Statistics:`);
    console.log(`   - Countries processed: ${processedCountries}`);
    console.log(`   - Countries skipped: ${skippedCountries}`);
    console.log(`   - Total cities added: ${totalCitiesAdded}`);

    return {
      success: true,
      countriesProcessed: processedCountries,
      countriesSkipped: skippedCountries,
      citiesAdded: totalCitiesAdded
    };

  } catch (error) {
    console.error('💥 World cities seeding failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Export for use in other files
export { seedWorldCities };