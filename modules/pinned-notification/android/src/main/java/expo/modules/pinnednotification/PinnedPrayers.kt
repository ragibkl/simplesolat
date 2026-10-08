package expo.modules.pinnednotification

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Typeface
import android.os.Build
import android.text.SpannableString
import android.text.Spanned
import android.text.style.StyleSpan
import android.widget.RemoteViews
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import org.json.JSONObject
import java.time.LocalDate
import java.time.ZoneId

// The five prayer times as a notification that stays at the top of the shade.
//
// The app stores a few days of times (save); this redraws the notification
// with today's times and the current prayer in bold (refresh), then sets an
// alarm for the next prayer or midnight, when it redraws again. Android 14+
// lets users swipe away ongoing notifications, so a swipe puts it back.
object PinnedPrayers {
  private const val PREFS = "simplesolat_pinned_prayers"
  private const val KEY_DATA = "data"
  private const val CHANNEL_ID = "pinned_prayer_times"
  private const val NOTIFICATION_ID = 7301
  private const val ACTION_REFRESH = "com.simplesolat.PINNED_PRAYERS_REFRESH"

  fun save(context: Context, json: String) {
    prefs(context).edit().putString(KEY_DATA, json).apply()
  }

  fun stop(context: Context) {
    prefs(context).edit().remove(KEY_DATA).apply()
    alarmManager(context).cancel(refreshIntent(context, 1))
    NotificationManagerCompat.from(context).cancel(NOTIFICATION_ID)
  }

  fun refresh(context: Context) {
    val json = prefs(context).getString(KEY_DATA, null) ?: return
    val data = try {
      JSONObject(json)
    } catch (e: Exception) {
      return
    }

    val now = System.currentTimeMillis()
    val today = LocalDate.now().toString()
    val days = data.optJSONArray("days")
    var day: JSONObject? = null
    for (i in 0 until (days?.length() ?: 0)) {
      val d = days!!.getJSONObject(i)
      if (d.optString("date") == today) day = d
    }

    show(context, data, day, now)
    scheduleNext(context, day, now)
  }

  private fun show(context: Context, data: JSONObject, day: JSONObject?, now: Long) {
    val manager = NotificationManagerCompat.from(context)
    if (!manager.areNotificationsEnabled()) return
    createChannel(context)

    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
    val contentIntent = launch?.let {
      PendingIntent.getActivity(context, 0, it, PendingIntent.FLAG_IMMUTABLE)
    }

    val builder = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(R.drawable.ic_stat_pinned_prayers)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setSilent(true)
      .setShowWhen(false)
      .setCategory(NotificationCompat.CATEGORY_STATUS)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setPriority(NotificationCompat.PRIORITY_DEFAULT)
      .setContentIntent(contentIntent)
      .setDeleteIntent(refreshIntent(context, 2))

    if (day == null) {
      builder
        .setContentTitle("Prayer times")
        .setContentText("Open simplesolat to update today's times")
    } else {
      val views = columnsView(context, day, now)
      builder
        .setSubText(data.optString("subText"))
        .setStyle(NotificationCompat.DecoratedCustomViewStyle())
        .setCustomContentView(views)
        .setCustomBigContentView(views)
    }

    try {
      manager.notify(NOTIFICATION_ID, builder.build())
    } catch (e: SecurityException) {
      // Notification permission was revoked.
    }
  }

  private fun columnsView(context: Context, day: JSONObject, now: Long): RemoteViews {
    val pkg = context.packageName
    val row = RemoteViews(pkg, R.layout.pinned_prayers)
    row.removeAllViews(R.id.pinned_columns)
    val columns = day.getJSONArray("columns")
    for (i in 0 until columns.length()) {
      val c = columns.getJSONObject(i)
      val start = c.getLong("start")
      val end = if (c.has("end") && !c.isNull("end")) c.getLong("end") else Long.MAX_VALUE
      val current = now in start until end

      val column = RemoteViews(pkg, R.layout.pinned_prayer_column)
      column.setTextViewText(R.id.pinned_label, styled(c.getString("label"), current))
      column.setTextViewText(R.id.pinned_time, styled(c.getString("time"), current))
      row.addView(R.id.pinned_columns, column)
    }
    return row
  }

  private fun styled(text: String, bold: Boolean): CharSequence {
    if (!bold) return text
    return SpannableString(text).apply {
      setSpan(StyleSpan(Typeface.BOLD), 0, text.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
    }
  }

  // The next prayer start today, else the next midnight.
  private fun scheduleNext(context: Context, day: JSONObject?, now: Long) {
    val midnight = LocalDate.now().plusDays(1)
      .atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli()
    var next = midnight
    val columns = day?.optJSONArray("columns")
    for (i in 0 until (columns?.length() ?: 0)) {
      val start = columns!!.getJSONObject(i).getLong("start")
      if (start > now && start < next) next = start
    }

    val alarms = alarmManager(context)
    val intent = refreshIntent(context, 1)
    val exact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarms.canScheduleExactAlarms()
    if (exact) {
      alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, intent)
    } else {
      alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, intent)
    }
  }

  private fun createChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = context.getSystemService(NotificationManager::class.java)
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return
    // Default importance keeps it out of the "Silent" section; no sound or
    // vibration, since the prayer reminders do the alerting.
    val channel = NotificationChannel(
      CHANNEL_ID, "Pinned prayer times", NotificationManager.IMPORTANCE_DEFAULT
    ).apply {
      description = "Today's five prayer times, pinned in the notifications"
      setSound(null, null)
      enableVibration(false)
      setShowBadge(false)
    }
    manager.createNotificationChannel(channel)
  }

  private fun refreshIntent(context: Context, requestCode: Int): PendingIntent {
    val intent = Intent(context, PinnedPrayersReceiver::class.java).setAction(ACTION_REFRESH)
    return PendingIntent.getBroadcast(
      context, requestCode, intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  private fun alarmManager(context: Context) =
    context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

  private fun prefs(context: Context) =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}
