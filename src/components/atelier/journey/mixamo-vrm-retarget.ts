import * as THREE from "three";
import type { VRM, VRMHumanBoneName } from "@pixiv/three-vrm";

/**
 * Maps a Mixamo rig's bone names to VRM's standard humanoid bone names, so a
 * Mixamo animation clip (this scene's existing walk/idle) can be replayed on
 * any VRM avatar's own skeleton — VRM avatars (e.g. from VRoid Hub) ship
 * with a static pose only, no baked-in animation.
 */
const MIXAMO_VRM_RIG_MAP: Record<string, VRMHumanBoneName> = {
  mixamorigHips: "hips",
  mixamorigSpine: "spine",
  mixamorigSpine1: "chest",
  mixamorigSpine2: "upperChest",
  mixamorigNeck: "neck",
  mixamorigHead: "head",
  mixamorigLeftShoulder: "leftShoulder",
  mixamorigLeftArm: "leftUpperArm",
  mixamorigLeftForeArm: "leftLowerArm",
  mixamorigLeftHand: "leftHand",
  mixamorigRightShoulder: "rightShoulder",
  mixamorigRightArm: "rightUpperArm",
  mixamorigRightForeArm: "rightLowerArm",
  mixamorigRightHand: "rightHand",
  mixamorigLeftUpLeg: "leftUpperLeg",
  mixamorigLeftLeg: "leftLowerLeg",
  mixamorigLeftFoot: "leftFoot",
  mixamorigLeftToeBase: "leftToes",
  mixamorigRightUpLeg: "rightUpperLeg",
  mixamorigRightLeg: "rightLowerLeg",
  mixamorigRightFoot: "rightFoot",
  mixamorigRightToeBase: "rightToes",
};

/**
 * Retargets a Mixamo AnimationClip onto a VRM's humanoid skeleton.
 *
 * Rotation tracks are re-expressed relative to each VRM bone's own rest
 * orientation (mixamoRestWorldRotation⁻¹, premultiplied by the parent's rest
 * world rotation) — necessary because the two skeletons don't share a rest
 * pose, so a raw copy of Mixamo's local rotations would leave limbs twisted.
 *
 * The hips position track is rescaled from the Mixamo rig's native units to
 * the VRM's real-world meters, using each rig's own hips rest height as the
 * conversion ratio — note this must use the Mixamo hips' *local* rest
 * position, not its world position: the world position already has the
 * source rig's Armature scale folded in, and the animation's raw keyframe
 * values are authored in the same unscaled local space, so re-applying that
 * scale via a world-space ratio would double it and shrink the retargeted
 * motion far too much (verified empirically — this exact mistake produced a
 * ~100x undershoot before the fix).
 */
export function retargetMixamoClipToVrm(clip: THREE.AnimationClip, mixamoScene: THREE.Object3D, vrm: VRM): THREE.AnimationClip {
  const tracks: THREE.KeyframeTrack[] = [];
  const restRotationInverse = new THREE.Quaternion();
  const parentRestWorldRotation = new THREE.Quaternion();
  const quatA = new THREE.Quaternion();

  mixamoScene.updateMatrixWorld(true);

  const motionHips = mixamoScene.getObjectByName("mixamorigHips");
  const vrmHipsNode = vrm.humanoid?.getNormalizedBoneNode("hips");
  if (!motionHips || !vrmHipsNode) return new THREE.AnimationClip("retargeted", clip.duration, []);

  const motionHipsHeight = motionHips.position.y;
  const vrmHipsHeight = vrmHipsNode.getWorldPosition(new THREE.Vector3()).y;
  const hipsPositionScale = vrmHipsHeight / motionHipsHeight;

  for (const track of clip.tracks) {
    const [mixamoRigName, propertyName] = track.name.split(".");
    const vrmBoneName = MIXAMO_VRM_RIG_MAP[mixamoRigName];
    if (!vrmBoneName) continue;
    const vrmNode = vrm.humanoid?.getNormalizedBoneNode(vrmBoneName);
    const mixamoRigNode = mixamoScene.getObjectByName(mixamoRigName);
    if (!vrmNode || !mixamoRigNode || !mixamoRigNode.parent) continue;

    if (track.ValueTypeName === "quaternion") {
      mixamoRigNode.getWorldQuaternion(restRotationInverse).invert();
      mixamoRigNode.parent.getWorldQuaternion(parentRestWorldRotation);

      const values = track.values.slice();
      for (let i = 0; i < values.length; i += 4) {
        quatA.fromArray(values, i);
        quatA.premultiply(parentRestWorldRotation).multiply(restRotationInverse);
        quatA.toArray(values, i);
      }
      tracks.push(new THREE.QuaternionKeyframeTrack(`${vrmNode.name}.quaternion`, track.times, values));
    } else if (track.ValueTypeName === "vector" && propertyName === "position") {
      const values = track.values.map((v) => v * hipsPositionScale);
      tracks.push(new THREE.VectorKeyframeTrack(`${vrmNode.name}.position`, track.times, values));
    }
  }

  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}
