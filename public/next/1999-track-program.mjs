/** WTW 1999 track program, ID-keyed projection, NOT an independent historical master.
 * 21 real-track dates from 1999 state commission schedules; 4 locked game-calendar windows.
 * Other active track windows are clearly designated WTW GAME MODELED, not certified 1999 dates.
 * 93 stakesIds reference the locked 1999 stakes source; no new events/results are invented.
 */
export const TRACK_PROGRAM_1999=Object.freeze({
  "T-0001": {
    "id": "T-0001",
    "name": "Aqueduct",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "01-01",
        "04-25"
      ],
      [
        "10-15",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–Apr 25; Oct 15–Dec 31",
    "raceDays": "~139",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [
      "STK-0006",
      "STK-0007",
      "STK-0018",
      "STK-0037",
      "STK-0061",
      "STK-0062",
      "STK-0064",
      "STK-0069",
      "STK-0075",
      "STK-0077",
      "STK-0085",
      "STK-0087",
      "STK-0088"
    ],
    "stakesDates": [
      "1999-01-30",
      "1999-02-20",
      "1999-03-06",
      "1999-03-13",
      "1999-03-20",
      "1999-04-10",
      "1999-04-17",
      "1999-11-06",
      "1999-11-13",
      "1999-11-27",
      "1999-12-18"
    ],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0002": {
    "id": "T-0002",
    "name": "Belmont Park",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "04-28",
        "07-18"
      ],
      [
        "09-08",
        "10-24"
      ]
    ],
    "meetWindow": "Apr 28–Jul 18; Sep 8–Oct 24",
    "raceDays": "94",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "APPROVED_WTW_1999_GAME_CALENDAR",
    "sourceUrl": null,
    "stakesIds": [
      "STK-0003",
      "STK-0024",
      "STK-0025",
      "STK-0031",
      "STK-0032",
      "STK-0038",
      "STK-0041",
      "STK-0042",
      "STK-0043",
      "STK-0078",
      "STK-0086",
      "STK-0090",
      "STK-0091",
      "STK-0092"
    ],
    "stakesDates": [
      "1999-05-22",
      "1999-05-29",
      "1999-06-05",
      "1999-06-12",
      "1999-06-19",
      "1999-06-26",
      "1999-07-04",
      "1999-07-10",
      "1999-07-17",
      "1999-09-18",
      "1999-09-25",
      "1999-10-10",
      "1999-10-16"
    ],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0003": {
    "id": "T-0003",
    "name": "Saratoga",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "07-28",
        "09-06"
      ]
    ],
    "meetWindow": "Jul 28–Sep 6",
    "raceDays": "36",
    "preferredDays": "Wed–Mon",
    "dayPattern": [
      0,
      1,
      3,
      4,
      5,
      6
    ],
    "basis": "PUBLISHED_1999_SARATOGA_PROPOSAL",
    "sourceUrl": "https://www.thoroughbreddailynews.com/pdf/tdn/1998/tdn980813.pdf",
    "stakesIds": [
      "STK-0022",
      "STK-0023",
      "STK-0030",
      "STK-0035",
      "STK-0036",
      "STK-0045",
      "STK-0046",
      "STK-0084"
    ],
    "stakesDates": [
      "1999-07-31",
      "1999-08-01",
      "1999-08-21",
      "1999-08-25",
      "1999-08-28",
      "1999-08-29",
      "1999-09-04"
    ],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0004": {
    "id": "T-0004",
    "name": "Monmouth Park",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "05-29",
        "09-05"
      ]
    ],
    "meetWindow": "May 29–Sep 5",
    "raceDays": "72",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "VERIFIED_1999_CALENDAR",
    "sourceUrl": "https://www.nj.gov/oag/racing/downloads/ar1999.pdf",
    "stakesIds": [
      "STK-0053",
      "STK-0054",
      "STK-0060",
      "STK-0066",
      "STK-0068"
    ],
    "stakesDates": [
      "1999-06-26",
      "1999-07-10",
      "1999-08-14",
      "1999-08-22",
      "1999-08-28"
    ],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": "1999 exceptions: open May 31 and Jul 5; dark Jun 2–3",
    "darkDates": [
      "1999-06-02",
      "1999-06-03"
    ],
    "specialDates": [
      "1999-05-31",
      "1999-07-05"
    ],
    "playableIn1999": true
  },
  "T-0005": {
    "id": "T-0005",
    "name": "Meadowlands",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "09-06",
        "11-20"
      ]
    ],
    "meetWindow": "Sep 6–Nov 20",
    "raceDays": "51",
    "preferredDays": "Tue–Sat",
    "dayPattern": [
      2,
      3,
      4,
      5,
      6
    ],
    "basis": "VERIFIED_1999_CALENDAR",
    "sourceUrl": "https://www.nj.gov/oag/racing/downloads/ar1999.pdf",
    "stakesIds": [
      "STK-0072"
    ],
    "stakesDates": [
      "1999-10-15"
    ],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": "1999 NJ: 53 awarded, 51 actually raced; Sep 7–9 dark",
    "darkDates": [
      "1999-09-07",
      "1999-09-08",
      "1999-09-09"
    ],
    "specialDates": [
      "1999-09-06"
    ],
    "playableIn1999": true
  },
  "T-0006": {
    "id": "T-0006",
    "name": "Finger Lakes",
    "surfaces": "Dirt",
    "meets": [
      [
        "04-01",
        "11-30"
      ]
    ],
    "meetWindow": "Apr 1–Nov 30",
    "raceDays": "~174",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0007": {
    "id": "T-0007",
    "name": "Pimlico",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "04-01",
        "06-20"
      ],
      [
        "08-28",
        "10-10"
      ]
    ],
    "meetWindow": "Apr 1–Jun 20; Aug 28–Oct 10",
    "raceDays": "~91",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [
      "STK-0002",
      "STK-0044",
      "STK-0073"
    ],
    "stakesDates": [
      "1999-05-08",
      "1999-05-14",
      "1999-05-15"
    ],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0008": {
    "id": "T-0008",
    "name": "Laurel Park",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "01-01",
        "04-04"
      ],
      [
        "07-01",
        "08-31"
      ],
      [
        "10-01",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–Apr 4; Jul 1–Aug 31; Oct 1–Dec 31",
    "raceDays": "~178",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0009": {
    "id": "T-0009",
    "name": "Delaware Park",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "05-01",
        "11-07"
      ]
    ],
    "meetWindow": "May 1–Nov 7",
    "raceDays": "~137",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [
      "STK-0034",
      "STK-0076"
    ],
    "stakesDates": [
      "1999-07-18",
      "1999-09-04"
    ],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0010": {
    "id": "T-0010",
    "name": "Philadelphia Park",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "01-01",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–Dec 31",
    "raceDays": "~261",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [
      "STK-0071"
    ],
    "stakesDates": [
      "1999-09-06"
    ],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0011": {
    "id": "T-0011",
    "name": "Garden State Park",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "03-19",
        "05-22"
      ]
    ],
    "meetWindow": "Mar 19–May 22",
    "raceDays": "38",
    "preferredDays": "Wed–Sat",
    "dayPattern": [
      3,
      4,
      5,
      6
    ],
    "basis": "VERIFIED_1999_CALENDAR",
    "sourceUrl": "https://www.nj.gov/oag/racing/downloads/ar1999.pdf",
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0012": {
    "id": "T-0012",
    "name": "Charles Town",
    "surfaces": "Dirt",
    "meets": [
      [
        "01-01",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–Dec 31",
    "raceDays": "~261",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0013": {
    "id": "T-0013",
    "name": "Churchill Downs",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "04-24",
        "06-27"
      ],
      [
        "10-31",
        "11-27"
      ]
    ],
    "meetWindow": "Apr 24–Jun 27; Oct 31–Nov 27",
    "raceDays": "71",
    "preferredDays": "Wed–Sun (modeled weekdays)",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "VERIFIED_1999_CALENDAR",
    "sourceUrl": "https://financialfilings.com/filings/churchill-downs-inc/annual-report/2000/10492900/",
    "stakesIds": [
      "STK-0001",
      "STK-0019",
      "STK-0021",
      "STK-0055",
      "STK-0070"
    ],
    "stakesDates": [
      "1999-04-30",
      "1999-05-01",
      "1999-11-20",
      "1999-11-25"
    ],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0014": {
    "id": "T-0014",
    "name": "Keeneland",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "04-02",
        "04-23"
      ],
      [
        "10-09",
        "10-30"
      ]
    ],
    "meetWindow": "Apr 2–Apr 23; Oct 9–Oct 30",
    "raceDays": "31",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "VERIFIED_1999_CALENDAR",
    "sourceUrl": "https://www.keeneland.com/sites/default/files/Meet%20Dates.pdf",
    "stakesIds": [
      "STK-0014",
      "STK-0015",
      "STK-0039",
      "STK-0056",
      "STK-0081"
    ],
    "stakesDates": [
      "1999-04-10",
      "1999-04-11",
      "1999-04-18",
      "1999-10-09",
      "1999-10-10"
    ],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": "1999 official Keeneland: 15 spring days and 16 fall days; dark Easter Sunday Apr 4.",
    "playableIn1999": true,
    "darkDates": [
      "1999-04-04"
    ]
  },
  "T-0015": {
    "id": "T-0015",
    "name": "Turfway Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "01-01",
        "04-02"
      ],
      [
        "09-15",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–Apr 2; Sep 15–Dec 31",
    "raceDays": "~144",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "1999_DIRT_PRE_POLYTRACK",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0016": {
    "id": "T-0016",
    "name": "Ellis Park",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "06-28",
        "09-06"
      ]
    ],
    "meetWindow": "Jun 28–Sep 6",
    "raceDays": "61",
    "preferredDays": "Tue–Sun (modeled weekdays)",
    "dayPattern": [
      0,
      2,
      3,
      4,
      5,
      6
    ],
    "basis": "VERIFIED_1999_CALENDAR",
    "sourceUrl": "https://financialfilings.com/filings/churchill-downs-inc/annual-report/2000/10492900/",
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0017": {
    "id": "T-0017",
    "name": "Gulfstream Park",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "01-03",
        "04-18"
      ],
      [
        "11-05",
        "11-07"
      ]
    ],
    "meetWindow": "Jan 3–Apr 18; Nov 5–Nov 7",
    "raceDays": "~79",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": "https://flgaming.gov/pmw/annual-reports/docs/AnnualReport-1999-2000--69th.pdf",
    "stakesIds": [
      "STK-0004",
      "STK-0005",
      "STK-0059",
      "STK-0082",
      "STK-0089"
    ],
    "stakesDates": [
      "1999-02-20",
      "1999-02-27",
      "1999-03-13",
      "1999-03-20",
      "1999-03-27"
    ],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": "Nov 5–7, 1999 Breeders Cup Championship meet at Gulfstream; winter dates remain WTW modeled, not certified.",
    "playableIn1999": true
  },
  "T-0018": {
    "id": "T-0018",
    "name": "Hialeah Park",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "01-01",
        "04-04"
      ]
    ],
    "meetWindow": "Jan 1–Apr 4",
    "raceDays": "~68",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0019": {
    "id": "T-0019",
    "name": "Calder",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "04-01",
        "11-30"
      ]
    ],
    "meetWindow": "Apr 1–Nov 30",
    "raceDays": "~174",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0020": {
    "id": "T-0020",
    "name": "Tampa Bay",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "01-01",
        "04-30"
      ],
      [
        "12-01",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–Apr 30; Dec 1–Dec 31",
    "raceDays": "~109",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [
      "STK-0016"
    ],
    "stakesDates": [
      "1999-03-13"
    ],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0021": {
    "id": "T-0021",
    "name": "Oaklawn Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "01-29",
        "04-10"
      ]
    ],
    "meetWindow": "Jan 29–Apr 10",
    "raceDays": "52",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "VERIFIED_1999_CALENDAR",
    "sourceUrl": "https://www.oaklawn.com/site/assets/files/20315/oaklawnmediaguide25-26.pdf",
    "stakesIds": [
      "STK-0010",
      "STK-0011",
      "STK-0040",
      "STK-0063",
      "STK-0067"
    ],
    "stakesDates": [
      "1999-02-06",
      "1999-02-20",
      "1999-02-27",
      "1999-03-13",
      "1999-04-10"
    ],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": "1999 official Oaklawn live-meet statistics: Jan 29–Apr 10, 52 days. Individual dark dates are modeled except known stakes dates.",
    "playableIn1999": true
  },
  "T-0022": {
    "id": "T-0022",
    "name": "Fair Grounds",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "01-01",
        "03-28"
      ],
      [
        "11-25",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–Mar 28; Nov 25–Dec 31",
    "raceDays": "~90",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [
      "STK-0012",
      "STK-0013"
    ],
    "stakesDates": [
      "1999-02-20",
      "1999-03-14"
    ],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0023": {
    "id": "T-0023",
    "name": "Louisiana Downs",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "05-01",
        "10-31"
      ]
    ],
    "meetWindow": "May 1–Oct 31",
    "raceDays": "~132",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [
      "STK-0074"
    ],
    "stakesDates": [
      "1999-10-02"
    ],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0024": {
    "id": "T-0024",
    "name": "Delta Downs",
    "surfaces": "Dirt",
    "meets": [
      [
        "01-01",
        "03-31"
      ],
      [
        "10-01",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–Mar 31; Oct 1–Dec 31",
    "raceDays": "~130",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0025": {
    "id": "T-0025",
    "name": "Lone Star Park",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "04-01",
        "07-18"
      ],
      [
        "10-01",
        "11-28"
      ]
    ],
    "meetWindow": "Apr 1–Jul 18; Oct 1–Nov 28",
    "raceDays": "~122",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0026": {
    "id": "T-0026",
    "name": "Sam Houston",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "01-01",
        "04-11"
      ],
      [
        "11-01",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–Apr 11; Nov 1–Dec 31",
    "raceDays": "~116",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0027": {
    "id": "T-0027",
    "name": "Retama Park",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "05-01",
        "08-29"
      ]
    ],
    "meetWindow": "May 1–Aug 29",
    "raceDays": "~87",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0028": {
    "id": "T-0028",
    "name": "Santa Anita",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "01-01",
        "04-19"
      ],
      [
        "09-29",
        "11-08"
      ]
    ],
    "meetWindow": "Jan 1–Apr 19; Sep 29–Nov 8",
    "raceDays": "~108",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "VERIFIED_1999_CALENDAR",
    "sourceUrl": "https://www.chrb.ca.gov/DocumentRequestor2.aspx?Category=REPORTS&DocumentID=40719&SubCategory=ANNUAL",
    "stakesIds": [
      "STK-0008",
      "STK-0009",
      "STK-0026",
      "STK-0052",
      "STK-0058"
    ],
    "stakesDates": [
      "1999-02-27",
      "1999-03-06",
      "1999-03-13",
      "1999-04-03"
    ],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0029": {
    "id": "T-0029",
    "name": "Hollywood Park",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "04-23",
        "07-19"
      ],
      [
        "11-10",
        "12-20"
      ]
    ],
    "meetWindow": "Apr 23–Jul 19; Nov 10–Dec 20",
    "raceDays": "~93",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "VERIFIED_1999_CALENDAR",
    "sourceUrl": "https://www.chrb.ca.gov/DocumentRequestor2.aspx?Category=REPORTS&DocumentID=40719&SubCategory=ANNUAL",
    "stakesIds": [
      "STK-0020",
      "STK-0027"
    ],
    "stakesDates": [
      "1999-06-27",
      "1999-12-18"
    ],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0030": {
    "id": "T-0030",
    "name": "Del Mar",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "07-22",
        "09-08"
      ]
    ],
    "meetWindow": "Jul 22–Sep 8",
    "raceDays": "~35",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "VERIFIED_1999_CALENDAR",
    "sourceUrl": "https://www.chrb.ca.gov/DocumentRequestor2.aspx?Category=REPORTS&DocumentID=40719&SubCategory=ANNUAL",
    "stakesIds": [
      "STK-0028"
    ],
    "stakesDates": [
      "1999-08-29"
    ],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0031": {
    "id": "T-0031",
    "name": "Golden Gate Fields",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "01-01",
        "01-18"
      ],
      [
        "03-31",
        "06-20"
      ],
      [
        "11-17",
        "12-20"
      ]
    ],
    "meetWindow": "Jan 1–Jan 18; Mar 31–Jun 20; Nov 17–Dec 20",
    "raceDays": "~98",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "VERIFIED_1999_CALENDAR",
    "sourceUrl": "https://www.chrb.ca.gov/DocumentRequestor2.aspx?Category=REPORTS&DocumentID=40719&SubCategory=ANNUAL",
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0032": {
    "id": "T-0032",
    "name": "Bay Meadows",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "01-21",
        "03-28"
      ],
      [
        "09-03",
        "11-14"
      ]
    ],
    "meetWindow": "Jan 21–Mar 28; Sep 3–Nov 14",
    "raceDays": "~102",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "VERIFIED_1999_CALENDAR",
    "sourceUrl": "https://www.chrb.ca.gov/DocumentRequestor2.aspx?Category=REPORTS&DocumentID=40719&SubCategory=ANNUAL",
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0033": {
    "id": "T-0033",
    "name": "Longacres",
    "surfaces": "Dirt",
    "meets": [
      [
        "05-01",
        "09-12"
      ]
    ],
    "meetWindow": "May 1–Sep 12",
    "raceDays": "~97",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_ALTERNATE_SURVIVAL_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0034": {
    "id": "T-0034",
    "name": "Arlington Park",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "05-01",
        "09-30"
      ]
    ],
    "meetWindow": "May 1–Sep 30",
    "raceDays": "~109",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [
      "STK-0029",
      "STK-0057"
    ],
    "stakesDates": [
      "1999-07-17",
      "1999-08-21"
    ],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0035": {
    "id": "T-0035",
    "name": "Hawthorne",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "07-01",
        "11-28"
      ]
    ],
    "meetWindow": "Jul 1–Nov 28",
    "raceDays": "108",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "VERIFIED_1999_CALENDAR",
    "sourceUrl": "https://irb.illinois.gov/content/dam/soi/en/web/irb/sierra/about-the-irb/documents/annual-reports/1998-Annual-Report.pdf",
    "stakesIds": [
      "STK-0080"
    ],
    "stakesDates": [
      "1999-10-09"
    ],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0036": {
    "id": "T-0036",
    "name": "Sportsman's Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "02-19",
        "06-30"
      ]
    ],
    "meetWindow": "Feb 19–Jun 30",
    "raceDays": "95",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "VERIFIED_1999_CALENDAR",
    "sourceUrl": "https://irb.illinois.gov/content/dam/soi/en/web/irb/sierra/about-the-irb/documents/annual-reports/1998-Annual-Report.pdf",
    "stakesIds": [
      "STK-0017",
      "STK-0048"
    ],
    "stakesDates": [
      "1999-04-10",
      "1999-05-29"
    ],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0037": {
    "id": "T-0037",
    "name": "Detroit Race Course",
    "surfaces": "Dirt",
    "meets": [
      [
        "04-16",
        "10-17"
      ]
    ],
    "meetWindow": "Apr 16–Oct 17",
    "raceDays": "~133",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_ALTERNATE_SURVIVAL_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0038": {
    "id": "T-0038",
    "name": "Ak-Sar-Ben",
    "surfaces": "Dirt",
    "meets": [
      [
        "05-01",
        "09-06"
      ]
    ],
    "meetWindow": "May 1–Sep 6",
    "raceDays": "~92",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_ALTERNATE_SURVIVAL_MODELED",
    "sourceUrl": null,
    "stakesIds": [
      "STK-0033"
    ],
    "stakesDates": [
      "1999-07-03"
    ],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0039": {
    "id": "T-0039",
    "name": "Woodbine",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "04-10",
        "12-12"
      ]
    ],
    "meetWindow": "Apr 10–Dec 12",
    "raceDays": "~177",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [
      "STK-0049",
      "STK-0050",
      "STK-0051",
      "STK-0065"
    ],
    "stakesDates": [
      "1999-06-13",
      "1999-09-12",
      "1999-09-26",
      "1999-11-06"
    ],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0040": {
    "id": "T-0040",
    "name": "Suffolk Downs",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "04-01",
        "11-28"
      ]
    ],
    "meetWindow": "Apr 1–Nov 28",
    "raceDays": "~174",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [
      "STK-0047"
    ],
    "stakesDates": [
      "1999-05-29"
    ],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0041": {
    "id": "T-0041",
    "name": "Rockingham Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "04-01",
        "10-24"
      ]
    ],
    "meetWindow": "Apr 1–Oct 24",
    "raceDays": "~149",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0042": {
    "id": "T-0042",
    "name": "Atlantic City Race Course",
    "surfaces": "Turf",
    "meets": [
      [
        "05-24",
        "05-28"
      ]
    ],
    "meetWindow": "May 24–May 28",
    "raceDays": "5",
    "preferredDays": "Mon–Fri",
    "dayPattern": [
      1,
      2,
      3,
      4,
      5
    ],
    "basis": "VERIFIED_1999_CALENDAR",
    "sourceUrl": "https://www.nj.gov/oag/racing/downloads/ar1999.pdf",
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0043": {
    "id": "T-0043",
    "name": "Penn National",
    "surfaces": "Dirt",
    "meets": [
      [
        "01-01",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–Dec 31",
    "raceDays": "~261",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0044": {
    "id": "T-0044",
    "name": "Colonial Downs",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "06-01",
        "09-06"
      ]
    ],
    "meetWindow": "Jun 1–Sep 6",
    "raceDays": "~70",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0045": {
    "id": "T-0045",
    "name": "Timonium",
    "surfaces": "Dirt",
    "meets": [
      [
        "08-21",
        "09-06"
      ]
    ],
    "meetWindow": "Aug 21–Sep 6",
    "raceDays": "~17",
    "preferredDays": "Daily",
    "dayPattern": [
      0,
      1,
      2,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0046": {
    "id": "T-0046",
    "name": "Kentucky Downs",
    "surfaces": "Turf",
    "meets": [
      [
        "09-11",
        "09-26"
      ]
    ],
    "meetWindow": "Sep 11–Sep 26",
    "raceDays": "~16",
    "preferredDays": "Daily",
    "dayPattern": [
      0,
      1,
      2,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0047": {
    "id": "T-0047",
    "name": "Hoosier Park",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "04-17",
        "10-24"
      ]
    ],
    "meetWindow": "Apr 17–Oct 24",
    "raceDays": "~137",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0048": {
    "id": "T-0048",
    "name": "Beulah Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "01-01",
        "05-23"
      ],
      [
        "09-01",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–May 23; Sep 1–Dec 31",
    "raceDays": "~191",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0049": {
    "id": "T-0049",
    "name": "River Downs",
    "surfaces": "Dirt",
    "meets": [
      [
        "04-10",
        "09-06"
      ]
    ],
    "meetWindow": "Apr 10–Sep 6",
    "raceDays": "~107",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0050": {
    "id": "T-0050",
    "name": "Thistledown",
    "surfaces": "Dirt",
    "meets": [
      [
        "03-10",
        "12-04"
      ]
    ],
    "meetWindow": "Mar 10–Dec 4",
    "raceDays": "~194",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [
      "STK-0083"
    ],
    "stakesDates": [
      "1999-06-19"
    ],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0051": {
    "id": "T-0051",
    "name": "Fairmount Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "03-30",
        "09-18"
      ]
    ],
    "meetWindow": "Mar 30–Sep 18",
    "raceDays": "101",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "VERIFIED_1999_CALENDAR",
    "sourceUrl": "https://irb.illinois.gov/content/dam/soi/en/web/irb/sierra/about-the-irb/documents/annual-reports/1998-Annual-Report.pdf",
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0052": {
    "id": "T-0052",
    "name": "Canterbury Park",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "05-01",
        "09-06"
      ]
    ],
    "meetWindow": "May 1–Sep 6",
    "raceDays": "~92",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0053": {
    "id": "T-0053",
    "name": "Prairie Meadows",
    "surfaces": "Dirt",
    "meets": [
      [
        "04-16",
        "10-10"
      ]
    ],
    "meetWindow": "Apr 16–Oct 10",
    "raceDays": "~128",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0054": {
    "id": "T-0054",
    "name": "Great Lakes Downs",
    "surfaces": "Dirt",
    "meets": [
      [
        "05-06",
        "11-07"
      ]
    ],
    "meetWindow": "May 6–Nov 7",
    "raceDays": "~134",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0055": {
    "id": "T-0055",
    "name": "Mountaineer Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "01-01",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–Dec 31",
    "raceDays": "~261",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0056": {
    "id": "T-0056",
    "name": "Evangeline Downs",
    "surfaces": "Dirt",
    "meets": [
      [
        "04-01",
        "09-30"
      ]
    ],
    "meetWindow": "Apr 1–Sep 30",
    "raceDays": "~131",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0057": {
    "id": "T-0057",
    "name": "Remington Park",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "01-01",
        "02-28"
      ],
      [
        "08-01",
        "11-30"
      ]
    ],
    "meetWindow": "Jan 1–Feb 28; Aug 1–Nov 30",
    "raceDays": "~129",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0058": {
    "id": "T-0058",
    "name": "Fair Meadows",
    "surfaces": "Dirt",
    "meets": [
      [
        "06-01",
        "08-15"
      ]
    ],
    "meetWindow": "Jun 1–Aug 15",
    "raceDays": "~55",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0059": {
    "id": "T-0059",
    "name": "Turf Paradise",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "01-01",
        "05-16"
      ],
      [
        "09-15",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–May 16; Sep 15–Dec 31",
    "raceDays": "~176",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0060": {
    "id": "T-0060",
    "name": "Yavapai Downs",
    "surfaces": "Dirt",
    "meets": [
      [
        "05-01",
        "09-06"
      ]
    ],
    "meetWindow": "May 1–Sep 6",
    "raceDays": "~92",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0061": {
    "id": "T-0061",
    "name": "Sunland Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "01-01",
        "04-25"
      ],
      [
        "11-01",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–Apr 25; Nov 1–Dec 31",
    "raceDays": "~126",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0062": {
    "id": "T-0062",
    "name": "Ruidoso Downs",
    "surfaces": "Dirt",
    "meets": [
      [
        "05-29",
        "09-06"
      ]
    ],
    "meetWindow": "May 29–Sep 6",
    "raceDays": "~72",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0063": {
    "id": "T-0063",
    "name": "The Downs at Albuquerque",
    "surfaces": "Dirt",
    "meets": [
      [
        "09-01",
        "11-07"
      ]
    ],
    "meetWindow": "Sep 1–Nov 7",
    "raceDays": "~50",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0064": {
    "id": "T-0064",
    "name": "Arapahoe Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "05-01",
        "08-29"
      ]
    ],
    "meetWindow": "May 1–Aug 29",
    "raceDays": "~87",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0065": {
    "id": "T-0065",
    "name": "Emerald Downs",
    "surfaces": "Dirt",
    "meets": [
      [
        "04-16",
        "09-19"
      ]
    ],
    "meetWindow": "Apr 16–Sep 19",
    "raceDays": "~113",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0066": {
    "id": "T-0066",
    "name": "Portland Meadows",
    "surfaces": "Dirt",
    "meets": [
      [
        "01-01",
        "04-11"
      ],
      [
        "10-01",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–Apr 11; Oct 1–Dec 31",
    "raceDays": "~139",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0067": {
    "id": "T-0067",
    "name": "Fairplex Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "09-09",
        "09-26"
      ]
    ],
    "meetWindow": "Sep 9–Sep 26",
    "raceDays": "18",
    "preferredDays": "Daily",
    "dayPattern": [
      0,
      1,
      2,
      3,
      4,
      5,
      6
    ],
    "basis": "VERIFIED_1999_CALENDAR",
    "sourceUrl": "https://www.chrb.ca.gov/DocumentRequestor2.aspx?Category=REPORTS&DocumentID=40719&SubCategory=ANNUAL",
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": "18-day Fairplex meeting; daily thoroughbred racing documented in 1999.",
    "playableIn1999": true
  },
  "T-0068": {
    "id": "T-0068",
    "name": "Pleasanton",
    "surfaces": "Dirt",
    "meets": [
      [
        "06-30",
        "07-11"
      ]
    ],
    "meetWindow": "Jun 30–Jul 11",
    "raceDays": "GAME MODELED",
    "preferredDays": "Fair dates · not daily",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "VERIFIED_1999_CALENDAR",
    "sourceUrl": "https://www.chrb.ca.gov/DocumentRequestor2.aspx?Category=REPORTS&DocumentID=40719&SubCategory=ANNUAL",
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": "State-reported fair meeting span; thoroughbred-only daily cards not authenticated.",
    "playableIn1999": true
  },
  "T-0069": {
    "id": "T-0069",
    "name": "Santa Rosa",
    "surfaces": "Dirt",
    "meets": [
      [
        "07-28",
        "08-09"
      ]
    ],
    "meetWindow": "Jul 28–Aug 9",
    "raceDays": "GAME MODELED",
    "preferredDays": "Fair dates · not daily",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "VERIFIED_1999_CALENDAR",
    "sourceUrl": "https://www.chrb.ca.gov/DocumentRequestor2.aspx?Category=REPORTS&DocumentID=40719&SubCategory=ANNUAL",
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": "State-reported fair meeting span; thoroughbred-only daily cards not authenticated.",
    "playableIn1999": true
  },
  "T-0070": {
    "id": "T-0070",
    "name": "Sacramento",
    "surfaces": "Dirt",
    "meets": [
      [
        "08-25",
        "09-06"
      ]
    ],
    "meetWindow": "Aug 25–Sep 6",
    "raceDays": "GAME MODELED",
    "preferredDays": "Fair dates · not daily",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "VERIFIED_1999_CALENDAR",
    "sourceUrl": "https://www.chrb.ca.gov/DocumentRequestor2.aspx?Category=REPORTS&DocumentID=40719&SubCategory=ANNUAL",
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": "State-reported fair meeting span; thoroughbred-only daily cards not authenticated.",
    "playableIn1999": true
  },
  "T-0071": {
    "id": "T-0071",
    "name": "Fresno",
    "surfaces": "Dirt",
    "meets": [
      [
        "10-06",
        "10-17"
      ]
    ],
    "meetWindow": "Oct 6–Oct 17",
    "raceDays": "GAME MODELED",
    "preferredDays": "Fair dates · not daily",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "VERIFIED_1999_CALENDAR",
    "sourceUrl": "https://www.chrb.ca.gov/DocumentRequestor2.aspx?Category=REPORTS&DocumentID=40719&SubCategory=ANNUAL",
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": "State-reported fair meeting span; thoroughbred-only daily cards not authenticated.",
    "playableIn1999": true
  },
  "T-0072": {
    "id": "T-0072",
    "name": "Ferndale",
    "surfaces": "Dirt",
    "meets": [
      [
        "08-12",
        "08-22"
      ]
    ],
    "meetWindow": "Aug 12–Aug 22",
    "raceDays": "GAME MODELED",
    "preferredDays": "Fair dates · not daily",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "VERIFIED_1999_CALENDAR",
    "sourceUrl": "https://www.chrb.ca.gov/DocumentRequestor2.aspx?Category=REPORTS&DocumentID=40719&SubCategory=ANNUAL",
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": "State-reported fair meeting span; thoroughbred-only daily cards not authenticated.",
    "playableIn1999": true
  },
  "T-0073": {
    "id": "T-0073",
    "name": "Stockton",
    "surfaces": "Dirt",
    "meets": [
      [
        "06-16",
        "06-27"
      ]
    ],
    "meetWindow": "Jun 16–Jun 27",
    "raceDays": "GAME MODELED",
    "preferredDays": "Fair dates · not daily",
    "dayPattern": [
      3,
      4,
      5,
      6
    ],
    "basis": "VERIFIED_1999_CALENDAR",
    "sourceUrl": "https://www.chrb.ca.gov/DocumentRequestor2.aspx?Category=REPORTS&DocumentID=40719&SubCategory=ANNUAL",
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": "State-reported fair meeting span; thoroughbred-only daily cards not authenticated.",
    "playableIn1999": true
  },
  "T-0074": {
    "id": "T-0074",
    "name": "Vallejo",
    "surfaces": "Dirt",
    "meets": [
      [
        "07-14",
        "07-26"
      ]
    ],
    "meetWindow": "Jul 14–Jul 26",
    "raceDays": "GAME MODELED",
    "preferredDays": "Fair dates · not daily",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "VERIFIED_1999_CALENDAR",
    "sourceUrl": "https://www.chrb.ca.gov/DocumentRequestor2.aspx?Category=REPORTS&DocumentID=40719&SubCategory=ANNUAL",
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": "State-reported fair meeting span; thoroughbred-only daily cards not authenticated.",
    "playableIn1999": true
  },
  "T-0075": {
    "id": "T-0075",
    "name": "San Mateo",
    "surfaces": "Dirt",
    "meets": [
      [
        "08-11",
        "08-23"
      ]
    ],
    "meetWindow": "Aug 11–Aug 23",
    "raceDays": "GAME MODELED",
    "preferredDays": "Fair dates · not daily",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "VERIFIED_1999_CALENDAR",
    "sourceUrl": "https://www.chrb.ca.gov/DocumentRequestor2.aspx?Category=REPORTS&DocumentID=40719&SubCategory=ANNUAL",
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": "State-reported fair meeting span; thoroughbred-only daily cards not authenticated.",
    "playableIn1999": true
  },
  "T-0076": {
    "id": "T-0076",
    "name": "Fort Erie",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "05-01",
        "10-24"
      ]
    ],
    "meetWindow": "May 1–Oct 24",
    "raceDays": "~127",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0077": {
    "id": "T-0077",
    "name": "Hastings Park",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "04-01",
        "10-31"
      ]
    ],
    "meetWindow": "Apr 1–Oct 31",
    "raceDays": "~154",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0078": {
    "id": "T-0078",
    "name": "Assiniboia Downs",
    "surfaces": "Dirt",
    "meets": [
      [
        "05-01",
        "09-06"
      ]
    ],
    "meetWindow": "May 1–Sep 6",
    "raceDays": "~92",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0079": {
    "id": "T-0079",
    "name": "Northlands Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "04-10",
        "10-17"
      ]
    ],
    "meetWindow": "Apr 10–Oct 17",
    "raceDays": "~137",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0080": {
    "id": "T-0080",
    "name": "Stampede Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "05-01",
        "09-06"
      ]
    ],
    "meetWindow": "May 1–Sep 6",
    "raceDays": "~92",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0081": {
    "id": "T-0081",
    "name": "Marquis Downs",
    "surfaces": "Dirt",
    "meets": [
      [
        "05-01",
        "08-29"
      ]
    ],
    "meetWindow": "May 1–Aug 29",
    "raceDays": "~87",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0082": {
    "id": "T-0082",
    "name": "El Comandante",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "01-01",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–Dec 31",
    "raceDays": "~261",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0083": {
    "id": "T-0083",
    "name": "Fonner Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "02-19",
        "05-23"
      ]
    ],
    "meetWindow": "Feb 19–May 23",
    "raceDays": "~68",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0084": {
    "id": "T-0084",
    "name": "Blue Ribbon Downs",
    "surfaces": "Dirt",
    "meets": [
      [
        "06-01",
        "08-31"
      ]
    ],
    "meetWindow": "Jun 1–Aug 31",
    "raceDays": "~65",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0085": {
    "id": "T-0085",
    "name": "Rillito Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "01-01",
        "03-28"
      ]
    ],
    "meetWindow": "Jan 1–Mar 28",
    "raceDays": "~87",
    "preferredDays": "Daily",
    "dayPattern": [
      0,
      1,
      2,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0086": {
    "id": "T-0086",
    "name": "Wyoming Downs",
    "surfaces": "Dirt",
    "meets": [
      [
        "06-01",
        "08-29"
      ]
    ],
    "meetWindow": "Jun 1–Aug 29",
    "raceDays": "~65",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0087": {
    "id": "T-0087",
    "name": "SunRay Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "04-01",
        "06-27"
      ]
    ],
    "meetWindow": "Apr 1–Jun 27",
    "raceDays": "~64",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0088": {
    "id": "T-0088",
    "name": "Birmingham Race Course",
    "surfaces": "Dirt",
    "meets": [
      [
        "04-01",
        "09-30"
      ]
    ],
    "meetWindow": "Apr 1–Sep 30",
    "raceDays": "~131",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_ALTERNATE_SURVIVAL_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0089": {
    "id": "T-0089",
    "name": "Les Bois Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "05-01",
        "08-31"
      ]
    ],
    "meetWindow": "May 1–Aug 31",
    "raceDays": "~87",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0090": {
    "id": "T-0090",
    "name": "Manor Downs",
    "surfaces": "Dirt",
    "meets": [
      [
        "03-01",
        "05-31"
      ]
    ],
    "meetWindow": "Mar 1–May 31",
    "raceDays": "~65",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0091": {
    "id": "T-0091",
    "name": "Grants Pass",
    "surfaces": "Dirt",
    "meets": [
      [
        "06-01",
        "08-31"
      ]
    ],
    "meetWindow": "Jun 1–Aug 31",
    "raceDays": "~92",
    "preferredDays": "Daily",
    "dayPattern": [
      0,
      1,
      2,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0092": {
    "id": "T-0092",
    "name": "Lincoln State Fair",
    "surfaces": "Dirt",
    "meets": [
      [
        "05-01",
        "09-12"
      ]
    ],
    "meetWindow": "May 1–Sep 12",
    "raceDays": "~135",
    "preferredDays": "Daily",
    "dayPattern": [
      0,
      1,
      2,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0093": {
    "id": "T-0093",
    "name": "Columbus",
    "surfaces": "Dirt",
    "meets": [
      [
        "05-01",
        "08-31"
      ]
    ],
    "meetWindow": "May 1–Aug 31",
    "raceDays": "~87",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_SEASONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0094": {
    "id": "T-0094",
    "name": "Sweetwater Park",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "03-01",
        "06-27"
      ],
      [
        "09-01",
        "11-28"
      ]
    ],
    "meetWindow": "Mar 1–Jun 27; Sep 1–Nov 28",
    "raceDays": "~150",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_FICTIONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0095": {
    "id": "T-0095",
    "name": "Cumberland Downs",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "05-01",
        "07-18"
      ],
      [
        "09-01",
        "11-14"
      ]
    ],
    "meetWindow": "May 1–Jul 18; Sep 1–Nov 14",
    "raceDays": "~112",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_FICTIONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0096": {
    "id": "T-0096",
    "name": "Queen City Racecourse",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "04-01",
        "06-27"
      ],
      [
        "09-01",
        "11-21"
      ]
    ],
    "meetWindow": "Apr 1–Jun 27; Sep 1–Nov 21",
    "raceDays": "~124",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_FICTIONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0097": {
    "id": "T-0097",
    "name": "Front Range Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "05-01",
        "09-06"
      ]
    ],
    "meetWindow": "May 1–Sep 6",
    "raceDays": "~92",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_FICTIONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0098": {
    "id": "T-0098",
    "name": "Silver State Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "02-01",
        "04-30"
      ],
      [
        "09-15",
        "11-30"
      ]
    ],
    "meetWindow": "Feb 1–Apr 30; Sep 15–Nov 30",
    "raceDays": "~118",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_FICTIONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0099": {
    "id": "T-0099",
    "name": "Wasatch Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "05-01",
        "09-12"
      ]
    ],
    "meetWindow": "May 1–Sep 12",
    "raceDays": "~97",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_FICTIONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0100": {
    "id": "T-0100",
    "name": "Heartland Park",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "04-01",
        "06-30"
      ],
      [
        "09-01",
        "11-14"
      ]
    ],
    "meetWindow": "Apr 1–Jun 30; Sep 1–Nov 14",
    "raceDays": "~120",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_FICTIONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0101": {
    "id": "T-0101",
    "name": "Cream City Racecourse",
    "surfaces": "Dirt",
    "meets": [
      [
        "05-01",
        "09-26"
      ]
    ],
    "meetWindow": "May 1–Sep 26",
    "raceDays": "~107",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_FICTIONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0102": {
    "id": "T-0102",
    "name": "Oriental Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "01-01",
        "03-31"
      ],
      [
        "12-01",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–Mar 31; Dec 1–Dec 31",
    "raceDays": "~87",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_ALTERNATE_SURVIVAL_MODELED",
    "sourceUrl": null,
    "stakesIds": [
      "STK-0093",
      "STK-0094"
    ],
    "stakesDates": [
      "1999-02-06",
      "1999-02-27"
    ],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": true
  },
  "T-0103": {
    "id": "T-0103",
    "name": "Jerome Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "05-01",
        "06-13"
      ],
      [
        "09-10",
        "10-10"
      ]
    ],
    "meetWindow": "May 1–Jun 13; Sep 10–Oct 10",
    "raceDays": "~43",
    "preferredDays": "Thu–Sun",
    "dayPattern": [
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_ALTERNATE_HISTORY_CONTINUED_OPERATION",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WTW_ALTERNATE_HISTORY_COURSE_SPECIFICATION",
    "calendarExceptions": null,
    "realWorldClosure": "CLOSED_BEFORE_1999",
    "wtwFeatureNames": [
      "Jerome Park Spring Handicap",
      "Jerome Park Autumn Cup"
    ],
    "playableIn1999": true
  },
  "T-0104": {
    "id": "T-0104",
    "name": "Morris Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "03-20",
        "04-25"
      ],
      [
        "10-01",
        "11-07"
      ]
    ],
    "meetWindow": "Mar 20–Apr 25; Oct 1–Nov 7",
    "raceDays": "~43",
    "preferredDays": "Thu–Sun",
    "dayPattern": [
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_ALTERNATE_HISTORY_CONTINUED_OPERATION",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WTW_ALTERNATE_HISTORY_COURSE_SPECIFICATION",
    "calendarExceptions": null,
    "realWorldClosure": "CLOSED_BEFORE_1999",
    "wtwFeatureNames": [
      "Morris Park Spring Classic",
      "Morris Park Autumn Invitational"
    ],
    "playableIn1999": true
  },
  "T-0105": {
    "id": "T-0105",
    "name": "Gravesend Racetrack",
    "surfaces": "Dirt",
    "meets": [
      [
        "07-01",
        "08-15"
      ],
      [
        "10-24",
        "11-27"
      ]
    ],
    "meetWindow": "Jul 1–Aug 15; Oct 24–Nov 27",
    "raceDays": "~47",
    "preferredDays": "Thu–Sun",
    "dayPattern": [
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_ALTERNATE_HISTORY_CONTINUED_OPERATION",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WTW_ALTERNATE_HISTORY_COURSE_SPECIFICATION",
    "calendarExceptions": null,
    "realWorldClosure": "CLOSED_BEFORE_1999",
    "wtwFeatureNames": [
      "Gravesend Summer Mile",
      "Gravesend Autumn Handicap"
    ],
    "playableIn1999": true
  },
  "T-0106": {
    "id": "T-0106",
    "name": "Sheepshead Bay Race Track",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "05-15",
        "06-27"
      ],
      [
        "08-01",
        "09-06"
      ]
    ],
    "meetWindow": "May 15–Jun 27; Aug 1–Sep 6",
    "raceDays": "~45",
    "preferredDays": "Thu–Sun",
    "dayPattern": [
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_ALTERNATE_HISTORY_CONTINUED_OPERATION",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WTW_ALTERNATE_HISTORY_COURSE_SPECIFICATION",
    "calendarExceptions": null,
    "realWorldClosure": "CLOSED_BEFORE_1999",
    "wtwFeatureNames": [
      "Sheepshead Bay Turf Cup",
      "Sheepshead Bay September Classic"
    ],
    "playableIn1999": true
  },
  "T-0107": {
    "id": "T-0107",
    "name": "Jamaica Race Course",
    "surfaces": "Dirt",
    "meets": [
      [
        "01-01",
        "03-15"
      ],
      [
        "11-01",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–Mar 15; Nov 1–Dec 31",
    "raceDays": "~96",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_ALTERNATE_HISTORY_CONTINUED_OPERATION",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WTW_ALTERNATE_HISTORY_COURSE_SPECIFICATION",
    "calendarExceptions": null,
    "realWorldClosure": "CLOSED_BEFORE_1999",
    "wtwFeatureNames": [
      "Jamaica Winter Handicap",
      "Jamaica Autumn Classic"
    ],
    "playableIn1999": true
  },
  "T-0108": {
    "id": "T-0108",
    "name": "Empire City Race Track",
    "surfaces": "Dirt",
    "meets": [
      [
        "01-15",
        "03-07"
      ],
      [
        "11-13",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 15–Mar 7; Nov 13–Dec 31",
    "raceDays": "~73",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_ALTERNATE_HISTORY_CONTINUED_OPERATION",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WTW_ALTERNATE_HISTORY_COURSE_SPECIFICATION",
    "calendarExceptions": null,
    "realWorldClosure": "CLOSED_BEFORE_1999",
    "wtwFeatureNames": [
      "Empire City Winter Cup",
      "Empire City Fall Championship"
    ],
    "playableIn1999": true
  },
  "T-0109": {
    "id": "T-0109",
    "name": "Kentucky Association Track",
    "surfaces": "Dirt",
    "meets": [
      [
        "05-07",
        "06-20"
      ],
      [
        "08-19",
        "09-26"
      ]
    ],
    "meetWindow": "May 7–Jun 20; Aug 19–Sep 26",
    "raceDays": "~49",
    "preferredDays": "Thu–Sun",
    "dayPattern": [
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_ALTERNATE_HISTORY_CONTINUED_OPERATION",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WTW_ALTERNATE_HISTORY_COURSE_SPECIFICATION",
    "calendarExceptions": null,
    "realWorldClosure": "CLOSED_BEFORE_1999",
    "wtwFeatureNames": [
      "Kentucky Association Spring Mile",
      "Lexington Heritage Handicap"
    ],
    "playableIn1999": true
  },
  "T-0110": {
    "id": "T-0110",
    "name": "Chester Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "04-09",
        "06-20"
      ],
      [
        "09-03",
        "10-24"
      ]
    ],
    "meetWindow": "Apr 9–Jun 20; Sep 3–Oct 24",
    "raceDays": "~72",
    "preferredDays": "Thu–Sun",
    "dayPattern": [
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_ALTERNATE_HISTORY_CONTINUED_OPERATION",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WTW_ALTERNATE_HISTORY_COURSE_SPECIFICATION",
    "calendarExceptions": null,
    "realWorldClosure": "CLOSED_BEFORE_1999",
    "wtwFeatureNames": [
      "Chester Park Spring Classic",
      "Chester Park Autumn Cup"
    ],
    "playableIn1999": true
  },
  "T-0111": {
    "id": "T-0111",
    "name": "Maple Heights Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "05-07",
        "07-18"
      ],
      [
        "08-20",
        "10-10"
      ]
    ],
    "meetWindow": "May 7–Jul 18; Aug 20–Oct 10",
    "raceDays": "~72",
    "preferredDays": "Thu–Sun",
    "dayPattern": [
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_ALTERNATE_HISTORY_CONTINUED_OPERATION",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WTW_ALTERNATE_HISTORY_COURSE_SPECIFICATION",
    "calendarExceptions": null,
    "realWorldClosure": "CLOSED_BEFORE_1999",
    "wtwFeatureNames": [
      "Maple Heights Summer Stakes",
      "Maple Heights Fall Handicap"
    ],
    "playableIn1999": true
  },
  "T-0112": {
    "id": "T-0112",
    "name": "Bainbridge Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "04-30",
        "06-27"
      ],
      [
        "09-03",
        "11-07"
      ]
    ],
    "meetWindow": "Apr 30–Jun 27; Sep 3–Nov 7",
    "raceDays": "~72",
    "preferredDays": "Thu–Sun",
    "dayPattern": [
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_ALTERNATE_HISTORY_CONTINUED_OPERATION",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WTW_ALTERNATE_HISTORY_COURSE_SPECIFICATION",
    "calendarExceptions": null,
    "realWorldClosure": "CLOSED_BEFORE_1999",
    "wtwFeatureNames": [
      "Bainbridge Park Spring Cup",
      "Bainbridge Park Autumn Mile"
    ],
    "playableIn1999": true
  },
  "T-0113": {
    "id": "T-0113",
    "name": "Jefferson Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "01-02",
        "04-04"
      ],
      [
        "10-15",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 2–Apr 4; Oct 15–Dec 31",
    "raceDays": "~123",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_ALTERNATE_HISTORY_CONTINUED_OPERATION",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WTW_ALTERNATE_HISTORY_COURSE_SPECIFICATION",
    "calendarExceptions": null,
    "realWorldClosure": "CLOSED_BEFORE_1999",
    "wtwFeatureNames": [
      "Jefferson Park Winter Classic",
      "Jefferson Park Holiday Handicap"
    ],
    "playableIn1999": true
  },
  "T-0114": {
    "id": "T-0114",
    "name": "Old Woodbine / Greenwood",
    "surfaces": "Dirt",
    "meets": [
      [
        "04-23",
        "07-11"
      ],
      [
        "08-27",
        "11-14"
      ]
    ],
    "meetWindow": "Apr 23–Jul 11; Aug 27–Nov 14",
    "raceDays": "~92",
    "preferredDays": "Thu–Sun",
    "dayPattern": [
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_ALTERNATE_HISTORY_CONTINUED_OPERATION",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WTW_ALTERNATE_HISTORY_COURSE_SPECIFICATION",
    "calendarExceptions": null,
    "realWorldClosure": "CLOSED_BEFORE_1999",
    "wtwFeatureNames": [
      "Greenwood Spring Mile",
      "Old Woodbine Autumn Cup"
    ],
    "playableIn1999": true
  },
  "T-0115": {
    "id": "T-0115",
    "name": "Aurora Downs",
    "surfaces": "Dirt",
    "meets": [
      [
        "04-02",
        "06-27"
      ],
      [
        "08-20",
        "11-28"
      ]
    ],
    "meetWindow": "Apr 2–Jun 27; Aug 20–Nov 28",
    "raceDays": "~108",
    "preferredDays": "Thu–Sun",
    "dayPattern": [
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_ALTERNATE_HISTORY_CONTINUED_OPERATION",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WTW_ALTERNATE_HISTORY_COURSE_SPECIFICATION",
    "calendarExceptions": null,
    "realWorldClosure": "CLOSED_BEFORE_1999",
    "wtwFeatureNames": [
      "Aurora Downs Spring Handicap",
      "Aurora Downs Fall Classic"
    ],
    "playableIn1999": true
  },
  "T-0116": {
    "id": "T-0116",
    "name": "Cranwood Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "04-01",
        "05-30"
      ],
      [
        "09-10",
        "10-31"
      ]
    ],
    "meetWindow": "Apr 1–May 30; Sep 10–Oct 31",
    "raceDays": "~65",
    "preferredDays": "Thu–Sun",
    "dayPattern": [
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_ALTERNATE_HISTORY_CONTINUED_OPERATION",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WTW_ALTERNATE_HISTORY_COURSE_SPECIFICATION",
    "calendarExceptions": null,
    "realWorldClosure": "CLOSED_BEFORE_1999",
    "wtwFeatureNames": [
      "Cranwood Spring Invitational",
      "Cranwood Fall Handicap"
    ],
    "playableIn1999": true
  },
  "T-0117": {
    "id": "T-0117",
    "name": "Randall Park",
    "surfaces": "Dirt",
    "meets": [
      [
        "04-22",
        "07-11"
      ],
      [
        "08-06",
        "10-31"
      ]
    ],
    "meetWindow": "Apr 22–Jul 11; Aug 6–Oct 31",
    "raceDays": "~97",
    "preferredDays": "Thu–Sun",
    "dayPattern": [
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_ALTERNATE_HISTORY_CONTINUED_OPERATION",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WTW_ALTERNATE_HISTORY_COURSE_SPECIFICATION",
    "calendarExceptions": null,
    "realWorldClosure": "CLOSED_BEFORE_1999",
    "wtwFeatureNames": [
      "Randall Park Summer Stakes",
      "Randall Park Autumn Cup"
    ],
    "playableIn1999": true
  },
  "T-0118": {
    "id": "T-0118",
    "name": "Latonia Race Track",
    "surfaces": "Dirt",
    "meets": [
      [
        "01-01",
        "03-21"
      ],
      [
        "11-04",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–Mar 21; Nov 4–Dec 31",
    "raceDays": "~100",
    "preferredDays": "Wed–Sun",
    "dayPattern": [
      0,
      3,
      4,
      5,
      6
    ],
    "basis": "WTW_ALTERNATE_HISTORY_CONTINUED_OPERATION",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "OPEN_1999",
    "surfaceStatus": "WTW_ALTERNATE_HISTORY_COURSE_SPECIFICATION",
    "calendarExceptions": null,
    "realWorldClosure": "CLOSED_BEFORE_1999",
    "wtwFeatureNames": [
      "Latonia Winter Classic",
      "Latonia Holiday Handicap"
    ],
    "playableIn1999": true
  },
  "IT-0001": {
    "id": "IT-0001",
    "name": "The Curragh",
    "surfaces": "Turf",
    "meets": [
      [
        "03-01",
        "10-31"
      ]
    ],
    "meetWindow": "Mar 1–Oct 31",
    "raceDays": "GAME MODELED",
    "preferredDays": "Selected fixtures · game model",
    "dayPattern": [
      0,
      6
    ],
    "basis": "INTERNATIONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "ARCHIVE_ONLY_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": false,
    "excludedFromGameReason": "Playable 1999 region limited to United States, Canada and Cuba"
  },
  "IT-0002": {
    "id": "IT-0002",
    "name": "Newmarket",
    "surfaces": "Turf",
    "meets": [
      [
        "04-01",
        "11-30"
      ]
    ],
    "meetWindow": "Apr 1–Nov 30",
    "raceDays": "GAME MODELED",
    "preferredDays": "Selected fixtures · game model",
    "dayPattern": [
      4,
      5,
      6
    ],
    "basis": "INTERNATIONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "ARCHIVE_ONLY_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": false,
    "excludedFromGameReason": "Playable 1999 region limited to United States, Canada and Cuba"
  },
  "IT-0003": {
    "id": "IT-0003",
    "name": "Ascot",
    "surfaces": "Turf",
    "meets": [
      [
        "03-01",
        "10-31"
      ]
    ],
    "meetWindow": "Mar 1–Oct 31",
    "raceDays": "GAME MODELED",
    "preferredDays": "Selected fixtures · game model",
    "dayPattern": [
      2,
      5,
      6
    ],
    "basis": "INTERNATIONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "ARCHIVE_ONLY_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": false,
    "excludedFromGameReason": "Playable 1999 region limited to United States, Canada and Cuba"
  },
  "IT-0004": {
    "id": "IT-0004",
    "name": "Longchamp",
    "surfaces": "Turf",
    "meets": [
      [
        "04-01",
        "10-31"
      ]
    ],
    "meetWindow": "Apr 1–Oct 31",
    "raceDays": "GAME MODELED",
    "preferredDays": "Selected fixtures · game model",
    "dayPattern": [
      0,
      6
    ],
    "basis": "INTERNATIONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "ARCHIVE_ONLY_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": false,
    "excludedFromGameReason": "Playable 1999 region limited to United States, Canada and Cuba"
  },
  "IT-0005": {
    "id": "IT-0005",
    "name": "Deauville",
    "surfaces": "Turf",
    "meets": [
      [
        "07-01",
        "08-31"
      ]
    ],
    "meetWindow": "Jul 1–Aug 31",
    "raceDays": "GAME MODELED",
    "preferredDays": "Selected fixtures · game model",
    "dayPattern": [
      0,
      3,
      6
    ],
    "basis": "INTERNATIONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "ARCHIVE_ONLY_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": false,
    "excludedFromGameReason": "Playable 1999 region limited to United States, Canada and Cuba"
  },
  "IT-0006": {
    "id": "IT-0006",
    "name": "Iffezheim",
    "surfaces": "Turf",
    "meets": [
      [
        "05-01",
        "06-15"
      ],
      [
        "08-15",
        "09-15"
      ],
      [
        "10-01",
        "10-31"
      ]
    ],
    "meetWindow": "May 1–Jun 15; Aug 15–Sep 15; Oct 1–Oct 31",
    "raceDays": "GAME MODELED",
    "preferredDays": "Selected fixtures · game model",
    "dayPattern": [
      0,
      3,
      6
    ],
    "basis": "INTERNATIONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "ARCHIVE_ONLY_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": false,
    "excludedFromGameReason": "Playable 1999 region limited to United States, Canada and Cuba"
  },
  "IT-0007": {
    "id": "IT-0007",
    "name": "San Isidro",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "01-01",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–Dec 31",
    "raceDays": "GAME MODELED",
    "preferredDays": "Selected fixtures · game model",
    "dayPattern": [
      0,
      6
    ],
    "basis": "INTERNATIONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "ARCHIVE_ONLY_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": false,
    "excludedFromGameReason": "Playable 1999 region limited to United States, Canada and Cuba"
  },
  "IT-0008": {
    "id": "IT-0008",
    "name": "Palermo",
    "surfaces": "Dirt",
    "meets": [
      [
        "01-01",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–Dec 31",
    "raceDays": "GAME MODELED",
    "preferredDays": "Selected fixtures · game model",
    "dayPattern": [
      1,
      6
    ],
    "basis": "INTERNATIONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "ARCHIVE_ONLY_1999",
    "surfaceStatus": "WORKING_1999_SURFACE_UNVERIFIED",
    "calendarExceptions": null,
    "playableIn1999": false,
    "excludedFromGameReason": "Playable 1999 region limited to United States, Canada and Cuba"
  },
  "IT-0009": {
    "id": "IT-0009",
    "name": "Tokyo Racecourse",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "01-01",
        "06-30"
      ],
      [
        "09-01",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–Jun 30; Sep 1–Dec 31",
    "raceDays": "GAME MODELED",
    "preferredDays": "Selected fixtures · game model",
    "dayPattern": [
      0,
      6
    ],
    "basis": "INTERNATIONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "ARCHIVE_ONLY_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": false,
    "excludedFromGameReason": "Playable 1999 region limited to United States, Canada and Cuba"
  },
  "IT-0011": {
    "id": "IT-0011",
    "name": "Flemington",
    "surfaces": "Turf",
    "meets": [
      [
        "01-01",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–Dec 31",
    "raceDays": "GAME MODELED",
    "preferredDays": "Selected fixtures · game model",
    "dayPattern": [
      3,
      6
    ],
    "basis": "INTERNATIONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "ARCHIVE_ONLY_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": false,
    "excludedFromGameReason": "Playable 1999 region limited to United States, Canada and Cuba"
  },
  "IT-0012": {
    "id": "IT-0012",
    "name": "Randwick",
    "surfaces": "Turf",
    "meets": [
      [
        "01-01",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–Dec 31",
    "raceDays": "GAME MODELED",
    "preferredDays": "Selected fixtures · game model",
    "dayPattern": [
      3,
      6
    ],
    "basis": "INTERNATIONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "ARCHIVE_ONLY_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": false,
    "excludedFromGameReason": "Playable 1999 region limited to United States, Canada and Cuba"
  },
  "IT-0013": {
    "id": "IT-0013",
    "name": "Kenilworth",
    "surfaces": "Turf",
    "meets": [
      [
        "01-01",
        "03-31"
      ],
      [
        "10-01",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–Mar 31; Oct 1–Dec 31",
    "raceDays": "GAME MODELED",
    "preferredDays": "Selected fixtures · game model",
    "dayPattern": [
      3,
      6
    ],
    "basis": "INTERNATIONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "ARCHIVE_ONLY_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": false,
    "excludedFromGameReason": "Playable 1999 region limited to United States, Canada and Cuba"
  },
  "IT-0014": {
    "id": "IT-0014",
    "name": "Turffontein",
    "surfaces": "Turf",
    "meets": [
      [
        "01-01",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–Dec 31",
    "raceDays": "GAME MODELED",
    "preferredDays": "Selected fixtures · game model",
    "dayPattern": [
      3,
      6
    ],
    "basis": "INTERNATIONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "ARCHIVE_ONLY_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": false,
    "excludedFromGameReason": "Playable 1999 region limited to United States, Canada and Cuba"
  },
  "IT-0015": {
    "id": "IT-0015",
    "name": "Cidade Jardim",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "01-01",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–Dec 31",
    "raceDays": "GAME MODELED",
    "preferredDays": "Selected fixtures · game model",
    "dayPattern": [
      0,
      6
    ],
    "basis": "INTERNATIONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "ARCHIVE_ONLY_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": false,
    "excludedFromGameReason": "Playable 1999 region limited to United States, Canada and Cuba"
  },
  "IT-0016": {
    "id": "IT-0016",
    "name": "Club Hípico de Santiago",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "01-01",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–Dec 31",
    "raceDays": "GAME MODELED",
    "preferredDays": "Selected fixtures · game model",
    "dayPattern": [
      0,
      5
    ],
    "basis": "INTERNATIONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "ARCHIVE_ONLY_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": false,
    "excludedFromGameReason": "Playable 1999 region limited to United States, Canada and Cuba"
  },
  "IT-0010": {
    "id": "IT-0010",
    "name": "Kyoto Racecourse",
    "surfaces": "Dirt · Turf",
    "meets": [
      [
        "01-01",
        "06-30"
      ],
      [
        "09-01",
        "12-31"
      ]
    ],
    "meetWindow": "Jan 1–Jun 30; Sep 1–Dec 31",
    "raceDays": "GAME MODELED",
    "preferredDays": "Selected fixtures · game model",
    "dayPattern": [
      0,
      6
    ],
    "basis": "INTERNATIONAL_GAME_MODELED",
    "sourceUrl": null,
    "stakesIds": [],
    "stakesDates": [],
    "trackOperating": "ARCHIVE_ONLY_1999",
    "surfaceStatus": "HISTORICALLY_KNOWN_GENERAL",
    "calendarExceptions": null,
    "playableIn1999": false,
    "excludedFromGameReason": "Playable 1999 region limited to United States, Canada and Cuba"
  }
});
export const trackProgram1999=id=>TRACK_PROGRAM_1999[id]||null;
export const trackMeetOpen1999=(id,date)=>{
 const p=trackProgram1999(id);if(!p||p.trackOperating!=='OPEN_1999'||!/^1999-\d{2}-\d{2}$/.test(date))return false;
 const md=date.slice(5);if(!p.meets.some(([a,b])=>a<=md&&md<=b))return false;
 if(p.darkDates?.includes(date))return false;
 if(p.specialDates?.includes(date)||p.stakesDates.includes(date))return true;
 const dow=new Date(date+'T12:00:00Z').getUTCDay();
 return p.dayPattern.includes(dow);
};
export const trackCardSurface1999=(id,slot=0)=>{
 const p=trackProgram1999(id);if(!p||p.trackOperating!=='OPEN_1999')return null;
 return p.surfaces==='Turf'?'TURF':p.surfaces.includes('Turf')&&slot%5===0?'TURF':'DIRT';
};
