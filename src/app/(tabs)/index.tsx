import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/scaled-text";
import { useAuth } from "@/lib/auth-context";
import { api, QualityIssue, IssueStatus, Severity, ApiError, resolveImageUrl } from "@/lib/api";
import { colors } from "@/constants/colors";
import { spacing, radius, typography } from "@/constants/ui-theme";
import { PressableScale } from "@/components/pressable-scale";
import { ComboBoxField } from "@/components/combo-box-field";
import { SEVERITY_OPTIONS, severityLabel, severityBadgeStyle } from "@/constants/severity";
import { IssueCard } from "@/components/issue-card";

const OTHER_FAILURE_ID = "OTHER";

const statusLabel: Record<IssueStatus, string> = {
  REPORTED: "Vừa báo cáo",
  INVESTIGATING: "Đang điều tra",
  ROOT_CAUSE_FOUND: "Đã xác định",
  ASSIGNED: "Đã giao việc",
  IN_PROGRESS: "Đang xử lý",
  DONE: "Đã hoàn thành",
};

type Option = { id: string; name: string };

export default function HomeScreenRedesign() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [issues, setIssues] = useState<QualityIssue[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCheckForm, setShowCheckForm] = useState(false);
  const [checkPoCode, setCheckPoCode] = useState("");
  const [checkResults, setCheckResults] = useState<QualityIssue[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  const [areas, setAreas] = useState<Option[]>([]);
  const [teams, setTeams] = useState<Option[]>([]);
  const [lines, setLines] = useState<Option[]>([]);
  const [failureCategories, setFailureCategories] = useState<Option[]>([]);
  const [areaId, setAreaId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [productionLineId, setProductionLineId] = useState("");
  const [failureCategoryId, setFailureCategoryId] = useState("");
  const [otherFailureNote, setOtherFailureNote] = useState("");
  const [severity, setSeverity] = useState<Severity | "">("");
  const [poCode, setPoCode] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    const data = await api.listMyIssues(token);
    setIssues(data);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function openReportForm() {
    setError(null);
    setShowReportForm(true);
    if (token) {
      const defaultAreaId = user?.area?.id || "";
      setAreaId(defaultAreaId);
      setTeamId("");
      setProductionLineId("");
      const [areaOpts, lineOpts, failureOpts] = await Promise.all([
        api.listAreas(token),
        api.listProductionLines(token, defaultAreaId || undefined),
        api.listFailureCategories(token),
      ]);
      setAreas(areaOpts);
      setLines(lineOpts);
      setTeams([]);
      setFailureCategories(failureOpts);
    }
  }

  function openCheckForm() {
    setCheckError(null);
    setCheckResults(null);
    setCheckPoCode("");
    setShowCheckForm(true);
  }

  async function handleCheck() {
    if (!token) return;
    if (!checkPoCode.trim()) {
      setCheckError("Vui lòng nhập mã PO/SP");
      return;
    }
    setChecking(true);
    setCheckError(null);
    try {
      const results = await api.searchIssuesByPoCode(token, checkPoCode.trim());
      setCheckResults(results);
    } catch (e) {
      setCheckError(e instanceof ApiError ? e.message : "Không thể tra cứu, thử lại");
    } finally {
      setChecking(false);
    }
  }

  async function handleAreaChange(nextAreaId: string) {
    setAreaId(nextAreaId);
    setProductionLineId("");
    setTeamId("");
    setTeams([]);
    if (!token) return;
    const lineOpts = await api.listProductionLines(token, nextAreaId || undefined);
    setLines(lineOpts);
  }

  async function handleLineChange(nextLineId: string) {
    setProductionLineId(nextLineId);
    setTeamId("");
    if (!token) return;
    const teamOpts = await api.listTeams(token, nextLineId || undefined);
    setTeams(teamOpts);
  }

  async function handlePickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.6,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]?.base64 || !token) return;
    setUploadingImage(true);
    try {
      const asset = result.assets[0];
      const uploaded = await api.uploadImage(token, asset.base64!, asset.mimeType || "image/jpeg");
      setImages((prev) => [...prev, uploaded.url]);
    } catch {
      setError("Không thể tải ảnh lên");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmitReport() {
    if (!token) return;
    if (!poCode.trim() || !description.trim()) {
      setError("Vui lòng nhập mã PO và mô tả");
      return;
    }
    if (!areaId) {
      setError("Vui lòng chọn khu vực/xưởng");
      return;
    }
    if (!severity) {
      setError("Vui lòng chọn mức độ nghiêm trọng");
      return;
    }
    if (!failureCategoryId) {
      setError("Vui lòng chọn danh mục lỗi");
      return;
    }
    if (failureCategoryId === OTHER_FAILURE_ID && !otherFailureNote.trim()) {
      setError("Vui lòng mô tả lỗi khác");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.reportIssue(token, {
        areaId,
        teamId: teamId || undefined,
        productionLineId: productionLineId || undefined,
        failureCategoryId: failureCategoryId === OTHER_FAILURE_ID ? undefined : failureCategoryId,
        otherFailureNote: failureCategoryId === OTHER_FAILURE_ID ? otherFailureNote.trim() : undefined,
        severity,
        poCode: poCode.trim(),
        description: description.trim(),
        images,
      });
      setShowReportForm(false);
      setAreaId("");
      setTeamId("");
      setProductionLineId("");
      setFailureCategoryId("");
      setOtherFailureNote("");
      setSeverity("");
      setPoCode("");
      setDescription("");
      setImages([]);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Không thể gửi báo cáo");
    } finally {
      setSubmitting(false);
    }
  }

  const reportedCount = issues.filter((i) => i.status === "REPORTED").length;
  const inProgressCount = issues.filter((i) => i.status === "IN_PROGRESS").length;

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <StatusBar style="dark" />

      <FlatList
        data={issues}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={
          <HeaderSection
            userName={user?.name || "Nhân viên"}
            reportedCount={reportedCount}
            inProgressCount={inProgressCount}
            onReportPress={openReportForm}
            onCheckPress={openCheckForm}
          />
        }
        ListEmptyComponent={
          <EmptyState />
        }
        renderItem={({ item, index }) => (
          <IssueCard
            issueId={item.id}
            poCode={item.poCode}
            description={item.description}
            status={item.status}
            severity={item.severity}
            reportedAt={item.createdAt}
            delay={index * 30}
            onPress={() => router.push(`/issue/${item.id}`)}
          />
        )}
        scrollIndicatorInsets={{ right: 1 }}
      />

      {/* Report Modal */}
      <Modal visible={showReportForm} transparent animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modalContainer}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setShowReportForm(false)}>
              <Text style={s.modalHeaderClose}>✕</Text>
            </TouchableOpacity>
            <Text style={s.modalHeaderTitle}>Báo cáo vấn đề</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={s.modalContent}>
            <FormSection label="Mã PO">
              <TextInput
                value={poCode}
                onChangeText={setPoCode}
                placeholder="VD: PO-2026-001"
                style={s.input}
                placeholderTextColor={colors.textMuted}
              />
            </FormSection>

            <ComboBoxField
              label="Khu vực / Xưởng"
              placeholder="Chọn khu vực"
              value={areaId}
              onChange={handleAreaChange}
              options={areas}
            />

            <ComboBoxField
              label="Chuyền"
              placeholder={areaId ? "Chọn chuyền" : "Chọn khu vực trước"}
              value={productionLineId}
              onChange={handleLineChange}
              options={lines}
            />

            <ComboBoxField
              label="Tổ"
              placeholder={productionLineId ? "Chọn tổ" : "Chọn chuyền trước"}
              value={teamId}
              onChange={setTeamId}
              options={teams}
            />

            <ComboBoxField
              label="Danh mục lỗi"
              placeholder="Chọn danh mục lỗi"
              value={failureCategoryId}
              onChange={setFailureCategoryId}
              options={[...failureCategories, { id: OTHER_FAILURE_ID, name: "Khác" }]}
            />

            {failureCategoryId === OTHER_FAILURE_ID && (
              <FormSection label="Mô tả lỗi khác">
                <TextInput
                  value={otherFailureNote}
                  onChangeText={setOtherFailureNote}
                  placeholder="Mô tả chi tiết lỗi (bắt buộc)"
                  style={s.input}
                  placeholderTextColor={colors.textMuted}
                />
              </FormSection>
            )}

            <ComboBoxField
              label="Mức độ nghiêm trọng"
              placeholder="Chọn mức độ"
              value={severity}
              onChange={(v) => setSeverity(v as Severity)}
              options={SEVERITY_OPTIONS}
            />

            <FormSection label="Mô tả vấn đề">
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Mô tả chi tiết tình trạng gặp phải"
                multiline
                numberOfLines={4}
                style={[s.input, { minHeight: 100, textAlignVertical: "top" }]}
                placeholderTextColor={colors.textMuted}
              />
            </FormSection>

            <FormSection label="Hình ảnh minh chứng">
              <View style={s.imageGrid}>
                {images.map((img, i) => (
                  <TouchableOpacity
                    key={i}
                    onLongPress={() => setImages(images.filter((_, idx) => idx !== i))}
                    style={s.imageThumbnail}
                  >
                    {/* Image component would go here */}
                    <Text style={s.imageIndex}>{i + 1}</Text>
                  </TouchableOpacity>
                ))}
                {images.length < 5 && (
                  <TouchableOpacity
                    style={[s.imageThumbnail, s.addImageBtn]}
                    onPress={handlePickImage}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator color={colors.primary} />
                    ) : (
                      <Text style={s.addImageIcon}>+</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </FormSection>

            {error && <View style={s.errorBanner}><Text style={s.errorText}>{error}</Text></View>}

            <View style={s.formActions}>
              <TouchableOpacity
                onPress={() => setShowReportForm(false)}
                style={s.secondaryBtn}
              >
                <Text style={s.secondaryBtnText}>Huỷ</Text>
              </TouchableOpacity>
              <PressableScale
                style={[s.primaryBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSubmitReport}
                disabled={submitting}
              >
                <Text style={s.primaryBtnText}>
                  {submitting ? "Đang gửi..." : "Gửi báo cáo"}
                </Text>
              </PressableScale>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Check Issue Modal */}
      <Modal visible={showCheckForm} transparent animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modalContainer}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setShowCheckForm(false)}>
              <Text style={s.modalHeaderClose}>✕</Text>
            </TouchableOpacity>
            <Text style={s.modalHeaderTitle}>Kiểm tra sự cố</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={s.modalContent}>
            <FormSection label="Mã PO / Mã sản phẩm">
              <TextInput
                value={checkPoCode}
                onChangeText={setCheckPoCode}
                placeholder="VD: PO-2026-001"
                style={s.input}
                placeholderTextColor={colors.textMuted}
                onSubmitEditing={handleCheck}
                autoCapitalize="characters"
              />
            </FormSection>

            <PressableScale
              style={[s.primaryBtn, checking && { opacity: 0.7 }]}
              onPress={handleCheck}
              disabled={checking}
            >
              <Text style={s.primaryBtnText}>{checking ? "Đang tra cứu..." : "Tra cứu"}</Text>
            </PressableScale>

            {checkError && (
              <View style={s.errorBanner}>
                <Text style={s.errorText}>{checkError}</Text>
              </View>
            )}

            {checkResults && checkResults.length === 0 && (
              <View style={{ paddingVertical: spacing.xl, alignItems: "center" }}>
                <Text style={s.emptyIcon}>✅</Text>
                <Text style={s.emptyTitle}>Chưa từng ghi nhận lỗi với mã này</Text>
              </View>
            )}

            {checkResults && checkResults.length > 0 && (
              <View style={{ marginTop: spacing.md, marginHorizontal: -spacing.lg }}>
                <Text style={[s.sectionTitle, { marginHorizontal: spacing.lg, marginBottom: spacing.sm }]}>
                  Tìm thấy {checkResults.length} sự cố trước đó
                </Text>
                {checkResults.map((item, index) => (
                  <IssueCard
                    key={item.id}
                    issueId={item.id}
                    poCode={item.poCode}
                    description={item.description}
                    status={item.status}
                    severity={item.severity}
                    reportedAt={item.createdAt}
                    delay={index * 30}
                    onPress={() => {
                      setShowCheckForm(false);
                      router.push(`/issue/${item.id}`);
                    }}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function HeaderSection({
  userName,
  reportedCount,
  inProgressCount,
  onReportPress,
  onCheckPress,
}: {
  userName: string;
  reportedCount: number;
  inProgressCount: number;
  onReportPress: () => void;
  onCheckPress: () => void;
}) {
  return (
    <View style={s.header}>
      <View style={s.headerTop}>
        <View>
          <Text style={s.greeting}>Xin chào,</Text>
          <Text style={s.userName}>{userName}</Text>
        </View>
        <View style={s.avatar}>
          <Text style={s.avatarText}>
            {(userName || "?").trim().charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={s.metricsRow}>
        <MetricCard label="Báo cáo" value={reportedCount} color="#F59E0B" />
        <MetricCard label="Đang xử lý" value={inProgressCount} color="#0EA5E9" />
      </View>

      <View style={s.ctaRow}>
        <PressableScale style={[s.primaryCta, { flex: 1 }]} onPress={onReportPress}>
          <Text style={s.ctaIcon}>⚠️</Text>
          <Text style={s.ctaTitle}>Báo cáo vấn đề</Text>
        </PressableScale>

        <PressableScale style={[s.secondaryCta, { flex: 1 }]} onPress={onCheckPress}>
          <Text style={s.ctaIconSecondary}>🔎</Text>
          <Text style={s.ctaTitleSecondary}>Kiểm tra sự cố</Text>
        </PressableScale>
      </View>

      <Text style={s.sectionTitle}>Hoạt động gần đây</Text>
    </View>
  );
}

function MetricCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={s.metricCard}>
      <View style={[s.metricDot, { backgroundColor: color }]} />
      <Text style={s.metricLabel}>{label}</Text>
      <Text style={s.metricValue}>{value}</Text>
    </View>
  );
}

function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.formSection}>
      <Text style={s.formLabel}>{label}</Text>
      {children}
    </View>
  );
}

function EmptyState() {
  return (
    <View style={s.emptyState}>
      <Text style={s.emptyIcon}>📋</Text>
      <Text style={s.emptyTitle}>Chưa có báo cáo</Text>
      <Text style={s.emptyText}>Bạn sẽ thấy các sự cố đã báo cáo ở đây</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  
  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textMuted,
    fontWeight: "500",
    lineHeight: typography.bodySmall.lineHeight,
  },
  userName: {
    fontSize: typography.h2.fontSize,
    fontWeight: "700",
    color: colors.text,
    lineHeight: typography.h2.lineHeight,
    marginTop: spacing.xs,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.white,
  },

  // Metrics
  metricsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surfaceBg,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.sm,
  },
  metricDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  metricLabel: {
    fontSize: typography.labelSmall.fontSize,
    color: colors.textMuted,
    fontWeight: "500",
  },
  metricValue: {
    fontSize: typography.h3.fontSize,
    fontWeight: "700",
    color: colors.text,
  },

  // CTA
  ctaRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  primaryCta: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  ctaIcon: {
    fontSize: 20,
  },
  ctaTitle: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: "600",
    color: colors.white,
    textAlign: "center",
  },
  ctaSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  ctaArrow: {
    fontSize: 20,
    color: colors.white,
  },
  secondaryCta: {
    backgroundColor: colors.surfaceBg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  ctaIconSecondary: {
    fontSize: 20,
  },
  ctaTitleSecondary: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: "600",
    color: colors.primary,
    textAlign: "center",
  },

  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: "600",
    color: colors.text,
  },

  // Empty
  emptyState: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxxl,
    alignItems: "center",
    gap: spacing.md,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: "600",
    color: colors.text,
  },
  emptyText: {
    fontSize: typography.body.fontSize,
    color: colors.textMuted,
    textAlign: "center",
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHeaderClose: {
    fontSize: 24,
    color: colors.text,
    fontWeight: "600",
  },
  modalHeaderTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: "700",
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },

  // Form
  formSection: {
    marginBottom: spacing.lg,
  },
  formLabel: {
    fontSize: typography.body.fontSize,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.text,
  },

  // Images
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  imageThumbnail: {
    width: "23%",
    aspectRatio: 1,
    backgroundColor: colors.surfaceBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  addImageBtn: {
    borderStyle: "dashed",
    borderColor: colors.primary,
  },
  addImageIcon: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: "600",
  },
  imageIndex: {
    fontSize: typography.labelSmall.fontSize,
    fontWeight: "600",
    color: colors.textMuted,
  },

  // Buttons
  formActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.xxxl,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: typography.body.fontSize,
    fontWeight: "600",
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: colors.surfaceBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryBtnText: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    fontWeight: "600",
  },

  // Error
  errorBanner: {
    backgroundColor: "#FEE2E2",
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginVertical: spacing.lg,
  },
  errorText: {
    color: "#991B1B",
    fontSize: typography.body.fontSize,
  },
});
