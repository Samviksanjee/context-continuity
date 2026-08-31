/* Compose UI makes local evidence, device adaptation, reasoning, and deletion visible. */
package ai.contextos

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.SnackbarResult
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ai.contextos.core.CapabilityState
import ai.contextos.core.ContextQueryResult
import ai.contextos.core.ContextThread
import ai.contextos.core.DeviceAiFeature
import ai.contextos.core.DeviceCapability
import ai.contextos.core.DeviceCapabilities
import ai.contextos.core.ThreadState

class MainActivity : ComponentActivity() {
  private val viewModel: ContextViewModel by viewModels()

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    handleShareIntent(intent)
    setContent { MaterialTheme { ContextOsScreen(viewModel) } }
  }

  override fun onResume() {
    super.onResume()
    viewModel.refreshCapabilities()
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    handleShareIntent(intent)
  }

  private fun handleShareIntent(intent: Intent?) {
    if (intent?.action != Intent.ACTION_SEND) return
    when {
      intent.type?.startsWith("text/") == true -> intent.getCharSequenceExtra(Intent.EXTRA_TEXT)
        ?.toString()
        ?.let(viewModel::captureSharedText)
      intent.type?.startsWith("image/") == true || intent.type == "application/pdf" -> sharedStream(intent)
        ?.let(viewModel::captureDocument)
    }
  }

  @Suppress("DEPRECATION")
  private fun sharedStream(intent: Intent): Uri? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java)
  } else {
    intent.getParcelableExtra(Intent.EXTRA_STREAM)
  }
}

