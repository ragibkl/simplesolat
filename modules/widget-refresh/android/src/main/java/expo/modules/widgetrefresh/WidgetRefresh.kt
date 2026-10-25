package expo.modules.widgetrefresh

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.os.Build
import org.json.JSONArray

// Redraws the home screen widgets on time when a prayer starts or ends.
//
// The widgets are drawn by React Native and only redraw when something wakes
// the app: a prayer reminder (only for prayers whose reminder is on), the
// background task (every 15 minutes at best) or Android's 30-minute widget
// update. So the bold could stay on a prayer that had ended, e.g. Syuruk,
// which ends at Dhuha and has no reminder. The app stores the moments the
// bold changes (save); an alarm at the next one asks Android to update our
// widgets, which redraws them with the current time (WIDGET_UPDATE).
object WidgetRefresh {
  private const val PREFS = "simplesolat_widget_refresh"
  private const val KEY_TIMES = "times"
  private const val ACTION_REFRESH = "com.simplesolat.WIDGET_REFRESH"

  fun save(context: Context, times: List<Long>) {
    val json = JSONArray(times.sorted()).toString()
    prefs(context).edit().putString(KEY_TIMES, json).apply()
  }

  fun refreshWidgets(context: Context) {
    val manager = AppWidgetManager.getInstance(context)
    val providers = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      manager.getInstalledProvidersForPackage(context.packageName, null)
    } else {
      manager.installedProviders.filter { it.provider.packageName == context.packageName }
    }
    for (info in providers) {
      val ids = manager.getAppWidgetIds(info.provider)
      if (ids.isEmpty()) continue
      val intent = Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE)
        .setComponent(info.provider)
        .putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
      context.sendBroadcast(intent)
    }
  }

  // An alarm at the next stored moment; none when no moment is left (the app
  // stores new ones every day) or no widget is on the home screen.
  fun scheduleNext(context: Context) {
    val alarms = alarmManager(context)
    val intent = refreshIntent(context)
    alarms.cancel(intent)
    if (!hasWidgets(context)) return

    val now = System.currentTimeMillis()
    val json = prefs(context).getString(KEY_TIMES, null) ?: return
    val times = try {
      JSONArray(json)
    } catch (e: Exception) {
      return
    }
    var next = Long.MAX_VALUE
    for (i in 0 until times.length()) {
      val t = times.getLong(i)
      if (t > now && t < next) next = t
    }
    if (next == Long.MAX_VALUE) return

    // Not an alarm clock (that shows an alarm icon in the status bar): an
    // exact "allow while idle" alarm, rate-limited only to about one per
    // 10 minutes when the phone is idle, which is plenty for these.
    val exact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarms.canScheduleExactAlarms()
    if (exact) {
      alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, intent)
    } else {
      alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, intent)
    }
  }

  private fun hasWidgets(context: Context): Boolean {
    val manager = AppWidgetManager.getInstance(context)
    return manager.installedProviders
      .filter { it.provider.packageName == context.packageName }
      .any { manager.getAppWidgetIds(it.provider).isNotEmpty() }
  }

  private fun refreshIntent(context: Context): PendingIntent {
    val intent = Intent(context, WidgetRefreshReceiver::class.java).setAction(ACTION_REFRESH)
    return PendingIntent.getBroadcast(
      context, 1, intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  private fun alarmManager(context: Context) =
    context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

  private fun prefs(context: Context) =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}
