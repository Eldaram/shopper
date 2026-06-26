package fr.eldaram.scanner

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.OutputStream
import java.net.InetSocketAddress
import java.net.Socket

enum class ScannerState {
    IDLE,
    CONNECTING,
    CONNECTED,
    ERROR
}

class ScannerViewModel : ViewModel() {

    var scannerState by mutableStateOf(ScannerState.IDLE)
        private set

    var lastScannedCode by mutableStateOf<String?>(null)
        private set

    private var socket: Socket? = null
    private var outputStream: OutputStream? = null

    private val _scanEvents = MutableSharedFlow<Unit>()
    val scanEvents: SharedFlow<Unit> = _scanEvents.asSharedFlow()

    private var lastScanTime = 0L
    private val scanCooldown = 1000L

    fun connectToCaisse(ipPort: String) {
        if (scannerState == ScannerState.CONNECTING || scannerState == ScannerState.CONNECTED) return

        viewModelScope.launch {
            scannerState = ScannerState.CONNECTING
            try {
                val parts = ipPort.split(":")
                if (parts.size != 2) throw IllegalArgumentException("Invalid IP:PORT format")

                val ip = parts[0]
                val port = parts[1].toInt()

                withContext(Dispatchers.IO) {
                    val newSocket = Socket()
                    newSocket.connect(InetSocketAddress(ip, port), 5000)
                    socket = newSocket
                    outputStream = newSocket.getOutputStream()
                }

                scannerState = ScannerState.CONNECTED
                monitorSocket()
            } catch (e: Exception) {
                e.printStackTrace()
                scannerState = ScannerState.IDLE
                // Potentially set ERROR state if we want to show a message
            }
        }
    }

    private fun monitorSocket() {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val inputStream = socket?.getInputStream()
                val buffer = ByteArray(1024)
                while (scannerState == ScannerState.CONNECTED) {
                    val read = inputStream?.read(buffer) ?: -1
                    if (read == -1) {
                        disconnect()
                        break
                    }
                }
            } catch (e: Exception) {
                disconnect()
            }
        }
    }

    fun onCodeScanned(code: String) {
        val currentTime = System.currentTimeMillis()
        if (currentTime - lastScanTime < scanCooldown) return

        lastScanTime = currentTime
        lastScannedCode = code

        viewModelScope.launch {
            _scanEvents.emit(Unit)
            if (scannerState == ScannerState.CONNECTED) {
                sendCodeToSocket(code)
            } else {
                // If not connected, check if it's an IP:PORT QR code
                if (code.contains(":")) {
                    connectToCaisse(code)
                }
            }
        }
    }

    private suspend fun sendCodeToSocket(code: String) {
        withContext(Dispatchers.IO) {
            try {
                outputStream?.let {
                    it.write((code + "\n").toByteArray())
                    it.flush()
                } ?: run {
                    disconnect()
                }
            } catch (e: Exception) {
                disconnect()
            }
        }
    }

    fun disconnect() {
        viewModelScope.launch {
            withContext(Dispatchers.IO) {
                try {
                    outputStream?.close()
                    socket?.close()
                } catch (e: Exception) {
                    e.printStackTrace()
                } finally {
                    socket = null
                    outputStream = null
                }
            }
            scannerState = ScannerState.IDLE
        }
    }

    override fun onCleared() {
        super.onCleared()
        disconnect()
    }
}
