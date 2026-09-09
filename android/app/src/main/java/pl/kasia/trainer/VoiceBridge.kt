package pl.kasia.trainer

import android.Manifest
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import java.util.Locale
import java.util.concurrent.ConcurrentLinkedQueue

/**
 * Native Android voice for Kasia:
 *   listen({locale}) -> {transcript}   (SpeechRecognizer, on-device STT)
 *   speak({text, locale, rate})        (TextToSpeech, native PL voices)
 */
@CapacitorPlugin(
    name = "VoiceBridge",
    permissions = [
        Permission(strings = [Manifest.permission.RECORD_AUDIO], alias = "microphone")
    ]
)
class VoiceBridge : Plugin() {

    private var tts: TextToSpeech? = null
    private val speakQueue = ConcurrentLinkedQueue<JSObject>()
    private var recognizer: SpeechRecognizer? = null

    override fun load() {
        tts = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                    override fun onStart(utteranceId: String?) {}
                    override fun onDone(utteranceId: String?) = drainSpeak()
                    @Deprecated("Deprecated in Java")
                    override fun onError(utteranceId: String?) = drainSpeak()
                })
                drainSpeak()
            }
        }
    }

    // ---------------- TTS ----------------

    @PluginMethod
    fun speak(call: PluginCall) {
        val p = JSObject()
        p.put("text", call.getString("text") ?: "")
        p.put("locale", call.getString("locale") ?: "pl-PL")
        p.put("rate", (call.getDouble("rate") ?: 1.0).coerceIn(0.5, 2.0))
        val engine = tts
        if (engine != null && !engine.isSpeaking) speakNow(engine, p) else speakQueue.add(p)
        call.resolve()
    }

    private fun speakNow(engine: TextToSpeech, p: JSObject) {
        val text = p.getString("text") ?: return
        val localeTag = p.getString("locale") ?: "pl-PL"
        val rate = (p.getDouble("rate") ?: 1.0).toFloat()
        engine.language = Locale.forLanguageTag(localeTag)
        engine.setSpeechRate(rate)
        engine.speak(text, TextToSpeech.QUEUE_FLUSH, null, "kasia-${System.currentTimeMillis()}")
    }

    private fun drainSpeak() {
        val engine = tts ?: return
        if (engine.isSpeaking) return
        val next = speakQueue.poll() ?: return
        speakNow(engine, next)
    }

    // ---------------- STT ----------------

    @PluginMethod
    fun listen(call: PluginCall) {
        val engine = tts
        if (engine != null && (engine.isSpeaking || speakQueue.isNotEmpty())) {
            // Starting the recognizer while TTS plays picks up the device's own
            // voice output as if it were the learner speaking (feedback loop).
            call.reject("tts-speaking")
            return
        }
        if (getPermissionState("microphone") == PermissionState.GRANTED) {
            listenImpl(call)
        } else {
            requestPermissionForAlias("microphone", call, "listenPermissionCallback")
        }
    }

    @PermissionCallback
    private fun listenPermissionCallback(call: PluginCall) {
        if (getPermissionState("microphone") == PermissionState.GRANTED) {
            listenImpl(call)
        } else {
            call.reject("microphone permission denied")
        }
    }

    // SpeechRecognizer must be created/used on the main thread; Capacitor plugin
    // methods run on a background handler thread, so we hop to the UI thread here.
    private fun listenImpl(call: PluginCall) {
        activity.runOnUiThread { listenOnUiThread(call) }
    }

    private fun listenOnUiThread(call: PluginCall) {
        val localeTag = call.getString("locale") ?: "pl-PL"
        val ctx = context
        if (!SpeechRecognizer.isRecognitionAvailable(ctx)) {
            call.reject("speech-recognition-unavailable")
            return
        }
        val rec = SpeechRecognizer.createSpeechRecognizer(ctx)
        recognizer = rec
        var settled = false
        rec.setRecognitionListener(object : RecognitionListener {
            override fun onResults(results: Bundle?) {
                if (settled) return
                settled = true
                val list = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                val transcript = list?.firstOrNull() ?: ""
                rec.stopListening()
                resolveListen(call, transcript)
            }

            override fun onError(error: Int) {
                if (settled) return
                settled = true
                rec.stopListening()
                when (error) {
                    // nothing said / no match: not an app error, let the UI nudge the user
                    SpeechRecognizer.ERROR_NO_MATCH,
                    SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> resolveListen(call, "")
                    else -> call.reject("recognition-error-$error")
                }
            }

            override fun onReadyForSpeech(params: Bundle?) {}
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(rmsdB: Float) {}
            override fun onBufferReceived(buffer: ByteArray?) {}
            override fun onEndOfSpeech() {}
            override fun onPartialResults(partialResults: Bundle?) {}
            override fun onEvent(eventType: Int, params: Bundle?) {}
        })
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, localeTag)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
        }
        rec.startListening(intent)
    }

    private fun resolveListen(call: PluginCall, transcript: String) {
        val ret = JSObject()
        ret.put("transcript", transcript)
        call.resolve(ret)
    }

    override fun handleOnDestroy() {
        recognizer?.destroy()
        tts?.shutdown()
        super.handleOnDestroy()
    }
}
