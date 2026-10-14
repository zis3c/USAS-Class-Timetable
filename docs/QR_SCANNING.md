# QR Scanning

## Where it is used

The shared decoder in `src/shared/lib/qrDecode.ts` powers both:

- Schedule sharing and comparison in `CompareScheduleModal`.
- Lecturer attendance codes in `AttendanceScanModal`.

Both screens keep their own camera and result handling. The decoder reads camera frames or selected images locally in the browser. Image files are not uploaded. Attendance sends the decoded QR text through the existing USAS API flow; schedule comparison handles the decoded timetable in the browser.

## Decoder and camera flow

The project uses [`qr-scanner`](https://github.com/nimiq/qr-scanner) with one shared Web Worker on all browsers. This keeps QR decoding consistent across iOS Safari, Android browsers, and desktop browsers instead of depending on each browser's native `BarcodeDetector`. The worker starts warming while camera permission and startup complete, then is reused across frames and camera restarts for the lifetime of the page.

Camera callers request up to 1920x1080 from `getUserMedia`; a device may provide a lower resolution. They pass the video element and a reusable canvas to `decodeQrFromFrame`. The decoder downsizes the full frame for a quick pass. Every fifth pass scans a centered crop for more detail. The crop follows the current digital zoom. A decode miss returns `null`; the caller keeps scanning. The camera is left to its native autofocus on startup. Tapping the preview requests focus at that point only when the browser and camera expose point-of-interest focus; unsupported hardware keeps its normal autofocus behavior.

The worker is configured for both dark-on-light and light-on-dark codes. This supports QR images generated in dark theme and codes shown in light theme. The worker message used for this setting follows `qr-scanner`'s worker protocol, so recheck it whenever that dependency is upgraded.

There is no drawn guide frame over the camera preview. The scan loop checks the full frame and periodically checks the center at higher detail. After a successful scan the camera stops; starting another scan requests a fresh camera stream, while the decoder worker remains warm.

## Image uploads

Callers load a selected image and pass it to `decodeQrFromImage`. The decoder tries the complete image and a centered crop at up to 1,200 and 2,000 pixels on the longest side. It then tries a JPEG-softened center crop to reduce screen moire. This limits canvas memory use on phones while retaining a higher-resolution pass for dense codes. The file input accepts `image/*`, so mobile users can choose an existing screenshot or take a photo with the system camera picker.

Object URL lifetime and input reset stay with each modal's upload handler.

## Browser and deployment requirements

- Camera access needs HTTPS, except on localhost, and user permission.
- Keep the camera video muted and `playsInline` for inline playback in iOS Safari.
- Keep `worker-src 'self' blob:` in `public/_headers`. The library creates its fallback worker from a blob URL.
- Deploy the Vite output in `dist` as a whole. Vite emits the scanner worker as a separate asset.
- Upload scans run locally and need no network access. Attendance sends the decoded QR text through its existing API request after decoding.

## Debugging

Open Attendance with `?qrdebug=1` to show camera dimensions, canvas dimensions, average frame brightness, decode time, and scan count in the status area. The readout does not include the QR payload. Compare Schedule does not currently show this diagnostic panel.

If a browser cannot read a code, first check camera permission and HTTPS, then make sure the QR is visible and in focus. Tap the preview to request focus on supported devices, or use image upload and choose a screenshot/photo. For dark-theme scans, keep both QR color modes enabled. For deployed failures, check that the scanner worker asset returns successfully and that the site's Content Security Policy still allows it.

## Device validation

- iPhone XS: the user confirmed camera and uploaded-photo scanning worked, including dark-theme QR codes. The latest startup-focus adjustment still needs a physical-device retest.
- Android Tab A8: the user previously confirmed camera scanning worked; the camera sometimes needed movement to settle focus.
- Desktop camera behavior has not been confirmed on physical hardware. Camera choice, focus controls, and permissions vary by device.
