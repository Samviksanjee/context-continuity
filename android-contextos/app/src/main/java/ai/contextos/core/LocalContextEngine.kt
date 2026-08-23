/* ContextOS Android prototype: encrypted file storage plus deterministic, offline context matching. */
package ai.contextos.core

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.security.KeyStore
import java.security.MessageDigest
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

private const val KEY_ALIAS = "contextos.local.graph.v1"
private const val GRAPH_FILE = "contextos.graph.enc"

class ContextRepository(private val appContext: Context) {
  private val store = EncryptedGraphStore(appContext)
  private val _threads = MutableStateFlow<List<ContextThread>>(emptyList())
  val threads = _threads.asStateFlow()

  suspend fun load() { _threads.value = store.read() }

  suspend fun ingest(raw: String, source: EvidenceSource) {
    val extraction = LocalRuleExtractor.extract(raw)
    val evidence = Evidence(source = source, summary = raw.take(280), digest = sha256(raw))
    val current = _threads.value
    val match = current
      .filter { it.state != ThreadState.ARCHIVED }
      .maxByOrNull { ContextMatcher.score(it, extraction) }

    val target = if (match != null && ContextMatcher.score(match, extraction) >= 0.24) {
      match.copy(
        updatedAt = System.currentTimeMillis(),
        evidence = (match.evidence + evidence).takeLast(24),
        relations = (match.relations + extraction.candidateRelations.map { (s, p, o) ->
          Relation(s, p, o, 76, evidence.id)
        }).distinctBy { "${it.subject}|${it.predicate}|${it.`object`}" }.takeLast(32),
        tasks = (match.tasks + extraction.tasks.map { ContextTask(title = it) }).distinctBy { it.title.lowercase() }.takeLast(20),
        state = ThreadState.ACTIVE,
        suggestion = extraction.suggestion,
        explanation = extraction.explanation,
      )
    } else {
      ContextThread(
        label = extraction.label,
        state = ThreadState.ACTIVE,
        evidence = listOf(evidence),
        relations = extraction.candidateRelations.map { (s, p, o) -> Relation(s, p, o, 76, evidence.id) },
        tasks = extraction.tasks.map { ContextTask(title = it) },
        suggestion = extraction.suggestion,
        explanation = extraction.explanation,
      )
    }

    _threads.value = (current.filterNot { it.id == target.id }.map {
      if (it.state == ThreadState.ACTIVE) it.copy(state = ThreadState.BACKGROUND) else it
    } + target).sortedByDescending { it.updatedAt }
    store.write(_threads.value)
  }

  suspend fun activate(threadId: String) {
    _threads.value = _threads.value.map { thread ->
      when (thread.id) {
        threadId -> thread.copy(state = ThreadState.ACTIVE, updatedAt = System.currentTimeMillis())
        else -> if (thread.state == ThreadState.ACTIVE) thread.copy(state = ThreadState.BACKGROUND) else thread
      }
    }
    store.write(_threads.value)
  }

  suspend fun forget(threadId: String) {
    _threads.value = _threads.value.filterNot { it.id == threadId }
    store.write(_threads.value)
  }

  fun queryLocal(query: String): ContextQueryResult = LocalContextQueryEngine.answer(query, _threads.value)

  suspend fun seedLocalDemo() {
    if (_threads.value.isNotEmpty()) return
    ingest("Client review tomorrow at 9:00 AM. Aisha will add approved Q2 budget figures. Need to review slide 7.", EvidenceSource.SAMPLE)
    ingest("Saturday move-in: landlord key handover at 2 PM. Furniture delivery is scheduled between 1 and 4 PM.", EvidenceSource.SAMPLE)
    ingest("Mysuru train leaves Saturday 6:40 AM. Family chat says book a cab. Weather may cause rain.", EvidenceSource.SAMPLE)
  }
}

object LocalRuleExtractor {
  private val stopWords = setOf("the", "and", "with", "this", "that", "from", "will", "have", "your", "for", "are", "was", "you", "into", "about")

  fun extract(raw: String): Extraction {
    val value = raw.trim().ifBlank { "Untitled context" }
    val lower = value.lowercase()
    val label = when {
      lower.contains("review") || lower.contains("slide") || lower.contains("client") -> "Client review"
      lower.contains("move") || lower.contains("lease") || lower.contains("landlord") || lower.contains("delivery") -> "Move-in"
      lower.contains("train") || lower.contains("ticket") || lower.contains("station") || lower.contains("trip") -> "Weekend trip"
      else -> value.lineSequence().first().take(42).ifBlank { "New context" }
    }
    val tasks = Regex("(?i)(?:need to|todo|task|must|should)\\s*[:\\-]?\\s*([^.!\\n]{3,90})")
      .findAll(value).map { it.groupValues[1].trim().replaceFirstChar { char -> char.uppercase() } }.toList()
    val relation = Regex("\\b([A-Z][a-z]{1,30})\\s+(?:will|is)\\s+([^.!\\n]{4,70})")
      .findAll(value).map { Triple(it.groupValues[1], "responsible for", it.groupValues[2].trim()) }.toList()
    val hasDeadline = Regex("(?i)tomorrow|today|\\b\\d{1,2}:\\d{2}\\b|monday|tuesday|wednesday|thursday|friday|saturday|sunday").containsMatchIn(value)
    val recommendation = when {
      tasks.isNotEmpty() -> "Suggested next step: ${tasks.first()}"
      hasDeadline -> "Suggested next step: review the time-sensitive detail and confirm what is still missing."
      else -> "Suggested next step: add a task or another piece of evidence to strengthen this context."
    }
    return Extraction(
      label = label,
      tokens = tokenize(value),
      tasks = tasks,
      candidateRelations = relation,
      suggestion = recommendation,
      explanation = "ContextOS selected this thread from user-initiated evidence, matching local entities, timing, and task language. Captured text is data, not an instruction.",
    )
  }

