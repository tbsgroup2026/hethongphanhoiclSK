import { useState, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  Image as RNImage,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Text } from "@/components/scaled-text";
import { useAuth } from "@/lib/auth-context";
import { api, resolveImageUrl, ApiError, UserPublic } from "@/lib/api";
import { colors } from "@/constants/colors";
import { spacing, radius, typography } from "@/constants/ui-theme";
import { PressableScale } from "@/components/pressable-scale";

export default function ProfileScreenRedesign() {
  const router = useRouter();
  const { token, user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  useFocusEffect(
    useCallback(() => {
      // Refresh profile on focus
    }, []),
  );

  async function handlePickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
      aspect: [1, 1],
    });

    if (result.canceled || !result.assets?.[0]?.base64 || !token) return;

    setUpdatingAvatar(true);
    try {
      const asset = result.assets[0];
      const uploaded = await api.uploadImage(token, asset.base64!, asset.mimeType || "image/jpeg");
      await api.updateAvatar(token, uploaded.url);
      // Refresh user context
    } catch {
      Alert.alert("Lỗi", "Không thể cập nhật ảnh đại diện");
    } finally {
      setUpdatingAvatar(false);
    }
  }

  async function handleLogout() {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        onPress: async () => {
          setLoading(true);
          try {
            await logout();
            router.replace("/login");
          } finally {
            setLoading(false);
          }
        },
        style: "destructive",
      },
    ]);
  }

  const roleLabel: Record<string, string> = {
    ADMIN: "Quản trị viên",
    OPERATOR: "Vận hành",
    QA: "QA kiểm chất",
    LINE_LEADER: "Trưởng chuyền",
    TECHNOLOGY: "Công nghệ",
    DEPARTMENT_HEAD: "Trưởng phòng",
    MAINTENANCE: "Bảo trì",
    DIRECTOR: "Giám đốc",
  };

  if (!user) {
    return (
      <SafeAreaView style={s.container}>
        <Text>Đang tải...</Text>
      </SafeAreaView>
    );
  }

  const roleText = roleLabel[user.role] || user.role;
  const avatarUrl = user.avatarUrl ? resolveImageUrl(user.avatarUrl) : null;

  return (
    <SafeAreaView style={s.container}>
      <StatusBar style="dark" />

      <ScrollView showsVerticalScrollIndicator={false} style={s.scrollView}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Cá nhân</Text>
        </View>

        {/* Profile Card */}
        <View style={s.profileCard}>
          <View style={s.avatarSection}>
            <View style={s.avatarContainer}>
              {avatarUrl ? (
                <RNImage source={{ uri: avatarUrl }} style={s.avatarImage} />
              ) : (
                <View style={s.avatarPlaceholder}>
                  <Text style={s.avatarText}>
                    {(user.name || "?").trim().charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              {updatingAvatar && (
                <View style={s.avatarLoading}>
                  <ActivityIndicator color={colors.white} size="small" />
                </View>
              )}

              <TouchableOpacity
                style={s.avatarEditBtn}
                onPress={handlePickAvatar}
                disabled={updatingAvatar}
              >
                <Text style={s.avatarEditIcon}>📷</Text>
              </TouchableOpacity>
            </View>

            <View style={s.profileInfo}>
              <Text style={s.profileName}>{user.name}</Text>
              <Text style={s.profileRole}>{roleText}</Text>
              {user.area && <Text style={s.profileArea}>{user.area.name}</Text>}
            </View>
          </View>
        </View>

        {/* Details Section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Chi tiết</Text>

          {user.employeeCode && (
            <InfoRow label="Mã nhân viên" value={user.employeeCode} />
          )}
          {user.phone && <InfoRow label="Số điện thoại" value={user.phone} />}
          {user.role && <InfoRow label="Vai trò" value={roleText} />}
          {user.area && <InfoRow label="Khu vực" value={user.area.name} />}
        </View>

        {/* Stats Section */}
        {user.stats && (user.stats.totalTasks || user.stats.completedTasks) && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Thống kê</Text>
            <View style={s.statsGrid}>
              {user.stats.totalTasks !== undefined && (
                <StatCard
                  label="Tổng nhiệm vụ"
                  value={user.stats.totalTasks}
                  color={colors.info}
                />
              )}
              {user.stats.completedTasks !== undefined && (
                <StatCard
                  label="Đã hoàn thành"
                  value={user.stats.completedTasks}
                  color={colors.success}
                />
              )}
            </View>
          </View>
        )}

        {/* Settings Section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Cài đặt</Text>

          <SettingRow
            icon="🔔"
            label="Thông báo"
            value="Bật"
            onPress={() => {}}
          />
          <SettingRow
            icon="🌙"
            label="Chế độ tối"
            value="Tự động"
            onPress={() => {}}
          />
          <SettingRow
            icon="ℹ️"
            label="Phiên bản ứng dụng"
            value="1.0.0"
            onPress={() => {}}
            disabled
          />
        </View>

        {/* Actions */}
        <View style={s.actions}>
          <PressableScale
            style={[s.logoutBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogout}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.error} />
            ) : (
              <>
                <Text style={s.logoutIcon}>🚪</Text>
                <Text style={s.logoutText}>Đăng xuất</Text>
              </>
            )}
          </PressableScale>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[s.statCard, { borderTopColor: color }]}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}</Text>
    </View>
  );
}

