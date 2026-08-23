/* ContextOS Android prototype: view state is local, source-scoped, and has explicit delete controls. */
package ai.contextos

import android.app.Application
import android.graphics.Bitmap
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import ai.contextos.core.ContextRepository
import ai.contextos.core.ContextQueryResult
import ai.contextos.core.ContextThread
import ai.contextos.core.EvidenceSource
import ai.contextos.core.OnDeviceCapture
import ai.contextos.core.OnDeviceVoiceCapture
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

data class ContextUiState(
  val threads: List<ContextThread> = emptyList(),
  val selectedId: String? = null,
  val isWorking: Boolean = false,
  val message: String = "No network permission. Your context stays in this app on this phone.",
  val queryResult: ContextQueryResult? = null,
)

class ContextViewModel(application: Application) : AndroidViewModel(application) {
  private val repository = ContextRepository(application)
  private val capture = OnDeviceCapture(application)
  private val voice = OnDeviceVoiceCapture(application)
  private val _state = MutableStateFlow(ContextUiState())
  val state: StateFlow<ContextUiState> = _state.asStateFlow()

  init {
    viewModelScope.launch {
      repository.load()
      repository.threads.collectLatest { threads ->
        _state.value = _state.value.copy(threads = threads, selectedId = _state.value.selectedId ?: threads.firstOrNull()?.id, isWorking = false)
      }
    }
  }

  fun select(id: String) = viewModelScope.launch { repository.activate(id); _state.value = _state.value.copy(selectedId = id) }
  fun forget(id: String) = viewModelScope.launch { repository.forget(id); _state.value = _state.value.copy(message = "The selected local context and its evidence were deleted.") }
  fun seedDemo() = viewModelScope.launch { working("Creating local sample contexts…"); repository.seedLocalDemo() }
  fun captureNote(value: String) = ingest(value, EvidenceSource.NOTE)
  fun captureSharedText(value: String) = ingest(value, EvidenceSource.SHARE_TEXT)
  fun captureVoice() {
    working("Listening with this phone’s on-device recognizer…")
    voice.start(
      onResult = { transcript -> ingest(transcript, EvidenceSource.VOICE) },
      onFailure = ::failed,
    )
  }

  fun queryByVoice() {
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
    runCatching { working("Reading image locally…"); capture.extractFromBitmap(bitmap) }
      .onSuccess { ingest(it, EvidenceSource.CAMERA_OCR) }
      .onFailure { failed("Local image reading failed: ${it.message ?: "unknown error"}") }
  }

  fun captureDocument(uri: Uri) = viewModelScope.launch {
    runCatching { working("Reading document locally…"); capture.extractFromUri(uri) }
      .onSuccess { ingest(it, EvidenceSource.DOCUMENT) }
      .onFailure { failed("Local document reading failed: ${it.message ?: "unknown error"}") }
  }

  private fun ingest(value: String, source: EvidenceSource) = viewModelScope.launch {
    if (value.isBlank()) { failed("Nothing was captured. ContextOS did not store an empty record."); return@launch }
    runCatching { working("Updating your local context graph…"); repository.ingest(value, source) }
      .onSuccess { _state.value = _state.value.copy(message = "Saved as user-initiated ${source.name.lowercase().replace('_', ' ')} evidence.") }
      .onFailure { failed("Context update failed: ${it.message ?: "unknown error"}") }
  }

  private fun working(message: String) { _state.value = _state.value.copy(isWorking = true, message = message) }
  private fun failed(message: String) { _state.value = _state.value.copy(isWorking = false, message = message) }
}
