# Source's
# https://www.edu.gov.mb.ca/k12/cur/socstud/foundation_gr6/blms/6-3-1e.pdf # For Canadian Provinces
# https://www.kaggle.com/datasets/nikitagrec/world-capitals-gps/data # For Country Capitals
# https://www.xfront.com/us_states/ # For US states


# Every 60 seconds, re-send data to publisher

# COORDINATE LOOK-UP TABLE
provinces = {

    "BC": (48.4284, -123.3656),  # British Columbia – Victoria
    "YT": (60.7212, -135.0568),  # Yukon – Whitehorse
    "AB": (53.5461, -113.4938),  # Alberta – Edmonton
    "NT": (62.4540, -114.3718),  # Northwest Territories – Yellowknife
    "SK": (50.4452, -104.6189),  # Saskatchewan – Regina
    "MB": (49.8951, -97.1384),   # Manitoba – Winnipeg
    "NU": (63.7467, -68.5170),   # Nunavut – Iqaluit
    "ON": (43.6532, -79.3832),   # Ontario – Toronto
    "QC": (46.8139, -71.2080),   # Québec – Québec City
    "NB": (45.9636, -66.6431),   # New Brunswick – Fredericton
    "NL": (47.5615, -52.7126),   # Newfoundland and Labrador – St. John’s
    "NS": (44.6488, -63.5752),   # Nova Scotia – Halifax
    "PE": (46.2382, -63.1311),   # Prince Edward Island – Charlottetown

}

states = {
    ######### US STATES #########
    "Ala": (32.361538, -86.279118),  # Alabama
    "Alk": (58.301935, -134.419740),  # Alaska
    "Ari": (33.448457, -112.073844),  # Arizona
    "Ark": (34.736009, -92.331122),  # Arkansas
    "Cal": (38.555605, -121.468926),  # California
    "Col": (39.7391667, -104.984167),  # Colorado
    "Con": (41.767, -72.677),  # Connecticut
    "Del": (39.161921, -75.526755),  # Delaware
    "Flo": (30.4518, -84.27277),  # Florida
    "Geo": (33.76, -84.39),  # Georgia
    "Haw": (21.30895, -157.826182),  # Hawaii
    "Ida": (43.613739, -116.237651),  # Idaho
    "Ill": (39.783250, -89.650373),  # Illinois
    "Ind": (39.790942, -86.147685),  # Indiana
    "Iow": (41.590939, -93.620866),  # Iowa
    "Kan": (39.04, -95.69),  # Kansas
    "Ken": (38.197274, -84.86311),  # Kentucky
    "Lou": (30.45809, -91.140229),  # Louisiana
    "Mai": (44.323535, -69.765261),  # Maine
    "Mar": (38.972945, -76.501157),  # Maryland
    "Mas": (42.2352, -71.0275),  # Massachusetts
    "Mic": (42.7335, -84.5467),  # Michigan
    "Min": (44.95, -93.094),  # Minnesota
    "Mis": (32.320, -90.207),  # Mississippi
    "Mou": (38.572954, -92.189283),  # Missouri
    "Mon": (46.595805, -112.027031),  # Montana
    "Neb": (40.809868, -96.675345),  # Nebraska
    "Nev": (39.160949, -119.753877),  # Nevada
    "Neh": (43.220093, -71.549127),  # New Hampshire
    # "Nej": (40.221741, -74.756138),  # New Jersey
    "Nem": (35.667231, -105.964575),  # New Mexico
    "Nyc": (42.659829, -73.781339),  # New York
    "Nca": (35.771, -78.638),  # North Carolina
    "Nda": (48.813343, -100.779004),  # North Dakota
    "Ohi": (39.962245, -83.000647),  # Ohio
    "Okl": (35.482309, -97.534994),  # Oklahoma
    "Ore": (44.931109, -123.029159),  # Oregon
    "Pen": (40.269789, -76.875613),  # Pennsylvania
    "Rho": (41.82355, -71.422132),  # Rhode Island
    "Sca": (34.000, -81.035),  # South Carolina
    "Sda": (44.367966, -100.336378),  # South Dakota
    "Ten": (36.165, -86.784),  # Tennessee
    "Tex": (30.266667, -97.75),  # Texas
    "Uta": (40.7547, -111.892622),  # Utah
    "Ver": (44.26639, -72.57194),  # Vermont
    "Vir": (37.54, -77.46),  # Virginia
    "Was": (47.042418, -122.893077),  # Washington
    "Wvi": (38.349497, -81.633294),  # West Virginia
    "Wis": (43.074722, -89.384444),  # Wisconsin
    "Wyo": (41.145548, -104.802042)  # Wyoming
}

