import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Base tab bar scale — all dimensions derive from this to keep ratios consistent */
export const TAB_BAR_SCALE = 0.88;

/** Match HomeScreen content horizontal padding (~20px on 430px width) */
export const TAB_BAR_HORIZONTAL_INSET = SCREEN_WIDTH * 0.047;

export const TAB_ICON_SIZE = 26 * TAB_BAR_SCALE;
export const TAB_ACTIVE_CIRCLE_SIZE = 44 * TAB_BAR_SCALE;

const TAB_BAR_HEIGHT = 80 * TAB_BAR_SCALE;
export const TAB_BAR_BOTTOM = 26 * TAB_BAR_SCALE;
const TAB_BAR_PADDING_VERTICAL = 8 * (TAB_BAR_SCALE / 0.8);
const TAB_BAR_PADDING_HORIZONTAL = 10 * (TAB_BAR_SCALE / 0.8);

/** Outer wrapper positions the floating pill; applied in CustomTabBar */
export const tabBarWrapperStyle = {
  position: 'absolute' as const,
  left: TAB_BAR_HORIZONTAL_INSET,
  right: TAB_BAR_HORIZONTAL_INSET,
  bottom: TAB_BAR_BOTTOM,
  borderRadius: 100,
  overflow: 'hidden' as const,
};

export const defaultTabBarStyle = {
  backgroundColor: 'rgba(2, 12, 25, 0.94)',
  borderTopWidth: 0,
  borderWidth: 0.3,
  borderColor: 'rgba(255, 255, 255, 0.12)',
  height: TAB_BAR_HEIGHT,
  paddingBottom: TAB_BAR_PADDING_VERTICAL,
  paddingTop: TAB_BAR_PADDING_VERTICAL,
  paddingHorizontal: TAB_BAR_PADDING_HORIZONTAL,
  width: '100%' as const,
  borderRadius: 100,
  overflow: 'hidden' as const,
  elevation: 0,
  shadowOpacity: 0,
};

/** Extra scroll padding so list content clears the floating tab bar */
export const getTabBarScrollPadding = (safeAreaBottom = 0, extraSpacing = 32) =>
  TAB_BAR_BOTTOM + TAB_BAR_HEIGHT + extraSpacing + safeAreaBottom;
