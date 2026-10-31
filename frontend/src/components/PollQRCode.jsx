
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Copy, X } from "lucide-react";
import "./PollQRCode.css";

export default function PollQRCode({ pollId, onClose }) {
  const [copied, setCopied] = useState(false);

  const pollLink = `${window.location.origin}/poll/${pollId}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pollLink);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById("vs-poll-qr");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `votesphere-poll-${pollId}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="vs-qr-overlay" onClick={onClose}>
      <div
        className="vs-qr-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Share poll QR code"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="vs-qr-close"
          onClick={onClose}
          aria-label="Close QR code"
        >
          <X size={20} />
        </button>

        <h2>Share your poll</h2>
        <p>Scan this QR code to participate in the poll.</p>

        <div className="vs-qr-image">
          <QRCodeSVG
            id="vs-poll-qr"
            value={pollLink}
            size={220}
            bgColor="#ffffff"
            fgColor="#171717"
            level="H"
            marginSize={2}
          />
        </div>

        <div className="vs-qr-link">{pollLink}</div>

        <div className="vs-qr-actions">
          <button type="button" onClick={copyLink}>
            <Copy size={17} />
            {copied ? "Copied!" : "Copy link"}
          </button>

          <button type="button" onClick={downloadQR}>
            <Download size={17} />
            Download QR
          </button>
        </div>
      </div>
    </div>
  );
}
