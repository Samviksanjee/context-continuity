/* ContextOS Android prototype: Compose UI makes local evidence, reasoning, and deletion visible to the user. */
package ai.contextos

import android.content.Intent
import android.Manifest
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ai.contextos.core.ContextQueryResult
import ai.contextos.core.ContextThread
import ai.contextos.core.ThreadState

class MainActivity : ComponentActivity() {
  private val viewModel: ContextViewModel by viewModels()

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    handleShareIntent(intent)
    setContent { MaterialTheme { ContextOsScreen(viewModel) } }
  }

  override fun onNewIntent(intent: Intent) { super.onNewIntent(intent); handleShareIntent(intent) }

  private fun handleShareIntent(intent: Intent?) {
    if (intent?.action != Intent.ACTION_SEND) return
    when {
      intent.type == "text/plain" -> intent.getStringExtra(Intent.EXTRA_TEXT)?.let(viewModel::captureSharedText)
      intent.type?.startsWith("image/") == true || intent.type == "application/pdf" -> (intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM))?.let(viewModel::captureDocument)
    }
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ContextOsScreen(viewModel: ContextViewModel) {
  val state by viewModel.state.collectAsStateWithLifecycle()
  val photoCapture = rememberLauncherForActivityResult(ActivityResultContracts.TakePicturePreview()) { bitmap: Bitmap? -> bitmap?.let(viewModel::captureBitmap) }
  val documentPicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri: Uri? -> uri?.let(viewModel::captureDocument) }
  var voiceQueryMode by remember { mutableStateOf(false) }
  val microphonePermission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted -> if (granted) { if (voiceQueryMode) viewModel.queryByVoice() else viewModel.captureVoice() } }
  var note by remember { mutableStateOf("") }
  var question by remember { mutableStateOf("") }
  val selected = state.threads.firstOrNull { it.id == state.selectedId } ?: state.threads.firstOrNull()

  Scaffold(topBar = { TopAppBar(title = { Text("CONTEXT / OS", fontWeight = FontWeight.Bold, letterSpacing = 2.sp) }) }) { padding ->
    LazyColumn(modifier = Modifier.fillMaxSize().padding(padding), contentPadding = PaddingValues(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
      item { PrivacyBanner(state.message) }
      item {
        Text("Capture deliberately", fontSize = 26.sp, fontWeight = FontWeight.Bold)
        Text("Only user-initiated notes, shares, documents, and images enter this local graph. No cloud. No background screen reading.", style = MaterialTheme.typography.bodyMedium)
      }
      item {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
          Button(onClick = { photoCapture.launch(null) }, enabled = !state.isWorking) { Text("Capture image") }
          OutlinedButton(onClick = { documentPicker.launch(arrayOf("application/pdf", "image/*", "text/plain")) }, enabled = !state.isWorking) { Text("Add document") }
          OutlinedButton(onClick = { voiceQueryMode = false; microphonePermission.launch(Manifest.permission.RECORD_AUDIO) }, enabled = !state.isWorking) { Text("Voice note") }
        }
      }
      item {
        OutlinedTextField(value = note, onValueChange = { note = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Private note") }, placeholder = { Text("e.g., Aisha will update the budget slide before tomorrow’s review") })
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
          Button(onClick = { viewModel.captureNote(note); note = "" }, enabled = note.isNotBlank() && !state.isWorking) { Text("Remember locally") }
          OutlinedButton(onClick = viewModel::seedDemo, enabled = state.threads.isEmpty() && !state.isWorking) { Text("Try local demo") }
        }
      }
      item {
        Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFF1EEE5)), shape = RoundedCornerShape(8.dp)) {
          Column(Modifier.padding(14.dp)) {
            Text("ASK YOUR LOCAL CONTEXT", fontSize = 11.sp, color = Color(0xFFD95528), fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
            Spacer(Modifier.height(5.dp))
            Text("Ask about people, timing, tasks, or the next step. Answers come only from evidence already saved on this phone.", style = MaterialTheme.typography.bodySmall)
            Spacer(Modifier.height(9.dp))
            OutlinedTextField(value = question, onValueChange = { question = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Context question") }, placeholder = { Text("What should I do next for the client review?") })
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
              Button(onClick = { viewModel.queryContext(question); question = "" }, enabled = question.isNotBlank() && !state.isWorking) { Text("Ask locally") }
              OutlinedButton(onClick = { voiceQueryMode = true; microphonePermission.launch(Manifest.permission.RECORD_AUDIO) }, enabled = !state.isWorking) { Text("Ask by voice") }
            }
          }
        }
      }
      state.queryResult?.let { result -> item { QueryAnswer(result) } }
      if (state.threads.isNotEmpty()) {
        item { Text("Your context threads", fontSize = 19.sp, fontWeight = FontWeight.Bold) }
        items(state.threads, key = { it.id }) { thread -> ThreadRow(thread, selected?.id == thread.id, onClick = { viewModel.select(thread.id) }) }
      }
      selected?.let { thread ->
        item { ThreadDetail(thread, onForget = { viewModel.forget(thread.id) }) }
      }
    }
  }
}

