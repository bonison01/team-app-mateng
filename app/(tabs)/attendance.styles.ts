import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  /* ================= BASE ================= */
  container: {
    flex: 1,
    backgroundColor: "#0E1117",
  },

  /* ================= TOP BAR ================= */
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
  },
  topDate: {
    color: "#E5E7EB",
    fontSize: 16,
    fontWeight: "600",
  },

  /* ================= CARD ================= */
  card: {
    backgroundColor: "#111827",
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  cardDate: {
    color: "#34D399",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  text: {
    color: "#E5E7EB",
    fontSize: 14,
    marginTop: 4,
  },
  hours: {
    marginTop: 10,
    color: "#FACC15",
    fontWeight: "600",
  },

  /* ================= FLOATING BUTTON ================= */
  fab: {
    position: "absolute",
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  /* ================= MODAL ================= */
  modal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  preview: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: "#34D399",
  },

  timeText: {
    marginTop: 14,
    color: "#E5E7EB",
    fontSize: 16,
    fontWeight: "600",
  },

  confirmBtn: {
    marginTop: 22,
    backgroundColor: "#34D399",
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 28,
  },
  confirmText: {
    color: "#022C22",
    fontWeight: "700",
    fontSize: 16,
  },

  /* ================= CALENDAR ================= */
  calendarOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  calendarCard: {
    backgroundColor: "#0B1220",
    width: "92%",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  calendarTitle: {
    color: "#34D399",
    fontSize: 18,
    fontWeight: "700",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  weekDay: {
    width: "13%",
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  dayCell: {
    width: "13%",
    aspectRatio: 1,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  dayText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  dayPresent: { backgroundColor: "#16A34A" },
  dayIncomplete: { backgroundColor: "#F59E0B" },
  dayAbsent: { backgroundColor: "#DC2626" },
  daySelected: {
    borderWidth: 2,
    borderColor: "#60A5FA",
  },
});
