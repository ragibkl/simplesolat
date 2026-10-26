package expo.modules.widgetrefresh

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

// The alarm at each stored moment redraws the widgets; reboots, app updates
// and clock changes redraw them too and set the next alarm again.
class WidgetRefreshReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    WidgetRefresh.refreshWidgets(context)
    WidgetRefresh.scheduleNext(context)
  }
}
