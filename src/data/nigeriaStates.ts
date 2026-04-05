export interface State {
  name: string;
  capital: string;
  region: 'North Central' | 'North East' | 'North West' | 'South East' | 'South South' | 'South West';
  majorTowns: string[];
}

export const nigeriaStates: State[] = [
  {
    name: 'Abia',
    capital: 'Umuahia',
    region: 'South East',
    majorTowns: ['Umuahia', 'Aba', 'Arochukwu', 'Ohafia', 'Bende']
  },
  {
    name: 'Adamawa',
    capital: 'Yola',
    region: 'North East',
    majorTowns: ['Yola', 'Mubi', 'Numan', 'Jimeta', 'Ganye']
  },
  {
    name: 'Akwa Ibom',
    capital: 'Uyo',
    region: 'South South',
    majorTowns: ['Uyo', 'Eket', 'Ikot Ekpene', 'Oron', 'Ikot Abasi']
  },
  {
    name: 'Anambra',
    capital: 'Awka',
    region: 'South East',
    majorTowns: ['Awka', 'Onitsha', 'Nnewi', 'Ekwulobia', 'Aguata']
  },
  {
    name: 'Bauchi',
    capital: 'Bauchi',
    region: 'North East',
    majorTowns: ['Bauchi', 'Azare', 'Misau', 'Jama\'are', 'Katagum']
  },
  {
    name: 'Bayelsa',
    capital: 'Yenagoa',
    region: 'South South',
    majorTowns: ['Yenagoa', 'Brass', 'Nembe', 'Sagbama', 'Ogbia']
  },
  {
    name: 'Benue',
    capital: 'Makurdi',
    region: 'North Central',
    majorTowns: ['Makurdi', 'Gboko', 'Otukpo', 'Katsina-Ala', 'Vandeikya']
  },
  {
    name: 'Borno',
    capital: 'Maiduguri',
    region: 'North East',
    majorTowns: ['Maiduguri', 'Biu', 'Bama', 'Konduga', 'Damboa']
  },
  {
    name: 'Cross River',
    capital: 'Calabar',
    region: 'South South',
    majorTowns: ['Calabar', 'Ugep', 'Ikom', 'Ogoja', 'Obudu']
  },
  {
    name: 'Delta',
    capital: 'Asaba',
    region: 'South South',
    majorTowns: ['Asaba', 'Warri', 'Sapele', 'Ughelli', 'Agbor']
  },
  {
    name: 'Ebonyi',
    capital: 'Abakaliki',
    region: 'South East',
    majorTowns: ['Abakaliki', 'Afikpo', 'Onueke', 'Ezza', 'Ishielu']
  },
  {
    name: 'Edo',
    capital: 'Benin City',
    region: 'South South',
    majorTowns: ['Benin City', 'Auchi', 'Ekpoma', 'Uromi', 'Irrua']
  },
  {
    name: 'Ekiti',
    capital: 'Ado-Ekiti',
    region: 'South West',
    majorTowns: ['Ado-Ekiti', 'Ikere-Ekiti', 'Ijero-Ekiti', 'Ikole-Ekiti', 'Ise-Ekiti']
  },
  {
    name: 'Enugu',
    capital: 'Enugu',
    region: 'South East',
    majorTowns: ['Enugu', 'Nsukka', 'Agbani', 'Oji River', 'Udi']
  },
  {
    name: 'Gombe',
    capital: 'Gombe',
    region: 'North East',
    majorTowns: ['Gombe', 'Kumo', 'Deba', 'Billiri', 'Kaltungo']
  },
  {
    name: 'Imo',
    capital: 'Owerri',
    region: 'South East',
    majorTowns: ['Owerri', 'Orlu', 'Okigwe', 'Oguta', 'Mbaise']
  },
  {
    name: 'Jigawa',
    capital: 'Dutse',
    region: 'North West',
    majorTowns: ['Dutse', 'Hadejia', 'Kazaure', 'Gumel', 'Birnin Kudu']
  },
  {
    name: 'Kaduna',
    capital: 'Kaduna',
    region: 'North West',
    majorTowns: ['Kaduna', 'Zaria', 'Kafanchan', 'Kagoro', 'Saminaka']
  },
  {
    name: 'Kano',
    capital: 'Kano',
    region: 'North West',
    majorTowns: ['Kano', 'Wudil', 'Danbatta', 'Bichi', 'Gwarzo']
  },
  {
    name: 'Katsina',
    capital: 'Katsina',
    region: 'North West',
    majorTowns: ['Katsina', 'Daura', 'Funtua', 'Malumfashi', 'Dutsin-Ma']
  },
  {
    name: 'Kebbi',
    capital: 'Birnin Kebbi',
    region: 'North West',
    majorTowns: ['Birnin Kebbi', 'Argungu', 'Zuru', 'Yauri', 'Jega']
  },
  {
    name: 'Kogi',
    capital: 'Lokoja',
    region: 'North Central',
    majorTowns: ['Lokoja', 'Okene', 'Kabba', 'Idah', 'Ankpa']
  },
  {
    name: 'Kwara',
    capital: 'Ilorin',
    region: 'North Central',
    majorTowns: ['Ilorin', 'Offa', 'Jebba', 'Lafiagi', 'Patigi']
  },
  {
    name: 'Lagos',
    capital: 'Ikeja',
    region: 'South West',
    majorTowns: ['Ikeja', 'Lagos Island', 'Epe', 'Badagry', 'Ikorodu']
  },
  {
    name: 'Nasarawa',
    capital: 'Lafia',
    region: 'North Central',
    majorTowns: ['Lafia', 'Keffi', 'Akwanga', 'Nasarawa', 'Wamba']
  },
  {
    name: 'Niger',
    capital: 'Minna',
    region: 'North Central',
    majorTowns: ['Minna', 'Bida', 'Kontagora', 'Suleja', 'Lapai']
  },
  {
    name: 'Ogun',
    capital: 'Abeokuta',
    region: 'South West',
    majorTowns: ['Abeokuta', 'Ijebu Ode', 'Sagamu', 'Ota', 'Ilaro']
  },
  {
    name: 'Ondo',
    capital: 'Akure',
    region: 'South West',
    majorTowns: ['Akure', 'Ondo', 'Owo', 'Ikare', 'Ore']
  },
  {
    name: 'Osun',
    capital: 'Osogbo',
    region: 'South West',
    majorTowns: ['Osogbo', 'Ile-Ife', 'Ilesha', 'Ede', 'Iwo']
  },
  {
    name: 'Oyo',
    capital: 'Ibadan',
    region: 'South West',
    majorTowns: ['Ibadan', 'Ogbomosho', 'Oyo', 'Iseyin', 'Saki']
  },
  {
    name: 'Plateau',
    capital: 'Jos',
    region: 'North Central',
    majorTowns: ['Jos', 'Bukuru', 'Pankshin', 'Shendam', 'Vom']
  },
  {
    name: 'Rivers',
    capital: 'Port Harcourt',
    region: 'South South',
    majorTowns: ['Port Harcourt', 'Bonny', 'Degema', 'Okrika', 'Ahoada']
  },
  {
    name: 'Sokoto',
    capital: 'Sokoto',
    region: 'North West',
    majorTowns: ['Sokoto', 'Gwadabawa', 'Tambuwal', 'Wurno', 'Bodinga']
  },
  {
    name: 'Taraba',
    capital: 'Jalingo',
    region: 'North East',
    majorTowns: ['Jalingo', 'Wukari', 'Bali', 'Gembu', 'Takum']
  },
  {
    name: 'Yobe',
    capital: 'Damaturu',
    region: 'North East',
    majorTowns: ['Damaturu', 'Potiskum', 'Gashua', 'Nguru', 'Geidam']
  },
  {
    name: 'Zamfara',
    capital: 'Gusau',
    region: 'North West',
    majorTowns: ['Gusau', 'Kaura Namoda', 'Talata Mafara', 'Anka', 'Tsafe']
  },
  {
    name: 'FCT',
    capital: 'Abuja',
    region: 'North Central',
    majorTowns: ['Abuja', 'Gwagwalada', 'Kuje', 'Bwari', 'Kwali']
  }
];

export const regions = [
  'North Central',
  'North East',
  'North West',
  'South East',
  'South South',
  'South West'
] as const;
