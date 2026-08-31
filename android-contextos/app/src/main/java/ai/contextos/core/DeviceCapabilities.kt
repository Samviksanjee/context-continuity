/* Runtime capability discovery for vendor-neutral, local-only Android behavior. */
package ai.contextos.core

import android.Manifest
import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.provider.MediaStore
import android.speech.SpeechRecognizer
import androidx.annotation.RequiresApi
import androidx.core.content.ContextCompat
import java.util.Locale

enum class CapabilityState { READY, NEEDS_PERMISSION, UNAVAILABLE }

data class DeviceCapability(
  val state: CapabilityState,
  val detail: String,
) {
  val isReady: Boolean get() = state == CapabilityState.READY
  val canAttempt: Boolean get() = state != CapabilityState.UNAVAILABLE
}

enum class OcrScript(val displayName: String) {
  LATIN("Latin"),
  CHINESE("Chinese"),
  DEVANAGARI("Devanagari"),
  JAPANESE("Japanese"),
  KOREAN("Korean"),
  ;

  companion object {
    fun forLocale(locale: Locale): OcrScript = when (locale.language.lowercase(Locale.ROOT)) {
      "zh" -> CHINESE
      "ja" -> JAPANESE
      "ko" -> KOREAN
      "hi", "mr", "ne", "sa", "kok", "mai", "bho" -> DEVANAGARI
      else -> LATIN
    }
  }
}

data class CaptureWorkloadPolicy(
  val maxImageDimension: Int,
  val maxPdfPages: Int,
  val ocrScript: OcrScript,
)

data class DeviceAiFeature(
  val name: String,
  val state: CapabilityState,
  val detail: String,
)

/** Optional signed/OEM modules can report a public, contracted feature through this seam. */
fun interface DeviceAiFeatureProvider {
  fun probe(context: Context): DeviceAiFeature?
}

data class DeviceCapabilities(
  val deviceLabel: String,
  val androidRelease: String,
  val isLowMemory: Boolean,
  val cameraCapture: DeviceCapability,
  val documentPicker: DeviceCapability,
  val offlineSpeech: DeviceCapability,
  val capturePolicy: CaptureWorkloadPolicy,
  val aiFeatures: List<DeviceAiFeature>,
)

class DeviceCapabilityDetector(
  context: Context,
  private val additionalAiProviders: List<DeviceAiFeatureProvider> = emptyList(),
) {
  private val appContext = context.applicationContext

  fun detect(): DeviceCapabilities {
    val packageManager = appContext.packageManager
    val activityManager = appContext.getSystemService(ActivityManager::class.java)
    val isLowMemory = activityManager?.isLowRamDevice == true || (activityManager?.memoryClass ?: 256) < 192
    val ocrScript = OcrScript.forLocale(Locale.getDefault())
    val capturePolicy = if (isLowMemory) {
      CaptureWorkloadPolicy(maxImageDimension = 1280, maxPdfPages = 1, ocrScript = ocrScript)
    } else {
      CaptureWorkloadPolicy(maxImageDimension = 2048, maxPdfPages = 3, ocrScript = ocrScript)
    }

    val cameraIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
    val hasCamera = packageManager.hasSystemFeature(PackageManager.FEATURE_CAMERA_ANY) &&
      cameraIntent.resolveActivity(packageManager) != null
    val camera = if (hasCamera) {
      DeviceCapability(CapabilityState.READY, "A compatible camera app is available.")
    } else {
      DeviceCapability(CapabilityState.UNAVAILABLE, "No compatible camera app was found; choose an existing image instead.")
    }

    val documentIntent = Intent(Intent.ACTION_OPEN_DOCUMENT)
      .addCategory(Intent.CATEGORY_OPENABLE)
      .setType("*/*")
    val documents = if (documentIntent.resolveActivity(packageManager) != null) {
      DeviceCapability(CapabilityState.READY, "The system document picker is available.")
    } else {
      DeviceCapability(CapabilityState.UNAVAILABLE, "This phone has no compatible document picker; use a note or share sheet.")
    }

    val speech = OfflineSpeechCapability.detect(appContext)
    val builtInFeatures = listOf(
      DeviceAiFeature(
        name = "Local context reasoning",
        state = CapabilityState.READY,
        detail = "Deterministic CPU fallback works without a vendor AI service.",
      ),
      DeviceAiFeature(
        name = "${ocrScript.displayName} OCR",
        state = CapabilityState.READY,
        detail = "The model is bundled in the app and selected from the phone language.",
      ),
      DeviceAiFeature(
        name = "Offline speech",
        state = speech.state,
        detail = speech.detail,
      ),
    )
    val extensionFeatures = additionalAiProviders.mapNotNull { provider ->
      runCatching { provider.probe(appContext) }.getOrNull()
    }

    return DeviceCapabilities(
      deviceLabel = buildDeviceLabel(),
      androidRelease = Build.VERSION.RELEASE.orEmpty().ifBlank { Build.VERSION.SDK_INT.toString() },
      isLowMemory = isLowMemory,
      cameraCapture = camera,
      documentPicker = documents,
      offlineSpeech = speech,
      capturePolicy = capturePolicy,
      aiFeatures = builtInFeatures + extensionFeatures,
    )
  }

  private fun buildDeviceLabel(): String {
    val manufacturer = Build.MANUFACTURER.trim().replaceFirstChar { character ->
      if (character.isLowerCase()) character.titlecase(Locale.getDefault()) else character.toString()
    }
    val model = Build.MODEL.trim()
    return when {
      model.isBlank() && manufacturer.isBlank() -> "Android device"
      manufacturer.isBlank() || model.startsWith(manufacturer, ignoreCase = true) -> model
      model.isBlank() -> manufacturer
      else -> "$manufacturer $model"
    }
  }
}

object OfflineSpeechCapability {
  fun detect(context: Context): DeviceCapability {
    if (!context.packageManager.hasSystemFeature(PackageManager.FEATURE_MICROPHONE)) {
      return DeviceCapability(CapabilityState.UNAVAILABLE, "This device does not report a microphone; type instead.")
    }
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
      return DeviceCapability(
        CapabilityState.UNAVAILABLE,
        "Strict offline speech needs Android 12 or newer; typed notes and queries still work.",
      )
    }
    val providerAvailable = runCatching { Api31.isAvailable(context) }.getOrDefault(false)
    if (!providerAvailable) {
      return DeviceCapability(
        CapabilityState.UNAVAILABLE,
        "No installed on-device speech provider is available; ContextOS will not use a remote recognizer.",
      )
    }
    val hasPermission = ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) ==
      PackageManager.PERMISSION_GRANTED
    return if (hasPermission) {
      DeviceCapability(CapabilityState.READY, "Android reports an installed on-device speech recognizer.")
    } else {
      DeviceCapability(CapabilityState.NEEDS_PERMISSION, "Ready after microphone permission; audio stays with Android's on-device recognizer.")
    }
  }

  @RequiresApi(Build.VERSION_CODES.S)
  private object Api31 {
    fun isAvailable(context: Context): Boolean = SpeechRecognizer.isOnDeviceRecognitionAvailable(context)
  }
}
