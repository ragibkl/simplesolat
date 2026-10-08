package expo.modules.pinnednotification

import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PinnedNotificationModule : Module() {
  private val context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("PinnedNotification")

    // Stores the upcoming days (JSON from lib/service/pinnedNotification.ts)
    // and shows the notification.
    AsyncFunction("update") { json: String ->
      PinnedPrayers.save(context, json)
      PinnedPrayers.refresh(context)
    }

    AsyncFunction("stop") {
      PinnedPrayers.stop(context)
    }
  }
}