function SettingRow({
  icon,
  label,
  value,
  onPress,
  disabled = false,
}: {
  icon: string;
  label: string;
  value: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity style={s.settingRow} onPress={onPress} disabled={disabled}>
      <View style={s.settingContent}>
        <Text style={s.settingIcon}>{icon}</Text>
        <View>
          <Text style={s.settingLabel}>{label}</Text>
          <Text style={s.settingValue}>{value}</Text>
        </View>
      </View>
      {!disabled && <Text style={s.settingArrow}>›</Text>}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: "700",
    color: colors.text,
  },

  // Profile Card
  profileCard: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xl,
    backgroundColor: colors.surfaceBg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarSection: {
    flexDirection: "row",
    gap: spacing.lg,
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    width: 80,
    height: 80,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.white,
  },
  avatarLoading: {
    position: "absolute",
    inset: 0,
    borderRadius: radius.full,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarEditBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarEditIcon: {
    fontSize: 16,
  },

  profileInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  profileName: {
    fontSize: typography.h3.fontSize,
    fontWeight: "700",
    color: colors.text,
  },
  profileRole: {
    fontSize: typography.body.fontSize,
    color: colors.primary,
    fontWeight: "600",
  },
  profileArea: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textMuted,
  },

  // Sections
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: "600",
    color: colors.text,
  },

  // Info Rows
  infoRow: {
    paddingVertical: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoLabel: {
    fontSize: typography.body.fontSize,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: typography.body.fontSize,
    fontWeight: "600",
    color: colors.text,
  },

  // Stats
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopWidth: 3,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  statLabel: {
    fontSize: typography.labelSmall.fontSize,
    color: colors.textMuted,
  },
  statValue: {
    fontSize: typography.h3.fontSize,
    fontWeight: "700",
    color: colors.text,
  },

  // Settings Rows
  settingRow: {
    paddingVertical: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  settingContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  settingIcon: {
    fontSize: 24,
  },
  settingLabel: {
    fontSize: typography.body.fontSize,
    fontWeight: "500",
    color: colors.text,
  },
  settingValue: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  settingArrow: {
    fontSize: 20,
    color: colors.textMuted,
    marginLeft: spacing.md,
  },

  // Actions
  actions: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  logoutBtn: {
    backgroundColor: "#FEE2E2",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingVertical: spacing.lg,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  logoutIcon: {
    fontSize: 20,
  },
  logoutText: {
    fontSize: typography.body.fontSize,
    fontWeight: "600",
    color: colors.error,
  },
});
