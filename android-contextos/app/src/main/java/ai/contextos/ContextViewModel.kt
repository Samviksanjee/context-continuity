/* View state is local, source-scoped, capability-aware, and has explicit delete controls. */
package ai.contextos

import android.app.Application
import android.graphics.Bitmap
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import ai.contextos.core.CapabilityState
import ai.contextos.core.CaptureResult
import ai.contextos.core.ContextQueryResult
import ai.contextos.core.ContextRepository
import ai.contextos.core.ContextThread
import ai.contextos.core.DeviceCapabilities
import ai.contextos.core.DeviceCapabilityDetector
import ai.contextos.core.EvidenceSource
import ai.contextos.core.OnDeviceCapture
import ai.contextos.core.OnDeviceVoiceCapture
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

data class UndoableDeletion(val token: Long, val label: String)

data class ContextUiState(
  val threads: List<ContextThread> = emptyList(),
  val selectedId: String? = null,
  val isWorking: Boolean = false,
  val message: String = "No network permission. Your context stays in this app on this phone.",
  val queryResult: ContextQueryResult? = null,
  val capabilities: DeviceCapabilities,
  val undo: UndoableDeletion? = null,
)

class ContextViewModel(application: Application) : AndroidViewModel(application) {
  private val repository = ContextRepository(application)
  private val capabilityDetector = DeviceCapabilityDetector(application)
  private val initialCapabilities = capabilityDetector.detect()
  private val capture = OnDeviceCapture(application, initialCapabilities.capturePolicy)
  private val voice = OnDeviceVoiceCapture(application)
  private val _state = MutableStateFlow(ContextUiState(capabilities = initialCapabilities))
  val state: StateFlow<ContextUiState> = _state.asStateFlow()
  private var pendingRestore: ContextThread? = null

  init {
    viewModelScope.launch {
      repository.load()
      repository.threads.collectLatest { threads ->
        _state.value = _state.value.copy(
          threads = threads,
          selectedId = _state.value.selectedId ?: threads.firstOrNull()?.id,
          isWorking = false,
        )
      }
    }
  }

  fun refreshCapabilities() {
    _state.value = _state.value.copy(capabilities = capabilityDetector.detect())
  }

  fun report(message: String) {
    _state.value = _state.value.copy(isWorking = false, message = message)
  }

  fun onMicrophonePermissionDenied() {
    refreshCapabilities()
    failed("Microphone permission was not granted. Voice stays disabled; typed notes and questions remain available.")
  }

  fun select(id: String) = viewModelScope.launch {
    repository.activate(id)
    _state.value = _state.value.copy(selectedId = id)
  }

  fun forget(id: String) = viewModelScope.launch {
    val removed = _state.value.threads.firstOrNull { it.id == id }
    repository.forget(id)
    pendingRestore = removed
    _state.value = _state.value.copy(
      message = "Deleted \"${removed?.label ?: "context"}\". You can undo this.",
      undo = removed?.let { UndoableDeletion(System.currentTimeMillis(), it.label) },
    )
  }

  fun undoForget() = viewModelScope.launch {
    val thread = pendingRestore ?: return@launch
    repository.restore(thread)
    pendingRestore = null
    _state.value = _state.value.copy(undo = null, selectedId = thread.id, message = "Restored \"${thread.label}\".")
  }

  fun clearUndoNotice() {
    pendingRestore = null
    _state.value = _state.value.copy(undo = null)
  }

  fun seedDemo() = viewModelScope.launch {
    working("Creating local sample contexts…")
    repository.seedLocalDemo()
  }

  fun captureNote(value: String) = ingest(value, EvidenceSource.NOTE)
  fun captureSharedText(value: String) = ingest(value, EvidenceSource.SHARE_TEXT)

  fun captureVoice() {
    refreshCapabilities()
    val speech = _state.value.capabilities.offlineSpeech
    if (speech.state != CapabilityState.READY) {
      failed(speech.detail)
      return
    }
    working("Listening with this phone's on-device recognizer…")
    voice.start(
      onResult = { transcript -> ingest(transcript, EvidenceSource.VOICE) },
      onFailure = ::failed,
    )
  }

  fun queryByVoice() {
    refreshCapabilities()
    val speech = _state.value.capabilities.offlineSpeech
    if (speech.state != CapabilityState.READY) {
      failed(speech.detail)
      return
    }
    working("Listening for an offline context question…")
    voice.start(onResult = ::queryContext, onFailure = ::failed)
  }

  fun queryContext(query: String) {
    val result = repository.queryLocal(query)
    _state.value = _state.value.copy(
      isWorking = false,
      queryResult = result,
      selectedId = result.matchedThreadId ?: _state.value.selectedId,
      message = "Answered locally from your saved context graph. No network request was made.",
    )
  }

  fun captureBitmap(bitmap: Bitmap) = viewModelScope.launch {
    runCatching {
      working("Reading image locally with ${_state.value.capabilities.capturePolicy.ocrScript.displayName} OCR…")
      capture.extractFromBitmap(bitmap)
    }
      .onSuccess { handleCaptureResult(it, EvidenceSource.CAMERA_OCR) }
      .onFailure { failed("Local image reading failed: ${it.message ?: "unknown error"}") }
  }

  fun captureDocument(uri: Uri) = viewModelScope.launch {
    runCatching {
      working("Reading document locally with a memory-aware limit…")
      capture.extractFromUri(uri)
    }
      .onSuccess { handleCaptureResult(it, EvidenceSource.DOCUMENT) }
      .onFailure { failed("Local document reading failed: ${it.message ?: "unknown error"}") }
  }

  private fun handleCaptureResult(result: CaptureResult, source: EvidenceSource) {
    when (result) {
      is CaptureResult.Success -> ingest(result.text, source, result.notice)
      is CaptureResult.Empty -> failed(result.message)
      is CaptureResult.Unsupported -> failed(result.message)
    }
  }

  private fun ingest(value: String, source: EvidenceSource, notice: String? = null) = viewModelScope.launch {
    if (value.isBlank()) {
      failed("Nothing was captured. ContextOS did not store an empty record.")
      return@launch
    }
    runCatching {
      working("Updating your local context graph…")
      repository.ingest(value, source)
    }
      .onSuccess {
        val saved = "Saved as user-initiated ${source.name.lowercase().replace('_', ' ')} evidence."
        _state.value = _state.value.copy(isWorking = false, message = listOfNotNull(saved, notice).joinToString(" "))
      }
      .onFailure { failed("Context update failed: ${it.message ?: "unknown error"}") }
  }

  private fun working(message: String) {
    _state.value = _state.value.copy(isWorking = true, message = message)
  }

  private fun failed(message: String) {
    _state.value = _state.value.copy(isWorking = false, message = message)
  }

  override fun onCleared() {
    voice.close()
    capture.close()
    super.onCleared()
  }
}
