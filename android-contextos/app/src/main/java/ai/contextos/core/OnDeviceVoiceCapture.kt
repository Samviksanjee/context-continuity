/* Voice capture uses Android's on-device recognizer only and fails closed when unavailable. */
package ai.contextos.core

import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import androidx.annotation.RequiresApi
import java.util.Locale

class OnDeviceVoiceCapture(private val context: Context) : AutoCloseable {
  private val handler = Handler(Looper.getMainLooper())
  private var activeRecognizer: SpeechRecognizer? = null
  private var activeTimeout: Runnable? = null

  fun start(onResult: (String) -> Unit, onFailure: (String) -> Unit) {
    val capability = OfflineSpeechCapability.detect(context)
    if (!capability.isReady) {
      onFailure(capability.detail)
      return
    }
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
      onFailure("Strict offline speech needs Android 12 or newer; type instead.")
      return
    }
    startApi31(onResult, onFailure)
  }

  @RequiresApi(Build.VERSION_CODES.S)
  private fun startApi31(onResult: (String) -> Unit, onFailure: (String) -> Unit) {
    close()
    val recognizer = try {
      SpeechRecognizer.createOnDeviceSpeechRecognizer(context)
    } catch (error: Exception) {
      onFailure("The on-device speech provider could not start: ${error.message ?: "provider error"}. Type instead.")
      return
    } catch (_: LinkageError) {
      onFailure("This Android build does not expose a compatible on-device speech provider. Type instead.")
      return
    }
    activeRecognizer = recognizer

    fun finishWithFailure(message: String) {
      if (activeRecognizer !== recognizer) return
      release(recognizer)
      onFailure(message)
    }

    fun finishWithResult(text: String) {
      if (activeRecognizer !== recognizer) return
      release(recognizer)
      if (text.isBlank()) onFailure("No usable local transcription was returned. Type instead.") else onResult(text)
    }

    recognizer.setRecognitionListener(object : RecognitionListener {
      override fun onReadyForSpeech(params: Bundle?) = Unit
      override fun onBeginningOfSpeech() = Unit
      override fun onRmsChanged(rmsdB: Float) = Unit
      override fun onBufferReceived(buffer: ByteArray?) = Unit
      override fun onEndOfSpeech() = Unit
      override fun onError(error: Int) = finishWithFailure(errorMessage(error))
      override fun onResults(results: Bundle?) {
        val text = results
          ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
          ?.firstOrNull()
          .orEmpty()
        finishWithResult(text)
      }
      override fun onPartialResults(partialResults: Bundle?) = Unit
      override fun onEvent(eventType: Int, params: Bundle?) = Unit
    })

    val timeout = Runnable {
      finishWithFailure("Offline voice capture timed out. No remote recognizer was used; type instead.")
    }
    activeTimeout = timeout
    handler.postDelayed(timeout, VOICE_TIMEOUT_MILLIS)

    try {
      recognizer.startListening(Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
        putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
        putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault().toLanguageTag())
        putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
        putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
        putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, context.packageName)
      })
    } catch (error: Exception) {
      finishWithFailure("The on-device speech provider could not listen: ${error.message ?: "provider error"}. Type instead.")
    } catch (_: LinkageError) {
      finishWithFailure("This Android build rejected the on-device speech request. Type instead.")
    }
  }

  private fun errorMessage(error: Int): String = when (error) {
    SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Microphone permission is not available. Allow it in system settings or type instead."
    SpeechRecognizer.ERROR_AUDIO -> "The microphone could not be read. Close other recording apps and try again."
    SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "The on-device speech provider is busy. Wait a moment or type instead."
    SpeechRecognizer.ERROR_NO_MATCH -> "No speech was recognized locally. Try again or type instead."
    SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech was heard before the local timeout. Try again or type instead."
    SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED,
    SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE -> "Offline speech is not installed for ${Locale.getDefault().displayLanguage}. Type instead or add the language in Android settings."
    SpeechRecognizer.ERROR_NETWORK,
    SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "The installed speech provider requested a network service, so ContextOS stopped instead of sending audio remotely. Type instead."
    else -> "Offline voice capture stopped (recognizer error $error). No remote fallback was used."
  }

  private fun release(recognizer: SpeechRecognizer) {
    if (activeRecognizer !== recognizer) return
    activeRecognizer = null
    activeTimeout?.let(handler::removeCallbacks)
    activeTimeout = null
    runCatching { recognizer.destroy() }
  }

  override fun close() {
    val recognizer = activeRecognizer ?: return
    activeRecognizer = null
    activeTimeout?.let(handler::removeCallbacks)
    activeTimeout = null
    runCatching { recognizer.cancel() }
    runCatching { recognizer.destroy() }
  }

  private companion object {
    const val VOICE_TIMEOUT_MILLIS = 30_000L
  }
}
