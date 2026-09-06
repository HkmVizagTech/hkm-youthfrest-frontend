import { API_HOST } from "./config";
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
  const [isPaused, setIsPaused] = useState(false);
  // A ref (not just state) so the continuously-firing decode callback reads
  // the current paused state synchronously, without waiting on a re-render.
  const isPausedRef = useRef(false);
  const toast = useToast();

  const resumeScanning = () => {
    isPausedRef.current = false;
    setIsPaused(false);
    setCandidate(null); setStatus(""); setMessage(""); setError("");
  };

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    const handleResult = async (res, err) => {
      // Once a result is shown, ignore every further frame — a QR code
      // held in view for more than an instant used to get re-submitted
      // every ~1.5s, and the second submission would (correctly, but
      // confusingly) come back "already marked" for what was really the
      // same single scan. Scanning only resumes once the volunteer
      // explicitly taps "Scan next".
      if (isPausedRef.current) return;

      if (res) {
        const scannedText = res.getText();
        isPausedRef.current = true;
        setIsPaused(true);
        setError(""); setCandidate(null); setStatus(""); setMessage("");
        toast({ title: "QR scanned", status: "success", duration: 1500, isClosable: true, position: "top" });
        try {
          const r = await axios.post(`${API_HOST}/users/admin/attendance-scan`, { token: scannedText });
          setCandidate(r.data); setStatus(r.data.status); setMessage(r.data.message);
        } catch (e) {
          setError(e.response?.data?.message || e.message || "Scan error");
        }
        return;
      }
      if (err && !(err instanceof NotFoundException)) setError(err.message || "Scan error");
    };

    // Ask directly for the back/environment-facing camera — picking
    // devices[0] from the enumeration list is not reliable, since device
    // order isn't guaranteed to put the back camera first on every phone.
    codeReader
      .decodeFromConstraints(
        { video: { facingMode: { exact: "environment" } } },
        videoRef.current,
        handleResult
      )
      .catch((constraintErr) => {
        // Only reachable on a device with no back camera at all (e.g. a
        // laptop webcam) — fall back to whatever camera is available
        // rather than leaving the scanner completely unusable there.
        console.warn("Back camera unavailable, falling back:", constraintErr.message);
        codeReader
          .decodeFromConstraints({ video: { facingMode: "environment" } }, videoRef.current, handleResult)
          .catch((e) => setError(e.message || "Could not access any camera."));
      });

    return () => codeReader.reset();
  }, [toast]);

  const isSuccess = status && status !== "already-marked";
  const isWarning = status === "already-marked";

  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px", maxWidth: 480, margin: "0 auto" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#0FB6A6", marginBottom: 8 }}>Reception · QR Scanner</p>
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
          {/* paused overlay — makes it visually obvious scanning isn't live */}
          {isPaused && (
            <div style={{ position: "absolute", inset: 0, borderRadius: 16, background: "rgba(12,9,33,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: 13, letterSpacing: "0.04em", textTransform: "uppercase" }}>Paused</span>
            </div>
          )}
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
        {!candidate && !error && !isPaused && (
          <p style={{ color: "#7E70B8", fontSize: 14, fontWeight: 500, textAlign: "center" }}>Point the camera at a participant's QR code</p>
        )}

        {/* error */}
        {error && (
          <div style={{ background: "#FEE9F2", border: "2px solid #F2478B", borderRadius: 12, padding: "14px 18px", width: "100%", textAlign: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <p style={{ color: "#8F1747", fontWeight: 700, marginTop: 4 }}>{error}</p>
          </div>
        )}

        {/* resume control — scanning is paused until this is tapped */}
        {isPaused && (
          <button
            onClick={resumeScanning}
            style={{
              width: "100%", padding: "14px", borderRadius: 12, border: "none",
              background: "#0FB6A6", color: "white", fontWeight: 800, fontSize: 15,
              cursor: "pointer",
            }}
          >
            Scan next
          </button>
        )}
      </div>
    </Layout>
  );
};

export default AdminQrScanner;