countries = {

    # A
    "AFG": (34.5553, 69.2075),  # Afghanistan
    "ALB": (41.3275, 19.8189),  # Albania
    "ALG": (36.7538, 3.0588),   # Algeria
    # "AND": (42.5063, 1.5218),   # Andorra
    "AGO": (-8.8390, 13.2894),  # Angola
    "ATG": (17.1274, -61.8468), # Antigua and Barbuda
    "ARG": (-34.6037, -58.3816),# Argentina
    "ARM": (40.1792, 44.4991),  # Armenia
    "AUS": (-35.2809, 149.1300),# Australia
    "AUT": (48.2082, 16.3738),  # Austria
    "AZE": (40.4093, 49.8671),  # Azerbaijan

    # B
    "BHS": (25.0443, -77.3504), # Bahamas
    "BHR": (26.2285, 50.5860),  # Bahrain
    "BGD": (23.8103, 90.4125),  # Bangladesh
    "BRB": (13.0975, -59.6167), # Barbados
    "BLR": (53.9006, 27.5590),  # Belarus
    "BEL": (50.8503, 4.3517),   # Belgium
    "BLZ": (17.2510, -88.7590), # Belize
    "BEN": (6.4969, 2.6289),    # Benin
    "BTN": (27.4728, 89.6390),  # Bhutan
    "BOL": (-16.4897, -68.1193),# Bolivia
    "BIH": (43.8563, 18.4131),  # Bosnia and Herzegovina
    "BWA": (-24.6282, 25.9231), # Botswana
    "BRA": (-15.7939, -47.8828),# Brazil
    "BRN": (4.9031, 114.9398),  # Brunei
    "BGR": (42.6977, 23.3219),  # Bulgaria
    "BFA": (12.3714, -1.5197),  # Burkina Faso
    "BDI": (-3.3731, 29.9189),  # Burundi

    # C
    # "CPV": (14.9330, -23.5133), # Cape Verde
    "KHM": (11.5564, 104.9282), # Cambodia
    "CMR": (3.8480, 11.5021),   # Cameroon
    "CAN": (45.4215, -75.6972), # Canada
    "CAF": (4.3947, 18.5582),   # Central African Republic
    "TCD": (12.1348, 15.0557),  # Chad
    "CHL": (-33.4489, -70.6693),# Chile
    "CHN": (39.9042, 116.4074), # China
    "COL": (4.7110, -74.0721),  # Colombia
    "COM": (-11.7172, 43.2473), # Comoros
    "COG": (-4.2634, 15.2429),  # Republic of the Congo
    "COD": (-4.4419, 15.2663),  # Democratic Republic of the Congo
    "CRI": (9.9281, -84.0907),  # Costa Rica
    "CIV": (6.8276, -5.2893),   # Ivory Coast (Côte d'Ivoire)
    "HRV": (45.8150, 15.9819),  # Croatia
    "CUB": (23.1136, -82.3666), # Cuba
    "CYP": (35.1856, 33.3823),  # Cyprus
    "CZE": (50.0755, 14.4378),  # Czech Republic

    # D
    "DNK": (55.6761, 12.5683),  # Denmark
    "DJI": (11.8251, 42.5903),  # Djibouti
    "DMA": (15.3092, -61.3794), # Dominica
    "DOM": (18.4861, -69.9312), # Dominican Republic

    # E
    "ECU": (-0.1807, -78.4678), # Ecuador
    "EGY": (30.0444, 31.2357),  # Egypt
    "SLV": (13.6929, -89.2182), # El Salvador
    "GNQ": (3.7504, 8.7371),    # Equatorial Guinea
    "ERI": (15.3229, 38.9251),  # Eritrea
    "EST": (59.4370, 24.7536),  # Estonia
    "SWZ": (-26.3054, 31.1367), # Eswatini
    "ETH": (9.0300, 38.7400),   # Ethiopia

    # F
    "FJI": (-18.1248, 178.4501),# Fiji
    "FIN": (60.1699, 24.9384),  # Finland
    "FRA": (48.8566, 2.3522),   # France

    # G
    "GAB": (0.4162, 9.4673),    # Gabon
    "GMB": (13.4549, -16.5790), # Gambia
    "GEO": (41.7151, 44.8271),  # Georgia
    "DEU": (52.5200, 13.4050),  # Germany
    "GHA": (5.6037, -0.1870),   # Ghana
    "GRC": (37.9838, 23.7275),  # Greece
    "GRD": (12.0561, -61.7488), # Grenada
    "GTM": (14.6349, -90.5069), # Guatemala
    "GIN": (9.6412, -13.5784),  # Guinea
    "GNB": (11.8817, -15.6170), # Guinea-Bissau
    "GUY": (6.8013, -58.1551),  # Guyana

    # H
    "HTI": (18.5944, -72.3074), # Haiti
    "HND": (14.0723, -87.1921), # Honduras
    "HUN": (47.4979, 19.0402),  # Hungary

    # I
    "ISL": (64.1466, -21.9426), # Iceland
    "IND": (28.6139, 77.2090),  # India
    "IDN": (-6.2088, 106.8456), # Indonesia
    "IRN": (35.6892, 51.3890),  # Iran
    "IRQ": (33.3152, 44.3661),  # Iraq
    "IRL": (53.3498, -6.2603),  # Ireland
    "ISR": (31.7683, 35.2137),  # Israel
    "ITA": (41.9028, 12.4964),  # Italy
     # J
    "JAM": (17.9712, -76.7936),  # Jamaica
    "JPN": (35.6762, 139.6503),  # Japan
    "JOR": (31.9454, 35.9284),   # Jordan

    # K
    "KAZ": (51.1605, 71.4704),   # Kazakhstan
    "KEN": (-1.2921, 36.8219),   # Kenya
    "KIR": (1.4518, 172.9717),   # Kiribati
    "PRK": (39.0392, 125.7625),  # North Korea
    "KOR": (37.5665, 126.9780),  # South Korea
    "KWT": (29.3759, 47.9774),   # Kuwait
    "KGZ": (42.8746, 74.5698),   # Kyrgyzstan
    "KOS": (42.6629, 21.1655),   # Kosovo

    # L
    "LAO": (17.9757, 102.6331),  # Laos
    "LVA": (56.9496, 24.1052),   # Latvia
    "LBN": (33.8938, 35.5018),   # Lebanon
    "LSO": (-29.3158, 27.4869),  # Lesotho
    "LBR": (6.3156, -10.8074),   # Liberia
    "LBY": (32.8872, 13.1913),   # Libya
    # "LIE": (47.1410, 9.5209),    # Liechtenstein
    "LTU": (54.6872, 25.2797),   # Lithuania
    # "LUX": (49.6116, 6.1319),    # Luxembourg

    # M
    "MAD": (-18.8792, 47.5079),  # Madagascar
    "MWI": (-13.9626, 33.7741),  # Malawi
    "MYS": (3.1390, 101.6869),   # Malaysia
    "MDV": (4.1755, 73.5093),    # Maldives
    "MLI": (12.6392, -8.0029),   # Mali
    "MLT": (35.8997, 14.5146),   # Malta
    "MHL": (7.1315, 171.1845),   # Marshall Islands
    "MRT": (18.0735, -15.9582),  # Mauritania
    "MUS": (-20.3484, 57.5522),  # Mauritius
    "MEX": (19.4326, -99.1332),  # Mexico
    "FSM": (6.9248, 158.1610),   # Federated States of Micronesia
    "MOL": (47.0105, 28.8638),   # Moldova
    # "MCO": (43.7384, 7.4246),    # Monaco
    "MNG": (47.8864, 106.9057),  # Mongolia
    "MNT": (42.4304, 19.2594),   # Montenegro
    "MAR": (34.0209, -6.8416),   # Morocco
    "MOZ": (-25.9692, 32.5732),  # Mozambique
    "MMR": (19.7633, 96.0785),   # Myanmar

    # N
    "NAM": (-22.5609, 17.0658),  # Namibia
    "NRU": (-0.5477, 166.9209),  # Nauru
    "NPL": (27.7172, 85.3240),   # Nepal
    "NLD": (52.3676, 4.9041),    # Netherlands
    "NZL": (-41.2865, 174.7762), # New Zealand
    "NIC": (12.1149, -86.2362),  # Nicaragua
    "NER": (13.5116, 2.1254),    # Niger
    "NGA": (9.0765, 7.3986),     # Nigeria
    "MKD": (41.9973, 21.4280),   # North Macedonia
    "NWY": (59.9139, 10.7522),   # Norway

    # O
    "OMN": (23.5880, 58.3829),   # Oman

    # P
    "PAK": (33.6844, 73.0479),   # Pakistan
    "PLW": (7.5000, 134.6242),   # Palau
    "PAN": (8.9824, -79.5199),   # Panama
    "PNG": (-9.4438, 147.1803),  # Papua New Guinea
    "PRY": (-25.2637, -57.5759), # Paraguay
    "PER": (-12.0464, -77.0428), # Peru
    "PHL": (14.5995, 120.9842),  # Philippines
    "POL": (52.2297, 21.0122),   # Poland
    "POR": (38.7223, -9.1393),   # Portugal
    "PSE": (31.7683, 35.2137),   # Palestine

    # Q
    "QAT": (25.2854, 51.5310),   # Qatar

    # R
    "ROU": (44.4268, 26.1025),   # Romania
    "RUS": (55.7558, 37.6173),   # Russia
    "RWA": (-1.9706, 30.1044),   # Rwanda

    # S
    "KNA": (17.3026, -62.7177),  # Saint Kitts and Nevis
    "LCA": (14.0101, -60.9875),  # Saint Lucia
    "VCT": (13.1600, -61.2248),  # Saint Vincent and the Grenadines
    "WSM": (-13.8500, -171.7500),# Samoa
    # "SMR": (43.9424, 12.4578),   # San Marino
    "STP": (0.3365, 6.7273),     # São Tomé and Príncipe
    "SAU": (24.7136, 46.6753),   # Saudi Arabia
    "SEN": (14.7167, -17.4677),  # Senegal
    "SRB": (44.7866, 20.4489),   # Serbia
    "SYC": (-4.6191, 55.4513),   # Seychelles
    "SLE": (8.4657, -13.2317),   # Sierra Leone
    "SGP": (1.3521, 103.8198),   # Singapore
    "SVK": (48.1486, 17.1077),   # Slovakia
    "SVN": (46.0569, 14.5058),   # Slovenia
    "SLB": (-9.4456, 159.9729),  # Solomon Islands
    "SOM": (2.0469, 45.3182),    # Somalia
    "ZAF": (-25.7479, 28.2293),  # South Africa
    "SSD": (4.8594, 31.5713),    # South Sudan
    "ESP": (40.4168, -3.7038),   # Spain
    "LKA": (6.9271, 79.8612),    # Sri Lanka
    "SDN": (15.5007, 32.5599),   # Sudan
    "SUR": (5.8520, -55.2038),   # Suriname
    "SWE": (59.3293, 18.0686),   # Sweden
    "CHE": (46.9480, 7.4474),    # Switzerland
    "SYR": (33.5138, 36.2765),   # Syria

    # T
    "TWN": (25.0330, 121.5654),  # Taiwan
    "TJK": (38.5598, 68.7870),   # Tajikistan
    "TZA": (-6.1629, 35.7516),   # Tanzania
    "THA": (13.7563, 100.5018),  # Thailand
    "TLS": (-8.5569, 125.5603),  # Timor-Leste
    "TGO": (6.1725, 1.2314),     # Togo
    "TON": (-21.1394, -175.2040),# Tonga
    "TTO": (10.6549, -61.5019),  # Trinidad and Tobago
    "TUN": (36.8065, 10.1815),   # Tunisia
    "TUR": (39.9334, 32.8597),   # Turkey
    "TKM": (37.9601, 58.3261),   # Turkmenistan
    "TUV": (-8.5201, 179.1981),  # Tuvalu

    # U
    "UGA": (0.3476, 32.5825),    # Uganda
    "UKR": (50.4501, 30.5234),   # Ukraine
    "ARE": (24.4539, 54.3773),   # United Arab Emirates
    "GBR": (51.5074, -0.1278),   # United Kingdom
    # "USA": (38.9072, -77.0369),  # United States
    "URY": (-34.9011, -56.1645), # Uruguay
    "UZB": (41.2995, 69.2401),   # Uzbekistan

    # V
    "VUT": (-17.7333, 168.3273), # Vanuatu
    # "VAT": (41.9029, 12.4534),   # Vatican City
    "VEN": (10.4806, -66.9036),  # Venezuela
    "VNM": (21.0278, 105.8342),  # Vietnam

    # Y
    "YEM": (15.3694, 44.1910),   # Yemen

    # Z
    "ZMB": (-15.3875, 28.3228),  # Zambia
    "ZWE": (-17.8252, 31.0335)   # Zimbabwe

}