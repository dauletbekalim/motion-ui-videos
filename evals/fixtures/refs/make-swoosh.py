"""
Makes swoosh.wav, the reference sound for the audio-reference eval.

It's synthesized, not recorded or downloaded: pink noise through a band-pass
that sweeps up and back down, shaped by a soft swell and panned left to right.
Nothing here comes from a sound library, so the file is safe to ship.

    cd evals && python fixtures/refs/make-swoosh.py

Needs Python 3 and numpy. The seed is fixed, so it writes the same file every time.
"""
import numpy as np, wave

sr = 48000; dur = 0.55; n = int(sr * dur)
rng = np.random.default_rng(7)

# pink-ish noise: white noise through Paul Kellet's 1/f filter
w = rng.standard_normal(n)
b = [0] * 7; pink = np.zeros(n)
for i, x in enumerate(w):
    b[0] = 0.99886 * b[0] + x * 0.0555179; b[1] = 0.99332 * b[1] + x * 0.0750759; b[2] = 0.96900 * b[2] + x * 0.1538520
    b[3] = 0.86650 * b[3] + x * 0.3104856; b[4] = 0.55000 * b[4] + x * 0.5329522; b[5] = -0.7616 * b[5] - x * 0.0168980
    pink[i] = b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + b[6] + x * 0.5362; b[6] = x * 0.115926
t = np.arange(n) / sr

# a band-pass whose top sweeps from 500 Hz up to about 3.1 kHz and back
out = np.zeros(n); lp = 0; hp = 0; prev = 0
for i in range(n):
    k = i / n; fc = 500 + 2600 * np.sin(np.pi * min(1, k * 1.2)) ** 2
    a = np.exp(-2 * np.pi * fc / sr); lp = (1 - a) * pink[i] + a * lp
    ah = np.exp(-2 * np.pi * 250 / sr); hp = ah * (hp + lp - prev); prev = lp
    out[i] = hp

# a soft swell, then a gentle pan from left to right
env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2.2 * np.exp(-1.2 * t)
sig = out * env; sig /= np.abs(sig).max(); sig *= 0.7
pan = np.linspace(-0.5, 0.5, n); l = sig * np.cos((pan + 1) * np.pi / 4); r = sig * np.sin((pan + 1) * np.pi / 4)
data = (np.stack([l, r], 1) * 32767).astype('<i2').tobytes()
with wave.open('fixtures/refs/swoosh.wav', 'wb') as f:
    f.setnchannels(2); f.setsampwidth(2); f.setframerate(sr); f.writeframes(data)
print('ok', n / sr)
