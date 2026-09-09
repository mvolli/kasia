package pl.kasia.trainer

import android.util.Log
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Content
import com.google.ai.edge.litertlm.Contents
import com.google.ai.edge.litertlm.ConversationConfig
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.Message
import java.io.File
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test
import org.junit.runner.RunWith

// Verifies the on-device LiteRT-LM path end-to-end on the real device, without
// going through the app UI (no unlocked screen / user interaction needed). Run with:
//   ./gradlew connectedAndroidTest \
//     -Pandroid.testInstrumentationRunnerArguments.class=pl.kasia.trainer.AiBridgeGenerateTest
@RunWith(AndroidJUnit4::class)
class AiBridgeGenerateTest {

    private fun modelFile(context: android.content.Context) = File(context.filesDir, "gemma-4-E2B-it.litertlm")

    private fun newEngine(context: android.content.Context): Engine {
        val file = modelFile(context)
        assertTrue("model not downloaded at ${file.absolutePath} — run the app once first", file.exists())
        val engine = Engine(EngineConfig(modelPath = file.absolutePath, backend = Backend.CPU(), cacheDir = context.cacheDir.path))
        engine.initialize()
        return engine
    }

    // Real turns observed between 9s and ~50s, plus first-call engine warmup. If a
    // call doesn't complete in this bound, that's a reproducible hang outside the
    // app/UI too, not something caused by the UI layer.
    private fun runTurn(engine: Engine, systemPrompt: String, history: List<Message>, userText: String): String {
        var result: String? = null
        var error: Throwable? = null
        val latch = CountDownLatch(1)
        Thread {
            try {
                val conversation = engine.createConversation(
                    ConversationConfig(systemInstruction = Contents.of(systemPrompt), initialMessages = history)
                )
                conversation.use {
                    val msg = it.sendMessage(userText)
                    result = msg.contents.contents.filterIsInstance<Content.Text>().joinToString("") { c -> c.text }
                }
            } catch (t: Throwable) {
                error = t
            } finally {
                latch.countDown()
            }
        }.start()
        val completed = latch.await(150, TimeUnit.SECONDS)
        if (!completed) fail("generate() did not complete within 150s — reproducible hang outside the app UI")
        error?.let { throw it }
        return result ?: fail("empty result").let { "" }
    }

    private fun extractJson(raw: String): String? = Regex("\\{[\\s\\S]*\\}").find(raw)?.value

    private fun extractField(json: String, field: String): String? =
        Regex("\"$field\"\\s*:\\s*\"([^\"]*)\"").find(json)?.groupValues?.get(1)

    @Test
    fun generateCompletesAndFollowsVocabContract() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val engine = newEngine(context)

        val systemPrompt = """
            You are the AI tutor "Frau Schmidt" in a role-play scenario for a Polish speaker learning German.
            Scenario: Bakery in Berlin. Reply in simple German (1-3 short sentences).
            - vocab: 0-2 new useful German words for this scene, each as a {"word", "translation"} pair.
            Reply with ONLY this JSON, no markdown: {"reply": string, "replyNative": string, "correction": null, "vocab": [{"word": string, "translation": string}], "done": boolean}
            CRITICAL: in "vocab", "word" is ALWAYS in German and "translation" is ALWAYS in Polish — never English, never the same word in both, never a parenthetical gloss. Example: {"word": "Erfahrung", "translation": "doświadczenie"}.
        """.trimIndent()

        val started = System.currentTimeMillis()
        val result = runTurn(engine, systemPrompt, emptyList(), "MY_UTTERANCE: hätte gerne Brötchen und möchte bezahlen")
        Log.i("AiBridgeGenerateTest", "elapsed=${System.currentTimeMillis() - started}ms result=$result")

        val json = extractJson(result)
        assertTrue("no JSON object in result: $result", json != null)
        Log.i("AiBridgeGenerateTest", "parsed JSON candidate: $json")
        // Human judgment on "is this actually Polish, not English" happens by
        // reading this log line — not asserted here, to avoid a brittle keyword list.
    }

    @Test
    fun secondTurnDoesNotRepeatAlreadyAnsweredQuestion() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val engine = newEngine(context)

        val systemPrompt = """
            You are the AI tutor "Frau Klein", a friendly but professional HR manager conducting a job interview
            in German with a Polish speaker learning German. Reply in simple German (1-3 short sentences).
            - Never repeat a question or request you already made earlier in this conversation (check the history).
              If the learner already answered something, acknowledge it briefly and move to a new aspect of the goal
              — never re-ask the same thing again.
            Reply with ONLY this JSON, no markdown, no comments: {"reply": string, "replyNative": string, "vocab": [], "done": boolean}
        """.trimIndent()
        val formatReminder = "\n(Respond with ONLY the JSON object from the system prompt — no other text.)"

        // Turn 1: the learner gives their name unprompted — a cooperative, complete
        // answer (the original bug reproduced specifically under adversarial input;
        // this checks the fix holds in ordinary, cooperative use).
        val turn1User = "MY_UTTERANCE: Ich heiße Anna und komme aus Berlin."
        val raw1 = runTurn(engine, systemPrompt, emptyList(), turn1User + formatReminder)
        val json1 = extractJson(raw1) ?: fail("turn1: no JSON in $raw1").let { "" }
        val reply1 = extractField(json1, "reply") ?: raw1
        Log.i("AiBridgeGenerateTest", "turn1 reply: $reply1")

        // Turn 2: the learner answers a different question (experience). A
        // well-behaved tutor must not re-ask for the name it already has.
        val history = listOf(Message.user(turn1User), Message.model(reply1))
        val turn2User = "MY_UTTERANCE: Ich habe fünf Jahre Erfahrung als Verkäuferin."
        val raw2 = runTurn(engine, systemPrompt, history, turn2User + formatReminder)
        val json2 = extractJson(raw2) ?: fail("turn2: no JSON in $raw2").let { "" }
        val reply2 = extractField(json2, "reply") ?: raw2
        Log.i("AiBridgeGenerateTest", "turn2 reply: $reply2")

        assertTrue("turn2 repeated turn1's reply verbatim: $reply2", reply1.trim() != reply2.trim())
        val asksNameAgain = Regex("(?i)wie heißen sie|ihren namen|vollständigen namen").containsMatchIn(reply2)
        assertTrue("turn2 re-asked for the name even though turn1 already gave it: $reply2", !asksNameAgain)
    }
}
