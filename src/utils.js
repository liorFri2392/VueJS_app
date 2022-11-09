export function dateToYearMonth(monthString) {
  let [year, month] = monthString.split('-').slice(0, 2).map(Number);
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
}

export function monthsBetween(startDate, endDate) {
  const startYearMonth = dateToYearMonth(startDate);
  const endYearMonth = dateToYearMonth(endDate);
  const months = [];

  let currentYearMonth = startYearMonth;

  while (currentYearMonth <= endYearMonth) {
    months.push(currentYearMonth);
    let [year, month] = currentYearMonth.split('-').slice(0, 2).map(Number);
    currentYearMonth =
      month === 12
        ? `${year + 1}-01`
        : `${year}-${String(month + 1).padStart(2, '0')}`;
  }

  return months;
}
export function cleanDomain(domains) {
    if (domains instanceof Array) {
        return domains.map(function (cellValue) { return cleanDomain(cellValue); });
    }
    return domains.trim().replace(/^(?:\w+:\/\/)?(?:www\.)?/ig, '').replace(/\/.*$/ig, '').toLowerCase();
}

function csvCellSafe(value) {
  let result = String(value).replace(/"/g, '""');
  if (result.indexOf(',') >= 0) {
    result = `"${result}"`;
  }

  return result;
}

export function arrayToCsvRow(values) {
  return `${values.map(csvCellSafe)}\n`;
}

export function secondsToHumanReadable(totalSeconds) {
  const remaining = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  };

  let temp = totalSeconds;
  remaining.days = Math.floor((temp %= 31536000) / 86400);
  temp -= remaining.days;

  remaining.hours = Math.floor((temp %= 86400) / 3600);
  temp -= remaining.hours;

  remaining.minutes = Math.floor((temp %= 3600) / 60);
  temp -= remaining.minutes;

  remaining.seconds = temp % 60;
  temp -= remaining.seconds;

  remaining.milliseconds = 1000 * temp;

  let result = '';
  if (remaining.days > 0) {
    result = `${remaining.days} day${remaining.days > 1 ? 's' : ''} and ${
      remaining.hours
    } hour${remaining.hours > 1 ? 's' : ''}`;
  } else if (remaining.hours > 0) {
    result = `${remaining.hours} hour${remaining.hours > 1 ? 's' : ''} and ${
      remaining.minutes
    } minute${remaining.minutes > 1 ? 's' : ''}`;
  } else if (remaining.minutes > 0) {
    result = `${remaining.minutes} minute${
      remaining.minutes > 1 ? 's' : ''
    } and ${remaining.seconds.toFixed(0)} second${
      remaining.seconds > 1 ? 's' : ''
    }`;
  } else if (remaining.seconds > 0) {
    result = `${remaining.seconds.toFixed(0)} second${
      remaining.seconds > 1 ? 's' : ''
    }`;
  } else {
    result = 'Less than a second';
  }

  return result;
}

export function daysBefore(lastDay, nbDays) {
  if (nbDays === void 0) {
    nbDays = 28;
  }
  let dt = lastDay === void 0 ? new Date() : new Date(lastDay);
  let remainingDays = nbDays > 0 ? nbDays : 0;

  var days = [];
  while (remainingDays > 0) {
    days.unshift(dt.toISOString().split('T')[0]);
    dt.setDate(dt.getDate() - 1);
    remainingDays -= 1;
  }

  return days;
}

