import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../l10n/translator.dart';
import '../../services/cocoon_vision_service.dart';

/// Camera Overlay Scanner for real-time Cocoon Defect Triage using on-device MobileNetV2.
class CocoonCameraOverlayWidget extends ConsumerStatefulWidget {
  const CocoonCameraOverlayWidget({
    super.key,
    required this.onApplyTally,
    this.onClose,
  });

  final ValueChanged<CocoonVisionTally> onApplyTally;
  final VoidCallback? onClose;

  @override
  ConsumerState<CocoonCameraOverlayWidget> createState() =>
      _CocoonCameraOverlayWidgetState();
}

class _CocoonCameraOverlayWidgetState
    extends ConsumerState<CocoonCameraOverlayWidget>
    with WidgetsBindingObserver {
  CameraController? _controller;
  bool _isCameraReady = false;
  bool _isStreaming = false;
  bool _isPaused = false;
  String? _errorMessage;
  CocoonVisionTally _liveTally = const CocoonVisionTally.empty();
  late final CocoonVisionService _visionService;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _visionService = ref.read(cocoonVisionServiceProvider);
    _initializeCameraAndModel();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final cameraController = _controller;
    if (cameraController == null || !cameraController.value.isInitialized) {
      return;
    }

    if (state == AppLifecycleState.inactive) {
      _stopStreamAndDisposeCamera();
    } else if (state == AppLifecycleState.resumed) {
      _initializeCameraAndModel();
    }
  }

  Future<void> _initializeCameraAndModel() async {
    try {
      await _visionService.initialize();

      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        setState(() {
          _errorMessage =
              'No physical camera detected. Operating in high-fidelity simulation mode.'
                  .tr;
          _isCameraReady = false;
          _liveTally = _visionService.simulateStationaryScan();
        });
        return;
      }

      // Prefer back camera for tray inspection
      final backCamera = cameras.firstWhere(
        (cam) => cam.lensDirection == CameraLensDirection.back,
        orElse: () => cameras.first,
      );

      // ResolutionPreset.medium (approx 720p) is strictly chosen to avoid thermal throttling
      // and frame lag on mid-range devices such as Tecno Pova 6 Neo.
      final controller = CameraController(
        backCamera,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.yuv420,
      );

      await controller.initialize();
      if (!mounted) return;

      setState(() {
        _controller = controller;
        _isCameraReady = true;
        _errorMessage = null;
      });

      _startImageProcessingStream();
    } catch (e) {
      debugPrint('[CocoonCameraOverlayWidget] Camera init exception: $e');
      if (!mounted) return;
      setState(() {
        _errorMessage =
            'Camera unavailable. Switched to automated stationary simulation mode.'
                .tr;
        _isCameraReady = false;
        _liveTally = _visionService.simulateStationaryScan();
      });
    }
  }

  void _startImageProcessingStream() {
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized) return;

    if (_isStreaming) return;
    _isStreaming = true;

    controller.startImageStream((CameraImage image) async {
      if (_isPaused || !mounted) return;

      final result = await _visionService.processCameraImage(image);
      if (result != null && mounted) {
        setState(() {
          _liveTally = result;
        });
        ref.read(cocoonTallyProvider.notifier).updateTally(result);
      }
    });
  }

  Future<void> _stopStreamAndDisposeCamera() async {
    _isStreaming = false;
    final controller = _controller;
    _controller = null;
    if (controller != null) {
      try {
        if (controller.value.isStreamingImages) {
          await controller.stopImageStream();
        }
        await controller.dispose();
      } catch (e) {
        debugPrint('[CocoonCameraOverlayWidget] Camera disposal error: $e');
      }
    }
  }

  void _togglePause() {
    setState(() {
      _isPaused = !_isPaused;
    });
  }

  void _rescanSimulation() {
    setState(() {
      _liveTally = _visionService.simulateStationaryScan(
        sampleSize: 20 + (DateTime.now().second % 15),
      );
    });
    ref.read(cocoonTallyProvider.notifier).updateTally(_liveTally);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _stopStreamAndDisposeCamera();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // 1. Camera Live Feed or Simulation Backing
          if (_isCameraReady && _controller != null)
            Center(
              child: AspectRatio(
                aspectRatio: 1 / _controller!.value.aspectRatio,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    CameraPreview(_controller!),
                    CustomPaint(
                      painter: CocoonBoundingBoxPainter(
                        detections: _liveTally.detections,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            _buildSimulationView(),

          // 2. Top Status Bar
          Positioned(
            top: 16,
            left: 16,
            right: 16,
            child: _buildTopStatusBar(),
          ),

          // 3. Bottom HUD and Tally Summary
          Positioned(
            bottom: 16,
            left: 16,
            right: 16,
            child: _buildBottomHud(),
          ),
        ],
      ),
    );
  }

  Widget _buildSimulationView() {
    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 80),
        decoration: BoxDecoration(
          color: const Color(0xFF18181B),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF3F3F46)),
        ),
        child: Stack(
          fit: StackFit.expand,
          children: [
            CustomPaint(
              painter: CocoonBoundingBoxPainter(
                detections: _liveTally.detections,
              ),
            ),
            if (_errorMessage != null)
              Positioned(
                top: 20,
                left: 20,
                right: 20,
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.8),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFD97706)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline, color: Color(0xFFD97706), size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(color: Colors.white, fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopStatusBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF27272A)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: _isPaused ? const Color(0xFFF59E0B) : const Color(0xFF10B981),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              _isPaused ? 'PAUSED' : 'AI ACTIVE (1/5th Frame)',
              style: GoogleFonts.poppins(
                color: Colors.black,
                fontSize: 10,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              '${_liveTally.inferenceDurationMs}ms · MobileNetV2',
              style: GoogleFonts.poppins(
                color: const Color(0xFFA1A1AA),
                fontSize: 11,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (!_isCameraReady)
            IconButton(
              icon: const Icon(Icons.refresh, color: Colors.white, size: 20),
              tooltip: 'Resimulate scan'.tr,
              onPressed: _rescanSimulation,
            ),
          if (_isCameraReady)
            IconButton(
              icon: Icon(
                _isPaused ? Icons.play_arrow : Icons.pause,
                color: Colors.white,
                size: 20,
              ),
              tooltip: _isPaused ? 'Resume stream'.tr : 'Freeze frame'.tr,
              onPressed: _togglePause,
            ),
          IconButton(
            icon: const Icon(Icons.close, color: Colors.white, size: 20),
            tooltip: 'Close scanner'.tr,
            onPressed: widget.onClose,
          ),
        ],
      ),
    );
  }

  Widget _buildBottomHud() {
    final tally = _liveTally;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.90),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF27272A)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header summary
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${tally.totalDetected} Cocoons Detected'.tr,
                    style: GoogleFonts.poppins(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    '${tally.defectRatePercent.toStringAsFixed(1)}% Defect Rate · ${tally.commercialGrade}',
                    style: GoogleFonts.poppins(
                      color: tally.defectRatePercent <= 5.0
                          ? const Color(0xFF10B981)
                          : (tally.defectRatePercent <= 10.0
                              ? const Color(0xFFF59E0B)
                              : const Color(0xFFEF4444)),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                onPressed: tally.totalDetected > 0
                    ? () => widget.onApplyTally(tally)
                    : null,
                icon: const Icon(Icons.check, size: 18),
                label: Text(
                  'Apply Tally'.tr,
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(color: Color(0xFF27272A), height: 1),
          const SizedBox(height: 12),

          // Tally classification chips
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _buildClassChip('Clean', tally.cleanCount, const Color(0xFF10B981)),
              _buildClassChip('Thin', tally.thinCount, const Color(0xFFF59E0B)),
              _buildClassChip('Framed', tally.framedCount, const Color(0xFF6366F1)),
              _buildClassChip('Irregular', tally.irregularCount, const Color(0xFF8B5CF6)),
              _buildClassChip('Melted', tally.meltedCount, const Color(0xFFEF4444)),
              _buildClassChip('Double', tally.doubleCount, const Color(0xFFEC4899)),
              _buildClassChip('Stained', tally.stainedCount, const Color(0xFFD97706)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildClassChip(String label, int count, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFF18181B),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: count > 0 ? color : const Color(0xFF27272A),
          width: count > 0 ? 1.5 : 1.0,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            '$label: $count',
            style: GoogleFonts.poppins(
              color: Colors.white,
              fontSize: 11,
              fontWeight: count > 0 ? FontWeight.w600 : FontWeight.w400,
            ),
          ),
        ],
      ),
    );
  }
}

