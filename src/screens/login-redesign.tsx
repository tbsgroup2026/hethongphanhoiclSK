import { useState, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Text } from "@/components/scaled-text";
import { useAuth } from "@/lib/auth-context";
import { ApiError, getServerUrl } from "@/lib/api";
import { colors } from "@/constants/colors";
import { spacing, radius, typography } from "@/constants/ui-theme";
import { BrandMark } from "@/components/brand-mark";
import { PressableScale } from "@/components/pressable-scale";

const DEMO_ACCOUNTS: { code: string; label: string; icon: string; role: string }[] = [
  { code: "NV001", label: "Vận hành", icon: "👷", role: "OPERATOR" },
  { code: "QA001", label: "QA", icon: "🔍", role: "QA" },
  { code: "LL001", label: "Trưởng line", icon: "👔", role: "LINE_LEADER" },
  { code: "CN001", label: "Công nghệ", icon: "⚙️", role: "TECHNOLOGY" },
  { code: "BT001", label: "Bảo trì", icon: "🔧", role: "MAINTENANCE" },
];

export default function LoginScreenRedesign() {
  const { token, login } = useAuth();
  const [employeeCode, setEmployeeCode] = useState("");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [serverHost, setServerHost] = useState("Đang tải...");

  useEffect(() => {
    getServerUrl().then((url) => setServerHost(url));
  }, []);

  if (token) return <Redirect href="/(tabs)" />;

  function handleSelectRole(code: string) {
    setEmployeeCode(code);
    setPassword("123456");
    setSelectedRole(code);
    setError(null);
  }

  async function doLogin(code: string, pass: string) {
    setError(null);
    setLoading(true);
    try {
      await login(code.trim(), pass);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Không thể kết nối tới máy chủ. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!employeeCode.trim() || !password.trim()) {
      setError("Vui lòng điền tên đăng nhập và mật khẩu.");
      return;
    }
    await doLogin(employeeCode, password);
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Section */}
        <Animated.View entering={FadeInUp.duration(600)} style={s.brandSection}>
          <View style={s.logoWrap}>
            <BrandMark size={56} />
          </View>
          <Text style={s.brandTitle}>TBS HTPH-CLSK</Text>
          <Text style={s.brandSubtitle}>Hệ Thống Phản Hồi & Xử Lý Sự Cố</Text>
        </Animated.View>

        {/* Demo Accounts */}
        <Animated.View entering={FadeInUp.delay(100).duration(600)} style={s.demoSection}>
          <Text style={s.demoTitle}>Chọn vai trò kiểm thử nhanh</Text>
          <View style={s.demoGrid}>
            {DEMO_ACCOUNTS.map((account) => (
              <PressableScale
                key={account.code}
                style={[
                  s.demoCard,
                  selectedRole === account.code && s.demoCardActive,
                ]}
                onPress={() => handleSelectRole(account.code)}
              >
                <Text style={s.demoIcon}>{account.icon}</Text>
                <Text
                  style={[
                    s.demoLabel,
                    selectedRole === account.code && s.demoLabelActive,
                  ]}
                >
                  {account.label}
                </Text>
              </PressableScale>
            ))}
          </View>
        </Animated.View>

        {/* Divider */}
        <View style={s.divider} />

        {/* Form Section */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={s.formSection}>
          <Text style={s.formTitle}>Đăng nhập</Text>

          {/* Employee Code Input */}
          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>Mã nhân viên</Text>
            <View style={s.inputWrapper}>
              <Text style={s.inputIcon}>👤</Text>
              <TextInput
                value={employeeCode}
                onChangeText={setEmployeeCode}
                placeholder="VD: NV001"
                placeholderTextColor={colors.textMuted}
                style={s.input}
                editable={!loading}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={s.inputGroup}>
            <View style={s.inputLabelRow}>
              <Text style={s.inputLabel}>Mật khẩu</Text>
              <Text style={s.inputHint}>(mặc định: 123456)</Text>
            </View>
            <View style={s.inputWrapper}>
              <Text style={s.inputIcon}>🔒</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Nhập mật khẩu"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                style={s.input}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={s.inputToggle}
              >
                <Text>{showPassword ? "👁️" : "🚫"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Error Message */}
          {error && (
            <Animated.View
              entering={FadeInDown.duration(300)}
              style={s.errorBanner}
            >
              <Text style={s.errorIcon}>⚠️</Text>
              <Text style={s.errorText}>{error}</Text>
            </Animated.View>
          )}

          {/* Login Button */}
          <PressableScale
            style={[s.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Text style={s.loginBtnText}>Đăng nhập</Text>
                <Text style={s.loginBtnArrow}>→</Text>
              </>
            )}
          </PressableScale>

          {/* Server Info */}
          <Text style={s.serverInfo}>Server: {serverHost}</Text>
        </Animated.View>

        {/* Footer */}
        <Animated.View entering={FadeInUp.delay(300).duration(600)} style={s.footer}>
          <Text style={s.footerText}>
            © 2026 TBS Group • Phản hồi & Xử lý Sự cố Chất lượng
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },

  // Brand
  brandSection: {
    alignItems: "center",
    paddingVertical: spacing.xxxl,
    gap: spacing.lg,
  },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  brandTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  brandSubtitle: {
    fontSize: typography.body.fontSize,
    color: colors.textMuted,
    textAlign: "center",
    maxWidth: "80%",
  },

  // Demo Accounts
  demoSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  demoTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.lg,
  },
  demoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  demoCard: {
    flex: 1,
    minWidth: "28%",
    backgroundColor: colors.surfaceBg,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    gap: spacing.sm,
  },
  demoCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  demoIcon: {
    fontSize: 28,
  },
  demoLabel: {
    fontSize: typography.labelSmall.fontSize,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
  demoLabelActive: {
    color: colors.white,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xl,
  },

  // Form
  formSection: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  formTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: "600",
    color: colors.text,
  },

  // Inputs
  inputGroup: {
    gap: spacing.sm,
  },
  inputLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputLabel: {
    fontSize: typography.body.fontSize,
    fontWeight: "600",
    color: colors.text,
  },
  inputHint: {
    fontSize: typography.labelSmall.fontSize,
    color: colors.textMuted,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.text,
  },
  inputIcon: {
    fontSize: 18,
  },
  inputToggle: {
    padding: spacing.sm,
  },

  // Error
  errorBanner: {
    backgroundColor: "#FEE2E2",
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  errorIcon: {
    fontSize: 18,
    marginTop: 2,
  },
  errorText: {
    flex: 1,
    color: "#991B1B",
    fontSize: typography.bodySmall.fontSize,
    fontWeight: "500",
  },

  // Login Button
  loginBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  loginBtnText: {
    color: colors.white,
    fontSize: typography.body.fontSize,
    fontWeight: "600",
  },
  loginBtnArrow: {
    color: colors.white,
    fontSize: 20,
  },

  // Server Info
  serverInfo: {
    fontSize: typography.labelSmall.fontSize,
    color: colors.textMuted,
    textAlign: "center",
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  footerText: {
    fontSize: typography.labelSmall.fontSize,
    color: colors.textMuted,
    textAlign: "center",
  },
});
