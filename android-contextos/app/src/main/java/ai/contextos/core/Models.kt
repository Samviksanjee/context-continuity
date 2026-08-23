/* ContextOS Android prototype: local graph records keep provenance and never grant ambient action authority. */
package ai.contextos.core

import java.time.Instant
import java.util.UUID

enum class EvidenceSource { NOTE, SHARE_TEXT, DOCUMENT, CAMERA_OCR, VOICE, SAMPLE }
enum class ThreadState { ACTIVE, BACKGROUND, ARCHIVED }
enum class Retention { UNTIL_FORGOTTEN, THIRTY_DAYS, PROJECT_END }

data class Evidence(
  val id: String = UUID.randomUUID().toString(),
  val source: EvidenceSource,
  val capturedAt: Long = Instant.now().toEpochMilli(),
  val summary: String,
  val digest: String,
  val consent: String = "user-initiated",
)

data class Relation(
  val subject: String,
  val predicate: String,
  val `object`: String,
  val confidence: Int,
  val evidenceId: String,
)

data class ContextTask(
  val id: String = UUID.randomUUID().toString(),
  val title: String,
  val complete: Boolean = false,
)

data class ContextThread(
  val id: String = UUID.randomUUID().toString(),
  val label: String,
  val state: ThreadState = ThreadState.BACKGROUND,
  val retention: Retention = Retention.UNTIL_FORGOTTEN,
  val createdAt: Long = Instant.now().toEpochMilli(),
  val updatedAt: Long = Instant.now().toEpochMilli(),
  val evidence: List<Evidence> = emptyList(),
  val relations: List<Relation> = emptyList(),
  val tasks: List<ContextTask> = emptyList(),
  val suggestion: String = "Capture a note, document, or image to begin a context.",
  val explanation: String = "No external text can execute an action. ContextOS treats all captures as evidence only.",
)

data class Extraction(
  val label: String,
  val tokens: Set<String>,
  val tasks: List<String>,
  val candidateRelations: List<Triple<String, String, String>>,
  val suggestion: String,
  val explanation: String,
)

data class ContextQueryResult(
  val query: String,
  val answer: String,
  val confidence: Int,
  val matchedThreadId: String? = null,
  val matchedThreadLabel: String? = null,
  val provenance: List<String> = emptyList(),
  val explanation: String,
)