private enum class VoiceAction { NOTE, QUERY }

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
private fun ContextOsScreen(viewModel: ContextViewModel) {
  val state by viewModel.state.collectAsStateWithLifecycle()
  val context = LocalContext.current
  val photoCapture = rememberLauncherForActivityResult(ActivityResultContracts.TakePicturePreview()) { bitmap: Bitmap? ->
    bitmap?.let(viewModel::captureBitmap)
  }
  val documentPicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri: Uri? ->
    uri?.let(viewModel::captureDocument)
  }
  var pendingVoiceAction by rememberSaveable { mutableStateOf<String?>(null) }
  val microphonePermission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
    val action = pendingVoiceAction?.let { runCatching { VoiceAction.valueOf(it) }.getOrNull() }
    pendingVoiceAction = null
    viewModel.refreshCapabilities()
    if (granted) {
      when (action) {
        VoiceAction.NOTE -> viewModel.captureVoice()
        VoiceAction.QUERY -> viewModel.queryByVoice()
        null -> Unit
      }
    } else {
      viewModel.onMicrophonePermissionDenied()
    }
  }
  var note by rememberSaveable { mutableStateOf("") }
  var question by rememberSaveable { mutableStateOf("") }
  val selected = state.threads.firstOrNull { it.id == state.selectedId } ?: state.threads.firstOrNull()

  fun requestVoice(action: VoiceAction) {
    val capability = state.capabilities.offlineSpeech
    if (!capability.canAttempt) {
      viewModel.report(capability.detail)
      return
    }
    pendingVoiceAction = action.name
    if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
      viewModel.refreshCapabilities()
      if (action == VoiceAction.QUERY) viewModel.queryByVoice() else viewModel.captureVoice()
      pendingVoiceAction = null
    } else {
      microphonePermission.launch(Manifest.permission.RECORD_AUDIO)
    }
  }

  val snackbarHostState = remember { SnackbarHostState() }
  LaunchedEffect(state.undo?.token) {
    val undo = state.undo ?: return@LaunchedEffect
    val result = snackbarHostState.showSnackbar(
      message = "Deleted \"${undo.label}\".",
      actionLabel = "Undo",
      withDismissAction = true,
      duration = SnackbarDuration.Long,
    )
    if (result == SnackbarResult.ActionPerformed) viewModel.undoForget() else viewModel.clearUndoNotice()
  }

  Scaffold(
    topBar = { TopAppBar(title = { Text("CONTEXT / OS", fontWeight = FontWeight.Bold, letterSpacing = 2.sp) }) },
    snackbarHost = { SnackbarHost(snackbarHostState) },
  ) { padding ->
    LazyColumn(
      modifier = Modifier.fillMaxSize().padding(padding),
      contentPadding = PaddingValues(18.dp),
      verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
      item { PrivacyBanner(state.message) }
      item { DeviceAdaptationCard(state.capabilities) }
      item {
        Text("Capture deliberately", fontSize = 26.sp, fontWeight = FontWeight.Bold, modifier = Modifier.semantics { heading() })
        Text(
          "Only user-initiated notes, shares, documents, and images enter this local graph. No cloud. No background screen reading.",
          style = MaterialTheme.typography.bodyMedium,
        )
      }
      item {
        FlowRow(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.spacedBy(8.dp),
          verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
          Button(
            onClick = {
              runCatching { photoCapture.launch(null) }
                .onFailure { viewModel.report("A camera app could not be opened. Choose an existing image instead.") }
            },
            enabled = !state.isWorking && state.capabilities.cameraCapture.isReady,
          ) { Text(stringResource(R.string.capture_image)) }
          OutlinedButton(
            onClick = {
              runCatching {
                documentPicker.launch(arrayOf("application/pdf", "image/*", "text/*", "application/json"))
              }.onFailure { viewModel.report("The document picker could not be opened. Use a note or share sheet instead.") }
            },
            enabled = !state.isWorking && state.capabilities.documentPicker.isReady,
          ) { Text(stringResource(R.string.add_document)) }
          OutlinedButton(
            onClick = { requestVoice(VoiceAction.NOTE) },
            enabled = !state.isWorking && state.capabilities.offlineSpeech.canAttempt,
          ) { Text(stringResource(R.string.voice_note)) }
        }
      }
      item {
        OutlinedTextField(
          value = note,
          onValueChange = { note = it },
          modifier = Modifier.fillMaxWidth(),
          label = { Text("Private note") },
          placeholder = { Text("e.g., Aisha will update the budget slide before tomorrow's review") },
        )
        Spacer(Modifier.height(8.dp))
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
          Button(
            onClick = { viewModel.captureNote(note); note = "" },
            enabled = note.isNotBlank() && !state.isWorking,
          ) { Text(stringResource(R.string.remember_locally)) }
          OutlinedButton(
            onClick = viewModel::seedDemo,
            enabled = state.threads.isEmpty() && !state.isWorking,
          ) { Text(stringResource(R.string.try_local_demo)) }
        }
      }
      item {
        Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFF1EEE5)), shape = RoundedCornerShape(8.dp)) {
          Column(Modifier.padding(14.dp)) {
            Text("ASK YOUR LOCAL CONTEXT", fontSize = 11.sp, color = Color(0xFFD95528), fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
            Spacer(Modifier.height(5.dp))
            Text("Ask about people, timing, tasks, or the next step. Answers come only from evidence already saved on this phone.", style = MaterialTheme.typography.bodySmall)
            Spacer(Modifier.height(9.dp))
            OutlinedTextField(
              value = question,
              onValueChange = { question = it },
              modifier = Modifier.fillMaxWidth(),
              label = { Text("Context question") },
              placeholder = { Text("What should I do next for the client review?") },
            )
            Spacer(Modifier.height(8.dp))
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
              Button(
                onClick = { viewModel.queryContext(question); question = "" },
                enabled = question.isNotBlank() && !state.isWorking,
              ) { Text(stringResource(R.string.ask_locally)) }
              OutlinedButton(
                onClick = { requestVoice(VoiceAction.QUERY) },
                enabled = !state.isWorking && state.capabilities.offlineSpeech.canAttempt,
              ) { Text(stringResource(R.string.ask_by_voice)) }
            }
          }
        }
      }
      state.queryResult?.let { result -> item { QueryAnswer(result) } }
      if (state.threads.isNotEmpty()) {
        item { Text("Your context threads", fontSize = 19.sp, fontWeight = FontWeight.Bold, modifier = Modifier.semantics { heading() }) }
        items(state.threads, key = { it.id }) { thread ->
          ThreadRow(thread, selected?.id == thread.id, onClick = { viewModel.select(thread.id) })
        }
      }
      selected?.let { thread -> item { ThreadDetail(thread, onForget = { viewModel.forget(thread.id) }) } }
    }
  }
}

