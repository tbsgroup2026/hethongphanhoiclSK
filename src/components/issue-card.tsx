import { TouchableOpacity, View, StyleSheet, useWindowDimensions } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Text } from "./scaled-text";
import { colors } from "@/constants/colors";
import { spacing, radius, typography } from "@/constants/ui-theme";
import { IssueStatus, Severity } from "@/lib/api";

interface IssueCardProps {
  issueId: string;
  poCode: string;
  description: string;
  status: IssueStatus;
  severity: Severity;
  reportedAt: string;
  onPress: () => void;
  delay?: number;
}

const statusConfig: Record<IssueStatus, { label: string; bg: string; text: string }> = {
  REPORTED: { label: "Vừa báo cáo", bg: colors.statusReportedBg, text: colors.statusReportedText },
  INVESTIGATING: { label: "Đang điều tra", bg: colors.statusInvestigatingBg, text: colors.statusInvestigatingText },
  ROOT_CAUSE_FOUND: { label: "Đã xác định", bg: colors.statusRootCauseFoundBg, text: colors.statusRootCauseFoundText },
  ASSIGNED: { label: "Đã giao việc", bg: colors.statusAssignedBg, text: colors.statusAssignedText },
  IN_PROGRESS: { label: "Đang xử lý", bg: colors.statusInProgressBg, text: colors.statusInProgressText },
  DONE: { label: "Đã hoàn thành", bg: colors.statusDoneBg, text: colors.statusDoneText },
};

const severityConfig: Record<Severity, { label: string; color: string }> = {
  LOW: { label: "Thấp", color: colors.info },
  MEDIUM: { label: "Trung", color: colors.warning },
  HIGH: { label: "Cao", color: colors.error },
  URGENT: { label: "Khẩn cấp", color: colors.error },
};

export function IssueCard({ issueId, poCode, description, status, severity, reportedAt, onPress, delay = 0 }: IssueCardProps) {
  const statusCfg = statusConfig[status];
  const severityCfg = severityConfig[severity];

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(300)}
      style={{ marginHorizontal: spacing.lg, marginVertical: spacing.sm }}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[styles.card]}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.poCode}>{poCode}</Text>
            <Text style={styles.description} numberOfLines={1}>
              {description}
            </Text>
          </View>
          <View
            style={[
              styles.severityBadge,
              { backgroundColor: severityCfg.color },
            ]}
          >
            <Text style={styles.severityLabel}>{severityCfg.label}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusCfg.bg },
            ]}
          >
            <Text style={[styles.statusLabel, { color: statusCfg.text }]}>
              {statusCfg.label}
            </Text>
          </View>
          <Text style={styles.time}>{formatTimeAgo(reportedAt)}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Vừa xong";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return date.toLocaleDateString("vi-VN");
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  headerLeft: {
    flex: 1,
    gap: spacing.xs,
  },
  poCode: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: "600",
    color: colors.primary,
    lineHeight: typography.bodySmall.lineHeight,
  },
  description: {
    fontSize: typography.body.fontSize,
    fontWeight: "500",
    color: colors.text,
    lineHeight: typography.body.lineHeight,
  },
  severityBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 44,
  },
  severityLabel: {
    fontSize: typography.labelSmall.fontSize,
    fontWeight: "600",
    color: colors.white,
    lineHeight: typography.labelSmall.lineHeight,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    justifyContent: "center",
  },
  statusLabel: {
    fontSize: typography.label.fontSize,
    fontWeight: "600",
    lineHeight: typography.label.lineHeight,
  },
  time: {
    fontSize: typography.labelSmall.fontSize,
    color: colors.textMuted,
    lineHeight: typography.labelSmall.lineHeight,
  },
});
