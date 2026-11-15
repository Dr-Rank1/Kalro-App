import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/components.dart';
import '../l10n/translator.dart';
import '../theme/kalro_colors.dart';

/// Interactive USSD *384# Dialer & Multi-Dialect Audio Guides.
class UssdDialerScreen extends StatefulWidget {
  const UssdDialerScreen({super.key});

  static const routeName = '/ussd-dialer';

  @override
  State<UssdDialerScreen> createState() => _UssdDialerScreenState();
}

class _UssdDialerScreenState extends State<UssdDialerScreen> {
  int _tabIndex = 0; // 0: USSD Simulator, 1: Audio Guides
  final _inputController = TextEditingController(text: '*384#');
  String _currentScreenText =
      'KALRO Sericulture Services:\n1. Mulberry Cultivars (11 Characterized)\n2. Today Cocoon Prices (Grade A/B/C)\n3. Rearing Bed & Lime Calc\n4. Disease Report & Triage\n5. NSRC Thika Extension Desk';
  bool _inSession = false;
  String _playingAudioId = '';

  @override
  void dispose() {
    _inputController.dispose();
    super.dispose();
  }

  void _sendUssd() {
    final query = _inputController.text.trim();
    setState(() {
      _inSession = true;
      if (query == '*384#' || query == '0') {
        _currentScreenText =
            'KALRO Sericulture Services:\n1. Mulberry Cultivars (11 Characterized)\n2. Today Cocoon Prices (Grade A/B/C)\n3. Rearing Bed & Lime Calc\n4. Disease Report & Triage\n5. NSRC Thika Extension Desk';
      } else if (query == '1') {
        _currentScreenText =
            'Mulberry Cultivars:\n- V1 (Premier commercial)\n- Thika (Station benchmark)\n- Embu & Ithaanga (Drought hardy)\n- Limuru (Highland)\n- Kanva 2, S54, S36, Ichinose\nReply 0 to back.';
      } else if (query == '2') {
        _currentScreenText =
            'NSRC Cocoon Buying Rates (KES/kg):\n- Grade A (SR>=21%): KES 850\n- Grade B (SR 17-20%): KES 650\n- Grade C (Rejection): KES 420\nPayment: Instant M-Pesa B2C.\nReply 0 to back.';
      } else if (query == '3') {
        _currentScreenText =
            'Rearing Bed Standard (40k larvae):\n- Instar 1: 1.0 m²\n- Instar 3: 8.0 m²\n- Instar 5: 34.0 m²\nLime: 50g/m² dusting during moult.\nReply 0 to back.';
      } else if (query == '4') {
        _currentScreenText =
            'Disease Triage:\n- Grasserie: NPV virus, oily skin, swollen segments\n- Pebrine: Black spots, quarantine notifiable\n- Muscardine: Chalk white cadaver\nDisinfect with 2% Formalin.\nReply 0 to back.';
      } else if (query == '5') {
        _currentScreenText =
            'NSRC Thika Extension Support:\nPhone: +254 700 000 000\nEmail: sericulture@kalro.org\nP.O. Box 220, Thika Kenya\nReply 0 to back.';
      } else {
        _currentScreenText = 'Invalid option. Reply 0 to return to Main Menu.';
      }
      _inputController.clear();
    });
  }

