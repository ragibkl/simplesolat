package expo.modules.widgetrefresh

import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class WidgetRefreshModule : Module() {
  private val context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("WidgetRefresh")

    // The moments (epoch ms) when the widgets' bold changes, from
    // lib/service/waktuSolatWidget.ts.
    AsyncFunction("schedule") { times: List<Double> ->
      WidgetRefresh.save(context, times.map { it.toLong() })
      WidgetRefresh.scheduleNext(context)
    }
  }
}
