import { useState, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Pressable,
} from "react-native";
import { Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Animated, { FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/scaled-text";
import { useAuth } from "@/lib/auth-context";
import { ApiError, getServerUrl, setServerUrl } from "@/lib/api";
import { colors } from "@/constants/colors";
import { BrandMark } from "@/components/brand-mark";
import { PressableScale } from "@/components/pressable-scale";
import { spacing, radius } from "@/constants/ui-theme";

// ─── DANH SÁCH 5 VAI TRÒ KIỂM THỬ NHANH (CẬP NHẬT DESIGN) ──────────────────
const DEMO_ACCOUNTS: { code: string; label: string; description: string }[] = [
  { code: "NV001", label: "Vận hành", description: "Nhân viên sản xuất" },
  { code: "QA001", label: "QA", description: "Kiểm soát chất lượng" },
  { code: "LL001", label: "Trưởng line", description: "Quản lý dây chuyền" },
  { code: "CN001", label: "Công nghệ", description: "Hỗ trợ kỹ thuật" },
  { code: "TP001", label: "Quản lý", description: "Trưởng phòng" },
];
const DEMO_PASSWORD = "123456";
// ─────────────────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const { token, login } = useAuth();
  const [employeeCode, setEmployeeCode] = useState("");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Server URL Configuration state
  const [serverHost, setServerHost] = useState("Đang tải...");
  const [showServerModal, setShowServerModal] = useState(false);
  const [customServer, setCustomServer] = useState("");

  useEffect(() => {
    getServerUrl().then((url) => setServerHost(url));
  }, []);

  if (token) return <Redirect href="/(tabs)" />;

  function handleSelectRole(code: string) {
    setEmployeeCode(code);
    setPassword(DEMO_PASSWORD);
    setSelectedRole(code);
    setError(null);
  }

  async function doLogin(code: string, pass: string) {
    setError(null);
    setLoading(true);
    try {
      await login(code.trim(), pass);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Không thể kết nối tới máy chủ.");
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
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Logo container */}
          <View style={styles.logoWrap}>
            <BrandMark size={44} />
          </View>

          {/* Title & Brand Slogan */}
          <Text style={styles.brandTitle}>TBS HTPH-CLSK</Text>
          <Text style={styles.brandSubtitle}>
            Hệ Thống Phản Hồi & Xử Lý Sự Cố Chất Lượng
          </Text>

          <View style={styles.infoPill}>
            <Text style={styles.infoPillText}>🌿 Cổng Đăng Nhập Di Động Phân Xưởng</Text>
          </View>

          {/* 1-Tap Quick Role Picker */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Chọn nhanh vai trò</Text>
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>5 Roles</Text>
            </View>
          </View>

          <View style={styles.demoGrid}>
            {DEMO_ACCOUNTS.map((acc, idx) => {
              const isSelected = employeeCode === acc.code || selectedRole === acc.code;
              return (
                <Animated.View
                  key={acc.code}
                  entering={FadeInUp.delay(idx * 50).springify()}
                >
                  <PressableScale onPress={() => handleSelectRole(acc.code)} disabled={loading}>
                    <View
                      style={[
                        styles.demoPill,
                        isSelected && styles.demoPillActive,
                      ]}
                    >
                      <View
                        style={[
                          styles.roleDot,
                          isSelected && styles.roleDotActive,
                        ]}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.demoPillText,
                            isSelected && styles.demoPillTextActive,
                          ]}
                        >
                          {acc.label}
                        </Text>
                        <Text
                          style={[
                            styles.demoPillDesc,
                            isSelected && styles.demoPillDescActive,
                          ]}
                        >
                          {acc.description}
                        </Text>
                      </View>
                    </View>
                  </PressableScale>
                </Animated.View>
              );
            })}
          </View>

          <View style={styles.divider} />

          {/* Input: Username */}
          <Text style={styles.label}>Tên đăng nhập (Mã nhân viên)</Text>
          <TextInput
            value={employeeCode}
            onChangeText={(v) => {
              setEmployeeCode(v);
              setSelectedRole(null);
            }}
            autoCapitalize="characters"
            placeholder="VD: NV001, QA001, LL001..."
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />

          {/* Input: Password */}
          <Text style={styles.label}>Mật khẩu</Text>
          <View style={styles.passwordWrap}>
            <Text style={styles.inputPrefix}>🔒</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="Nhập mật khẩu"
              placeholderTextColor="#94A3B8"
              style={styles.passwordInput}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword((s) => !s)}
            >
              <Text style={styles.eyeIcon}>{showPassword ? "👁" : "👁‍🗨"}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hintText}>
            Demo mặc định: <Text style={styles.hintBold}>123456</Text>
          </Text>

          {/* Error message */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Primary Submit Button (TBS Green) */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>
              {loading ? "Đang kết nối hệ thống..." : "Đăng Nhập"}
            </Text>
          </TouchableOpacity>

          {/* Server Config Button */}
          <TouchableOpacity
            style={styles.serverButton}
            onPress={async () => {
              const current = await getServerUrl();
              setCustomServer(current);
              setShowServerModal(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.serverButtonText}>⚙️ Máy chủ: {serverHost}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Cấu hình Server URL */}
      {showServerModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cấu Hình Địa Chỉ Máy Chủ</Text>
            <Text style={styles.modalSub}>
              Nhập IP máy chủ phân xưởng hoặc Domain của hệ thống TBS HTPH-CLSK
            </Text>
            <TextInput
              value={customServer}
              onChangeText={setCustomServer}
              placeholder="VD: http://192.168.1.100:3000"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowServerModal(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={async () => {
                  if (customServer.trim()) {
                    await setServerUrl(customServer.trim());
                    setServerHost(customServer.trim());
                  }
                  setShowServerModal(false);
                }}
              >
                <Text style={styles.modalSaveText}>Lưu Cấu Hình</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.lg,
    padding: spacing.xxxl,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#005A36",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  logoWrap: {
    alignSelf: "center",
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  brandSubtitle: {
    fontSize: 12.5,
    color: "#005A36",
    fontWeight: "600",
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  infoPill: {
    alignSelf: "center",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.lg,
  },
  infoPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#005A36",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  badgeCount: {
    backgroundColor: "#ECFDF5",
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeCountText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#005A36",
  },
  demoGrid: {
    gap: spacing.sm,
  },
  demoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: "#F8FAFC",
  },
  demoPillActive: {
    borderColor: "#005A36",
    backgroundColor: "#005A36",
    shadowColor: "#005A36",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  roleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#CBD5E1",
  },
  roleDotActive: {
    backgroundColor: "#10B981",
  },
  demoPillText: {
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 13,
  },
  demoPillTextActive: {
    color: "#FFFFFF",
  },
  demoPillDesc: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: spacing.xs,
    fontWeight: "500",
  },
  demoPillDescActive: {
    color: "#D1FAE5",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#334155",
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingLeft: spacing.xxxl,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
  },
  inputPrefix: {
    position: "absolute",
    left: spacing.md,
    fontSize: 16,
  },
  passwordWrap: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingLeft: spacing.xxxl,
    paddingRight: spacing.xxxl,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
  },
  eyeButton: {
    position: "absolute",
    right: spacing.md,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  eyeIcon: {
    fontSize: 14,
  },
  hintText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: spacing.sm,
  },
  hintBold: {
    fontWeight: "700",
    color: "#005A36",
  },
  errorBox: {
    marginTop: spacing.lg,
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderLeftWidth: 3,
    borderLeftColor: "#DC2626",
    padding: spacing.md,
    borderRadius: radius.md,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "600",
  },
  button: {
    marginTop: spacing.xxxl,
    backgroundColor: "#005A36",
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: "center",
    shadowColor: "#005A36",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  serverButton: {
    marginTop: spacing.lg,
    alignSelf: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 999,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  serverButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: radius.lg,
    padding: spacing.xxl,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 13.5,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
  },
  modalCancel: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
  },
  modalCancelText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  modalSave: {
    backgroundColor: "#005A36",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    shadowColor: "#005A36",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 1,
  },
  modalSaveText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
