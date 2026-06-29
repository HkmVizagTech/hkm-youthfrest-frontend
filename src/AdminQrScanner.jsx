import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import axios from "axios";
import { useToast } from "@chakra-ui/react";
import Layout from "./component/Layout";

const AdminQrScanner = () => {
  const videoRef = useRef(null);
  const [candidate, setCandidate] = useState(null);
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const lastScanRef = useRef({ value: "", time: 0 });
  const toast = useToast();

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    codeReader.listVideoInputDevices().then(devices => {
      if (!devices.length) { setError("No camera found."); return; }
      codeReader.decodeFromVideoDevice(devices[0].deviceId, videoRef.current, async (res, err) => {
        if (res) {
          const scannedText = res.getText();
          const now = Date.now();
          if (scannedText !== lastScanRef.current.value || now - lastScanRef.current.time > 1500) {
            lastScanRef.current = { value: scannedText, time: now };
            setError(""); setCandidate(null); setStatus(""); setMessage("");
            toast({ title: "QR scanned", status: "success", duration: 1500, isClosable: true, position: "top" });
            try {
              const r = await axios.post("https://hkm-youtfrest-backend-razorpay-882278565284.asia-south1.run.app/users/admin/attendance-scan", { token: scannedText });
              setCandidate(r.data); setStatus(r.data.status); setMessage(r.data.message);
            } catch (e) { setError(e.response?.data?.message || e.message || "Scan error"); }
          }
        }
        if (err && !(err instanceof NotFoundException)) setError(err.message || "Scan error");
      });
    }).catch(e => setError(e.message));
    return () => codeReader.reset();
  }, [toast]);

  const isSuccess = status && status !== "already-marked";
  const isWarning = status === "already-marked";

  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px", maxWidth: 480, margin: "0 auto" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#0FB6A6", marginBottom: 8 }}>Admin · QR Scanner</p>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1C1440", marginBottom: 24 }}>Scan QR Code</h2>

        {/* camera viewport */}
        <div style={{ position: "relative", width: "100%", maxWidth: 360, marginBottom: 24 }}>
          <video ref={videoRef} style={{ width: "100%", borderRadius: 16, border: "3px solid #4CD9CB", display: "block", background: "#0C0921" }} />
          {/* corner markers */}
          {["topLeft","topRight","bottomLeft","bottomRight"].map(pos => (
            <div key={pos} style={{ position: "absolute", width: 28, height: 28,
              borderTop: pos.startsWith("top") ? "3px solid #FFB020" : "none",
              borderBottom: pos.startsWith("bottom") ? "3px solid #FFB020" : "none",
              borderLeft: pos.endsWith("Left") ? "3px solid #FFB020" : "none",
              borderRight: pos.endsWith("Right") ? "3px solid #FFB020" : "none",
              top: pos.startsWith("top") ? 6 : "auto", bottom: pos.startsWith("bottom") ? 6 : "auto",
              left: pos.endsWith("Left") ? 6 : "auto", right: pos.endsWith("Right") ? 6 : "auto",
            }} />
          ))}
        </div>

        {/* candidate card */}
        {candidate && (
          <div style={{ width: "100%", background: isWarning ? "#FFF8E8" : "#E5FBF8", border: `2px solid ${isWarning ? "#FFB020" : "#0FB6A6"}`, borderRadius: 16, padding: "20px 20px", marginBottom: 16 }}>
            <p style={{ fontWeight: 800, fontSize: 18, color: "#1C1440", marginBottom: 6 }}>{candidate.name}</p>
            {message && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>{isWarning ? "⚠️" : "✅"}</span>
                <p style={{ fontWeight: 700, color: isWarning ? "#CC7C00" : "#0A7268", fontSize: 15 }}>{message}</p>
              </div>
            )}
          </div>
        )}

        {/* idle state */}
        {!candidate && !error && (
          <p style={{ color: "#7E70B8", fontSize: 14, fontWeight: 500, textAlign: "center" }}>Point the camera at a participant's QR code</p>
        )}

        {/* error */}
        {error && (
          <div style={{ background: "#FEE9F2", border: "2px solid #F2478B", borderRadius: 12, padding: "14px 18px", width: "100%", textAlign: "center" }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <p style={{ color: "#8F1747", fontWeight: 700, marginTop: 4 }}>{error}</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminQrScanner;
