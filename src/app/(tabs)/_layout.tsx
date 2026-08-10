import { useEffect, useRef } from "react";
import { Redirect, Tabs } from "expo-router";
import { Animated, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import { useAuth } from "@/lib/auth-context";
import { colors } from "@/constants/colors";
import { spacing, radius } from "@/constants/ui-theme";

// Clean icon set using expo-symbols (modern system icons)
function TabIcon({ name, focused }: { name: "home" | "notifications" | "wrench" | "person"; focused: boolean }) {
  const scale = useRef(new Animated.Value(focused ? 1 : 0.9)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.08 : 0.9,
      useNativeDriver: true,
      friction: 7,
      tension: 100,
    }).start();
  }, [focused, scale]);

  const iconMap = {
    home: "house.fill",
    notifications: "bell.fill",
    wrench: "wrench.fill",
    person: "person.fill",
  };

  const iconName = iconMap[name];
  const tintColor = focused ? colors.primary : colors.textMuted;

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <SymbolView
        name={iconName}
        size={24}
        tintColor={tintColor}
        resizeMode="scaleAspectFit"
      />
    </Animated.View>
  );
}

export default function TabsLayout() {
  const { token, loading, user } = useAuth();
  const insets = useSafeAreaInsets();

  if (loading) return null;
  if (!token) return <Redirect href="/login" />;

  const canSeeWorkTab = user?.role === "MAINTENANCE" || user?.role === "DEPARTMENT_HEAD";

  return (
    <Tabs
      screenOptions={{
        // Header styling
        headerStyle: {
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          shadowColor: "transparent",
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 18,
          color: colors.text,
        },
        
        // Tab bar styling
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: spacing.xs,
        },
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingTop: spacing.md,
          paddingBottom: Math.max(insets.bottom, spacing.md),
          borderTopWidth: 1,
          borderTopColor: colors.border,
          borderRadius: 0,
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          paddingTop: spacing.xs,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang chủ",
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Thông báo",
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="notifications" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="work"
        options={{
          title: "Công việc",
          headerShown: false,
          href: canSeeWorkTab ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon name="wrench" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Cá nhân",
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
