import io
import os
import tempfile
import numpy as np
import soundfile as sf
from app.core.config import WHISPER_MODEL_PATH, WHISPER_MODEL_SIZE, WHISPER_DEVICE, VOICE_DATA_DIR, KOKORO_MODEL_FILE, KOKORO_VOICE


class VoiceService:
    """STT con faster-whisper (CUDA) + TTS con kokoro-onnx (ONNX/CPU o GPU)."""

    _instance: "VoiceService | None" = None

    def __init__(self):
        self._stt = None
        self._tts = None

    @classmethod
    def get(cls) -> "VoiceService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    # ── STT ───────────────────────────────────────────────────────────────────

    def _load_stt(self):
        if self._stt is None:
            from faster_whisper import WhisperModel
            compute = "float16" if WHISPER_DEVICE == "cuda" else "int8"
            # Usa ruta local si está configurada, si no intenta descargar
            model_ref = WHISPER_MODEL_PATH if WHISPER_MODEL_PATH else WHISPER_MODEL_SIZE
            print(f"[Voice] Cargando Whisper '{model_ref}' en {WHISPER_DEVICE} ({compute})…")
            self._stt = WhisperModel(
                model_ref,
                device=WHISPER_DEVICE,
                compute_type=compute,
            )
            print("[Voice] Whisper listo ✓")
        return self._stt

    def transcribe(self, audio_bytes: bytes, language: str = "es") -> str:
        """Convierte audio (WebM/WAV/OGG) a texto. Usa archivo temporal para soportar WebM del navegador."""
        stt = self._load_stt()

        # Detectar formato por magic bytes para poner la extensión correcta
        suffix = ".ogg" if audio_bytes[:4] == b"OggS" else ".webm"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            segments, _ = stt.transcribe(
                tmp_path,
                language=language,
                beam_size=5,
                vad_filter=True,
                vad_parameters={"min_silence_duration_ms": 300},
            )
            return " ".join(s.text.strip() for s in segments).strip()
        finally:
            os.unlink(tmp_path)

    # ── TTS ───────────────────────────────────────────────────────────────────

    def _load_tts(self):
        if self._tts is None:
            from kokoro_onnx import Kokoro
            model_path  = VOICE_DATA_DIR / KOKORO_MODEL_FILE
            voices_path = VOICE_DATA_DIR / "voices-v1.0.bin"
            if not model_path.exists():
                raise FileNotFoundError(
                    f"Modelo TTS no encontrado en {model_path}.\n"
                    "Descarga desde: github.com/thewh1teagle/kokoro-onnx → Releases → model-files-v1.0\n"
                    f"Archivos necesarios: {KOKORO_MODEL_FILE}  y  voices-v1.0.bin\n"
                    f"Colócalos en: {VOICE_DATA_DIR}"
                )
            print(f"[Voice] Cargando Kokoro TTS ({KOKORO_MODEL_FILE})…")
            self._tts = Kokoro(str(model_path), str(voices_path))
            print("[Voice] Kokoro TTS listo ✓")
        return self._tts

    def synthesize(self, text: str, voice: str = KOKORO_VOICE, speed: float = 1.1) -> bytes:
        """Convierte texto a WAV. Voces ES: ef_dora (fem) | em_alex | em_santa (masc)."""
        tts = self._load_tts()
        samples, sample_rate = tts.create(text, voice=voice, speed=speed, lang="e")
        buf = io.BytesIO()
        sf.write(buf, samples, sample_rate, format="WAV")
        return buf.getvalue()

    @property
    def stt_available(self) -> bool:
        try:
            import faster_whisper  # noqa: F401
            return True
        except ImportError:
            return False

    @property
    def tts_available(self) -> bool:
        try:
            import kokoro_onnx  # noqa: F401
            return (VOICE_DATA_DIR / KOKORO_MODEL_FILE).exists()
        except ImportError:
            return False
