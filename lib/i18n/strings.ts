// Every text the app shows, in English and Malay. Prayer names: English uses
// the English spelling of the Arabic names, Malay uses JAKIM's spelling.
// {name} placeholders are filled in by t().

export const en = {
  // Prayer names
  "prayer.imsak": "Imsak",
  "prayer.fajr": "Fajr",
  "prayer.syuruk": "Shuruq",
  "prayer.dhuha": "Dhuha",
  "prayer.dhuhr": "Dhuhr",
  "prayer.asr": "Asr",
  "prayer.maghrib": "Maghrib",
  "prayer.isha": "Isha",

  // Header and screen titles
  "title.qibla": "Qibla",
  "title.settings": "Settings",

  // Home
  "home.today": "Today",
  "home.tomorrow": "Tomorrow",
  "home.loading": "Loading prayer times…",
  "home.retry": "Retry",
  "home.failure.offline":
    "Couldn't load the prayer times: no internet connection.",
  "home.failure.notFound":
    "This zone's timetable for this day isn't published yet.",
  "home.failure.server":
    "Couldn't load the prayer times: the server didn't answer.",
  "home.noLocation": "Location not set",
  "zone.source": "{zone} - Source: {source}",
  "zone.calculated": "Calculated ({method})",
  "zone.unknownCountry": "Unknown",

  // Qibla
  "qibla.allowLocation":
    "Allow location access (Settings) to use the Qibla compass.",
  "qibla.noCompass": "This device has no compass, so it can't point the way.",
  "qibla.bearingOnly":
    "From where you are, the Kaaba is {bearing}° clockwise from north.",
  "qibla.waiting": "Waiting for compass...",
  "qibla.direction": "Kaaba direction: {bearing}°",
  "qibla.facing": "You're facing: {heading}°",
  "qibla.accuracy": "Accuracy: {accuracy}",
  "qibla.accuracy.high": "high",
  "qibla.accuracy.medium": "medium",
  "qibla.accuracy.low": "low",
  "qibla.accuracy.none": "none",
  "qibla.calibrate": "Low accuracy - wave phone in figure-8",
  "compass.n": "N",
  "compass.e": "E",
  "compass.s": "S",
  "compass.w": "W",

  // Settings
  "settings.language": "Language",
  "settings.language.system": "Same as phone",
  "settings.permissions": "Permissions",
  "settings.permissions.allGood": "All permissions are on.",
  "settings.fix": "Fix",
  "settings.testNotification": "Send test notification",
  "settings.testNotificationSent": "Test notification sent",
  "settings.notifications": "Notifications",
  "settings.dhuhaNote": "Malaysia, Brunei and Indonesia only",
  "settings.widget": "Widget",
  "settings.widget.help":
    "Extra time shown on the Waktu Solat widgets, next to the five prayers. None shows only the five prayers. Dhuha is for Malaysia, Brunei and Indonesia only; elsewhere the widget shows the five prayers.",
  "settings.widget.none": "None",
  "settings.offlineData": "Offline data",
  "settings.pinned": "Pinned notification",
  "settings.pinned.label": "Prayer times in notifications",
  "settings.pinned.help":
    "The five prayer times for today, always at the top of your notifications. Silent.",

  // Permission checks (Settings)
  "permission.notifications": "Notifications",
  "permission.notifications.help": "Needed for prayer time reminders.",
  "permission.exactAlarms": "Exact alarms",
  "permission.exactAlarms.help":
    "Lets reminders arrive right at the prayer time.",
  "permission.battery": "Battery unrestricted",
  "permission.battery.help":
    'Find "simplesolat" and choose "Unrestricted", so Android doesn\'t delay reminders and widget updates.',
  "permission.location": "Location",
  "permission.location.help":
    "Used on your phone to find your prayer zone. It never leaves your phone.",
  "permission.locationAlways.ios": "Location: Always",
  "permission.locationAlways.android": "Location all the time",
  "permission.locationAlways.help":
    "Keeps reminders and widgets on the right zone when you travel.",

  // Permission prompts (first launch)
  "prompt.ok": "Ok",
  "prompt.skip": "Skip",
  "prompt.location.title": "Location Permission",
  "prompt.location.body":
    "This app needs your location to determine your prayer zone and display accurate prayer times for your area.",
  "prompt.locationError.title": "Location Error",
  "prompt.locationError.body":
    "Failed to request location permission. Prayer zone detection may not work.",
  "prompt.background.title": "Background Location Permission",
  "prompt.background.body.ios":
    'To keep your prayer times, reminders and widget right when you travel, choose "Change to Always Allow" next. Your location stays on your device.',
  "prompt.background.body.android":
    "This app needs background location access to keep your prayer times and widgets updated as you travel, even when the app is not open.",
  "prompt.backgroundError.title": "Background Location Error",
  "prompt.backgroundError.body":
    "Failed to request background location permission. Widgets may not update automatically.",
  "prompt.notificationError.title": "Notification Error",
  "prompt.notificationError.body":
    "Failed to initialize notifications. Prayer time alerts may not work. Please restart the app or reinstall if the issue persists.",
  "prompt.exactAlarm.title": "Exact Alarm Permission",
  "prompt.exactAlarm.body":
    "This app needs exact alarm permission to notify you precisely when each prayer time begins.",
  "prompt.battery.title": "Battery Optimization",
  "prompt.battery.body":
    'To ensure prayer time notifications arrive on time, please find "simplesolat" in the list, tap on it, and select "Unrestricted".',

  // Notifications
  "notification.channel": "Prayer Times",
  "notification.title": "Waktu Solat - {prayer} at {time}",
  "notification.body": "It is now {prayer} in {place}",
  "notification.testTitle": "simplesolat test",
  "notification.testBody": "Prayer time notifications are working.",
  "notification.stale":
    "Open simplesolat to keep your prayer time reminders coming.",

  // Pinned notification (Android)
  "pinned.channel": "Pinned prayer times",
  "pinned.channelDescription":
    "Today's five prayer times, pinned in the notifications",
  "pinned.title": "Prayer times",
  "pinned.openToUpdate": "Open simplesolat to update today's times",
  "pinned.nextIn": "{prayer} in",

  // Widgets
  "widget.now": "Now",
  "widget.next": "Next",

  // Offline data
  "offline.help":
    "Countries kept on your phone, so prayer times work without internet anywhere in them, for this month and next. Kept up to date automatically. The country you are in is added when you arrive.",
  "offline.downloading": "Downloading…",
  "offline.removing": "Removing…",
  "offline.failed": "Couldn't download. Check the internet connection.",
  "offline.waiting": "Waiting for internet",
  "offline.notHere": "Not on this phone",
  "offline.updated": "{size} · updated {date}",
  "offline.keep": "Keep {country} offline",
};

