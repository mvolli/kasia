package pl.kasia.trainer

import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Content
import com.google.ai.edge.litertlm.ConversationConfig
import com.google.ai.edge.litertlm.Contents
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.Message
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/**
 * On-device tutor backend for Kasia via Gemma, run fully locally through
 * LiteRT-LM — no AICore/Gemini-Nano dependency, works regardless of the
 * device's OEM AICore fork:
 *   checkStatus()             -> {status: "not-downloaded"|"downloaded"}
 *   downloadModel()           -> downloads the .litertlm model into app-private
 *                                storage, emits "aiDownloadProgress" events
 *   generate({systemPrompt, userText}) -> {text}
 */
@CapacitorPlugin(name = "AiBridge")
class AiBridge : Plugin() {

    companion object {
        private const val TAG = "AiBridge"
        private const val MODEL_FILENAME = "gemma-4-E2B-it.litertlm"
        private const val MODEL_URL =
            "https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it.litertlm"
        // Observed normal turns take anywhere from ~15s to ~50s on-device; a call
        // stuck well past that is treated as abandoned rather than blocking every
        // later turn for the rest of the process's lifetime (see generateBusy).
        private const val STALE_BUSY_MS = 90_000L
    }

    private var scope = CoroutineScope(Dispatchers.Default + Job())
    private var engine: Engine? = null
    private val engineLock = Mutex()
    private val downloadLock = Mutex()
    // The LiteRT-LM engine is not known to be safe for concurrent inference calls;
    // an impatient re-send while a previous generate() is still running risked
    // wedging it so every later call hung forever. Fail fast instead of queuing
    // behind a call that might never return. generateStartedAt lets a later call
    // detect that the slot-holder is stuck (STALE_BUSY_MS) and recover instead of
    // being locked out for the rest of the process's lifetime.
    private val generateBusy = AtomicBoolean(false)
    private val generateStartedAt = AtomicLong(0L)

    private fun modelFile(): File = File(context.filesDir, MODEL_FILENAME)
    private fun modelPartFile(): File = File(context.filesDir, "$MODEL_FILENAME.part")

    // Message.contents is a Contents wrapper around a List<Content>; only the
    // Content.Text parts carry plain text (no images/audio in our use case).
    private fun Message.plainText(): String =
        contents.contents.filterIsInstance<Content.Text>().joinToString("") { it.text }

    @PluginMethod
    fun checkStatus(call: PluginCall) {
        val ret = JSObject()
        ret.put("status", if (modelFile().exists()) "downloaded" else "not-downloaded")
        call.resolve(ret)
    }

    @PluginMethod
    fun downloadModel(call: PluginCall) {
        if (modelFile().exists()) {
            call.resolve()
            return
        }
        scope.launch {
            downloadLock.withLock {
                if (modelFile().exists()) {
                    call.resolve()
                    return@withLock
                }
                try {
                    try {
                        runDownloadAttempt()
                    } catch (e: java.io.IOException) {
                        // A stale/corrupt .part file (e.g. from an interrupted earlier
                        // attempt) makes the resume Range request invalid (HTTP 416).
                        // Drop it and retry once from scratch instead of failing outright.
                        Log.w(TAG, "download attempt failed, retrying from scratch", e)
                        modelPartFile().delete()
                        runDownloadAttempt()
                    }
                    Log.d(TAG, "Model downloaded: ${modelFile().length()} bytes")
                    call.resolve()
                } catch (e: Exception) {
                    Log.e(TAG, "downloadModel failed", e)
                    call.reject("download-failed: ${e.message}")
                }
            }
        }
    }

