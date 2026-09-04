import { View } from 'react-native';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { AppText } from '@/components/ui/AppText';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { getRtlRow } from '@/lib/rtl';

/**
 * Architecture fixture — only AppText / AppTextInput / getRtlRow.
 * Must stay free of physical-edge textAlign, LTR islands, and reversed rows.
 */
export function RtlPolicyFixture() {
  return (
    <View>
      <AppText>عنوان القسم</AppText>
      <AppText>نص عربي</AppText>
      <AppTextInput label="عنوان الحقل" placeholder="اكتب هنا" />
      <View style={getRtlRow()}>
        <AppIcon name="location-outline" size={16} color="#1B4D3E" />
        <AppText>أيقونة مع نص</AppText>
      </View>
      <PrimaryButton title="زر" onPress={() => undefined} />
    </View>
  );
}