export type StringKey = keyof typeof en;

export const ms: Record<StringKey, string> = {
  "prayer.imsak": "Imsak",
  "prayer.fajr": "Subuh",
  "prayer.syuruk": "Syuruk",
  "prayer.dhuha": "Dhuha",
  "prayer.dhuhr": "Zohor",
  "prayer.asr": "Asar",
  "prayer.maghrib": "Maghrib",
  "prayer.isha": "Isyak",

  "title.qibla": "Kiblat",
  "title.settings": "Tetapan",

  "home.today": "Hari ini",
  "home.tomorrow": "Esok",
  "home.loading": "Memuatkan waktu solat…",
  "home.retry": "Cuba lagi",
  "home.failure.offline":
    "Waktu solat tidak dapat dimuatkan: tiada sambungan internet.",
  "home.failure.notFound":
    "Jadual waktu solat zon ini bagi tarikh ini belum diterbitkan.",
  "home.failure.server":
    "Waktu solat tidak dapat dimuatkan: pelayan tidak menjawab.",
  "home.noLocation": "Lokasi belum ditetapkan",
  "zone.source": "{zone} - Sumber: {source}",
  "zone.calculated": "Kiraan ({method})",
  "zone.unknownCountry": "Tidak diketahui",

  "qibla.allowLocation":
    "Benarkan akses lokasi (Tetapan) untuk menggunakan kompas kiblat.",
  "qibla.noCompass":
    "Peranti ini tiada kompas, jadi arah kiblat tidak dapat ditunjukkan.",
  "qibla.bearingOnly":
    "Dari tempat anda, Kaabah berada {bearing}° ikut arah jam dari utara.",
  "qibla.waiting": "Menunggu kompas...",
  "qibla.direction": "Arah Kaabah: {bearing}°",
  "qibla.facing": "Anda menghadap: {heading}°",
  "qibla.accuracy": "Ketepatan: {accuracy}",
  "qibla.accuracy.high": "tinggi",
  "qibla.accuracy.medium": "sederhana",
  "qibla.accuracy.low": "rendah",
  "qibla.accuracy.none": "tiada",
  "qibla.calibrate": "Ketepatan rendah - gerakkan telefon ikut bentuk angka 8",
  "compass.n": "U",
  "compass.e": "T",
  "compass.s": "S",
  "compass.w": "B",

  "settings.language": "Bahasa",
  "settings.language.system": "Ikut telefon",
  "settings.permissions": "Kebenaran",
  "settings.permissions.allGood": "Semua kebenaran sudah dihidupkan.",
  "settings.fix": "Betulkan",
  "settings.testNotification": "Hantar notifikasi ujian",
  "settings.testNotificationSent": "Notifikasi ujian dihantar",
  "settings.notifications": "Notifikasi",
  "settings.dhuhaNote": "Malaysia, Brunei dan Indonesia sahaja",
  "settings.widget": "Widget",
  "settings.widget.help":
    "Waktu tambahan pada widget Waktu Solat, di sebelah lima waktu solat. "Tiada" bermaksud lima waktu solat sahaja. Dhuha untuk Malaysia, Brunei dan Indonesia sahaja; di tempat lain widget menunjukkan lima waktu solat.",
  "settings.widget.none": "Tiada",
  "settings.offlineData": "Data luar talian",
  "settings.pinned": "Notifikasi disemat",
  "settings.pinned.label": "Waktu solat dalam notifikasi",
  "settings.pinned.help":
    "Lima waktu solat hari ini, sentiasa di bahagian atas notifikasi anda. Tanpa bunyi.",

  "permission.notifications": "Notifikasi",
  "permission.notifications.help": "Diperlukan untuk peringatan waktu solat.",
  "permission.exactAlarms": "Penggera tepat",
  "permission.exactAlarms.help":
    "Supaya peringatan sampai tepat pada waktu solat.",
  "permission.battery": "Bateri tanpa had",
  "permission.battery.help":
    'Cari "simplesolat" dan pilih "Tanpa had" (Unrestricted), supaya Android tidak melewatkan peringatan dan kemas kini widget.',
  "permission.location": "Lokasi",
  "permission.location.help":
    "Digunakan dalam telefon anda untuk mencari zon waktu solat. Lokasi anda tidak dihantar ke mana-mana.",
  "permission.locationAlways.ios": "Lokasi: Sentiasa",
  "permission.locationAlways.android": "Lokasi sepanjang masa",
  "permission.locationAlways.help":
    "Supaya peringatan dan widget ikut zon yang betul semasa anda bermusafir.",

  "prompt.ok": "Ok",
  "prompt.skip": "Langkau",
  "prompt.location.title": "Kebenaran Lokasi",
  "prompt.location.body":
    "Aplikasi ini memerlukan lokasi anda untuk mengenal pasti zon waktu solat dan memaparkan waktu solat yang tepat untuk kawasan anda.",
  "prompt.locationError.title": "Ralat Lokasi",
  "prompt.locationError.body":
    "Kebenaran lokasi tidak dapat diminta. Zon waktu solat mungkin tidak dapat dikenal pasti.",
  "prompt.background.title": "Kebenaran Lokasi Latar Belakang",
  "prompt.background.body.ios":
    'Supaya waktu solat, peringatan dan widget kekal betul semasa anda bermusafir, pilih "Tukar kepada Sentiasa Benarkan" (Change to Always Allow) selepas ini. Lokasi anda kekal dalam peranti anda.',
  "prompt.background.body.android":
    "Aplikasi ini memerlukan akses lokasi latar belakang supaya waktu solat dan widget dikemas kini semasa anda bermusafir, walaupun aplikasi tidak dibuka.",
  "prompt.backgroundError.title": "Ralat Lokasi Latar Belakang",
  "prompt.backgroundError.body":
    "Kebenaran lokasi latar belakang tidak dapat diminta. Widget mungkin tidak dikemas kini secara automatik.",
  "prompt.notificationError.title": "Ralat Notifikasi",
  "prompt.notificationError.body":
    "Notifikasi tidak dapat dimulakan. Peringatan waktu solat mungkin tidak berfungsi. Sila mulakan semula aplikasi atau pasang semula jika masalah berterusan.",
  "prompt.exactAlarm.title": "Kebenaran Penggera Tepat",
  "prompt.exactAlarm.body":
    "Aplikasi ini memerlukan kebenaran penggera tepat untuk memberitahu anda tepat pada setiap waktu solat.",
  "prompt.battery.title": "Pengoptimuman Bateri",
  "prompt.battery.body":
    'Supaya notifikasi waktu solat sampai tepat pada masanya, cari "simplesolat" dalam senarai, ketik, dan pilih "Tanpa had" (Unrestricted).',

  "notification.channel": "Waktu Solat",
  "notification.title": "Waktu Solat - {prayer} pada {time}",
  "notification.body": "Telah masuk waktu {prayer} di {place}",
  "notification.testTitle": "Ujian simplesolat",
  "notification.testBody": "Notifikasi waktu solat berfungsi.",
  "notification.stale":
    "Buka simplesolat supaya peringatan waktu solat anda diteruskan.",

  "pinned.channel": "Waktu solat disemat",
  "pinned.channelDescription":
    "Lima waktu solat hari ini, disemat dalam notifikasi",
  "pinned.title": "Waktu solat",
  "pinned.openToUpdate": "Buka simplesolat untuk mengemas kini waktu hari ini",
  "pinned.nextIn": "{prayer} dalam",

  "widget.now": "Kini",
  "widget.next": "Seterusnya",

  "offline.help":
    "Negara yang disimpan dalam telefon anda, supaya waktu solat berfungsi tanpa internet di mana-mana tempat dalam negara itu, untuk bulan ini dan bulan depan. Dikemas kini secara automatik. Negara tempat anda berada ditambah apabila anda tiba.",
  "offline.downloading": "Memuat turun…",
  "offline.removing": "Membuang…",
  "offline.failed": "Tidak dapat dimuat turun. Semak sambungan internet.",
  "offline.waiting": "Menunggu internet",
  "offline.notHere": "Tiada dalam telefon ini",
  "offline.updated": "{size} · dikemas kini {date}",
  "offline.keep": "Simpan data {country} untuk luar talian",
};
