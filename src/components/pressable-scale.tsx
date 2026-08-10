import { Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

/**
 * Thin visual wrapper around Pressable that adds a subtle scale-down
 * animation on press. Purely presentational — forwards all press handling
 * and props to the underlying Pressable, so it never changes behavior.
 */
export function PressableScale({
  style,
  children,
  scaleTo = 0.96,
  onPressIn,
  onPressOut,
  ...rest
}: PressableProps & { style?: StyleProp<ViewStyle>; scaleTo?: number }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={(e) => {
          scale.value = withTiming(scaleTo, { duration: 90 });
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          scale.value = withTiming(1, { duration: 140 });
          onPressOut?.(e);
        }}
        style={style}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