export function decodeCountry(countryCode) {
  var countryDict = {
    4: 'Afghanistan',
    8: 'Albania',
    10: 'Antarctica',
    12: 'Algeria',
    16: 'American Samoa',
    20: 'Andorra',
    24: 'Angola',
    28: 'Antigua and Barbuda',
    31: 'Azerbaijan',
    32: 'Argentina',
    36: 'Australia',
    40: 'Austria',
    44: 'Bahamas',
    48: 'Bahrain',
    50: 'Bangladesh',
    51: 'Armenia',
    52: 'Barbados',
    56: 'Belgium',
    60: 'Bermuda',
    64: 'Bhutan',
    68: 'Bolivia',
    70: 'Bosnia and Herzegovina',
    72: 'Botswana',
    74: 'Bouvet Island',
    76: 'Brazil',
    84: 'Belize',
    86: 'British Indian Ocean Territory',
    90: 'Solomon Islands',
    92: 'Virgin Islands (British)',
    96: 'Brunei Darussalam',
    100: 'Bulgaria',
    104: 'Myanmar',
    108: 'Burundi',
    112: 'Belarus',
    116: 'Cambodia',
    120: 'Cameroon',
    124: 'Canada',
    132: 'Cabo Verde',
    136: 'Cayman Islands',
    140: 'Central African Republic',
    144: 'Sri Lanka',
    148: 'Chad',
    152: 'Chile',
    156: 'China',
    158: 'Taiwan',
    162: 'Christmas Island',
    166: 'Cocos (Keeling) Islands',
    170: 'Colombia',
    174: 'Comoros',
    175: 'Mayotte',
    178: 'Congo',
    180: 'Congo (Democratic Republic of the)',
    184: 'Cook Islands',
    188: 'Costa Rica',
    191: 'Croatia',
    192: 'Cuba',
    196: 'Cyprus',
    203: 'Czech Republic',
    204: 'Benin',
    208: 'Denmark',
    212: 'Dominica',
    214: 'Dominican Republic',
    218: 'Ecuador',
    222: 'El Salvador',
    226: 'Equatorial Guinea',
    231: 'Ethiopia',
    232: 'Eritrea',
    233: 'Estonia',
    234: 'Faroe Islands',
    238: 'Falkland Islands (Malvinas)',
    239: 'South Georgia and the South Sandwich Islands',
    242: 'Fiji',
    246: 'Finland',
    248: 'Åland Islands',
    250: 'France',
    254: 'French Guiana',
    258: 'French Polynesia',
    260: 'French Southern Territories',
    262: 'Djibouti',
    266: 'Gabon',
    268: 'Georgia',
    270: 'Gambia',
    275: 'Palestine',
    276: 'Germany',
    288: 'Ghana',
    292: 'Gibraltar',
    296: 'Kiribati',
    300: 'Greece',
    304: 'Greenland',
    308: 'Grenada',
    312: 'Guadeloupe',
    316: 'Guam',
    320: 'Guatemala',
    324: 'Guinea',
    328: 'Guyana',
    332: 'Haiti',
    334: 'Heard Island and McDonald Islands',
    336: 'Holy See',
    340: 'Honduras',
    344: 'Hong Kong',
    348: 'Hungary',
    352: 'Iceland',
    356: 'India',
    360: 'Indonesia',
    364: 'Iran',
    368: 'Iraq',
    372: 'Ireland',
    376: 'Israel',
    380: 'Italy',
    384: "Côte d'Ivoire",
    388: 'Jamaica',
    392: 'Japan',
    398: 'Kazakhstan',
    400: 'Jordan',
    404: 'Kenya',
    408: "Korea, Democratic People's Republic of",
    410: 'Korea, Republic of',
    414: 'Kuwait',
    417: 'Kyrgyzstan',
    418: "Lao People's Democratic Republic",
    422: 'Lebanon',
    426: 'Lesotho',
    428: 'Latvia',
    430: 'Liberia',
    434: 'Libya',
    438: 'Liechtenstein',
    440: 'Lithuania',
    442: 'Luxembourg',
    446: 'Macao',
    450: 'Madagascar',
    454: 'Malawi',
    458: 'Malaysia',
    462: 'Maldives',
    466: 'Mali',
    470: 'Malta',
    474: 'Martinique',
    478: 'Mauritania',
    480: 'Mauritius',
    484: 'Mexico',
    492: 'Monaco',
    496: 'Mongolia',
    498: 'Moldova',
    499: 'Montenegro',
    500: 'Montserrat',
    504: 'Morocco',
    508: 'Mozambique',
    512: 'Oman',
    516: 'Namibia',
    520: 'Nauru',
    524: 'Nepal',
    528: 'Netherlands',
    531: 'Curaçao',
    533: 'Aruba',
    534: 'Sint Maarten (Dutch part)',
    535: 'Bonaire, Sint Eustatius and Saba',
    540: 'New Caledonia',
    548: 'Vanuatu',
    554: 'New Zealand',
    558: 'Nicaragua',
    562: 'Niger',
    566: 'Nigeria',
    570: 'Niue',
    574: 'Norfolk Island',
    578: 'Norway',
    580: 'Northern Mariana Islands',
    581: 'United States Minor Outlying Islands',
    583: 'Micronesia, Federated States of',
    584: 'Marshall Islands',
    585: 'Palau',
    586: 'Pakistan',
    591: 'Panama',
    598: 'Papua New Guinea',
    600: 'Paraguay',
    604: 'Peru',
    608: 'Philippines',
    612: 'Pitcairn',
    616: 'Poland',
    620: 'Portugal',
    624: 'Guinea-Bissau',
    626: 'Timor-Leste',
    630: 'Puerto Rico',
    634: 'Qatar',
    638: 'Réunion',
    642: 'Romania',
    643: 'Russia',
    646: 'Rwanda',
    652: 'Saint Barthélemy',
    654: 'Saint Helena, Ascension and Tristan da Cunha',
    659: 'Saint Kitts and Nevis',
    660: 'Anguilla',
    662: 'Saint Lucia',
    663: 'Saint Martin (French part)',
    666: 'Saint Pierre and Miquelon',
    670: 'Saint Vincent and the Grenadines',
    674: 'San Marino',
    678: 'Sao Tome and Principe',
    682: 'Saudi Arabia',
    686: 'Senegal',
    688: 'Serbia',
    690: 'Seychelles',
    694: 'Sierra Leone',
    702: 'Singapore',
    703: 'Slovakia',
    704: 'Vietnam',
    705: 'Slovenia',
    706: 'Somalia',
    710: 'South Africa',
    716: 'Zimbabwe',
    724: 'Spain',
    728: 'South Sudan',
    729: 'Sudan',
    732: 'Western Sahara',
    736: 'Sudan',
    740: 'Suriname',
    744: 'Svalbard and Jan Mayen',
    748: 'Swaziland',
    752: 'Sweden',
    756: 'Switzerland',
    760: 'Syria',
    762: 'Tajikistan',
    764: 'Thailand',
    768: 'Togo',
    772: 'Tokelau',
    776: 'Tonga',
    780: 'Trinidad and Tobago',
    784: 'United Arab Emirates',
    788: 'Tunisia',
    792: 'Turkey',
    795: 'Turkmenistan',
    796: 'Turks and Caicos Islands',
    798: 'Tuvalu',
    800: 'Uganda',
    804: 'Ukraine',
    807: 'Macedonia, the former Yugoslav Republic of',
    818: 'Egypt',
    826: 'United Kingdom',
    831: 'Guernsey',
    832: 'Jersey',
    833: 'Isle of Man',
    834: 'Tanzania, United Republic of',
    840: 'United States',
    850: 'Virgin Islands (U.S.)',
    854: 'Burkina Faso',
    858: 'Uruguay',
    860: 'Uzbekistan',
    862: 'Venezuela',
    876: 'Wallis and Futuna',
    882: 'Samoa',
    887: 'Yemen',
    894: 'Zambia',
    999: 'Worldwide',
  };
  return countryDict[countryCode] || countryCode;
}
