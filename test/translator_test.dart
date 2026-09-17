import 'package:flutter_test/flutter_test.dart';
import 'package:kalro/l10n/translator.dart';

void main() {
  tearDown(() {
    Translator.currentLanguage = 'en';
  });

  test('English toggle leaves copy unchanged', () {
    Translator.currentLanguage = 'en';
    expect('Feed today'.tr, 'Feed today');
    expect('Egg incubation'.tr, 'Egg incubation');
  });

  test('Swahili toggle translates farmer-facing copy', () {
    Translator.currentLanguage = 'sw';
    expect('Today'.tr, 'Leo');
    expect('Batches'.tr, isNot('Batches'));
    expect('Egg incubation'.tr, isNot('Egg incubation'));
    expect('Sign in'.tr, isNot('Sign in'));
    expect('Harvest window'.tr, isNot('Harvest window'));
    expect('Grasserie (NPV)'.tr, isNotEmpty);
    expect(
      'Incubate eggs. Watch temperature and humidity. Prepare the rearing room.'
          .tr,
      isNot(
        'Incubate eggs. Watch temperature and humidity. Prepare the rearing room.',
      ),
    );
  });

  test('Swahili fills interpolated templates', () {
    Translator.currentLanguage = 'sw';
    expect(Translator.fill('Feed {g} g', {'g': '45'}), contains('45'));
    expect('Feed 45 g'.tr, isNot('Feed 45 g'));
    expect(
      'Need 1.20 kg today · stock 3.0 kg · tap Farm to update.'.tr,
      isNot(contains('Need 1.20')),
    );
    expect('in 3 days'.tr.toLowerCase(), isNot(contains('in 3 days')));
    expect('Day 5 / 40'.tr, isNot('Day 5 / 40'));
    expect('Stop feeding — 1st moult'.tr, isNot('Stop feeding — 1st moult'));
    expect('Change PIN'.tr, isNot('Change PIN'));
    expect('This season'.tr, isNot('This season'));
    expect(
      Translator.fill('Signed in as {name}', {'name': 'Amina'}),
      contains('Amina'),
    );
  });

  test('compound strings translate each part', () {
    Translator.currentLanguage = 'sw';
    final out = 'Harvest · Rest day'.tr;
    expect(out, isNot('Harvest · Rest day'));
    expect(out.contains('·'), isTrue);
  });
}