@Composable
private fun DeviceAdaptationCard(capabilities: DeviceCapabilities) {
  val context = LocalContext.current
  Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFF1EEE5)), shape = RoundedCornerShape(8.dp)) {
    Column(Modifier.fillMaxWidth().padding(14.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
      Text("ADAPTED TO THIS DEVICE", fontSize = 11.sp, color = Color(0xFFD95528), fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
      Text("${capabilities.deviceLabel} · Android ${capabilities.androidRelease}", fontWeight = FontWeight.SemiBold)
      Text(
        if (capabilities.isLowMemory) {
          "Low-memory profile: smaller images and the first PDF page are processed."
        } else {
          "Standard profile: images up to ${capabilities.capturePolicy.maxImageDimension}px and up to ${capabilities.capturePolicy.maxPdfPages} PDF pages."
        },
        style = MaterialTheme.typography.bodySmall,
      )
      capabilities.aiFeatures.forEach { FeatureRow(it) }
      CapabilityRow("Camera capture", capabilities.cameraCapture)
      CapabilityRow("Document picker", capabilities.documentPicker)
      if (capabilities.offlineSpeech.state == CapabilityState.NEEDS_PERMISSION) {
        TextButton(onClick = { openAppSettings(context) }, contentPadding = PaddingValues(0.dp)) {
          Text("Open app settings to allow the microphone")
        }
      }
    }
  }
}

private fun openAppSettings(context: android.content.Context) {
  val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", context.packageName, null))
    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
  runCatching { context.startActivity(intent) }
}

@Composable
private fun FeatureRow(feature: DeviceAiFeature) {
  CapabilityRow(feature.name, DeviceCapability(feature.state, feature.detail))
}

@Composable
private fun CapabilityRow(label: String, capability: DeviceCapability) {
  val statusColor = when (capability.state) {
    CapabilityState.READY -> Color(0xFF28715B)
    CapabilityState.NEEDS_PERMISSION -> Color(0xFF9A6500)
    CapabilityState.UNAVAILABLE -> Color(0xFF755E57)
  }
  Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
    Text(label, modifier = Modifier.weight(0.34f), style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold)
    Column(modifier = Modifier.weight(0.66f)) {
      Text(capability.state.name.replace('_', ' '), color = statusColor, fontSize = 10.sp, fontWeight = FontWeight.Bold)
      Text(capability.detail, style = MaterialTheme.typography.bodySmall)
    }
  }
}

@Composable
private fun PrivacyBanner(message: String) {
  Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFE9F0EC)), shape = RoundedCornerShape(8.dp)) {
    Column(Modifier.padding(14.dp)) {
      Text("ON THIS PHONE", fontSize = 11.sp, color = Color(0xFF28715B), fontWeight = FontWeight.Bold, letterSpacing = 1.sp, modifier = Modifier.semantics { heading() })
      Spacer(Modifier.height(4.dp))
      Text(message, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
    }
  }
}

@Composable
private fun ThreadRow(thread: ContextThread, selected: Boolean, onClick: () -> Unit) {
  Card(
    modifier = Modifier
      .fillMaxWidth()
      .clickable(onClick = onClick, onClickLabel = "View this context", role = Role.Button)
      .semantics(mergeDescendants = true) {
        this.selected = selected
        stateDescription = if (selected) "Active context" else "Background context"
      },
    colors = CardDefaults.cardColors(containerColor = if (selected) Color(0xFFFFE7DD) else Color(0xFFF8F7F3)),
  ) {
    Row(Modifier.padding(14.dp), horizontalArrangement = Arrangement.SpaceBetween) {
      Column(Modifier.weight(1f)) {
        Text(thread.label, fontWeight = FontWeight.Bold)
        Text("${thread.evidence.size} evidence items · ${thread.tasks.size} tasks", style = MaterialTheme.typography.bodySmall)
      }
      Text(thread.state.name, fontSize = 10.sp, color = if (thread.state == ThreadState.ACTIVE) Color(0xFFD95528) else Color.Gray)
    }
  }
}