@Composable
private fun PrivacyBanner(message: String) {
  Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFE9F0EC)), shape = RoundedCornerShape(8.dp)) {
    Column(Modifier.padding(14.dp)) {
      Text("ON THIS PHONE", fontSize = 11.sp, color = Color(0xFF28715B), fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
      Spacer(Modifier.height(4.dp))
      Text(message)
    }
  }
}

@Composable
private fun ThreadRow(thread: ContextThread, selected: Boolean, onClick: () -> Unit) {
  Card(modifier = Modifier.fillMaxWidth().clickable(onClick = onClick), colors = CardDefaults.cardColors(containerColor = if (selected) Color(0xFFFFE7DD) else Color(0xFFF8F7F3))) {
    Row(Modifier.padding(14.dp), horizontalArrangement = Arrangement.SpaceBetween) {
      Column(Modifier.weight(1f)) { Text(thread.label, fontWeight = FontWeight.Bold); Text("${thread.evidence.size} evidence items · ${thread.tasks.size} tasks", style = MaterialTheme.typography.bodySmall) }
      Text(thread.state.name, fontSize = 10.sp, color = if (thread.state == ThreadState.ACTIVE) Color(0xFFD95528) else Color.Gray)
    }
  }
}

@Composable
private fun ThreadDetail(thread: ContextThread, onForget: () -> Unit) {
  Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF1D2724)), shape = RoundedCornerShape(8.dp)) {
    Column(Modifier.padding(16.dp)) {
      Text("CONTEXTOS SAYS", color = Color(0xFFFFA178), fontSize = 11.sp, letterSpacing = 1.sp)
      Spacer(Modifier.height(7.dp)); Text(thread.suggestion, color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.SemiBold)
      Spacer(Modifier.height(14.dp)); HorizontalDivider(color = Color(0xFF65706B))
      Spacer(Modifier.height(12.dp)); Text("WHY THIS THREAD", color = Color(0xFFBAC5BF), fontSize = 11.sp); Text(thread.explanation, color = Color.White)
      Spacer(Modifier.height(12.dp)); Text("PROVENANCE", color = Color(0xFFFFA178), fontSize = 11.sp)
      thread.evidence.takeLast(4).forEach { evidence -> Text("${evidence.source.name.replace('_', ' ')} · ${evidence.summary.take(110)}", color = Color(0xFFE2E8E4), style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 5.dp)) }
      if (thread.tasks.isNotEmpty()) { Spacer(Modifier.height(12.dp)); Text("TASKS", color = Color(0xFFFFA178), fontSize = 11.sp); thread.tasks.forEach { task -> Text("• ${task.title}", color = Color.White) } }
      Spacer(Modifier.height(14.dp)); OutlinedButton(onClick = onForget) { Text("Forget this local context") }
    }
  }
}

@Composable
private fun QueryAnswer(result: ContextQueryResult) {
  Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF1D2724)), shape = RoundedCornerShape(8.dp)) {
    Column(Modifier.padding(16.dp)) {
      Text("LOCAL GRAPH ANSWER", color = Color(0xFFFFA178), fontSize = 11.sp, letterSpacing = 1.sp)
      Spacer(Modifier.height(7.dp)); Text("“${result.query}”", color = Color(0xFFBAC5BF), style = MaterialTheme.typography.bodySmall)
      Spacer(Modifier.height(7.dp)); Text(result.answer, color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
      Spacer(Modifier.height(12.dp)); Text("MATCH: ${result.matchedThreadLabel ?: "NO LOCAL MATCH"} · ${result.confidence}%", color = Color(0xFFFFA178), fontSize = 10.sp, letterSpacing = .6.sp)
      Spacer(Modifier.height(11.dp)); Text("WHY", color = Color(0xFFBAC5BF), fontSize = 11.sp); Text(result.explanation, color = Color.White, style = MaterialTheme.typography.bodySmall)
      if (result.provenance.isNotEmpty()) {
        Spacer(Modifier.height(11.dp)); Text("LOCAL PROVENANCE", color = Color(0xFFFFA178), fontSize = 11.sp)
        result.provenance.forEach { source -> Text("• $source", color = Color(0xFFE2E8E4), style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 4.dp)) }
      }
    }
  }
}
