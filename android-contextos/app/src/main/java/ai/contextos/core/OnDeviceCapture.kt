/* OCR executes locally; input remains evidence and never becomes executable instruction text. */
package ai.contextos.core

import android.content.ContentResolver
import android.content.Context
import android.graphics.Bitmap
import android.graphics.ImageDecoder
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.TextRecognizer
import com.google.mlkit.vision.text.chinese.ChineseTextRecognizerOptions
import com.google.mlkit.vision.text.devanagari.DevanagariTextRecognizerOptions
import com.google.mlkit.vision.text.japanese.JapaneseTextRecognizerOptions
import com.google.mlkit.vision.text.korean.KoreanTextRecognizerOptions
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.coroutines.suspendCancellableCoroutine
import java.io.Reader
import java.util.Locale
import kotlin.math.ceil
import kotlin.math.roundToInt

sealed interface CaptureResult {
  data class Success(val text: String, val notice: String? = null) : CaptureResult
  data class Empty(val message: String) : CaptureResult
  data class Unsupported(val message: String) : CaptureResult
}

class OnDeviceCapture(
  private val context: Context,
  private val policy: CaptureWorkloadPolicy,
) : AutoCloseable {
  private val recognizer: TextRecognizer = createRecognizer(policy.ocrScript)

  suspend fun extractFromBitmap(bitmap: Bitmap): CaptureResult {
    if (bitmap.width <= 0 || bitmap.height <= 0) return CaptureResult.Empty("The image has no readable pixels.")
    val prepared = scaleForOcr(bitmap)
    return try {
      captureResult(recognize(prepared), "No readable ${policy.ocrScript.displayName.lowercase()} text was found in the image.")
    } finally {
      if (prepared !== bitmap) prepared.recycle()
    }
  }

  suspend fun extractFromUri(uri: Uri): CaptureResult {
    val resolver = context.contentResolver
    val type = resolver.getType(uri)
      ?.substringBefore(';')
      ?.lowercase(Locale.ROOT)
      .orEmpty()
    return when {
      type.startsWith("image/") -> extractImage(resolver, uri)
      type == "application/pdf" -> extractFromPdf(resolver, uri)
      type.startsWith("text/") || type == "application/json" || type.endsWith("+json") || type.endsWith("+xml") -> extractText(resolver, uri)
      else -> CaptureResult.Unsupported("Unsupported document type. Choose text, JSON, an image, or a PDF; no data was stored.")
    }
  }

  private suspend fun extractImage(resolver: ContentResolver, uri: Uri): CaptureResult {
    val source = ImageDecoder.createSource(resolver, uri)
    val bitmap = ImageDecoder.decodeBitmap(source) { decoder, info, _ ->
      val largestDimension = maxOf(info.size.width, info.size.height).coerceAtLeast(1)
      val sampleSize = ceil(largestDimension.toDouble() / policy.maxImageDimension).toInt().coerceAtLeast(1)
      decoder.setTargetSampleSize(sampleSize)
      decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
    }
    return try {
      extractFromBitmap(bitmap)
    } finally {
      bitmap.recycle()
    }
  }

  private fun extractText(resolver: ContentResolver, uri: Uri): CaptureResult {
    val input = resolver.openInputStream(uri)
      ?: return CaptureResult.Empty("The selected document could not be opened locally.")
    val text = input.bufferedReader().use(::readBounded)
    return captureResult(text, "The selected text document was empty.")
  }

  private suspend fun extractFromPdf(resolver: ContentResolver, uri: Uri): CaptureResult {
    val descriptor = resolver.openFileDescriptor(uri, "r")
      ?: return CaptureResult.Empty("The selected PDF could not be opened locally.")
    descriptor.use { fileDescriptor ->
      PdfRenderer(fileDescriptor).use { renderer ->
        if (renderer.pageCount == 0) return CaptureResult.Empty("The selected PDF has no pages.")
        val pagesToRead = minOf(renderer.pageCount, policy.maxPdfPages)
        val recognizedPages = mutableListOf<String>()
        repeat(pagesToRead) { pageIndex ->
          renderer.openPage(pageIndex).use { page ->
            val largestDimension = maxOf(page.width, page.height).coerceAtLeast(1)
            val scale = minOf(1f, policy.maxImageDimension.toFloat() / largestDimension)
            val width = (page.width * scale).roundToInt().coerceAtLeast(1)
            val height = (page.height * scale).roundToInt().coerceAtLeast(1)
            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            try {
              page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
              recognize(bitmap).trim().takeIf(String::isNotBlank)?.let(recognizedPages::add)
            } finally {
              bitmap.recycle()
            }
          }
        }
        val notice = if (renderer.pageCount > pagesToRead) {
          "Read the first $pagesToRead of ${renderer.pageCount} pages using this phone's memory-aware limit."
        } else {
          "Read $pagesToRead PDF ${if (pagesToRead == 1) "page" else "pages"} locally."
        }
        return captureResult(
          recognizedPages.joinToString("\n\n"),
          "No readable ${policy.ocrScript.displayName.lowercase()} text was found in the selected PDF pages.",
          notice,
        )
      }
    }
  }

  private suspend fun recognize(bitmap: Bitmap): String = suspendCancellableCoroutine { continuation ->
    recognizer.process(InputImage.fromBitmap(bitmap, 0))
      .addOnSuccessListener { result ->
        if (continuation.isActive) continuation.resumeWith(Result.success(result.text))
      }
      .addOnFailureListener { error ->
        if (continuation.isActive) continuation.resumeWith(Result.failure(error))
      }
  }

  private fun scaleForOcr(bitmap: Bitmap): Bitmap {
    val largestDimension = maxOf(bitmap.width, bitmap.height)
    if (largestDimension <= policy.maxImageDimension) return bitmap
    val scale = policy.maxImageDimension.toFloat() / largestDimension
    return Bitmap.createScaledBitmap(
      bitmap,
      (bitmap.width * scale).roundToInt().coerceAtLeast(1),
      (bitmap.height * scale).roundToInt().coerceAtLeast(1),
      true,
    )
  }

  private fun readBounded(reader: Reader): String {
    val result = StringBuilder(MAX_CAPTURE_CHARS)
    val buffer = CharArray(2048)
    while (result.length < MAX_CAPTURE_CHARS) {
      val remaining = MAX_CAPTURE_CHARS - result.length
      val count = reader.read(buffer, 0, minOf(buffer.size, remaining))
      if (count < 0) break
      result.append(buffer, 0, count)
    }
    return result.toString()
  }

  private fun captureResult(text: String, emptyMessage: String, notice: String? = null): CaptureResult {
    val normalized = text.trim()
    if (normalized.isBlank()) return CaptureResult.Empty(emptyMessage)
    val wasTruncated = normalized.length > MAX_CAPTURE_CHARS
    val combinedNotice = listOfNotNull(
      notice,
      if (wasTruncated) "Captured text was limited to $MAX_CAPTURE_CHARS characters for predictable local processing." else null,
    ).joinToString(" ").ifBlank { null }
    return CaptureResult.Success(normalized.take(MAX_CAPTURE_CHARS), combinedNotice)
  }

  override fun close() = recognizer.close()

  private fun createRecognizer(script: OcrScript): TextRecognizer = when (script) {
    OcrScript.LATIN -> TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
    OcrScript.CHINESE -> TextRecognition.getClient(ChineseTextRecognizerOptions.Builder().build())
    OcrScript.DEVANAGARI -> TextRecognition.getClient(DevanagariTextRecognizerOptions.Builder().build())
    OcrScript.JAPANESE -> TextRecognition.getClient(JapaneseTextRecognizerOptions.Builder().build())
    OcrScript.KOREAN -> TextRecognition.getClient(KoreanTextRecognizerOptions.Builder().build())
  }

  private companion object {
    const val MAX_CAPTURE_CHARS = 12_000
  }
}
