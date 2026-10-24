package expo.modules.compassheading

import android.content.Context
import android.hardware.GeomagneticField
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.SystemClock
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlin.math.abs

// The compass heading from Android's rotation vector sensor, which fuses the
// magnetometer, accelerometer and gyroscope. expo-location reads the raw
// magnetometer and accelerometer a few times a second and only reports
// changes over 2 degrees, so the Qibla dial moved in visible steps.
class CompassHeadingModule : Module(), SensorEventListener {
  private var sensorManager: SensorManager? = null
  private var declination = 0f
  private var accuracy = SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM
  private var lastHeading = -1f
  private var lastSent = 0L
  private val rotation = FloatArray(9)
  private val orientation = FloatArray(3)

  override fun definition() = ModuleDefinition {
    Name("CompassHeading")
    Events("onHeading")

    // False on phones without the sensor (no gyroscope or no magnetometer).
    Function("isAvailable") {
      manager()?.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR) != null
    }

    // Where the phone is, to turn magnetic north into true north.
    Function("setLocation") { latitude: Double, longitude: Double ->
      declination = GeomagneticField(
        latitude.toFloat(), longitude.toFloat(), 0f, System.currentTimeMillis()
      ).declination
    }

    Function("start") {
      val sm = manager() ?: return@Function false
      val rv = sm.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR) ?: return@Function false
      sm.registerListener(this@CompassHeadingModule, rv, SensorManager.SENSOR_DELAY_GAME)
      // Only for its accuracy (calibration), shown on the Qibla screen.
      sm.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD)?.let {
        sm.registerListener(this@CompassHeadingModule, it, SensorManager.SENSOR_DELAY_UI)
      }
      true
    }

    Function("stop") {
      sensorManager?.unregisterListener(this@CompassHeadingModule)
      lastHeading = -1f
    }

    OnDestroy {
      sensorManager?.unregisterListener(this@CompassHeadingModule)
    }
  }

  private fun manager(): SensorManager? {
    if (sensorManager == null) {
      val context = appContext.reactContext ?: return null
      sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager?
    }
    return sensorManager
  }

  override fun onSensorChanged(event: SensorEvent) {
    if (event.sensor.type != Sensor.TYPE_ROTATION_VECTOR) return
    SensorManager.getRotationMatrixFromVector(rotation, event.values)
    SensorManager.getOrientation(rotation, orientation)
    val magnetic = Math.toDegrees(orientation[0].toDouble()).toFloat()
    val heading = ((magnetic + declination) % 360f + 360f) % 360f

    // About 30 updates a second at most, and skip changes too small to see.
    val now = SystemClock.elapsedRealtime()
    var change = abs(heading - lastHeading)
    if (change > 180f) change = 360f - change
    if (lastHeading >= 0f && (now - lastSent < 33 || change < 0.3f)) return
    lastHeading = heading
    lastSent = now
    sendEvent("onHeading", mapOf("heading" to heading.toDouble(), "accuracy" to accuracy))
  }

  override fun onAccuracyChanged(sensor: Sensor, value: Int) {
    if (sensor.type == Sensor.TYPE_MAGNETIC_FIELD) accuracy = value
  }
}
