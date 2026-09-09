package pl.kasia.trainer

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(VoiceBridge::class.java)
        registerPlugin(AiBridge::class.java)
        super.onCreate(savedInstanceState)
    }
}
