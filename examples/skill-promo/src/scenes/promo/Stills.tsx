/**
 * The promo's stills: the reel's cover (1080×1920, everything that matters
 * inside the centred 3:4 the profile grid shows), the GitHub social preview
 * (1280×640), and the README's grid of every template format. Every frame in
 * them is the template's own cut at that second (Embed), not a screenshot.
 */
import type { ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import { Phone } from '../../lib/devices';
import { KineticTitle } from '../../lib/text';
import { Backdrop, SafeZones } from '../../lib/ui';
import { CutWindow, Embed, EmbedStill, momentOf } from '../../promo/Embed';
import { Pill, PROMO, SkillMark, SkillName, Wave, type WaveEvent } from '../../promo/parts';
import { alpha, C, FEATURES, FONT } from '../../theme';
import { Cover } from '../Cover';
import { Thumbnail } from '../Thumbnail';

/** The template showcase's features scene, its three cards in: the showcase frame the stills show. */
const SHOWCASE_AT = momentOf('showcase', 'features', 1.3);
/** The template reel's live scene, the team's note written and ticked: the reel frame the stills show. */
const REEL_AT = momentOf('reel', 'reelLive', 2.75);
/** A moment earlier in the same scene, Maya's tick landed and Theo still typing: the cover's cropped window. */
const REEL_NOTE_AT = momentOf('reel', 'reelLive', 2.45);

/** A phone playing the template reel full screen, frozen at `time`. */
function ReelPhone({ width, time }: { width: number; time: number }) {
  const h = width * 2.1667;
  const bezel = Math.max(8, width * 0.028);
  const bar = width * 0.12;
  const sh = h - 2 * bezel;
  const sw = width - 2 * bezel;
  const ew = (sh * 1080) / 1920;
  return (
    <Phone width={width}>
      <div style={{ position: 'absolute', left: (sw - ew) / 2, top: -bar }}>
        <Embed cut="reel" time={time} w={ew} />
      </div>
    </Phone>
  );
}

/** A strip of the timeline: marks as flags over the waveform of the sounds placed on them. */
function TimelineStrip({ width, height, size = 20 }: { width: number; height: number; size?: number }) {
  const marks: { name: string; x: number; kind: WaveEvent['kind'] }[] = [
    { name: 'click', x: 0.2, kind: 'click' },
    { name: 'join', x: 0.4, kind: 'pop' },
    { name: 'type', x: 0.6, kind: 'keys' },
  ];
  const flag = size * 1.9;
  return (
    <div style={{ position: 'relative', width, height, borderRadius: size * 0.9, background: 'linear-gradient(180deg, #16161CF2, #111116F2)', boxShadow: `inset 0 0 0 1px ${C.lineStrong}, 0 40px 90px -30px rgba(0,0,0,0.95)`, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: size, top: size * 0.6, fontFamily: FONT.mono, fontSize: size * 0.8, color: C.faint }}>cuts.json → sound</div>
      {marks.map((m) => (
        <div key={m.name} style={{ position: 'absolute', left: size + m.x * (width - 2 * size), top: size * 1.9, transform: 'translateX(-50%)' }}>
          <Pill mono size={size * 0.85} color={m.name === 'type' ? '#1A0F05' : C.text} bg={m.name === 'type' ? C.accent : '#1F1F27'} border={m.name === 'type' ? C.accent : C.lineStrong}>
            {m.name}
          </Pill>
        </div>
      ))}
      <div style={{ position: 'absolute', left: size, top: size * 1.9 + flag + 4 }}>
        <Wave width={width - 2 * size} height={height - size * 1.9 - flag - size * 0.6} head={0.66} bars={Math.round(width / 9)} events={marks.map((m) => ({ x: m.x, kind: m.kind, lit: m.name === 'type' ? 1 : 0.35, len: 0.14 }))} />
      </div>
      <div style={{ position: 'absolute', left: size + 0.66 * (width - 2 * size), top: size * 1.6, bottom: size * 0.5, width: 2.5, background: '#FFF4DC', boxShadow: `0 0 16px ${alpha(C.accent, 0.9)}` }} />
    </div>
  );
}

/**
 * The reel's cover: what the reel's first frame promises, as one picture. The
 * name, the headline, and one window into the template reel at its own phone
 * size (legible, not a stamp), with the timeline strip that drives it laid
 * over its corner. Everything that matters sits inside the centred 1080×1440
 * the profile grid shows.
 */
export function PromoCover({ safe = false }: { safe?: boolean }) {
  return (
    <AbsoluteFill>
      <Backdrop glow={0.3} y={48} grid />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 286, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
        <SkillMark size={70} />
        <SkillName size={46} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 410, display: 'flex', justifyContent: 'center', textShadow: `0 10px 50px ${C.bg}` }}>
        <KineticTitle text="Product videos, | *written as code.*" start={-1} size={112} />
      </div>
      {/* the product at its own size: the template reel's note, the team writing in it */}
      {/* the reel's note card edge to edge (its 780 px become 860), from "This week" down: Maya ticking, Theo typing */}
      {/* (the reel's UI area starts at y 530, under its caption band: the card's "This week" sits 110 px into it) */}
      <div style={{ position: 'absolute', left: 110, top: 670 }}>
        <CutWindow cut="reel" time={REEL_NOTE_AT} w={860} h={516} aim={{ x: 540, y: 640 + 258 / (860 / 780), s: 860 / 780 }} radius={40} style={{ boxShadow: `0 0 0 2px ${alpha(C.accent, 0.5)}, 0 0 90px ${alpha(C.accent, 0.18)}, 0 60px 120px -30px rgba(0,0,0,0.95)` }} />
      </div>
      <div style={{ position: 'absolute', left: 330, top: 1150, transform: 'rotate(-2deg)' }}>
        <TimelineStrip width={640} height={210} size={25} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1520, display: 'flex', justifyContent: 'center', fontFamily: FONT.ui, fontFeatureSettings: FEATURES, fontSize: 40, fontWeight: 500, color: C.dim, letterSpacing: '-0.02em' }}>{PROMO.line}</div>
      {safe ? <SafeZones margins={false} /> : null}
    </AbsoluteFill>
  );
}

