/* ContextOS Android prototype: OCR executes locally; input remains evidence and never becomes executable instruction text. */
package ai.contextos.core

import android.content.ContentResolver
import android.content.Context
import android.graphics.Bitmap
import android.graphics.ImageDecoder
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.coroutines.suspendCancellableCoroutine

class OnDeviceCapture(private val context: Context) {
  private val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

  suspend fun extractFromBitmap(bitmap: Bitmap): String = suspendCancellableCoroutine { continuation ->
    recognizer.process(InputImage.fromBitmap(bitmap, 0))
      .addOnSuccessListener { result -> continuation.resumeWith(Result.success(result.text)) }
      .addOnFailureListener { error -> continuation.resumeWith(Result.failure(error)) }
  }

  suspend fun extractFromUri(uri: Uri): String {
    val resolver = context.contentResolver
    val type = resolver.getType(uri).orEmpty()
    return when {
      type.startsWith("image/") -> extractFromBitmap(ImageDecoder.decodeBitmap(ImageDecoder.createSource(resolver, uri)))
      type == "application/pdf" -> extractFromPdf(resolver, uri)
      type.startsWith("text/") -> resolver.openInputStream(uri)?.bufferedReader()?.use { it.readText().take(12_000) }.orEmpty()
      else -> "Unsupported capture type. Share text, an image, or a PDF to keep processing local."
    }
  }

  private suspend fun extractFromPdf(resolver: ContentResolver, uri: Uri): String {
    val descriptor = resolver.openFileDescriptor(uri, "r") ?: return "Unable to open this PDF locally."
    descriptor.use { fd ->
      PdfRenderer(fd).use { renderer ->
        if (renderer.pageCount == 0) return "This PDF has no pages."
        renderer.openPage(0).use { page ->
          val bitmap = Bitmap.createBitmap(page.width.coerceAtMost(1600), page.height.coerceAtMost(2200), Bitmap.Config.ARGB_8888)
          page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
          return extractFromBitmap(bitmap)
        }
      }
    }
  }
}
