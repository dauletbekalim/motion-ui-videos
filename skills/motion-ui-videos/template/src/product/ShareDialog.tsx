/**
 * The share dialog: invite the team, see who has access, copy the link.
 * Members can arrive one by one (`enter`), and the two buttons a cursor
 * clicks have fixed places (shareGeometry) so a scene can aim at them.
 */
import { clamp, lerp } from '../lib/anim';
import { alpha, C, FEATURES, FONT, SHADOW } from '../theme';
import { Avatar, Button } from './atoms';
import { PEOPLE, WORKSPACE, type PersonId } from './data';
import { Icon } from './icons';

export type Member = { who: PersonId; role: string; enter?: number };

const W = 540;
const HEAD = 66;
const ROW = 56;
const MEMBERS_Y = 164;
const TAIL = 76 + 70; // general access + footer

/** Dialog height and the two click targets, in dialog coordinates. */
export function shareGeometry(members: Member[], width = W) {
  const rows = members.reduce((s, m) => s + clamp(m.enter ?? 1), 0);
  const height = MEMBERS_Y + rows * ROW + 12 + TAIL;
  return {
    width,
    height,
    invite: { x: width - 24 - 128, y: HEAD + 10, w: 128, h: 42 },
    copy: { x: 24, y: height - 58, w: 124, h: 38 },
  };
}

export function ShareDialog({
  title,
  members,
  open = 1,
  width = W,
  invitePress = 0,
  copyPress = 0,
  copied = 0,
}: {
  title: string;
  members: Member[];
  open?: number;
  width?: number;
  invitePress?: number;
  copyPress?: number;
  /** 0 → 1: "Copy link" turns into "Copied" */
  copied?: number;
}) {
  const k = clamp(open);
  if (k <= 0.001) return null;
  const g = shareGeometry(members, width);
  return (
    <div
      style={{
        position: 'relative',
        width,
        height: g.height,
        borderRadius: 18,
        background: `linear-gradient(180deg, #1D1D25, ${C.raised})`,
        boxShadow: SHADOW.modal,
        fontFamily: FONT.ui,
        fontFeatureSettings: FEATURES,
        letterSpacing: '-0.01em',
        overflow: 'hidden',
        opacity: clamp(k * 1.8),
        transform: `translateY(${(1 - k) * 14}px) scale(${lerp(0.95, 1, k)})`,
        filter: k < 0.98 ? `blur(${(1 - k) * 4}px)` : undefined,
      }}
    >
      <div style={{ height: HEAD, display: 'flex', alignItems: 'center', gap: 10, padding: '0 22px 0 24px', borderBottom: `1px solid ${C.line}` }}>
        <span style={{ fontSize: 16.5, fontWeight: 600, color: C.text }}>Share</span>
        <span style={{ fontSize: 16.5, fontWeight: 500, color: C.dim }}>“{title}”</span>
        <span style={{ flex: 1 }} />
        <Icon name="close" size={18} color={C.faint} />
      </div>
      {/* invite */}
      <div style={{ position: 'absolute', left: 24, top: g.invite.y, width: g.invite.x - 24 - 10, height: 42, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', borderRadius: 11, background: '#FFFFFF08', boxShadow: `inset 0 0 0 1px ${C.line}`, color: C.faint, fontSize: 14 }}>
        <Icon name="at" size={16} color={C.faint} />
        Add people, emails or groups
      </div>
      <div style={{ position: 'absolute', left: g.invite.x, top: g.invite.y }}>
        <Button primary icon="users" press={invitePress} size={13.5} style={{ height: 42, width: g.invite.w, justifyContent: 'center' }}>
          Invite team
        </Button>
      </div>
      <div style={{ position: 'absolute', left: 24, top: MEMBERS_Y - 30, fontSize: 12, fontWeight: 600, color: C.faint }}>People with access</div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: MEMBERS_Y, display: 'flex', flexDirection: 'column' }}>
        {members.map((m) => {
          const e = clamp(m.enter ?? 1);
          if (e <= 0.001) return null;
          const p = PEOPLE[m.who];
          return (
            <div key={m.who} style={{ height: ROW * e, opacity: clamp(e * 1.6 - 0.4) }}>
              <div style={{ height: ROW, display: 'flex', alignItems: 'center', gap: 13, padding: '0 24px', transform: `translateX(${(1 - e) * -14}px)` }}>
                <Avatar who={m.who} size={34} ring={C.raised} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                    {p.name}
                    {m.who === 'you' ? <span style={{ color: C.faint, fontWeight: 500 }}> (you)</span> : null}
                  </span>
                  <span style={{ fontSize: 12.5, color: C.faint }}>{p.email}</span>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: C.dim, fontWeight: 500 }}>
                  {m.role}
                  {m.role !== 'Owner' ? <Icon name="chevronDown" size={13} color={C.faint} /> : null}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {/* general access and the footer */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: TAIL }}>
        <div style={{ height: 1, margin: '0 24px', background: C.line }} />
        <div style={{ height: 74, display: 'flex', alignItems: 'center', gap: 13, padding: '0 24px' }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', background: alpha(C.ok, 0.12), boxShadow: `inset 0 0 0 1px ${alpha(C.ok, 0.22)}` }}>
            <Icon name="globe" size={17} color={C.ok} />
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Anyone at {WORKSPACE}</span>
            <span style={{ fontSize: 12.5, color: C.faint }}>can find and open this note</span>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: C.dim, fontWeight: 500 }}>
            Can view <Icon name="chevronDown" size={13} color={C.faint} />
          </span>
        </div>
        <div style={{ position: 'absolute', left: 24, right: 24, bottom: 20, display: 'flex', alignItems: 'center' }}>
          <Button icon={copied > 0.5 ? 'check' : 'link'} press={copyPress} size={13.5} style={{ height: 38, width: 124, justifyContent: 'center', color: copied > 0.5 ? C.ok : C.text }}>
            {copied > 0.5 ? 'Copied' : 'Copy link'}
          </Button>
          <span style={{ flex: 1 }} />
          <Button size={13.5} style={{ height: 38 }}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