    private fun runDownloadAttempt() {
        val partFile = modelPartFile()
        val startOffset = if (partFile.exists()) partFile.length() else 0L
        val connection = (URL(MODEL_URL).openConnection() as HttpURLConnection).apply {
            instanceFollowRedirects = true
            if (startOffset > 0) setRequestProperty("Range", "bytes=$startOffset-")
            connectTimeout = 15000
            readTimeout = 30000
        }
        connection.connect()
        if (connection.responseCode !in 200..299) {
            val code = connection.responseCode
            connection.disconnect()
            throw java.io.IOException("HTTP $code")
        }
        val contentLength = connection.contentLengthLong
        val resumed = startOffset > 0 && connection.responseCode == 206
        val bytesTotal = if (resumed) startOffset + contentLength else contentLength
        var bytesDownloaded = if (resumed) startOffset else 0L

        val startEvent = JSObject()
        startEvent.put("bytesDownloaded", bytesDownloaded)
        startEvent.put("bytesTotal", bytesTotal)
        notifyListeners("aiDownloadProgress", startEvent)

        connection.inputStream.use { input ->
            java.io.FileOutputStream(partFile, resumed).use { output ->
                val buffer = ByteArray(1 shl 16)
                var lastNotify = 0L
                while (true) {
                    val n = input.read(buffer)
                    if (n < 0) break
                    output.write(buffer, 0, n)
                    bytesDownloaded += n
                    val now = System.currentTimeMillis()
                    if (now - lastNotify > 250) {
                        lastNotify = now
                        val e = JSObject()
                        e.put("bytesDownloaded", bytesDownloaded)
                        e.put("bytesTotal", bytesTotal)
                        notifyListeners("aiDownloadProgress", e)
                    }
                }
            }
        }
        connection.disconnect()

        val finalLength = partFile.length()
        if (bytesTotal > 0 && finalLength != bytesTotal) {
            partFile.delete()
            throw java.io.IOException("size mismatch after download: $finalLength != $bytesTotal")
        }
        if (!partFile.renameTo(modelFile())) {
            throw java.io.IOException("failed to finalize downloaded model file")
        }
    }

    private suspend fun ensureEngine(): Engine = engineLock.withLock {
        engine?.let { return@withLock it }
        val config = EngineConfig(
            modelPath = modelFile().absolutePath,
            backend = Backend.CPU(),
            cacheDir = context.cacheDir.path,
        )
        val e = Engine(config)
        e.initialize()
        engine = e
        e
    }

    // Optional "history" arg: JSON array of {role: "user"|"assistant", text: string},
    // oldest first — becomes the conversation's initialMessages so the model sees
    // proper per-turn role attribution instead of a flattened transcript string.
    private fun parseHistory(call: PluginCall): List<Message> {
        val arr = call.getArray("history") ?: return emptyList()
        val out = mutableListOf<Message>()
        for (i in 0 until arr.length()) {
            val o = arr.getJSONObject(i)
            val text = o.optString("text", "")
            if (text.isEmpty()) continue
            out.add(if (o.optString("role") == "user") Message.user(text) else Message.model(text))
        }
        return out
    }

    @PluginMethod
    fun generate(call: PluginCall) {
        if (!modelFile().exists()) {
            call.reject("model-not-downloaded")
            return
        }
        val now = System.currentTimeMillis()
        var staleTakeover = false
        if (!generateBusy.compareAndSet(false, true)) {
            val elapsed = now - generateStartedAt.get()
            if (elapsed < STALE_BUSY_MS) {
                call.reject("generate-busy")
                return
            }
            Log.w(TAG, "generate: previous call stuck for ${elapsed}ms, recovering with a fresh engine")
            staleTakeover = true
        }
        generateStartedAt.set(now)
        val systemPrompt = call.getString("systemPrompt") ?: ""
        val userText = call.getString("userText") ?: ""
        val history = parseHistory(call)
        scope.launch {
            try {
                if (staleTakeover) {
                    // Don't close() the stuck engine — another thread may still be
                    // blocked inside it, and close-then-use from that thread risks a
                    // native crash. Just stop sharing it; ensureEngine() below builds
                    // a fresh one. The old instance's memory stays leaked until the
                    // process is killed.
                    engineLock.withLock { engine = null }
                }
                val e = ensureEngine()
                val conversationConfig = ConversationConfig(
                    systemInstruction = Contents.of(systemPrompt),
                    initialMessages = history,
                )
                val text = e.createConversation(conversationConfig).use { conversation ->
                    conversation.sendMessage(userText).plainText()
                }
                Log.d(TAG, "generate -> ${text.take(900)}")
                val ret = JSObject()
                ret.put("text", text)
                call.resolve(ret)
            } catch (ex: Exception) {
                Log.e(TAG, "generate failed", ex)
                call.reject("generate-failed: ${ex.message}")
            } finally {
                generateBusy.set(false)
            }
        }
    }

    override fun handleOnDestroy() {
        scope.launch {
            engineLock.withLock {
                engine?.close()
                engine = null
            }
        }
        scope.cancel()
        super.handleOnDestroy()
    }
}
