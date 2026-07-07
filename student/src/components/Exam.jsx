import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import * as faceapi from "face-api.js";
const INSCRIPT_MAP = {
  "`": "़",  "~": "ॐ",
  "1": "१",  "!": "!",
  "2": "२",  "@": "@",
  "3": "३",  "#": "#",
  "4": "४",  "$": "₹",
  "5": "५",  "%": "%",
  "6": "६",  "^": "^",
  "7": "७",  "&": "&",
  "8": "८",  "*": "*",
  "9": "९",  "(": "(",
  "0": "०",  ")": ")",
  "-": "-",  "_": "_",
  "=": "ृ",  "+": "ॄ",
  "q": "ौ",  "Q": "औ",
  "w": "ै",  "W": "ऐ",
  "e": "ा",  "E": "आ",
  "r": "ी",  "R": "ई",
  "t": "ू",  "T": "ऊ",
  "y": "ब",  "Y": "भ",
  "u": "ह",  "U": "ङ",
  "i": "ग",  "I": "घ",
  "o": "द",  "O": "ध",
  "p": "ज",  "P": "झ",
  "[": "ड",  "{": "ढ",
  "]": "़",  "}": "ञ",
  "\\": "ॉ", "|": "ऑ",
  "a": "ो",  "A": "ओ",
  "s": "े",  "S": "ए",
  "d": "्",  "D": "अ",
  "f": "ि",  "F": "इ",
  "g": "ु",  "G": "उ",
  "h": "प",  "H": "फ",
  "j": "र",  "J": "ऱ",
  "k": "क",  "K": "ख",
  "l": "त",  "L": "थ",
  ";": "च",  ":": "छ",
  "'": "ट",  "\"": "ठ",
  "z": "ॆ",  "Z": "ऍ",
  "x": "ँ",  "X": "ः",
  "c": "म",  "C": "ण",
  "v": "न",  "V": "ऩ",
  "b": "व",  "B": "ऴ",
  "n": "ल",  "N": "ळ",
  "m": "स",  "M": "श",
  ",": ",",  "<": "ष",
  ".": "।",  ">": ".",
  "/": "य",  "?": "?"
};
function toHindi(char) {
  return INSCRIPT_MAP[char] ?? char;
}
const FACE_CHECK_INTERVAL_MS  = 800;
const FACE_VERIFY_INTERVAL_MS = 1000;
const DISTANCE_THRESHOLD      = 0.42;
const MIN_FACE_BOX_FRACTION   = 0.12;
const SCORE_THRESHOLD         = 0.55;
const MATCH_FRAMES_NEEDED     = 3;
const MISMATCH_FRAMES_NEEDED  = 2;
const MAX_TAB_WARNINGS        = 3;
const EYE_GAZE_THRESHOLD      = 0.28;
const EYE_AWAY_FRAMES_NEEDED  = 3;
const MAX_EYE_WARNINGS        = 3;
const AUDIO_THRESHOLD         = 0.15;
const AUDIO_AWAY_FRAMES       = 4;
const POINTS_PER_WORD         = 2;
const LIVENESS_NOSE_MOVE_THRESHOLD = 4;
const LIVENESS_FRAMES_NEEDED       = 5;
const LIVENESS_WINDOW              = 40;
const LANDMARK_SPREAD_MIN          = 55;
const HEAD_POSE_YAW_MAX            = 0.38;
const hindiFont = {
  fontFamily: "'Mangal', 'Noto Sans Devanagari', 'Arial Unicode MS', sans-serif",
  fontSize: "1.1rem",
  lineHeight: 2,
};
const LOCK = {
  FACE_NOT_VISIBLE  : "face_not_visible",
  FACE_TOO_FAR      : "face_too_far",
  WRONG_PERSON      : "wrong_person",
  MULTI_FACE        : "multi_face",
  EYE_WARNINGS      : "eye_warnings",
  NO_DESCRIPTOR     : "no_descriptor",
  INITIAL           : "initial",
  LIVENESS_FAIL     : "liveness_fail",
  BACKGROUND_PERSON : "background_person",
};
const LOCK_MESSAGES = {
  [LOCK.FACE_NOT_VISIBLE]  : "🔒 Face not visible. Please sit in front of the camera.",
  [LOCK.FACE_TOO_FAR]      : "🔒 You are too far. Please move closer to the camera.",
  [LOCK.WRONG_PERSON]      : "🔒 Wrong person detected. Original student must be on camera.",
  [LOCK.MULTI_FACE]        : "🔒 Multiple faces detected. Only the student may appear.",
  [LOCK.EYE_WARNINGS]      : "🔒 Eyes off screen too many times. Please focus on the screen.",
  [LOCK.NO_DESCRIPTOR]     : "🔒 Registered face data missing. Logout and login again.",
  [LOCK.INITIAL]           : "🔒 Face not yet verified.",
  [LOCK.LIVENESS_FAIL]     : "🔒 Liveness check failed. Show your live face — no photos allowed.",
  [LOCK.BACKGROUND_PERSON] : "🔒 Another person detected in background. Ensure you are alone.",
};
function formatTimeAmPm(timeStr) {
  if (!timeStr) return "";
  try {
    const [hourStr, minuteStr] = timeStr.split(":");
    let hour = parseInt(hourStr, 10);
    const minute = minuteStr ? minuteStr.padStart(2, "0") : "00";
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${ampm}`;
  } catch {
    return timeStr;
  }
}
export default function Exam() {
  const [exams, setExams]           = useState([]);
  const [activeExam, setActiveExam] = useState(null);
  const [input, setInput]           = useState("");
  const [timeLeft, setTimeLeft]     = useState(0);
  const [startTimeStamp, setStartTimeStamp] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const examContainerRef = useRef(null);
  const [examPaused, setExamPaused] = useState(false);
  const [cameraOn, setCameraOn]     = useState(false);
  const [faceStatus, setFaceStatus] = useState("⏳ Initialising camera…");
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const verifiedDescriptor   = useRef(null);
  const faceMatchedOnce      = useRef(false);
  const cameraReadyRef       = useRef(false);
  const faceDetectionRunning = useRef(false);
  const lastVerifyTime       = useRef(0);
  const goodFrameCount       = useRef(0);
  const badFrameCount        = useRef(0);
  const livenessNoseHistory  = useRef([]);
  const livenessMovedFrames  = useRef(0);
  const livenessVerified     = useRef(false);
  const livenessCheckFrames  = useRef(0);
  const lockReasonsRef  = useRef(new Set([LOCK.INITIAL]));
  const [lockDisplay, setLockDisplay] = useState(LOCK_MESSAGES[LOCK.INITIAL]);
  const [isLocked, setIsLocked]       = useState(true);
  const PRIORITY_ORDER = [
    LOCK.MULTI_FACE, LOCK.BACKGROUND_PERSON, LOCK.WRONG_PERSON,
    LOCK.LIVENESS_FAIL, LOCK.EYE_WARNINGS, LOCK.NO_DESCRIPTOR,
    LOCK.FACE_NOT_VISIBLE, LOCK.FACE_TOO_FAR, LOCK.INITIAL
  ];
  const addLock = useCallback((code) => {
    lockReasonsRef.current.add(code);
    for (const p of PRIORITY_ORDER) {
      if (lockReasonsRef.current.has(p)) {
        setLockDisplay(LOCK_MESSAGES[p]);
        break;
      }
    }
    setIsLocked(true);
  }, []);
  const removeLock = useCallback((code) => {
    lockReasonsRef.current.delete(code);
    if (lockReasonsRef.current.size === 0) {
      setIsLocked(false);
      setLockDisplay("");
    } else {
      for (const p of PRIORITY_ORDER) {
        if (lockReasonsRef.current.has(p)) {
          setLockDisplay(LOCK_MESSAGES[p]);
          break;
        }
      }
    }
  }, []);
  const clearAllFaceLocks = useCallback(() => {
    [LOCK.FACE_NOT_VISIBLE, LOCK.FACE_TOO_FAR, LOCK.WRONG_PERSON,
     LOCK.MULTI_FACE, LOCK.NO_DESCRIPTOR, LOCK.INITIAL,
     LOCK.LIVENESS_FAIL, LOCK.BACKGROUND_PERSON].forEach(c => {
      lockReasonsRef.current.delete(c);
    });
    if (lockReasonsRef.current.size === 0) {
      setIsLocked(false);
      setLockDisplay("");
    } else {
      for (const p of PRIORITY_ORDER) {
        if (lockReasonsRef.current.has(p)) {
          setLockDisplay(LOCK_MESSAGES[p]);
          break;
        }
      }
    }
  }, []);
  const isLockedRef = useRef(true);
  useEffect(() => { isLockedRef.current = isLocked; }, [isLocked]);
  const [wrongPersonAlert, setWrongPersonAlert]   = useState(false);
  const [multiFaceAlert, setMultiFaceAlert]       = useState(false);
  const [eyeAlert, setEyeAlert]                   = useState(false);
  const [audioAlert, setAudioAlert]               = useState(false);
  const [livenessAlert, setLivenessAlert]         = useState(false);
  const [backgroundAlert, setBackgroundAlert]     = useState(false);
  const [eyeWarningCount, setEyeWarningCount] = useState(0);
  const eyeWarningCountRef = useRef(0);
  const eyeAwayFrames      = useRef(0);
  const eyeAlertTimerRef   = useRef(null);
  const audioContextRef    = useRef(null);
  const analyserRef        = useRef(null);
  const audioStreamRef     = useRef(null);
  const audioAlertTimerRef = useRef(null);
  const audioAwayFrames    = useRef(0);
  const wrongPersonEverRef    = useRef(false);
  const multiFaceEverRef      = useRef(false);
  const livenessFailEverRef   = useRef(false);
  const warningCountRef = useRef(0);
  const [warningCount, setWarningCount] = useState(0);
  const lastWarningTime = useRef(0);
  const suspiciousLog = useRef([]);
  const activeExamRef  = useRef(null);
  const inputRef       = useRef("");
  const inputElRef     = useRef(null);
  const startTimeRef   = useRef(null);
  const typingStartRef = useRef(null);
  const submittingRef  = useRef(false);
  const [toastMsg, setToastMsg]       = useState("");
  const [toastType, setToastType]     = useState("info");
  const toastTimerRef                 = useRef(null);
  const examPausedRef = useRef(false);
  const showToast = useCallback((msg, type = "info", duration = 4500) => {
    setToastMsg(msg);
    setToastType(type);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(""), duration);
  }, []);
  const student   = JSON.parse(localStorage.getItem("studentData") || "{}");
  const studentId = student?.id;
  const username  = student?.username;
  const enterFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  }, []);
  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
    else if (document.msExitFullscreen) document.msExitFullscreen();
  }, []);
  useEffect(() => {
    examPausedRef.current = examPaused;
  }, [examPaused]);
  useEffect(() => {
    const onFsChange = () => {
      const fsEl =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;
      const nowFullscreen = !!fsEl;
      setIsFullscreen(nowFullscreen);
      if (!nowFullscreen && activeExamRef.current) {
        const styleId = "exam-fullscreen-hide-sidebar";
        const el = document.getElementById(styleId);
        if (el) el.remove();
        setExamPaused(true);
        logSuspicious("Student exited fullscreen (Escape key)");
      }
      if (nowFullscreen && activeExamRef.current) {
        setExamPaused(false);
        const styleId = "exam-fullscreen-hide-sidebar";
        if (!document.getElementById(styleId)) {
          const style = document.createElement("style");
          style.id = styleId;
          style.innerHTML = `
            nav, aside, .sidebar, .navbar, .nav-sidebar,
            [class*="sidebar"], [class*="Sidebar"],
            [class*="navbar"], [class*="Navbar"],
            [class*="header"]:not(#exam-header),
            [class*="Header"]:not(#exam-header),
            .layout-sidebar, .app-sidebar, .left-panel,
            .main-nav, .top-nav {
              display: none !important;
            }
            body, #root, .app-layout, .main-layout,
            .content-wrapper, .page-wrapper {
              padding: 0 !important;
              margin: 0 !important;
            }
          `;
          document.head.appendChild(style);
        }
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    document.addEventListener("mozfullscreenchange", onFsChange);
    document.addEventListener("MSFullscreenChange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      document.removeEventListener("mozfullscreenchange", onFsChange);
      document.removeEventListener("MSFullscreenChange", onFsChange);
    };
  }, []);
  useEffect(() => {
    const styleId = "exam-fullscreen-hide-sidebar";
    if (activeExam && isFullscreen && !examPaused) {
      if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.innerHTML = `
          nav, aside, .sidebar, .navbar, .nav-sidebar,
          [class*="sidebar"], [class*="Sidebar"],
          [class*="navbar"], [class*="Navbar"],
          [class*="header"]:not(#exam-header),
          [class*="Header"]:not(#exam-header),
          .layout-sidebar, .app-sidebar, .left-panel,
          .main-nav, .top-nav {
            display: none !important;
          }
          body, #root, .app-layout, .main-layout,
          .content-wrapper, .page-wrapper {
            padding: 0 !important;
            margin: 0 !important;
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    }
  }, [activeExam, isFullscreen, examPaused]);
  const formatDateSafe = (dateStr) => {
    if (!dateStr) return "";
    const s = String(dateStr).split("T")[0];
    const parts = s.split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
  };
  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const euclideanDistance = (d1, d2) => {
    if (!d1 || !d2 || d1.length !== d2.length) return 999;
    let sum = 0;
    for (let i = 0; i < d1.length; i++) sum += (d1[i] - d2[i]) ** 2;
    return Math.sqrt(sum);
  };
  const getStoredDescriptor = () => {
    try {
      const raw = localStorage.getItem("studentData");
      if (!raw) return null;
      const obj = JSON.parse(raw);
      let d = obj?.descriptor;
      if (!d) return null;
      if (typeof d === "string") d = JSON.parse(d);
      if (!Array.isArray(d) || d.length === 0) return null;
      return d;
    } catch { return null; }
  };
  const logSuspicious = (event) => {
    suspiciousLog.current.push({ event, time: new Date().toISOString() });
  };
  const isHindiExam = activeExam?.language === "Hindi" || activeExam?.language === "HI";
  const checkLiveness = (landmarks) => {
    try {
      const positions = landmarks.positions;
      const noseTip = positions[30];
      const history = livenessNoseHistory.current;
      history.push({ x: noseTip.x, y: noseTip.y });
      livenessCheckFrames.current++;
      if (history.length > LIVENESS_WINDOW) history.shift();
      if (history.length >= 8) {
        let movingFrames = 0;
        for (let i = 1; i < history.length; i++) {
          const dx = history[i].x - history[i-1].x;
          const dy = history[i].y - history[i-1].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist > LIVENESS_NOSE_MOVE_THRESHOLD) movingFrames++;
        }
        livenessMovedFrames.current = movingFrames;
        if (livenessCheckFrames.current >= 20) {
          if (movingFrames < LIVENESS_FRAMES_NEEDED) {
            return false;
          } else {
            return true;
          }
        }
        return null;
      }
      return null;
    } catch {
      return null;
    }
  };
  const checkLandmarkSpread = (landmarks) => {
    try {
      const positions = landmarks.positions;
      const xs = positions.map(p => p.x);
      const ys = positions.map(p => p.y);
      const spreadX = Math.max(...xs) - Math.min(...xs);
      const spreadY = Math.max(...ys) - Math.min(...ys);
      const spread = Math.sqrt(spreadX * spreadX + spreadY * spreadY);
      return spread >= LANDMARK_SPREAD_MIN;
    } catch {
      return true;
    }
  };
  const estimateHeadPose = (landmarks) => {
    try {
      const positions = landmarks.positions;
      const noseTip  = positions[30];
      const leftEye  = positions[36];
      const rightEye = positions[45];
      const eyeMidX  = (leftEye.x + rightEye.x) / 2;
      const faceW    = Math.abs(positions[16].x - positions[0].x);
      if (faceW === 0) return { yaw: 0 };
      const yaw = (noseTip.x - eyeMidX) / faceW;
      return { yaw };
    } catch {
      return { yaw: 0 };
    }
  };
  const estimateEyeGaze = (landmarks) => {
    try {
      const positions = landmarks.positions;
      const eyeCenter = (pts) => {
        const xs = pts.map(p => p.x);
        const ys = pts.map(p => p.y);
        return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
      };
      const le = eyeCenter(positions.slice(36, 42));
      const re = eyeCenter(positions.slice(42, 48));
      const noseTip   = positions[30];
      const faceWidth = Math.abs(positions[16].x - positions[0].x);
      const eyeMidX   = (le.x + re.x) / 2;
      const noseOffset = Math.abs(noseTip.x - eyeMidX) / faceWidth;
      return { noseOffset, lookingAway: noseOffset > EYE_GAZE_THRESHOLD };
    } catch {
      return { noseOffset: 0, lookingAway: false };
    }
  };
  const stopCamera = () => {
    cameraReadyRef.current       = false;
    faceDetectionRunning.current = false;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };
  const startCamera = () =>
    new Promise(async (resolve, reject) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" }
        });
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) { reject(new Error("No video element")); return; }
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play()
            .then(() => {
              setCameraOn(true);
              setTimeout(() => {
                cameraReadyRef.current = true;
                setFaceStatus("📷 Camera ready — verifying your face…");
                resolve();
              }, 2000);
            })
            .catch(reject);
        };
      } catch (err) { reject(err); }
    });
  const loadModels = async () => {
    // Resolve relative to the current document location instead of using
    // an absolute-looking "/models" path. "/models" breaks in the packaged
    // Electron app because it loads via file:// and treats a leading "/"
    // as the filesystem root, not the app's own folder.
    // NOTE: named modelsUrl (not URL) so it doesn't shadow the built-in
    // window.URL constructor — naming it "URL" caused a
    // "Cannot access 'URL' before initialization" error, since the const
    // declaration shadows the global inside its own initializer.
    const modelsUrl = new window.URL("models", window.location.href).href;
    await faceapi.nets.tinyFaceDetector.loadFromUri(modelsUrl);
    await faceapi.nets.faceLandmark68Net.loadFromUri(modelsUrl);
    await faceapi.nets.faceRecognitionNet.loadFromUri(modelsUrl);
  };
  const startAudioMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
    } catch (err) {
      console.warn("Audio monitoring unavailable:", err);
    }
  };
  const stopAudioMonitoring = () => {
    try {
      audioStreamRef.current?.getTracks().forEach(t => t.stop());
      audioContextRef.current?.close();
    } catch {}
    audioStreamRef.current = null;
    audioContextRef.current = null;
    analyserRef.current = null;
  };
  useEffect(() => {
    if (!activeExam || !cameraOn) return;
    const iv = setInterval(() => {
      if (!analyserRef.current) return;
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;
      if (avg > AUDIO_THRESHOLD) {
        audioAwayFrames.current++;
        if (audioAwayFrames.current >= AUDIO_AWAY_FRAMES) {
          setAudioAlert(true);
          logSuspicious("High background audio detected");
          clearTimeout(audioAlertTimerRef.current);
          audioAlertTimerRef.current = setTimeout(() => setAudioAlert(false), 4000);
          audioAwayFrames.current = 0;
        }
      } else {
        audioAwayFrames.current = 0;
      }
    }, 1200);
    return () => clearInterval(iv);
  }, [activeExam, cameraOn]);
  useEffect(() => {
    if (!cameraOn || !activeExam) return;
    const interval = setInterval(async () => {
      if (examPausedRef.current)        return;
      if (!cameraReadyRef.current)      return;
      if (faceDetectionRunning.current) return;
      const video = videoRef.current;
      if (!video || video.readyState < 3) return;
      faceDetectionRunning.current = true;
      try {
        const now          = Date.now();
        const doFullVerify = (now - lastVerifyTime.current) >= FACE_VERIFY_INTERVAL_MS;
        const allDetections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: SCORE_THRESHOLD
          }))
          .withFaceLandmarks()
          .withFaceDescriptors();
        if (allDetections.length > 1) {
          goodFrameCount.current = 0;
          badFrameCount.current  = Math.min(badFrameCount.current + 1, MISMATCH_FRAMES_NEEDED);
          multiFaceEverRef.current = true;
          logSuspicious(`Multiple faces detected: ${allDetections.length}`);
          const primaryFace = allDetections.reduce((best, d) =>
            d.detection.box.width > best.detection.box.width ? d : best
          );
          const primaryBoxFraction = primaryFace.detection.box.width / video.videoWidth;
          const otherFaces = allDetections.filter(d => d !== primaryFace);
          const allOthersSmall = otherFaces.every(
            d => d.detection.box.width / video.videoWidth < 0.08
          );
          if (allOthersSmall && primaryBoxFraction >= MIN_FACE_BOX_FRACTION) {
            setFaceStatus(`🚫 Another person detected in background! You must be alone.`);
            addLock(LOCK.BACKGROUND_PERSON);
            lockReasonsRef.current.delete(LOCK.MULTI_FACE);
            setBackgroundAlert(true);
            setMultiFaceAlert(false);
          } else {
            setFaceStatus(`🚨 Multiple faces detected (${allDetections.length})! Only you should be visible.`);
            addLock(LOCK.MULTI_FACE);
            lockReasonsRef.current.delete(LOCK.BACKGROUND_PERSON);
            setMultiFaceAlert(true);
            setBackgroundAlert(false);
            typingStartRef.current = null;
            setWrongPersonAlert(false);
          }
          faceDetectionRunning.current = false;
          return;
        }
        lockReasonsRef.current.delete(LOCK.MULTI_FACE);
        lockReasonsRef.current.delete(LOCK.BACKGROUND_PERSON);
        setMultiFaceAlert(false);
        setBackgroundAlert(false);
        typingStartRef.current = null;
        if (allDetections.length === 0) {
          goodFrameCount.current = 0;
          badFrameCount.current  = Math.min(badFrameCount.current + 1, MISMATCH_FRAMES_NEEDED);
          if (badFrameCount.current >= MISMATCH_FRAMES_NEEDED) {
            setFaceStatus("⚠️ Face not visible — sit in front of the camera");
            addLock(LOCK.FACE_NOT_VISIBLE);
            setWrongPersonAlert(false);
          }
          faceDetectionRunning.current = false;
          return;
        }
        const detection = allDetections[0];
        const boxFraction = detection.detection.box.width / video.videoWidth;
        if (boxFraction < MIN_FACE_BOX_FRACTION) {
          goodFrameCount.current = 0;
          badFrameCount.current  = Math.min(badFrameCount.current + 1, MISMATCH_FRAMES_NEEDED);
          if (badFrameCount.current >= MISMATCH_FRAMES_NEEDED) {
            setFaceStatus("⚠️ Too far from camera — move closer");
            lockReasonsRef.current.delete(LOCK.FACE_NOT_VISIBLE);
            addLock(LOCK.FACE_TOO_FAR);
            setWrongPersonAlert(false);
          }
          faceDetectionRunning.current = false;
          return;
        }
        lockReasonsRef.current.delete(LOCK.FACE_NOT_VISIBLE);
        lockReasonsRef.current.delete(LOCK.FACE_TOO_FAR);
        if (detection.landmarks) {
          const livenessResult = checkLiveness(detection.landmarks);
          if (livenessResult === false) {
            if (!livenessVerified.current) {
              setFaceStatus("🚫 Liveness check failed — use your live face, no photos");
              addLock(LOCK.LIVENESS_FAIL);
              setLivenessAlert(true);
              livenessFailEverRef.current = true;
              logSuspicious("Liveness check failed — possible photo/screen detected");
              faceDetectionRunning.current = false;
              return;
            }
          } else if (livenessResult === true) {
            livenessVerified.current = true;
            lockReasonsRef.current.delete(LOCK.LIVENESS_FAIL);
            setLivenessAlert(false);
          }
          const spreadOk = checkLandmarkSpread(detection.landmarks);
          if (!spreadOk && !livenessVerified.current) {
            setFaceStatus("⚠️ Face too small or unclear — move closer");
            faceDetectionRunning.current = false;
            return;
          }
        }
        if (detection.landmarks) {
          const gaze = estimateEyeGaze(detection.landmarks);
          if (gaze.lookingAway) {
            eyeAwayFrames.current++;
            if (eyeAwayFrames.current >= EYE_AWAY_FRAMES_NEEDED) {
              eyeAwayFrames.current = 0;
              const newEW = eyeWarningCountRef.current + 1;
              eyeWarningCountRef.current = newEW;
              setEyeWarningCount(newEW);
              logSuspicious("Eyes looking away from screen");
              setEyeAlert(true);
              clearTimeout(eyeAlertTimerRef.current);
              eyeAlertTimerRef.current = setTimeout(() => setEyeAlert(false), 3500);
              if (newEW >= MAX_EYE_WARNINGS) {
                addLock(LOCK.EYE_WARNINGS);
                logSuspicious("Eye tracking: max warnings reached — input locked");
              }
            }
          } else {
            eyeAwayFrames.current = Math.max(0, eyeAwayFrames.current - 1);
          }
        }
        if (!doFullVerify && faceMatchedOnce.current) {
          faceDetectionRunning.current = false;
          return;
        }
        lastVerifyTime.current = now;
        const liveDescriptor = Array.from(detection.descriptor);
        const stored = getStoredDescriptor();
        if (!faceMatchedOnce.current) {
          if (!stored) {
            setFaceStatus("⚠️ Registered face missing — logout and login again");
            addLock(LOCK.NO_DESCRIPTOR);
            faceDetectionRunning.current = false;
            return;
          }
          if (!livenessVerified.current && livenessCheckFrames.current >= 20) {
            setFaceStatus("🚫 Please move slightly — liveness verification required");
            addLock(LOCK.LIVENESS_FAIL);
            faceDetectionRunning.current = false;
            return;
          }
          const dist = euclideanDistance(liveDescriptor, stored);
          if (dist <= DISTANCE_THRESHOLD) {
            goodFrameCount.current++;
            if (goodFrameCount.current >= MATCH_FRAMES_NEEDED) {
              verifiedDescriptor.current = liveDescriptor;
              faceMatchedOnce.current    = true;
              badFrameCount.current      = 0;
              goodFrameCount.current     = 0;
              setFaceStatus("✅ Face verified — exam in progress");
              setWrongPersonAlert(false);
              clearAllFaceLocks();
            } else {
              setFaceStatus(`📷 Verifying… (${goodFrameCount.current}/${MATCH_FRAMES_NEEDED})`);
            }
          } else {
            goodFrameCount.current = 0;
            badFrameCount.current  = Math.min(badFrameCount.current + 1, MISMATCH_FRAMES_NEEDED);
            wrongPersonEverRef.current = true;
            setFaceStatus(`⚠️ Face not matching (dist ${dist.toFixed(2)}) — adjust lighting or position`);
            if (badFrameCount.current >= MISMATCH_FRAMES_NEEDED) {
              addLock(LOCK.WRONG_PERSON);
              setWrongPersonAlert(true);
              logSuspicious(`Identity mismatch at initial verify, dist=${dist.toFixed(2)}`);
            }
          }
          faceDetectionRunning.current = false;
          return;
        }
        const distVerified = euclideanDistance(liveDescriptor, verifiedDescriptor.current);
        const distStored   = stored ? euclideanDistance(liveDescriptor, stored) : 999;
        const bestDist     = Math.min(distVerified, distStored);
        if (bestDist <= DISTANCE_THRESHOLD) {
          goodFrameCount.current++;
          badFrameCount.current = 0;
          if (goodFrameCount.current >= MATCH_FRAMES_NEEDED) {
            setFaceStatus("✅ Face verified");
            setWrongPersonAlert(false);
            clearAllFaceLocks();
            if (bestDist <= 0.38) {
              verifiedDescriptor.current = verifiedDescriptor.current.map(
                (v, i) => v * 0.85 + liveDescriptor[i] * 0.15
              );
            }
          }
        } else {
          goodFrameCount.current = 0;
          badFrameCount.current  = Math.min(badFrameCount.current + 1, MISMATCH_FRAMES_NEEDED);
          wrongPersonEverRef.current = true;
          logSuspicious(`Wrong person detected (dist=${bestDist.toFixed(2)})`);
          if (badFrameCount.current >= MISMATCH_FRAMES_NEEDED) {
            setFaceStatus(`🚨 Wrong person detected — original student must appear`);
            addLock(LOCK.WRONG_PERSON);
            setWrongPersonAlert(true);
            livenessVerified.current    = false;
            livenessNoseHistory.current = [];
            livenessMovedFrames.current = 0;
            livenessCheckFrames.current = 0;
            faceMatchedOnce.current     = false;
            verifiedDescriptor.current  = null;
          } else {
            setFaceStatus(`⚠️ Verifying identity… (${badFrameCount.current}/${MISMATCH_FRAMES_NEEDED})`);
          }
        }
      } catch (err) {
        console.error("Face detection error:", err);
        setFaceStatus("⚠️ Detection error — retrying…");
      } finally {
        faceDetectionRunning.current = false;
      }
    }, FACE_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [cameraOn, activeExam, examPaused, addLock, clearAllFaceLocks, removeLock]);
  useEffect(() => {
    if (examPaused) return;
    if (!activeExam || !cameraOn) return;
    faceDetectionRunning.current = false;
    cameraReadyRef.current       = false;
    setFaceStatus("📷 Camera resuming — verifying your face…");
    const warmUp = setTimeout(() => {
      const video = videoRef.current;
      if (video && streamRef.current && !video.srcObject) {
        video.srcObject = streamRef.current;
        video.play().catch(() => {});
      }
      cameraReadyRef.current = true;
      setFaceStatus("📷 Camera ready — verifying your face…");
    }, 1500);
    return () => clearTimeout(warmUp);
  }, [examPaused, activeExam, cameraOn]);
  useEffect(() => {
    if (!activeExam) return;
    const blockShortcuts = (e) => {
      if (e.ctrlKey && ["c","v","a","z","x","u","s"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        logSuspicious(`Blocked shortcut: Ctrl+${e.key}`);
        return false;
      }
      if (e.key === "PrintScreen") {
        e.preventDefault();
        logSuspicious("Screenshot attempt detected");
      }
      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && ["i","j","c"].includes(e.key.toLowerCase()))) {
        e.preventDefault();
        logSuspicious("DevTools attempt blocked");
      }
    };
    document.addEventListener("keydown", blockShortcuts);
    return () => document.removeEventListener("keydown", blockShortcuts);
  }, [activeExam]);
  useEffect(() => {
    if (!activeExam) return;
    const blockContext = (e) => {
      e.preventDefault();
      logSuspicious("Right-click attempt blocked");
    };
    document.addEventListener("contextmenu", blockContext);
    return () => document.removeEventListener("contextmenu", blockContext);
  }, [activeExam]);
  const finishExam = useCallback(async (examData, auto = false) => {
    if (submittingRef.current || !examData) return;
    submittingRef.current = true;
    const currentInput = inputRef.current || localStorage.getItem(`typed_${examData.id}_${studentId}`) || "";
    const resolvedStartTime = startTimeRef.current ||
      (localStorage.getItem(`start_time_${examData.id}_${studentId}`)
        ? parseInt(localStorage.getItem(`start_time_${examData.id}_${studentId}`), 10)
        : null);
    const currentWarnings = warningCountRef.current;
    const wasWrongPerson  = wrongPersonEverRef.current;
    const wasMultiFace    = multiFaceEverRef.current;
    const wasLivenessFail = livenessFailEverRef.current;
    const eyeWarnSnap     = eyeWarningCountRef.current;
    const suspiciousSnap  = [...suspiciousLog.current];
    localStorage.setItem(`submitted_${examData.id}_${studentId}`, "true");
    localStorage.removeItem(`typed_${examData.id}_${studentId}`);
    localStorage.removeItem(`start_time_${examData.id}_${studentId}`);
    setExams(prev =>
      prev.map(e => e.id === examData.id ? { ...e, attempted: true } : e)
    );
    const typedWords = currentInput.trim().split(/\s+/).filter(Boolean).length;
    const paragraphText = examData.paragraph || "";
    const totalWordsInParagraph = paragraphText.trim().split(/\s+/).filter(Boolean).length;
    const typedChars    = currentInput.split("");
    const originalChars = paragraphText.split("");
    const compareLen    = typedChars.length;
    let correctChars = 0;
    let errorChars   = 0;
    for (let i = 0; i < compareLen; i++) {
      if (i < originalChars.length && typedChars[i] === originalChars[i]) {
        correctChars++;
      } else {
        errorChars++;
      }
    }
    let elapsedMin;
    if (resolvedStartTime) {
      elapsedMin = (Date.now() - resolvedStartTime) / 60000;
    } else {
      elapsedMin = examData.duration;
    }
    elapsedMin = Math.max(1 / 60, Math.min(elapsedMin, examData.duration));
    const totalKeystrokes = currentInput.length;
    const grossWpm = Math.round((totalKeystrokes / 5) / elapsedMin);
    const netWpm   = Math.max(0, Math.round(grossWpm - (errorChars / elapsedMin)));
    const acc = compareLen > 0 ? Math.round((correctChars / compareLen) * 100) : 0;
    const totalScore    = typedWords * POINTS_PER_WORD;
    const totalPossible = totalWordsInParagraph * POINTS_PER_WORD;
    console.log(
      "[finishExam — SSC/Railway Formula]",
      "\nauto=", auto,
      "\ntotal_characters (keystrokes)=", totalKeystrokes,
      "\ntypedWords=", typedWords,
      "\ntotalWordsInParagraph=", totalWordsInParagraph,
      "\ncorrectChars=", correctChars,
      "\nerrorChars=", errorChars,
      "\nelapsedMin=", elapsedMin.toFixed(3),
      "\ngrossWpm=", grossWpm,
      "\nnetWpm (wpm)=", netWpm,
      "\nacc=", acc, "%",
      "\npoints=", totalScore, "/", totalPossible
    );
    exitFullscreen();
    stopCamera();
    stopAudioMonitoring();
    setActiveExam(null);        activeExamRef.current = null;
    setInput("");               inputRef.current = "";
    setTimeLeft(0);
    setStartTimeStamp(null);    startTimeRef.current = null;
    setWarningCount(0);         warningCountRef.current = 0;
    setEyeWarningCount(0);      eyeWarningCountRef.current = 0;
    setFaceStatus("⏳ Initialising camera…");
    setExamPaused(false);
    faceMatchedOnce.current     = false;
    verifiedDescriptor.current  = null;
    wrongPersonEverRef.current  = false;
    multiFaceEverRef.current    = false;
    livenessFailEverRef.current = false;
    livenessVerified.current    = false;
    livenessNoseHistory.current = [];
    livenessMovedFrames.current = 0;
    livenessCheckFrames.current = 0;
    goodFrameCount.current      = 0;
    badFrameCount.current       = 0;
    eyeAwayFrames.current       = 0;
    audioAwayFrames.current     = 0;
    suspiciousLog.current       = [];
    lockReasonsRef.current      = new Set([LOCK.INITIAL]);
    setIsLocked(true);
    setLockDisplay(LOCK_MESSAGES[LOCK.INITIAL]);
    typingStartRef.current = null;
    setWrongPersonAlert(false);
    setMultiFaceAlert(false);
    setEyeAlert(false);
    setAudioAlert(false);
    setLivenessAlert(false);
    setBackgroundAlert(false);
    typingStartRef.current = null;
    showToast(
      auto ? "🚨 Time's up! Exam Auto-Submitted." : "✅ Exam Submitted Successfully!",
      auto ? "warning" : "success",
      5000
    );
    try {
      await axios.post("https://typing-portal-es53.onrender.com/save-exam-result", {
        student_id:   studentId,
        username,
        language:     examData.language,
        exam_id:      examData.id,
        total_words:       totalWordsInParagraph,
        typed_words:       typedWords,
        total_characters:  totalKeystrokes,
        errors:            errorChars,
        points:            totalScore,
        total_possible_points: totalPossible,
        wpm:       netWpm,
        gross_wpm: grossWpm,
        accuracy:  acc,
        duration_used: Math.round(elapsedMin * 60),
        warnings:     currentWarnings,
        eye_warnings: eyeWarnSnap,
        status:       auto ? "auto-submitted" : "completed",
        wrong_person: wasWrongPerson,
        multi_face:   wasMultiFace,
        suspicious_events: suspiciousSnap.length,
        suspicious_log:    JSON.stringify(suspiciousSnap),
        integrity_note:
          wasLivenessFail ? "🚨 Liveness check failed — possible photo spoofing"
          : wasWrongPerson ? "⚠️ Wrong person detected during exam"
          : wasMultiFace   ? "⚠️ Multiple faces detected during exam"
          : "✅ Identity verified throughout exam"
      });
    } catch (err) {
      console.error("Submit error:", err);
      if (err.response?.status !== 400) {
        showToast("⚠️ Result may not have saved to server. Please contact admin.", "warning", 7000);
      }
    }
    submittingRef.current = false;
  }, [studentId, username, showToast, exitFullscreen]);
  const markNotAttempted = useCallback(async (exam) => {
    if (!exam || !studentId) return;
    const alreadySubmitted = localStorage.getItem(`submitted_${exam.id}_${studentId}`);
    if (alreadySubmitted) return;
    try {
      const paragraphText = exam.paragraph || "";
      const totalWordsInParagraph = paragraphText.trim().split(/\s+/).filter(Boolean).length;
      await axios.post("https://typing-portal-es53.onrender.com/save-exam-result", {
        student_id:            studentId,
        username,
        language:              exam.language,
        exam_id:               exam.id,
        total_words:           totalWordsInParagraph,
        total_possible_points: totalWordsInParagraph * POINTS_PER_WORD,
        typed_words:           0,
        total_characters:      0,
        errors:                0,
        points:                0,
        wpm:                   0,
        gross_wpm:             0,
        accuracy:              0,
        warnings:              0,
        eye_warnings:          0,
        status:                "not_attempted",
        wrong_person:          false,
        multi_face:            false,
        suspicious_events:     0,
        suspicious_log:        JSON.stringify([]),
        integrity_note:        "⚠️ Student did not attempt the exam",
      });
      localStorage.setItem(`submitted_${exam.id}_${studentId}`, "true");
    } catch (err) {
      if (err.response?.status !== 400) {
        console.warn("markNotAttempted error:", err);
      }
    }
  }, [studentId, username]);
  const handleTabWarning = useCallback(() => {
    const now = Date.now();
    if (now - lastWarningTime.current < 3000) return;
    lastWarningTime.current = now;
    const n = warningCountRef.current + 1;
    warningCountRef.current = n;
    setWarningCount(n);
    logSuspicious(`Tab switch #${n}`);
    if (n < MAX_TAB_WARNINGS) {
      showToast(
        `⚠️ Warning ${n}/${MAX_TAB_WARNINGS}: Do not switch tabs or minimise the window!`,
        "warning",
        5000
      );
    } else {
      showToast(
        `❌ Warning ${n}/${MAX_TAB_WARNINGS}: Too many tab switches — auto-submitting!`,
        "error",
        5000
      );
      finishExam(activeExamRef.current, true);
    }
  }, [finishExam, showToast]);
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && activeExamRef.current) handleTabWarning();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [handleTabWarning]);
  useEffect(() => {
    if (!activeExam) return;
    const onBlur = () => { if (activeExamRef.current) logSuspicious("Window focus lost"); };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [activeExam]);
  useEffect(() => {
    if (!studentId) return;
    const load = async () => {
      try {
        const res = await axios.get(`https://typing-portal-es53.onrender.com/api/exams-for-student/${studentId}`);
        setExams(prev => {
          return res.data.map(serverExam => {
            const localAttempted = !!localStorage.getItem(`submitted_${serverExam.id}_${studentId}`);
            const stateAttempted = prev.find(e => e.id === serverExam.id)?.attempted || false;
            return {
              ...serverExam,
              attempted: serverExam.attempted || localAttempted || stateAttempted,
            };
          });
        });
        const updated = res.data.map(exam => ({
          ...exam,
          attempted: exam.attempted || !!localStorage.getItem(`submitted_${exam.id}_${studentId}`)
        }));
        for (const exam of updated) {
          if (exam.status === "Ended" && !exam.attempted) {
            await markNotAttempted(exam);
          }
        }
      } catch (err) { console.error("Load exams error:", err); }
    };
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, [studentId, markNotAttempted]);
  const startExam = async (exam) => {
    if (exam.status !== "Ongoing") {
      showToast("⚠️ Exam has not started yet!", "warning");
      return;
    }
    if (localStorage.getItem(`submitted_${exam.id}_${studentId}`)) {
      showToast("⚠️ You have already submitted this exam!", "warning");
      setExams(prev => prev.map(e => e.id === exam.id ? { ...e, attempted: true } : e));
      return;
    }
    faceMatchedOnce.current       = false;
    verifiedDescriptor.current    = null;
    cameraReadyRef.current        = false;
    faceDetectionRunning.current  = false;
    warningCountRef.current       = 0;
    submittingRef.current         = false;
    wrongPersonEverRef.current    = false;
    multiFaceEverRef.current      = false;
    livenessFailEverRef.current   = false;
    livenessVerified.current      = false;
    livenessNoseHistory.current   = [];
    livenessMovedFrames.current   = 0;
    livenessCheckFrames.current   = 0;
    goodFrameCount.current        = 0;
    badFrameCount.current         = 0;
    eyeAwayFrames.current         = 0;
    audioAwayFrames.current       = 0;
    eyeWarningCountRef.current    = 0;
    suspiciousLog.current         = [];
    inputRef.current              = "";
    lastVerifyTime.current        = 0;
    lockReasonsRef.current        = new Set([LOCK.INITIAL]);
    setWarningCount(0);
    setEyeWarningCount(0);
    setInput("");
    setFaceStatus("⏳ Starting camera…");
    setWrongPersonAlert(false);
    setMultiFaceAlert(false);
    setEyeAlert(false);
    setAudioAlert(false);
    setLivenessAlert(false);
    setBackgroundAlert(false);
    typingStartRef.current = null;
    setIsLocked(true);
    setLockDisplay(LOCK_MESSAGES[LOCK.INITIAL]);
    typingStartRef.current = null;
    setExamPaused(false);
    const examStartMs  = new Date(exam.start_datetime.replace(" ", "T")).getTime();
    const examEndMs    = examStartMs + exam.duration * 60 * 1000;
    const nowMs        = Date.now();
    const remainingSec = Math.floor((examEndMs - nowMs) / 1000);
    if (remainingSec <= 0) {
      showToast("⚠️ This exam has already ended!", "warning");
      return;
    }
    const syntheticStart = nowMs - (exam.duration * 60 * 1000 - remainingSec * 1000);
    setStartTimeStamp(syntheticStart);
    startTimeRef.current = syntheticStart;
    localStorage.setItem(`start_time_${exam.id}_${studentId}`, String(syntheticStart));
    const savedText = localStorage.getItem(`typed_${exam.id}_${studentId}`) || "";
    if (savedText) { setInput(savedText); inputRef.current = savedText; }
    activeExamRef.current = exam;
    setActiveExam(exam);
    enterFullscreen();
    try {
      await loadModels();
      await startCamera();
      await startAudioMonitoring();
    } catch (err) {
      console.error("Exam start error:", err);
      showToast("❌ Could not access camera. Please allow camera permission and try again.", "error", 6000);
    }
  };
  const resumeExam = useCallback(() => {
    faceDetectionRunning.current = false;
    cameraReadyRef.current       = false;
    setExamPaused(false);
    enterFullscreen();
    logSuspicious("Student resumed exam (re-entered fullscreen)");
  }, [enterFullscreen]);
  useEffect(() => {
    if (!activeExam || !startTimeStamp) return;
    const timer = setInterval(() => {
      const totalMs   = activeExam.duration * 60 * 1000;
      const elapsed   = Date.now() - startTimeStamp;
      const remaining = Math.floor((totalMs - elapsed) / 1000);
      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(timer);
        const snap = activeExamRef.current;
        if (snap) finishExam(snap, true);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activeExam, startTimeStamp, finishExam]);
  const handleHindiKeyDown = useCallback((e) => {
    if (isLockedRef.current) return;
    const navKeys = ["ArrowLeft","ArrowRight","ArrowUp","ArrowDown",
                     "Home","End","Tab","Escape","Shift","Control","Alt","Meta",
                     "CapsLock","PageUp","PageDown",
                     "F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12"];
    if (navKeys.includes(e.key)) return;
    const el = inputElRef.current;
    if (!el) return;
    const updateStats = (newValue) => {
      setInput(newValue);
      inputRef.current = newValue;
      if (activeExamRef.current) {
        localStorage.setItem(`typed_${activeExamRef.current.id}_${studentId}`, newValue);
      }
    };
    if (e.key === "Backspace") {
      e.preventDefault();
      const start = el.selectionStart ?? inputRef.current.length;
      const end   = el.selectionEnd   ?? inputRef.current.length;
      const cur   = inputRef.current;
      let newValue;
      if (start !== end) {
        newValue = cur.slice(0, start) + cur.slice(end);
      } else if (start > 0) {
        const chars = Array.from(cur);
        chars.splice(Array.from(cur.slice(0, start)).length - 1, 1);
        newValue = chars.join("");
      } else return;
      updateStats(newValue);
      const newCursor = start !== end ? start : Math.max(0, start - 1);
      setTimeout(() => { el.selectionStart = newCursor; el.selectionEnd = newCursor; }, 0);
      return;
    }
    if (e.key === "Delete") {
      e.preventDefault();
      const start = el.selectionStart ?? inputRef.current.length;
      const end   = el.selectionEnd   ?? inputRef.current.length;
      const cur   = inputRef.current;
      let newValue;
      if (start !== end) {
        newValue = cur.slice(0, start) + cur.slice(end);
      } else if (start < cur.length) {
        const chars = Array.from(cur);
        chars.splice(Array.from(cur.slice(0, start)).length, 1);
        newValue = chars.join("");
      } else return;
      updateStats(newValue);
      setTimeout(() => { el.selectionStart = start; el.selectionEnd = start; }, 0);
      return;
    }
    e.preventDefault();
    const hindiChar = toHindi(e.key);
    const start = el.selectionStart ?? inputRef.current.length;
    const end   = el.selectionEnd   ?? inputRef.current.length;
    const cur   = inputRef.current;
    const newValue = cur.slice(0, start) + hindiChar + cur.slice(end);
    updateStats(newValue);
    setTimeout(() => {
      el.selectionStart = start + hindiChar.length;
      el.selectionEnd   = start + hindiChar.length;
    }, 0);
  }, [studentId]);
  const handleTyping = (e) => {
    if (isLockedRef.current) return;
    if (isHindiExam) return;
    const value = e.target.value;
    if (!typingStartRef.current && value.trim().length > 0) {
      typingStartRef.current = Date.now();
    }
    setInput(value);
    inputRef.current = value;
    if (!activeExam || !startTimeRef.current) return;
    localStorage.setItem(`typed_${activeExam.id}_${studentId}`, value);
  };
  const faceStatusColor =
    faceStatus.includes("✅") ? "#22c55e" :
    faceStatus.includes("🚨") || faceStatus.includes("🚫") ? "#ef4444" :
    faceStatus.includes("⚠️") ? "#f59e0b" : "#94a3b8";
  const faceStatusBg =
    faceStatus.includes("✅") ? "rgba(34,197,94,0.08)"  :
    faceStatus.includes("🚨") || faceStatus.includes("🚫") ? "rgba(239,68,68,0.08)"  :
    faceStatus.includes("⚠️") ? "rgba(245,158,11,0.08)" : "rgba(148,163,184,0.06)";
  const S = {
    fullscreenPage: {
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 99999,
      background: "linear-gradient(135deg, #060b18 0%, #0a1628 50%, #060b18 100%)",
      overflowY: "auto",
      padding: "0",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    fullscreenInner: {
      maxWidth: 1280,
      margin: "0 auto",
      padding: "20px 28px 32px",
    },
    topBar: {
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "rgba(6,11,24,0.97)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid #1e3a5f",
      padding: "14px 28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 24,
      marginLeft: -28,
      marginRight: -28,
    },
    topBarLeft: {
      display: "flex", alignItems: "center", gap: 16,
    },
    examTitle: {
      color: "#e2e8f0", fontSize: "1.15rem", fontWeight: 800, letterSpacing: 0.5,
    },
    examIdBadge: {
      background: "rgba(30,58,95,0.8)",
      border: "1px solid #1e3a5f",
      borderRadius: 8,
      padding: "4px 12px",
      color: "#93c5fd",
      fontSize: "0.85rem",
      fontWeight: 700,
    },
    timerBadge: (urgent) => ({
      background: urgent
        ? "linear-gradient(135deg,#dc2626,#ef4444)"
        : "linear-gradient(135deg,#1d4ed8,#3b82f6)",
      color: "#fff", borderRadius: 12, padding: "10px 28px",
      fontSize: "1.5rem", fontWeight: 900, letterSpacing: 4,
      boxShadow: urgent ? "0 0 24px rgba(239,68,68,0.6)" : "0 0 16px rgba(59,130,246,0.4)",
      transition: "all 0.3s",
      fontVariantNumeric: "tabular-nums",
    }),
    twoCol: {
      display: "grid",
      gridTemplateColumns: "1fr 340px",
      gap: 24,
      alignItems: "start",
    },
    leftCol: {
      display: "flex",
      flexDirection: "column",
      gap: 18,
    },
    card: {
      background: "rgba(15,23,42,0.95)",
      border: "1px solid #1e3a5f",
      borderRadius: 16, padding: 24,
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      color: "#e2e8f0",
    },
    sectionLabel: {
      color: "#64748b", fontSize: "0.78rem", fontWeight: 700,
      letterSpacing: 1.5, textTransform: "uppercase",
      marginBottom: 10,
    },
    paragraphBox: {
      background: "rgba(6,11,24,0.8)",
      border: "1px solid #1e3a5f",
      borderRadius: 12, padding: "20px 24px",
      fontSize: "1.12rem", lineHeight: 2.1,
      color: "#cbd5e1",
      userSelect: "none",
      maxHeight: 260,
      overflowY: "auto",
    },
    warningRow: {
      display: "flex", gap: 8, flexWrap: "wrap",
    },
    warningBadge: (color, bg) => ({
      background: bg, color, borderRadius: 8,
      padding: "6px 14px", fontWeight: 700, fontSize: "0.82rem",
      border: `1px solid ${color}30`,
    }),
    hindiBadge: {
      background: "rgba(251,191,36,0.08)",
      border: "1px solid rgba(251,191,36,0.25)",
      borderRadius: 10, padding: "10px 16px",
      color: "#fbbf24", fontWeight: 600,
      fontSize: "0.88rem",
      display: "flex", alignItems: "center", gap: 8,
    },
    alertBox: (type) => ({
      background:
        type === "multi"       ? "rgba(168,85,247,0.12)"  :
        type === "wrong"       ? "rgba(239,68,68,0.12)"   :
        type === "eye"         ? "rgba(99,102,241,0.12)"  :
        type === "audio"       ? "rgba(34,197,94,0.10)"   :
        type === "liveness"    ? "rgba(239,68,68,0.15)"   :
        type === "background"  ? "rgba(245,158,11,0.13)"  :
        "rgba(245,158,11,0.12)",
      border: `1px solid ${
        type === "multi"       ? "#a855f7" :
        type === "wrong"       ? "#ef4444" :
        type === "eye"         ? "#818cf8" :
        type === "audio"       ? "#4ade80" :
        type === "liveness"    ? "#ef4444" :
        type === "background"  ? "#f59e0b" :
        "#f59e0b"
      }`,
      borderRadius: 10, padding: "11px 18px",
      color:
        type === "multi"       ? "#e9d5ff" :
        type === "wrong"       ? "#fca5a5" :
        type === "eye"         ? "#c7d2fe" :
        type === "audio"       ? "#bbf7d0" :
        type === "liveness"    ? "#fca5a5" :
        type === "background"  ? "#fde68a" :
        "#fde68a",
      fontWeight: 600, marginBottom: 10,
      display: "flex", alignItems: "center", gap: 8,
      animation: "fadeInAlert 0.2s ease-out",
    }),
    textarea: (locked) => ({
      width: "100%", minHeight: 200,
      background: locked ? "rgba(6,11,24,0.95)" : "rgba(6,11,24,0.7)",
      border: `2px solid ${locked ? "#ef4444" : "#22c55e"}`,
      borderRadius: 14, padding: "18px 20px",
      color: locked ? "#475569" : "#e2e8f0",
      fontSize: "1.08rem", resize: "vertical", outline: "none",
      cursor: locked ? "not-allowed" : "text",
      transition: "border-color 0.3s, box-shadow 0.3s",
      boxShadow: locked ? "0 0 16px rgba(239,68,68,0.18)" : "0 0 16px rgba(34,197,94,0.12)",
      fontFamily: "inherit",
      lineHeight: 1.8,
    }),
    submitBtn: (locked) => ({
      width: "100%", padding: "18px",
      background: locked
        ? "linear-gradient(135deg,#1f2937,#374151)"
        : "linear-gradient(135deg,#15803d,#22c55e)",
      color: locked ? "#6b7280" : "#fff",
      border: "none", borderRadius: 14,
      fontSize: "1.08rem", fontWeight: 800,
      cursor: locked ? "not-allowed" : "pointer",
      marginTop: 8, transition: "all 0.3s",
      letterSpacing: 0.5,
      boxShadow: locked ? "none" : "0 6px 20px rgba(34,197,94,0.3)",
    }),
    rightCol: {
      display: "flex",
      flexDirection: "column",
      gap: 16,
      position: "sticky",
      top: 90,
    },
    cameraCard: {
      background: "rgba(15,23,42,0.95)",
      border: "1px solid #1e3a5f",
      borderRadius: 16,
      padding: 20,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    },
    videoEl: (locked) => ({
      border: `3px solid ${locked ? "#ef4444" : "#22c55e"}`,
      borderRadius: 14, width: "100%",
      maxWidth: 300,
      aspectRatio: "4/3",
      objectFit: "cover",
      boxShadow: locked
        ? "0 0 28px rgba(239,68,68,0.4)"
        : "0 0 28px rgba(34,197,94,0.3)",
      transition: "all 0.4s",
    }),
    faceStatusBox: {
      background: faceStatusBg,
      border: `1px solid ${faceStatusColor}50`,
      borderRadius: 10, padding: "9px 16px",
      color: faceStatusColor, fontWeight: 700,
      fontSize: "0.9rem", textAlign: "center",
      width: "100%",
    },
    indicatorGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "4px 8px",
      fontSize: "0.72rem",
      color: "#475569",
      width: "100%",
    },
    indicatorItem: {
      display: "flex", alignItems: "center", gap: 4,
    },
    lockStatusBanner: (locked) => ({
      width: "100%",
      background: locked ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.10)",
      border: `1px solid ${locked ? "#ef444440" : "#22c55e40"}`,
      borderRadius: 10,
      padding: "8px 14px",
      color: locked ? "#ef4444" : "#22c55e",
      fontWeight: 800, fontSize: "0.88rem",
      textAlign: "center",
      letterSpacing: 1,
    }),
    page: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0f1e 0%, #0d1627 50%, #0a0f1e 100%)",
      padding: "24px 16px",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    container: { maxWidth: 880, margin: "0 auto" },
    heading: {
      color: "#e2e8f0", fontSize: "1.75rem", fontWeight: 700,
      marginBottom: 24, display: "flex", alignItems: "center", gap: 10,
    },
    examCard: {
      background: "rgba(30,41,59,0.9)",
      border: "1px solid #1e3a5f",
      borderRadius: 14, padding: 22,
      marginBottom: 16, color: "#e2e8f0",
      boxShadow: "0 2px 16px rgba(0,0,0,0.3)",
    },
    startBtn: {
      background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
      color: "#fff", border: "none", borderRadius: 10,
      padding: "10px 24px", fontWeight: 700,
      cursor: "pointer", fontSize: "0.95rem",
      boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
    },
    resumeBtn: {
      background: "linear-gradient(135deg,#b45309,#f59e0b)",
      color: "#fff", border: "none", borderRadius: 10,
      padding: "10px 24px", fontWeight: 700,
      cursor: "pointer", fontSize: "0.95rem",
      boxShadow: "0 4px 12px rgba(245,158,11,0.35)",
      display: "flex", alignItems: "center", gap: 8,
    },
    disabledBtn: {
      background: "#1f2937", color: "#4b5563",
      border: "1px solid #374151", borderRadius: 10,
      padding: "10px 24px", fontWeight: 600,
      cursor: "not-allowed", fontSize: "0.95rem",
    },
    notAttemptedBtn: {
      background: "rgba(120,113,108,0.15)",
      color: "#a8a29e",
      border: "1px solid #78716c50", borderRadius: 10,
      padding: "10px 24px", fontWeight: 600,
      cursor: "not-allowed", fontSize: "0.95rem",
    },
    label:  { color: "#64748b", fontSize: "0.82rem", marginBottom: 2 },
    value:  { color: "#e2e8f0", fontWeight: 600, marginBottom: 8 },
    statusPill: (status) => ({
      background:
        status === "Ongoing"     ? "rgba(22,101,52,0.6)" :
        status === "Not Started" ? "rgba(113,63,18,0.6)" :
        status === "Ended"       ? "rgba(55,65,81,0.6)"  : "rgba(55,65,81,0.6)",
      color:
        status === "Ongoing"     ? "#86efac" :
        status === "Not Started" ? "#fde68a" :
        status === "Ended"       ? "#9ca3af" : "#9ca3af",
      border: `1px solid ${
        status === "Ongoing"     ? "#166534" :
        status === "Not Started" ? "#713f12" :
        status === "Ended"       ? "#374151" : "#374151"
      }`,
      borderRadius: 6, padding: "4px 12px",
      fontSize: "0.8rem", fontWeight: 700,
    }),
    toast: (type) => ({
      position: "fixed",
      bottom: 32,
      left: "50%",
      transform: "translateX(-50%)",
      background:
        type === "success" ? "rgba(21,128,61,0.97)"  :
        type === "error"   ? "rgba(185,28,28,0.97)"  :
        type === "warning" ? "rgba(146,64,14,0.97)"  :
        "rgba(15,23,42,0.97)",
      border: `1px solid ${
        type === "success" ? "#22c55e" :
        type === "error"   ? "#ef4444" :
        type === "warning" ? "#f59e0b" :
        "#1e3a5f"
      }`,
      borderRadius: 14,
      padding: "14px 32px",
      color: "#f1f5f9",
      fontWeight: 700,
      fontSize: "1rem",
      zIndex: 999999,
      boxShadow: "0 8px 40px rgba(0,0,0,0.7)",
      animation: "toastIn 0.25s ease-out",
      maxWidth: "90vw",
      textAlign: "center",
      pointerEvents: "none",
      whiteSpace: "pre-line",
    }),
  };
  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `
      @keyframes fadeInAlert {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes toastIn {
        from { opacity: 0; transform: translateX(-50%) translateY(12px); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: rgba(15,23,42,0.5); }
      ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 3px; }
    `;
    document.head.appendChild(styleEl);
    return () => document.head.removeChild(styleEl);
  }, []);
  return (
    <>
      {activeExam && !examPaused && (
        <div style={S.fullscreenPage} ref={examContainerRef}>
          <div style={S.fullscreenInner}>
            <div style={S.topBar} id="exam-header">
              <div style={S.topBarLeft}>
                <span style={{ fontSize: "1.4rem" }}>📝</span>
                <span style={S.examTitle}>Typing Exam</span>
                <span style={S.examIdBadge}>#{activeExam.id}</span>
                {isHindiExam && (
                  <span style={{
                    background: "rgba(251,191,36,0.1)",
                    border: "1px solid rgba(251,191,36,0.3)",
                    borderRadius: 8, padding: "4px 12px",
                    color: "#fbbf24", fontWeight: 700, fontSize: "0.8rem",
                  }}>
                    🇮🇳 Hindi InScript
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{
                  color: "#64748b", fontSize: "0.75rem",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  {isFullscreen ? "⛶ Press Esc to exit fullscreen" : "⛶ Fullscreen mode"}
                </span>
                <div style={S.timerBadge(timeLeft < 60)}>
                  ⏱ {formatTime(timeLeft)}
                </div>
              </div>
            </div>
            <div style={S.twoCol}>
              <div style={S.leftCol}>
                <div style={S.warningRow}>
                  <span style={S.warningBadge(
                    warningCount >= 2 ? "#ef4444" : "#f59e0b",
                    warningCount >= 2 ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)"
                  )}>
                    ⚠️ Tab Warnings: {warningCount}/{MAX_TAB_WARNINGS}
                  </span>
                  <span style={S.warningBadge(
                    eyeWarningCount >= 2 ? "#a78bfa" : "#818cf8",
                    "rgba(129,140,248,0.1)"
                  )}>
                    👁 Eye Warnings: {eyeWarningCount}/{MAX_EYE_WARNINGS}
                  </span>
                  <span style={S.warningBadge(
                    livenessVerified.current ? "#22c55e" : "#f59e0b",
                    livenessVerified.current ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)"
                  )}>
                    {livenessVerified.current ? "✅ Liveness OK" : "⏳ Liveness Check"}
                  </span>
                </div>
                {multiFaceAlert && (
                  <div style={S.alertBox("multi")}>
                    🚫 Multiple faces detected! Only the registered student may be on camera.
                  </div>
                )}
                {backgroundAlert && !multiFaceAlert && (
                  <div style={S.alertBox("background")}>
                    👥 Another person detected in the background! You must be completely alone.
                  </div>
                )}
                {wrongPersonAlert && !multiFaceAlert && !backgroundAlert && (
                  <div style={S.alertBox("wrong")}>
                    🚨 Wrong person detected! Original student must appear in camera.
                  </div>
                )}
                {livenessAlert && (
                  <div style={S.alertBox("liveness")}>
                    📸 Liveness check failed! No photos or phone screens allowed — show your live face and move slightly.
                  </div>
                )}
                {eyeAlert && (
                  <div style={S.alertBox("eye")}>
                    👁 Eyes off screen detected! Keep your eyes on the screen only.
                  </div>
                )}
                {audioAlert && (
                  <div style={S.alertBox("audio")}>
                    🔊 Unusual audio detected! Please ensure a quiet environment.
                  </div>
                )}
                {isLocked && lockDisplay && (
                  <div style={S.alertBox("warn")}>
                    {lockDisplay}
                  </div>
                )}
                <div style={S.card}>
                  <div style={S.sectionLabel}>📄 Passage to Type</div>
                  {isHindiExam && (
                    <div style={{ ...S.hindiBadge, marginBottom: 12 }}>
                      ⌨️ <span>हिंदी परीक्षा — InScript (Mangal) कीबोर्ड सक्रिय है</span>
                    </div>
                  )}
                  <div style={{ ...S.paragraphBox, ...(isHindiExam ? hindiFont : {}) }}>
                    {activeExam.paragraph}
                  </div>
                </div>
                <div style={S.card}>
                  <div style={S.sectionLabel}>✍️ Your Typing Area</div>
                  <div style={{ position: "relative" }}>
                    <textarea
                      ref={inputElRef}
                      style={{ ...S.textarea(isLocked), ...(isHindiExam ? hindiFont : {}) }}
                      rows={8}
                      value={input}
                      onChange={isLocked ? undefined : handleTyping}
                      onKeyDown={isHindiExam && !isLocked ? handleHindiKeyDown : undefined}
                      onKeyPress={isHindiExam ? (e) => e.preventDefault() : undefined}
                      onPaste={(e) => e.preventDefault()}
                      onCopy={(e) => e.preventDefault()}
                      onCut={(e) => e.preventDefault()}
                      onContextMenu={(e) => e.preventDefault()}
                      onDrop={(e) => e.preventDefault()}
                      readOnly={isLocked}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      placeholder={
                        isLocked
                          ? "⛔ Typing locked — face must be visible and verified…"
                          : isHindiExam
                            ? "यहाँ हिंदी में टाइप करें…"
                            : "Start typing here…"
                      }
                    />
                    {isLocked && (
                      <div
                        style={{
                          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                          borderRadius: 14, cursor: "not-allowed", zIndex: 10,
                          background: "rgba(239,68,68,0.03)", pointerEvents: "all",
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => e.preventDefault()}
                      />
                    )}
                  </div>
                  <button
                    style={S.submitBtn(isLocked)}
                    disabled={isLocked}
                    title={isLocked ? "Face must be visible and verified to submit" : ""}
                    onClick={() => finishExam(activeExamRef.current)}
                  >
                    {isLocked ? "🔒 Locked — Face Must Be Visible to Submit" : "✅ Submit Exam"}
                  </button>
                </div>
              </div>
              <div style={S.rightCol}>
                <div style={S.cameraCard}>
                  <div style={{ ...S.sectionLabel, alignSelf: "flex-start" }}>📷 Live Camera</div>
                  <video
                    ref={videoRef}
                    autoPlay muted playsInline
                    width={300} height={225}
                    style={S.videoEl(isLocked)}
                  />
                  <div style={S.faceStatusBox}>{faceStatus}</div>
                  <div style={S.lockStatusBanner(isLocked)}>
                    {isLocked ? "🔒 LOCKED" : "🔓 UNLOCKED"}
                  </div>
                  <div style={S.indicatorGrid}>
                    <div style={S.indicatorItem}><span>🔍</span> Face check: 0.8s</div>
                    <div style={S.indicatorItem}><span>🆔</span> ID verify: 1s</div>
                    <div style={S.indicatorItem}><span>👥</span> Multi-face: ON</div>
                    <div style={S.indicatorItem}><span>👁</span> Eye track: ON</div>
                    <div style={S.indicatorItem}><span>🔊</span> Audio: ON</div>
                    <div style={S.indicatorItem}><span>🎭</span> Anti-spoof: ON</div>
                    <div style={S.indicatorItem}><span>👤</span> Background: ON</div>
                    <div style={S.indicatorItem}><span>📺</span> Fullscreen: ON</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {(!activeExam || examPaused) && (
        <div style={S.page}>
          <div style={S.container}>
            <h2 style={S.heading}>📝 Typing Exam</h2>
            {examPaused && activeExam && (
              <div style={{
                background: "rgba(146,64,14,0.25)",
                border: "1px solid #f59e0b",
                borderRadius: 14,
                padding: "18px 24px",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 14,
              }}>
                <div>
                  <div style={{ color: "#fbbf24", fontWeight: 800, fontSize: "1.05rem", marginBottom: 4 }}>
                    ⚠️ Exam In Progress — Fullscreen Exited
                  </div>
                  <div style={{ color: "#fde68a", fontSize: "0.9rem" }}>
                    Your exam (#{activeExam.id}) is still running. Time remaining:{" "}
                    <strong style={{ color: "#f59e0b", fontVariantNumeric: "tabular-nums" }}>
                      {formatTime(timeLeft)}
                    </strong>
                    . You must return to fullscreen to continue.
                  </div>
                </div>
                <button style={S.resumeBtn} onClick={resumeExam}>
                  ▶ Resume Exam (Re-enter Fullscreen)
                </button>
              </div>
            )}
            {exams.length === 0 && !examPaused && (
              <div style={{
                background: "rgba(30,41,59,0.9)", border: "1px solid #1e3a5f",
                borderRadius: 14, padding: 28, color: "#64748b", textAlign: "center",
              }}>
                📭 No exams available at this time.
              </div>
            )}
            {exams.map(exam => {
              const isEndedNotAttempted = exam.status === "Ended" && !exam.attempted;
              const isPausedExam = examPaused && activeExam && activeExam.id === exam.id;
              return (
                <div
                  key={exam.id}
                  style={{
                    ...S.examCard,
                    opacity: isEndedNotAttempted ? 0.7 : 1,
                    borderColor: isPausedExam ? "#f59e0b" : isEndedNotAttempted ? "#44403c" : "#1e3a5f",
                    boxShadow: isPausedExam
                      ? "0 0 0 2px rgba(245,158,11,0.3), 0 2px 16px rgba(0,0,0,0.3)"
                      : "0 2px 16px rgba(0,0,0,0.3)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 10 }}>
                        Exam #{exam.id}
                        {isEndedNotAttempted && (
                          <span style={{
                            marginLeft: 10, fontSize: "0.75rem", fontWeight: 600,
                            background: "rgba(120,113,108,0.2)", color: "#a8a29e",
                            border: "1px solid #78716c40", borderRadius: 6,
                            padding: "2px 8px", verticalAlign: "middle",
                          }}>
                            Not Attempted
                          </span>
                        )}
                        {isPausedExam && (
                          <span style={{
                            marginLeft: 10, fontSize: "0.75rem", fontWeight: 700,
                            background: "rgba(146,64,14,0.3)", color: "#fbbf24",
                            border: "1px solid #f59e0b50", borderRadius: 6,
                            padding: "2px 8px", verticalAlign: "middle",
                          }}>
                            ⏸ In Progress
                          </span>
                        )}
                      </div>
                      <div style={S.label}>📅 Date</div>
                      <div style={S.value}>{formatDateSafe(exam.exam_date)}</div>
                      <div style={S.label}>⏰ Start Time</div>
                      <div style={S.value}>{formatTimeAmPm(exam.start_time)}</div>
                      <div style={S.label}>⏱ Duration</div>
                      <div style={S.value}>{exam.duration} minutes</div>
                      <div style={S.label}>🌐 Language</div>
                      <div style={S.value}>
                        {exam.language === "Hindi" || exam.language === "HI"
                          ? "🇮🇳 Hindi (InScript)"
                          : exam.language}
                          <p>Restrictions: </p>
                          <ul>
                            <li>No copy-paste</li>
                            <li>No switching tabs or minimizing</li>
                            <li>Must be alone in a quiet room</li>
                            <li>Face must be fully visible and verified</li>
                            <li>No photos, videos, or screens allowed</li>
                          </ul>
                      </div>
                    </div>
                    <div>
                      <span style={S.statusPill(exam.status)}>{exam.status}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    {isPausedExam ? (
                      <button style={S.resumeBtn} onClick={resumeExam}>
                        ▶ Resume Exam
                      </button>
                    ) : exam.attempted ? (
                      isEndedNotAttempted ? (
                        <button style={S.notAttemptedBtn} disabled>
                          ⚠️ Not Attempted
                        </button>
                      ) : (
                        <button style={S.disabledBtn} disabled>✅ Already Submitted</button>
                      )
                    ) : exam.status === "Ongoing" ? (
                      <button style={S.startBtn} onClick={() => startExam(exam)}>🚀 Start Exam</button>
                    ) : exam.status === "Ended" ? (
                      <button style={S.notAttemptedBtn} disabled>
                        ⚠️ Not Attempted
                      </button>
                    ) : (
                      <button style={S.disabledBtn} disabled>⏳ Not Started Yet</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {toastMsg && (
        <div style={S.toast(toastType)}>
          {toastMsg}
        </div>
      )}
    </>
  );
}
