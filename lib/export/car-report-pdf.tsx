import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import { format } from "date-fns"

import type { gasLog, maintenanceFiles, maintenanceLog, maintenanceParts } from "~/server/db/schema"

type GasLogRow = typeof gasLog.$inferSelect
type MaintenanceLogRow = typeof maintenanceLog.$inferSelect & {
  maintenanceParts: (typeof maintenanceParts.$inferSelect)[]
  files: (typeof maintenanceFiles.$inferSelect)[]
}

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#666", marginBottom: 16 },
  sectionTitle: { fontSize: 14, marginTop: 16, marginBottom: 8 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, paddingBottom: 4, marginBottom: 4, fontWeight: "bold" },
  tableRow: { flexDirection: "row", paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: "#eee" },
  cell: { flex: 1, paddingRight: 4 },
  logBlock: { marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#ddd" },
  imageGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  imageCell: { width: "31%", marginRight: "2%", marginBottom: 8 },
  image: { width: "100%", height: 80, objectFit: "cover" },
})

function isImageType(fileType: string) {
  return fileType.startsWith("image/")
}

export function CarReportDocument({
  gasLogs,
  maintenanceLogs,
  from,
  to,
  imageData,
}: {
  gasLogs: GasLogRow[]
  maintenanceLogs: MaintenanceLogRow[]
  from: string
  to: string
  imageData: Record<string, string>
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>My Car Report</Text>
        <Text style={styles.subtitle}>
          {format(new Date(from), "MMM d, yyyy")} — {format(new Date(to), "MMM d, yyyy")}
        </Text>

        <Text style={styles.sectionTitle}>Gas Log</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.cell}>Date</Text>
          <Text style={styles.cell}>Odo</Text>
          <Text style={styles.cell}>Gal</Text>
          <Text style={styles.cell}>$/gal</Text>
          <Text style={styles.cell}>Total</Text>
          <Text style={styles.cell}>MPG</Text>
        </View>
        {gasLogs.length === 0 ? (
          <Text>No fill-ups in this range.</Text>
        ) : (
          gasLogs.map((log) => (
            <View key={log.id} style={styles.tableRow}>
              <Text style={styles.cell}>{format(new Date(log.date), "MM/dd/yy")}</Text>
              <Text style={styles.cell}>{log.odometer ?? "—"}</Text>
              <Text style={styles.cell}>{log.gallons ?? "—"}</Text>
              <Text style={styles.cell}>{log.pricePerGallon ?? "—"}</Text>
              <Text style={styles.cell}>{log.totalPrice ?? "—"}</Text>
              <Text style={styles.cell}>{log.mpg ?? "—"}</Text>
            </View>
          ))
        )}
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Maintenance Log</Text>
        {maintenanceLogs.length === 0 ? (
          <Text>No maintenance records in this range.</Text>
        ) : (
          maintenanceLogs.map((log) => {
            const images = log.files.filter((f) => isImageType(f.fileType))
            const otherFiles = log.files.filter((f) => !isImageType(f.fileType))
            return (
              <View key={log.id} style={styles.logBlock} wrap={false}>
                <Text>
                  {format(new Date(log.date), "MMM d, yyyy")} — {log.system} / {log.service}
                </Text>
                <Text>
                  Status: {log.status ?? "—"} · Odometer: {log.odometer ?? "—"} · Cost:{" "}
                  {log.total ?? log.cost ?? "—"}
                </Text>
                {log.description ? <Text>{log.description}</Text> : null}
                {log.notes ? <Text>Notes: {log.notes}</Text> : null}
                {log.maintenanceParts.length > 0 ? (
                  <View style={{ marginTop: 6 }}>
                    <Text>Parts:</Text>
                    {log.maintenanceParts.map((p) => (
                      <Text key={p.id}>
                        - {p.name} ×{p.quantity}
                        {p.partNumber ? ` (${p.partNumber})` : ""}
                      </Text>
                    ))}
                  </View>
                ) : null}
                {otherFiles.length > 0 ? (
                  <View style={{ marginTop: 6 }}>
                    <Text>Files:</Text>
                    {otherFiles.map((f) => (
                      <Text key={f.id}>
                        - {f.fileName} ({f.fileType})
                      </Text>
                    ))}
                  </View>
                ) : null}
                {images.length > 0 ? (
                  <View style={styles.imageGrid}>
                    {images.map((img) =>
                      imageData[img.id] ? (
                        <View key={img.id} style={styles.imageCell}>
                          <Image src={imageData[img.id]} style={styles.image} />
                        </View>
                      ) : null
                    )}
                  </View>
                ) : null}
              </View>
            )
          })
        )}
      </Page>
    </Document>
  )
}