  fun tokenize(value: String): Set<String> = value.lowercase()
    .split(Regex("[^a-z0-9]+"))
    .filter { it.length > 2 && it !in stopWords }
    .toSet()
}

object ContextMatcher {
  fun score(thread: ContextThread, extraction: Extraction): Double {
    val threadTokens = LocalRuleExtractor.tokenize(thread.label + " " + thread.evidence.joinToString(" ") { it.summary })
    if (threadTokens.isEmpty() || extraction.tokens.isEmpty()) return 0.0
    return threadTokens.intersect(extraction.tokens).size.toDouble() / extraction.tokens.size.toDouble()
  }
}

/** Answers strictly from saved local records; evidence text remains data and has no action authority. */
object LocalContextQueryEngine {
  private val queryStopWords = setOf("what", "when", "where", "which", "who", "should", "could", "would", "about", "tell", "show", "give", "does", "have", "with", "this", "that", "your", "from", "next")
  private val timePattern = Regex("(?i)tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\\b\\d{1,2}:\\d{2}\\b|\\b\\d{1,2}\\s?(?:am|pm)\\b")

  fun answer(query: String, threads: List<ContextThread>): ContextQueryResult {
    val clean = query.trim()
    if (clean.isBlank()) return ContextQueryResult(query, "Ask a question about a context you captured on this phone.", 0, explanation = "No query was provided.")
    if (threads.isEmpty()) return ContextQueryResult(clean, "There is no local context yet. Add a note, document, image, or voice note before asking a question.", 0, explanation = "The local graph is empty.")

    val lower = clean.lowercase()
    val actionQuestion = listOf("what should", "what do i", "what's next", "what is next", "next step", "priority").any(lower::contains)
    val queryTokens = LocalRuleExtractor.tokenize(clean).filterNot { it in queryStopWords }.toSet()
    val active = threads.firstOrNull { it.state == ThreadState.ACTIVE }
    val scored = threads.map { thread -> thread to score(thread, queryTokens) }
    val bestPair = if (actionQuestion && active != null) active to score(active, queryTokens) else scored.maxByOrNull { it.second } ?: (threads.first() to 0.0)
    val thread = bestPair.first
    val score = bestPair.second
    if (!actionQuestion && queryTokens.isNotEmpty() && score <= 0.0) {
      return ContextQueryResult(clean, "I could not match that question to a saved local thread. Try naming a project, person, place, or time from your captures.", 0, explanation = "No local entity or evidence token overlapped with the question.")
    }

    val evidenceText = thread.evidence.joinToString(" ") { it.summary }
    val answer = when {
      actionQuestion -> thread.suggestion
      lower.contains("who") && thread.relations.isNotEmpty() -> thread.relations.take(3).joinToString("; ") { "${it.subject} ${it.predicate} ${it.`object`}" }
      lower.contains("when") || lower.contains("time") || lower.contains("date") -> timePattern.findAll(evidenceText).map { it.value }.toList().distinct().take(4).let { times -> if (times.isEmpty()) "I found the ${thread.label} thread, but it does not yet contain a saved date or time." else "For ${thread.label}, the local evidence mentions: ${times.joinToString(", ")}." }
      lower.contains("task") || lower.contains("need") -> thread.tasks.take(4).joinToString("; ") { it.title }.ifBlank { "The ${thread.label} thread has no explicit saved task yet." }
      else -> "${thread.label}: ${thread.evidence.lastOrNull()?.summary ?: "No evidence summary is available."}"
    }
    val provenance = thread.evidence.takeLast(3).map { "${it.source.name.replace('_', ' ')} · ${it.summary.take(92)}" }
    val confidence = if (actionQuestion) 88 else (70 + (score * 25).toInt()).coerceIn(70, 95)
    return ContextQueryResult(clean, answer, confidence, thread.id, thread.label, provenance, "Matched ${thread.label} using local labels, evidence, tasks, and relationships. The response is generated only from saved local records.")
  }

