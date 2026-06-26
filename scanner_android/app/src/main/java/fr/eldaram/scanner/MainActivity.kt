package fr.eldaram.scanner

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.camera.core.CameraSelector
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import fr.eldaram.scanner.ui.theme.ScannerTheme
import kotlinx.coroutines.delay
import java.util.concurrent.Executors

class MainActivity : ComponentActivity() {
    private val viewModel: ScannerViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            ScannerTheme {
                ScannerScreen(viewModel)
            }
        }
    }
}

@Composable
fun ScannerScreen(viewModel: ScannerViewModel) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED
        )
    }

    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission(),
        onResult = { granted ->
            hasCameraPermission = granted
        }
    )

    LaunchedEffect(key1 = true) {
        if (!hasCameraPermission) {
            launcher.launch(Manifest.permission.CAMERA)
        }
    }

    var showFlash by remember { mutableStateOf(false) }

    LaunchedEffect(viewModel.scanEvents) {
        viewModel.scanEvents.collect {
            showFlash = true
            delay(200)
            showFlash = false
        }
    }

    Scaffold(modifier = Modifier.fillMaxSize()) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            if (hasCameraPermission) {
                CameraPreview(viewModel)
            } else {
                Text(
                    text = "Permission caméra requise",
                    modifier = Modifier.align(Alignment.Center)
                )
            }

            // Connection Status Indicator
            StatusIndicator(viewModel.scannerState, Modifier.align(Alignment.TopEnd).padding(16.dp))

            // Last scanned code (optional, for debug/feedback)
            viewModel.lastScannedCode?.let { code ->
                Text(
                    text = "Code: $code",
                    color = Color.White,
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(bottom = 32.dp)
                        .background(Color.Black.copy(alpha = 0.5f))
                        .padding(8.dp)
                )
            }

            // Flash effect
            AnimatedVisibility(
                visible = showFlash,
                enter = fadeIn(animationSpec = tween(50)),
                exit = fadeOut(animationSpec = tween(150))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Green.copy(alpha = 0.3f))
                )
            }
        }
    }
}

@Composable
fun CameraPreview(viewModel: ScannerViewModel) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val cameraExecutor = remember { Executors.newSingleThreadExecutor() }

    // Configure ML Kit
    val options = BarcodeScannerOptions.Builder()
        .setBarcodeFormats(
            if (viewModel.scannerState == ScannerState.CONNECTED) {
                Barcode.FORMAT_ALL_FORMATS // Or specific: FORMAT_EAN_13, FORMAT_CODE_128, etc.
            } else {
                Barcode.FORMAT_QR_CODE
            }
        )
        .build()
    val scanner = remember(viewModel.scannerState) { BarcodeScanning.getClient(options) }

    AndroidView(
        factory = { ctx ->
            PreviewView(ctx)
        },
        update = { previewView ->
            val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
            cameraProviderFuture.addListener({
                val cameraProvider = cameraProviderFuture.get()

                val preview = Preview.Builder().build().also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }

                val imageAnalysis = ImageAnalysis.Builder()
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .build()

                imageAnalysis.setAnalyzer(cameraExecutor) { imageProxy ->
                    processImageProxy(imageProxy, scanner, viewModel)
                }

                try {
                    cameraProvider.unbindAll()
                    cameraProvider.bindToLifecycle(
                        lifecycleOwner,
                        CameraSelector.DEFAULT_BACK_CAMERA,
                        preview,
                        imageAnalysis
                    )
                } catch (e: Exception) {
                    Log.e("CameraPreview", "Use case binding failed", e)
                }
            }, ContextCompat.getMainExecutor(context))
        },
        modifier = Modifier.fillMaxSize()
    )
    
    DisposableEffect(Unit) {
        onDispose {
            cameraExecutor.shutdown()
        }
    }
}

@Composable
fun StatusIndicator(state: ScannerState, modifier: Modifier = Modifier) {
    val color = when (state) {
        ScannerState.CONNECTED -> Color.Green
        ScannerState.CONNECTING -> Color.Yellow
        ScannerState.IDLE -> Color.Gray
        ScannerState.ERROR -> Color.Red
    }

    Box(
        modifier = modifier
            .size(24.dp)
            .background(color, CircleShape)
    )
}

@androidx.annotation.OptIn(ExperimentalGetImage::class)
private fun processImageProxy(
    imageProxy: ImageProxy,
    scanner: com.google.mlkit.vision.barcode.BarcodeScanner,
    viewModel: ScannerViewModel
) {
    val mediaImage = imageProxy.image
    if (mediaImage != null) {
        val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
        scanner.process(image)
            .addOnSuccessListener { barcodes ->
                for (barcode in barcodes) {
                    barcode.rawValue?.let { value ->
                        viewModel.onCodeScanned(value)
                    }
                }
            }
            .addOnCompleteListener {
                imageProxy.close()
            }
    } else {
        imageProxy.close()
    }
}