/** The GitHub social preview, 1280×640: text on the left, the work on the right, 40 px clear all round. */
export function SocialPreview() {
  return (
    <AbsoluteFill>
      <Backdrop glow={0.3} x={72} y={44} grid />
      <div style={{ position: 'absolute', left: 72, top: 78, display: 'flex', alignItems: 'center', gap: 16 }}>
        <SkillMark size={56} />
        <SkillName size={36} />
      </div>
      <div style={{ position: 'absolute', left: 68, top: 172, textShadow: `0 8px 40px ${C.bg}` }}>
        <KineticTitle text="Product videos, | *written as code.*" start={-1} size={70} align="left" />
      </div>
      <div style={{ position: 'absolute', left: 72, top: 340, width: 520, fontFamily: FONT.ui, fontFeatureSettings: FEATURES, fontSize: 25, lineHeight: 1.4, fontWeight: 500, color: C.dim, letterSpacing: '-0.015em' }}>
        A Claude Code skill: your UI rebuilt as Remotion scenes, sound designed in code, both on one timeline.
      </div>
      <div style={{ position: 'absolute', left: 72, top: 520, display: 'flex', gap: 12 }}>
        <Pill size={19} color={C.text}>
          free & open source
        </Pill>
        <Pill size={19} color={C.text}>
          reels · showcases · loops · stills
        </Pill>
      </div>
      <div style={{ position: 'absolute', left: 660, top: 96, transform: 'rotate(-3deg)' }}>
        <Embed cut="showcase" time={SHOWCASE_AT} w={450} radius={14} style={{ boxShadow: `0 0 0 1px ${C.lineStrong}, 0 40px 90px -30px rgba(0,0,0,0.95)` }} />
      </div>
      <div style={{ position: 'absolute', left: 1010, top: 60, transform: 'rotate(3deg)' }}>
        <ReelPhone width={220} time={REEL_AT} />
      </div>
      <div style={{ position: 'absolute', left: 684, top: 400, transform: 'rotate(-1deg)' }}>
        <TimelineStrip width={420} height={150} size={16} />
      </div>
    </AbsoluteFill>
  );
}

type Tile = { label: string; spec: string; W: number; H: number; draw: (w: number) => ReactNode };

/** Every template format at once, labelled: the README's grid. */
export function FormatsGrid() {
  const rowH = 440;
  const gap = 44;
  const label = 64;
  const top: Tile[] = [
    { label: 'showcase', spec: '16:9 · 1920×1080 · 60 fps', W: 1920, H: 1080, draw: (w) => <Embed cut="showcase" time={SHOWCASE_AT} w={w} radius={12} /> },
    { label: 'loop', spec: '16:10 · 1600×1000 · 60 fps · seamless', W: 1600, H: 1000, draw: (w) => <Embed cut="loop" time={3.25} w={w} radius={12} /> },
  ];
  const bottom: Tile[] = [
    { label: 'reel', spec: '9:16 · 30 fps', W: 1080, H: 1920, draw: (w) => <Embed cut="reel" time={REEL_AT} w={w} radius={12} /> },
    { label: 'story', spec: '9:16 · 30 fps', W: 1080, H: 1920, draw: (w) => <Embed cut="story" time={5.2} w={w} radius={12} /> },
    {
      label: 'cover',
      spec: '9:16 still',
      W: 1080,
      H: 1920,
      draw: (w) => (
        <EmbedStill W={1080} H={1920} w={w} radius={12}>
          <Cover />
        </EmbedStill>
      ),
    },
    {
      label: 'thumbnail',
      spec: '16:9 · 1280×720 still',
      W: 1280,
      H: 720,
      draw: (w) => (
        <EmbedStill W={1280} H={720} w={w} radius={12}>
          <Thumbnail />
        </EmbedStill>
      ),
    },
  ];
  const row = (tiles: Tile[], y: number) => {
    const widths = tiles.map((t) => (rowH * t.W) / t.H);
    const total = widths.reduce((a, b) => a + b, 0) + gap * (tiles.length - 1);
    let x = (1760 - total) / 2;
    return tiles.map((t, i) => {
      const left = x;
      x += widths[i] + gap;
      return (
        <div key={t.label} style={{ position: 'absolute', left, top: y, width: widths[i] }}>
          <div style={{ borderRadius: 12, boxShadow: `0 0 0 1px ${C.lineStrong}, 0 30px 70px -30px rgba(0,0,0,0.95)` }}>{t.draw(widths[i])}</div>
          <div style={{ height: label, display: 'flex', alignItems: 'center', gap: 12, fontFamily: FONT.ui, fontFeatureSettings: FEATURES, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>{t.label}</span>
            <span style={{ fontFamily: FONT.mono, fontSize: 16, color: C.faint }}>{t.spec}</span>
          </div>
        </div>
      );
    });
  };
  return (
    <AbsoluteFill>
      <Backdrop glow={0.15} y={30} />
      {row(top, 44)}
      {row(bottom, 44 + rowH + label + 28)}
    </AbsoluteFill>
  );
}