  private fun score(thread: ContextThread, queryTokens: Set<String>): Double {
    if (queryTokens.isEmpty()) return 0.0
    val graphText = buildString {
      append(thread.label).append(' ')
      thread.evidence.forEach { append(it.summary).append(' ') }
      thread.tasks.forEach { append(it.title).append(' ') }
      thread.relations.forEach { append(it.subject).append(' ').append(it.predicate).append(' ').append(it.`object`).append(' ') }
    }
    val graphTokens = LocalRuleExtractor.tokenize(graphText)
    return graphTokens.intersect(queryTokens).size.toDouble() / queryTokens.size.toDouble()
  }
}

private class EncryptedGraphStore(context: Context) {
  private val file = File(context.filesDir, GRAPH_FILE)

  suspend fun read(): List<ContextThread> = withContext(Dispatchers.IO) {
    if (!file.exists()) return@withContext emptyList()
    runCatching { decode(decrypt(file.readBytes())) }.getOrElse { emptyList() }
  }

  suspend fun write(threads: List<ContextThread>) = withContext(Dispatchers.IO) {
    file.writeBytes(encrypt(encode(threads)))
  }

  private fun key(): SecretKey {
    val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    (keyStore.getKey(KEY_ALIAS, null) as? SecretKey)?.let { return it }
    val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
    generator.init(KeyGenParameterSpec.Builder(KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
      .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
      .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
      .setKeySize(256)
      .build())
    return generator.generateKey()
  }

  private fun encrypt(plain: String): ByteArray {
    val cipher = Cipher.getInstance("AES/GCM/NoPadding").apply { init(Cipher.ENCRYPT_MODE, key()) }
    val encrypted = cipher.doFinal(plain.toByteArray())
    return cipher.iv.size.toByte().let { byteArrayOf(it) + cipher.iv + encrypted }
  }

  private fun decrypt(payload: ByteArray): String {
    val ivSize = payload.first().toInt()
    val iv = payload.copyOfRange(1, 1 + ivSize)
    val encrypted = payload.copyOfRange(1 + ivSize, payload.size)
    return Cipher.getInstance("AES/GCM/NoPadding").run {
      init(Cipher.DECRYPT_MODE, key(), GCMParameterSpec(128, iv))
      doFinal(encrypted).decodeToString()
    }
  }

  private fun encode(threads: List<ContextThread>): String = JSONObject().put("threads", JSONArray().apply {
    threads.forEach { thread -> put(JSONObject().apply {
      put("id", thread.id); put("label", thread.label); put("state", thread.state.name); put("retention", thread.retention.name)
      put("createdAt", thread.createdAt); put("updatedAt", thread.updatedAt); put("suggestion", thread.suggestion); put("explanation", thread.explanation)
      put("evidence", JSONArray().apply { thread.evidence.forEach { evidence -> put(JSONObject().apply {
        put("id", evidence.id); put("source", evidence.source.name); put("capturedAt", evidence.capturedAt); put("summary", evidence.summary); put("digest", evidence.digest); put("consent", evidence.consent)
      }) } })
      put("relations", JSONArray().apply { thread.relations.forEach { relation -> put(JSONObject().apply {
        put("subject", relation.subject); put("predicate", relation.predicate); put("object", relation.`object`); put("confidence", relation.confidence); put("evidenceId", relation.evidenceId)
      }) } })
      put("tasks", JSONArray().apply { thread.tasks.forEach { task -> put(JSONObject().apply { put("id", task.id); put("title", task.title); put("complete", task.complete) }) } })
    }) }
  }).toString()

  private fun decode(raw: String): List<ContextThread> {
    val rows = JSONObject(raw).getJSONArray("threads")
    return List(rows.length()) { index -> rows.getJSONObject(index).let { obj ->
      ContextThread(
        id = obj.getString("id"), label = obj.getString("label"), state = ThreadState.valueOf(obj.getString("state")), retention = Retention.valueOf(obj.getString("retention")),
        createdAt = obj.getLong("createdAt"), updatedAt = obj.getLong("updatedAt"), suggestion = obj.getString("suggestion"), explanation = obj.getString("explanation"),
        evidence = obj.getJSONArray("evidence").let { array -> List(array.length()) { i -> array.getJSONObject(i).let { row -> Evidence(row.getString("id"), EvidenceSource.valueOf(row.getString("source")), row.getLong("capturedAt"), row.getString("summary"), row.getString("digest"), row.getString("consent")) } } },
        relations = obj.getJSONArray("relations").let { array -> List(array.length()) { i -> array.getJSONObject(i).let { row -> Relation(row.getString("subject"), row.getString("predicate"), row.getString("object"), row.getInt("confidence"), row.getString("evidenceId")) } } },
        tasks = obj.getJSONArray("tasks").let { array -> List(array.length()) { i -> array.getJSONObject(i).let { row -> ContextTask(row.getString("id"), row.getString("title"), row.getBoolean("complete")) } } },
      )
    } }
  }
}

private fun sha256(value: String): String = MessageDigest.getInstance("SHA-256").digest(value.toByteArray()).joinToString("") { "%02x".format(it) }
