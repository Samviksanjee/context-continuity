/* ContextOS Android prototype: voice capture uses Android's on-device recognizer only and fails closed when unavailable. */
package ai.contextos.core

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer

class OnDeviceVoiceCapture(private val context: Context) {
  fun isAvailable(): Boolean = SpeechRecognizer.isOnDeviceRecognitionAvailable(context)

  fun start(onResult: (String) -> Unit, onFailure: (String) -> Unit) {
    if (!isAvailable()) {
      onFailure("On-device speech recognition is unavailable on this phone. ContextOS will not fall back to a remote speech service.")
      return
    }
    val recognizer = try { SpeechRecognizer.createOnDeviceSpeechRecognizer(context) } catch (_: UnsupportedOperationException) {
      onFailure("This device does not currently offer an on-device speech recognizer.")
      return
    }
    recognizer.setRecognitionListener(object : RecognitionListener {
      override fun onReadyForSpeech(params: Bundle?) = Unit
      override fun onBeginningOfSpeech() = Unit
      override fun onRmsChanged(rmsdB: Float) = Unit
      override fun onBufferReceived(buffer: ByteArray?) = Unit
      override fun onEndOfSpeech() = Unit
      override fun onError(error: Int) {
        recognizer.destroy()
        onFailure("Voice capture stopped locally (recognizer error $error). No audio was sent by ContextOS.")
      }
      override fun onResults(results: Bundle?) {
        val text = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull().orEmpty()
        recognizer.destroy()
        if (text.isBlank()) onFailure("No usable local transcription was returned.") else onResult(text)
      }
      override fun onPartialResults(partialResults: Bundle?) = Unit
      override fun onEvent(eventType: Int, params: Bundle?) = Unit
    })
    recognizer.startListening(Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
      putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
      putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
    })
  }
}
