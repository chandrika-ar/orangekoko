// Real face-landmark tracking for the try-on camera, so the jewelry overlay
// actually follows the wearer's head instead of sitting at a fixed screen
// position. Uses MediaPipe's FaceLandmarker (WASM + a small ML model, both
// fetched from Google's CDN the first time it's needed) rather than any
// server-side processing — the camera frame never leaves the device.
import {
  FaceLandmarker,
  FilesetResolver,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

// Self-hosting the ~30MB of WASM binaries (three variants, picked at runtime
// by SIMD support) in this repo isn't worth it for a generic third-party
// runtime blob — jsdelivr is the CDN MediaPipe's own docs point at, and is
// what every other consumer of this package relies on.
const WASM_BASE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/[email protected]/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

function getLandmarker(): Promise<FaceLandmarker> {
  landmarkerPromise ??= (async () => {
    const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL);
    try {
      return await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        numFaces: 1,
      });
    } catch {
      // Some devices/browsers don't support the WebGL delegate for this task.
      return await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
        runningMode: "VIDEO",
        numFaces: 1,
      });
    }
  })();
  return landmarkerPromise;
}

// Canonical MediaPipe face-mesh indices. There's no ear or neck landmark in
// the mesh at all (it only covers the front of the face), so both anchors
// are approximations built from the nearest points the mesh does have.
//
// The jaw-contour points at roughly earlobe height (132/361) are a much
// closer match than the temple/cheekbone points (234/454) an earlier
// version of this used — those sit up near eye level, which is why the
// overlay was landing on the cheeks instead of the ears. Even 132/361 are
// still *on* the face surface, though, and a real earlobe hangs out past
// the jawline — so each point is also pushed further outward, away from
// the opposite jaw point, by a fraction of the face's own width, rather
// than relying on a separate "center" landmark to extrapolate from.
const LEFT_JAW = 132;
const RIGHT_JAW = 361;
const CHIN = 152;
const FOREHEAD = 10;
const EAR_OUTWARD_FACTOR = 0.22;

// All coordinates are normalized (0..1) against the raw camera frame, i.e.
// *not* accounting for object-cover cropping or the mirrored on-screen
// display — see mapNormalizedPoint in try-on-stage.tsx, which is where that
// conversion (and anything aspect-ratio-sensitive, like distances and
// angles) happens, since it needs the actual rendered box size to do it
// correctly for a non-square camera frame.
export interface FaceAnchors {
  leftEar: { x: number; y: number };
  rightEar: { x: number; y: number };
  neck: { x: number; y: number };
}

export function computeFaceAnchors(landmarks: NormalizedLandmark[]): FaceAnchors | null {
  const lj = landmarks[LEFT_JAW];
  const rj = landmarks[RIGHT_JAW];
  const chin = landmarks[CHIN];
  const forehead = landmarks[FOREHEAD];
  if (!lj || !rj || !chin || !forehead) return null;

  const dxJaw = lj.x - rj.x;
  const dyJaw = lj.y - rj.y;
  const leftEar = { x: lj.x + dxJaw * EAR_OUTWARD_FACTOR, y: lj.y + dyJaw * EAR_OUTWARD_FACTOR };
  const rightEar = { x: rj.x - dxJaw * EAR_OUTWARD_FACTOR, y: rj.y - dyJaw * EAR_OUTWARD_FACTOR };

  // Below the chin, continuing the forehead->chin line, roughly to collar
  // height — there's no neck/shoulder landmark in the mesh to anchor to.
  const dx = chin.x - forehead.x;
  const dy = chin.y - forehead.y;
  const neck = { x: chin.x + dx * 0.55, y: chin.y + dy * 0.55 };

  return { leftEar, rightEar, neck };
}

/**
 * Starts a per-frame detection loop against `video` and calls `onFrame` with
 * the computed anchors (or null when no face is currently visible). Returns
 * a cleanup function that stops the loop — the loaded model itself stays
 * cached at module scope so re-opening the try-on view doesn't re-download
 * or re-initialize it.
 */
export function startFaceTracking(
  video: HTMLVideoElement,
  onFrame: (anchors: FaceAnchors | null) => void,
  onError: (error: unknown) => void,
): () => void {
  let stopped = false;
  let rafId = 0;

  getLandmarker()
    .then((landmarker) => {
      if (stopped) return;
      const loop = () => {
        if (stopped) return;
        if (video.readyState >= 2 && !video.paused) {
          const result = landmarker.detectForVideo(video, performance.now());
          const first = result.faceLandmarks[0];
          onFrame(first ? computeFaceAnchors(first) : null);
        }
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    })
    .catch((error: unknown) => {
      if (!stopped) onError(error);
    });

  return () => {
    stopped = true;
    if (rafId) cancelAnimationFrame(rafId);
  };
}