@Composable
private fun ThreadDetail(thread: ContextThread, onForget: () -> Unit) {
  var confirmForget by rememberSaveable(thread.id) { mutableStateOf(false) }
  Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF1D2724)), shape = RoundedCornerShape(8.dp)) {
    Column(Modifier.padding(16.dp)) {
      Text("CONTEXTOS SAYS", color = Color(0xFFFFA178), fontSize = 11.sp, letterSpacing = 1.sp, modifier = Modifier.semantics { heading() })
      Spacer(Modifier.height(7.dp))
      Text(thread.suggestion, color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.SemiBold)
      Spacer(Modifier.height(6.dp))
      Text("Advisory · you decide. No action is taken automatically.", color = Color(0xFFBAC5BF), style = MaterialTheme.typography.bodySmall)
      Spacer(Modifier.height(14.dp))
      HorizontalDivider(color = Color(0xFF65706B))
      Spacer(Modifier.height(12.dp))
      Text("WHY THIS THREAD", color = Color(0xFFBAC5BF), fontSize = 11.sp)
      Text(thread.explanation, color = Color.White)
      Spacer(Modifier.height(12.dp))
      Text("PROVENANCE", color = Color(0xFFFFA178), fontSize = 11.sp)
      thread.evidence.takeLast(4).forEach { evidence ->
        Text(
          "${evidence.source.name.replace('_', ' ')} · ${evidence.summary.take(110)}",
          color = Color(0xFFE2E8E4),
          style = MaterialTheme.typography.bodySmall,
          modifier = Modifier.padding(top = 5.dp),
        )
      }
      if (thread.relations.isNotEmpty()) {
        Spacer(Modifier.height(12.dp))
        Text("RELATIONSHIPS", color = Color(0xFFFFA178), fontSize = 11.sp)
        thread.relations.take(6).forEach { relation ->
          Text("${relation.subject} → ${relation.predicate} → ${relation.`object`}", color = Color(0xFFE2E8E4), style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 4.dp))
        }
      }
      if (thread.tasks.isNotEmpty()) {
        Spacer(Modifier.height(12.dp))
        Text("TASKS", color = Color(0xFFFFA178), fontSize = 11.sp)
        thread.tasks.forEach { task -> Text("• ${task.title}", color = Color.White) }
      }
      Spacer(Modifier.height(14.dp))
      OutlinedButton(onClick = { confirmForget = true }) { Text(stringResource(R.string.forget_local_context)) }
    }
  }
  if (confirmForget) {
    AlertDialog(
      onDismissRequest = { confirmForget = false },
      title = { Text("Forget this context?") },
      text = { Text("This deletes \"${thread.label}\" and its ${thread.evidence.size} evidence items from this phone. You can undo right after.") },
      confirmButton = { TextButton(onClick = { confirmForget = false; onForget() }) { Text("Forget") } },
      dismissButton = { TextButton(onClick = { confirmForget = false }) { Text("Cancel") } },
    )
  }
}

@Composable
private fun QueryAnswer(result: ContextQueryResult) {
  Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF1D2724)), shape = RoundedCornerShape(8.dp)) {
    Column(Modifier.padding(16.dp)) {
      Text("LOCAL GRAPH ANSWER", color = Color(0xFFFFA178), fontSize = 11.sp, letterSpacing = 1.sp, modifier = Modifier.semantics { heading() })
      Spacer(Modifier.height(7.dp))
      Text("“${result.query}”", color = Color(0xFFBAC5BF), style = MaterialTheme.typography.bodySmall)
      Spacer(Modifier.height(7.dp))
      Text(result.answer, color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
      Spacer(Modifier.height(12.dp))
      Text("MATCH: ${result.matchedThreadLabel ?: "NO LOCAL MATCH"} · ${result.confidence}%", color = Color(0xFFFFA178), fontSize = 10.sp, letterSpacing = .6.sp)
      Spacer(Modifier.height(11.dp))
      Text("WHY", color = Color(0xFFBAC5BF), fontSize = 11.sp)
      Text(result.explanation, color = Color.White, style = MaterialTheme.typography.bodySmall)
      if (result.provenance.isNotEmpty()) {
        Spacer(Modifier.height(11.dp))
        Text("LOCAL PROVENANCE", color = Color(0xFFFFA178), fontSize = 11.sp)
        result.provenance.forEach { source ->
          Text("• $source", color = Color(0xFFE2E8E4), style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 4.dp))
        }
      }
    }
  }
}