/// Custom painter for rendering high-contrast bounding boxes and labels over the video stream.
class CocoonBoundingBoxPainter extends CustomPainter {
  const CocoonBoundingBoxPainter({required this.detections});

  final List<CocoonDetection> detections;

  @override
  void paint(Canvas canvas, Size size) {
    for (final detection in detections) {
      final rect = Rect.fromLTWH(
        detection.boundingBox.left * size.width,
        detection.boundingBox.top * size.height,
        detection.boundingBox.width * size.width,
        detection.boundingBox.height * size.height,
      );

      final color = detection.defectClass.indicatorColor;

      // 1. Draw bounding box rectangle
      final boxPaint = Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.5;

      canvas.drawRRect(
        RRect.fromRectAndRadius(rect, const Radius.circular(6)),
        boxPaint,
      );

      // 2. Draw label pill background
      final textSpan = TextSpan(
        text: detection.label,
        style: GoogleFonts.poppins(
          color: Colors.black,
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      );

      final textPainter = TextPainter(
        text: textSpan,
        textDirection: TextDirection.ltr,
      )..layout();

      final labelRect = Rect.fromLTWH(
        rect.left,
        (rect.top - textPainter.height - 4).clamp(0.0, size.height),
        textPainter.width + 8,
        textPainter.height + 4,
      );

      final labelPaint = Paint()..color = color;
      canvas.drawRRect(
        RRect.fromRectAndRadius(labelRect, const Radius.circular(4)),
        labelPaint,
      );

      // 3. Draw text label
      textPainter.paint(
        canvas,
        Offset(labelRect.left + 4, labelRect.top + 2),
      );
    }
  }

  @override
  bool shouldRepaint(covariant CocoonBoundingBoxPainter oldDelegate) {
    return oldDelegate.detections != detections;
  }
}
