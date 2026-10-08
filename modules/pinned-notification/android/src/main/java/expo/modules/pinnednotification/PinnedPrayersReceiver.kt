package expo.modules.pinnednotification

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

// Prayer time alarms, the user swiping the notification away, reboots, app
// updates and clock changes: all redraw the notification.
class PinnedPrayersReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    PinnedPrayers.refresh(context)
  }
}