  void _resetSession() {
    setState(() {
      _inSession = false;
      _inputController.text = '*384#';
      _currentScreenText =
          'KALRO Sericulture Services:\n1. Mulberry Cultivars (11 Characterized)\n2. Today Cocoon Prices (Grade A/B/C)\n3. Rearing Bed & Lime Calc\n4. Disease Report & Triage\n5. NSRC Thika Extension Desk';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: KalroColors.background,
      appBar: AppBar(
        title: Text('USSD *384# & Audio Guides'.tr),
        backgroundColor: KalroColors.headerGreen,
        foregroundColor: Colors.white,
      ),
      body: KalroBackground(
        child: SafeArea(
          child: Column(
            children: [
              Container(
                color: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    _NavBtn(
                      label: 'USSD *384# Phone Simulator'.tr,
                      selected: _tabIndex == 0,
                      onTap: () => setState(() => _tabIndex = 0),
                    ),
                    const SizedBox(width: 8),
                    _NavBtn(
                      label: 'Multi-Dialect Audio Guides'.tr,
                      selected: _tabIndex == 1,
                      onTap: () => setState(() => _tabIndex = 1),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    if (_tabIndex == 0) _buildUssdSimulator(),
                    if (_tabIndex == 1) ..._buildAudioGuides(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildUssdSimulator() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: KalroColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.phone_android, color: KalroColors.headerGreen, size: 20),
              const SizedBox(width: 8),
              Text(
                'Safaricom / Airtel *384# Gateway'.tr,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: KalroColors.textDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // USSD Terminal Screen
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'USSD SESSION ACTIVE',
                      style: GoogleFonts.sourceCodePro(
                        fontSize: 10,
                        color: Colors.greenAccent,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    if (_inSession)
                      InkWell(
                        onTap: _resetSession,
                        child: Text(
                          'CANCEL',
                          style: GoogleFonts.sourceCodePro(
                            fontSize: 10,
                            color: Colors.redAccent,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  _currentScreenText,
                  style: GoogleFonts.sourceCodePro(
                    fontSize: 12,
                    color: Colors.white,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _inputController,
                  keyboardType: TextInputType.text,
                  decoration: InputDecoration(
                    hintText: _inSession ? 'Reply option (e.g. 1, 2, 0)' : '*384#',
                    border: const OutlineInputBorder(),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                  onSubmitted: (_) => _sendUssd(),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: _sendUssd,
                style: ElevatedButton.styleFrom(
                  backgroundColor: KalroColors.headerGreen,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                ),
                child: Text('Send'.tr),
              ),
            ],
          ),
        ],
      ),
    );
  }

  List<Widget> _buildAudioGuides() {
    final guides = [
      {
        'id': 'sw_moult',
        'title': 'Mwongozo wa Ulishaji na Kulala kwa Minyoo (Kiswahili)',
        'dialect': 'Kiswahili',
        'duration': '3m 42s',
        'speaker': 'Afisa wa Ugani KALRO NSRC',
        'notes': 'Maelekezo ya kuweka chokaa (slaked lime) minyoo wanapoingia moult na jinsi ya kuzuia ugonjwa wa Grasserie.',
      },
      {
        'id': 'gik_moult',
        'title': 'Kurera Ngunyu cia Hariri na Rangi wa Makuni (Gikuyu)',
        'dialect': 'Gikuyu (Central Kenya)',
        'duration': '4m 15s',
        'speaker': 'Mwarimu wa Urimi NSRC Thika',
        'notes': 'Uria ungirera ngunyu gicigo-ini gia Kiambu na Murang\'a na kumenya makuni mega ma Grade A.',
      },
      {
        'id': 'kam_castor',
        'title': 'Kwiithya Ngunyu sya Eri kwa Mitiki ya Mbariki (Kikamba)',
        'dialect': 'Kikamba (Eastern Kenya)',
        'duration': '3m 50s',
        'speaker': 'Afisa wa Uimi Machakos / Kitui',
        'notes': 'Matumio ma mbariki ta NUU 70 kwiithya eri silkworms kundu kute mbua mbingi.',
      },
      {
        'id': 'eng_drying',
        'title': 'Hot-Air Chamber Drying Protocol (English)',
        'dialect': 'English (Official Guide)',
        'duration': '2m 58s',
        'speaker': 'Senior Sericulture Research Officer',
        'notes': 'Scientific temperature ramping (115°C to 90°C) to stifling pupae and avoid UV discoloration.',
      },
    ];

    return guides.map((g) {
      final isPlaying = _playingAudioId == g['id'];
      return Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: KalroColors.divider),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    g['title'] as String,
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: KalroColors.textDark,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: KalroColors.headerGreen.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    g['dialect'] as String,
                    style: GoogleFonts.poppins(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: KalroColors.headerGreen,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              g['notes'] as String,
              style: GoogleFonts.poppins(fontSize: 11, color: KalroColors.textMuted, height: 1.3),
            ),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${g['speaker']} • ${g['duration']}',
                  style: GoogleFonts.poppins(fontSize: 10, color: KalroColors.textMuted),
                ),
                IconButton(
                  onPressed: () {
                    setState(() {
                      _playingAudioId = isPlaying ? '' : (g['id'] as String);
                    });
                  },
                  icon: Icon(
                    isPlaying ? Icons.pause_circle_filled : Icons.play_circle_fill,
                    color: KalroColors.headerGreen,
                    size: 28,
                  ),
                ),
              ],
            ),
          ],
        ),
      );
    }).toList();
  }
}

class _NavBtn extends StatelessWidget {
  const _NavBtn({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: selected ? KalroColors.headerGreen : KalroColors.background,
            borderRadius: BorderRadius.circular(6),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: GoogleFonts.poppins(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: selected ? Colors.white : KalroColors.textDark,
            ),
          ),
        ),
      ),
    );
  }
}
