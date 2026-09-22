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

// Self-hosted rather than pulled from jsdelivr/Google at runtime: a report
// of the overlay staying frozen at its fallback position even with no face
// in frame at all — meaning tracking was never actually starting — pointed
// at the third-party CDN fetch itself as the likely failure (ad blockers
// and some mobile/corporate networks block exactly this kind of "tracking"-
// named vendor script, or a model host, even when the rest of the site
// loads fine). Same-origin means neither can be blocked independently of
// the app itself. Only the two variants FilesetResolver.forVisionTasks
// actually requests (SIMD and non-SIMD) are here — see public/mediapipe.
const WASM_BASE_URL = "/mediapipe/wasm";
const MODEL_URL = "/mediapipe/face_landmarker.task";

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
// than relying on a separate "center" landmark to extrapolate from. A
// report of the earrings landing too far out brought that factor down
// from an initial, too-aggressive 0.22.
const LEFT_JAW = 132;
const RIGHT_JAW = 361;
const CHIN = 152;
const FOREHEAD = 10;
const EAR_OUTWARD_FACTOR = 0.08;
// 132/361 aren't a well-documented mirror-symmetric pair, and a report of
// the earrings hanging visibly crooked even for a level, front-on face
// suggests they're not reliable enough as a *rotation* reference (small
// per-point noise in an already-approximate landmark reads as a much
// larger angle once you're computing atan2 between just two points close
// together). The outer eye corners (33/263) are canonical, well-separated,
// and exactly what most face-filter roll-angle calculations use — using
// those for rotation only, decoupled from the ear/neck position anchors.
const EYE_OUTER_LEFT = 33;
const EYE_OUTER_RIGHT = 263;

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
  eyeLeft: { x: number; y: number };
  eyeRight: { x: number; y: number };
  // The raw, un-adjusted landmarks the anchors above are built from —
  // exposed so a debug overlay can show exactly what MediaPipe itself is
  // detecting, separate from anything this file's own math then does to
  // it (an outward push, an extrapolated neck point, ...). See the small
  // debug dots in try-on-stage.tsx, added after two rounds of blind
  // parameter tuning failed to converge — there was no way to tell
  // whether the raw detection or the derived math was the actual problem
  // without being able to see the raw points directly.
  debugRaw: {
    leftJaw: { x: number; y: number };
    rightJaw: { x: number; y: number };
    chin: { x: number; y: number };
    forehead: { x: number; y: number };
  };
}

export function computeFaceAnchors(landmarks: NormalizedLandmark[]): FaceAnchors | null {
  const lj = landmarks[LEFT_JAW];
  const rj = landmarks[RIGHT_JAW];
  const chin = landmarks[CHIN];
  const forehead = landmarks[FOREHEAD];
  const eyeLeft = landmarks[EYE_OUTER_LEFT];
  const eyeRight = landmarks[EYE_OUTER_RIGHT];
  if (!lj || !rj || !chin || !forehead || !eyeLeft || !eyeRight) return null;

  const dxJaw = lj.x - rj.x;
  const dyJaw = lj.y - rj.y;
  const leftEar = { x: lj.x + dxJaw * EAR_OUTWARD_FACTOR, y: lj.y + dyJaw * EAR_OUTWARD_FACTOR };
  const rightEar = { x: rj.x - dxJaw * EAR_OUTWARD_FACTOR, y: rj.y - dyJaw * EAR_OUTWARD_FACTOR };

  // Below the chin, continuing the forehead->chin line, roughly to collar
  // height — there's no neck/shoulder landmark in the mesh to anchor to.
  const dx = chin.x - forehead.x;
  const dy = chin.y - forehead.y;
  const neck = { x: chin.x + dx * 0.55, y: chin.y + dy * 0.55 };

  return {
    leftEar,
    rightEar,
    neck,
    eyeLeft: { x: eyeLeft.x, y: eyeLeft.y },
    eyeRight: { x: eyeRight.x, y: eyeRight.y },
    debugRaw: {
      leftJaw: { x: lj.x, y: lj.y },
      rightJaw: { x: rj.x, y: rj.y },
      chin: { x: chin.x, y: chin.y },
      forehead: { x: forehead.x, y: forehead.y },
    },
  };
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
