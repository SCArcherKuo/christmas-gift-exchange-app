"use client";

import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";

interface ScannerProps {
    onScanSuccess: (decodedText: string) => void;
}

export default function Scanner({ onScanSuccess }: ScannerProps) {
    const [scanResult, setScanResult] = useState<string | null>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Initialize scanner only once
        if (!scannerRef.current) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 150 },
                    aspectRatio: 1.0,
                },
        /* verbose= */ false
            );

            scanner.render(
                (decodedText) => {
                    setScanResult(decodedText);
                    onScanSuccess(decodedText);
                    // Optional: Clear scanner after success if desired, but for now we keep it open
                    // scanner.clear();
                },
                (errorMessage) => {
                    // parse error, ignore it.
                    // console.log(errorMessage);
                }
            );

            scannerRef.current = scanner;
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch((error) => {
                    console.error("Failed to clear html5-qrcode scanner. ", error);
                });
                scannerRef.current = null;
            }
        };
    }, [onScanSuccess]);

    return (
        <div className="w-full max-w-md mx-auto p-4 border rounded-lg bg-white shadow-sm">
            <div id="reader" className="w-full"></div>
            {scanResult && (
                <p className="mt-2 text-center text-green-600 font-medium">
                    Scanned: {scanResult}
                </p>
            )}
        </div>
    );
}
