import { useEffect, useState, type CSSProperties } from "react";
import { useAuth } from "@/hooks/useAuth";
import { initialsFrom, logout } from "@/lib/auth";
import { getCourseProgress } from "@/lib/storage";
import { showToast } from "@/lib/toast";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { ProfileSettings } from "./ProfileSettings";

const DP_STATE_LS = "ff_dp_state";
const DP_STATE_COOKIE = "ff_dp_state_v2";

type DPModuleFlags = Partial<
  Record<"video" | "article" | "idExercise" | "auditSubmitted", boolean>
>;
type DPState = Partial<Record<"m1" | "m2" | "m3" | "m4", DPModuleFlags>>;

interface ProgressResult {
  done: number;
  total: number;
  pct: number;
}

const INITIAL_PROGRESS: ProgressResult = { done: 0, total: 4, pct: 0 };

function getCookie(name: string): string | null {
  try {
    const escaped = name.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${escaped}=([^;]*)`),
    );
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

function parseDPState(raw: string): DPState | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as DPState) : null;
  } catch {
    return null;
  }
}

function readDPState(): DPState | null {
  const cookie = getCookie(DP_STATE_COOKIE);
  if (cookie) {
    const parsed = parseDPState(cookie);
    if (parsed) return parsed;
  }
  try {
    const ls = localStorage.getItem(DP_STATE_LS);
    if (ls) {
      const parsed = parseDPState(ls);
      if (parsed) return parsed;
    }
  } catch {
    // localStorage may be unavailable (private mode); ignore.
  }
  return null;
}

// Prefer current module flags; preserve progress from older course versions.
function computeProgress(): ProgressResult {
  const dp = readDPState();
  if (dp) {
    const m1 = Boolean(dp.m1?.video && dp.m1?.article);
    const m2 = Boolean(dp.m2?.video && dp.m2?.article && dp.m2?.idExercise);
    const m3 = Boolean(dp.m3?.video && dp.m3?.article);
    const m4 = Boolean(dp.m4?.article && dp.m4?.auditSubmitted);
    const done = [m1, m2, m3, m4].filter(Boolean).length;
    const total = 4;
    return { done, total, pct: Math.round((done / total) * 100) };
  }

  const ARR6 = [
    "junk-fees",
    "subs-cancel",
    "bnpl",
    "chargebacks",
    "arbitration",
    "debt-rights",
  ];
  const DP4 = ["dp-m1", "dp-m2", "dp-m3", "dp-m4"];
  const ids = [...new Set(getCourseProgress())];

  const count6 = ids.filter((id) => ARR6.includes(id)).length;
  const count4 = ids.filter((id) => DP4.includes(id)).length;

  if (count4 >= count6) {
    const total = 4;
    return { done: count4, total, pct: Math.round((count4 / total) * 100) };
  }
  const total = 6;
  return { done: count6, total, pct: Math.round((count6 / total) * 100) };
}

function fmtDate(iso: string | null | undefined): string {
  return iso
    ? new Date(iso).toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : " - ";
}

export function Profile() {
  const { user, status } = useAuth();
  const [progress, setProgress] = useState<ProgressResult>(INITIAL_PROGRESS);

  useEffect(() => {
    if (status === "out") window.location.replace("/");
  }, [status]);

  useEffect(() => {
    if (status === "in" && user) setProgress(computeProgress());
  }, [status, user]);

  const [signingOut, runSignOut] = useSubmitLock();
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);

  async function handleSignOut(): Promise<void> {
    await runSignOut(async () => {
      try {
        await logout();
        window.location.replace("/");
      } catch {
        showToast("Could not sign out. Try again.");
      }
    });
  }

  if (status !== "in" || !user) {
    return (
      <section className="account-page page-heading container">
        <h1>Your profile</h1>
        <p role="status">Loading your account…</p>
      </section>
    );
  }

  const displayName =
    user.displayName || user.email?.split("@")[0] || "Your account";
  const photo =
    user.photoURL && failedPhoto !== user.photoURL ? user.photoURL : undefined;

  return (
    <section
      className="account-page page-heading container"
      aria-labelledby="profile-heading"
    >
      <h1 id="profile-heading">Your profile</h1>
      <p className="account-intro">
        Manage your details and pick up where you left off.
      </p>
      <div className="account-layout">
        <div className="account-main">
          <div className="account-identity">
            <div className="account-avatar">
              <img
                id="prof-avatar"
                alt=""
                src={photo}
                hidden={!photo}
                onError={() => setFailedPhoto(user.photoURL)}
              />
              <span id="prof-initials" hidden={!!photo}>
                {initialsFrom(user)}
              </span>
            </div>
            <div>
              <h2 id="prof-name">{displayName}</h2>
              <p id="prof-email">{user.email}</p>
              <p className="account-since">
                Member since{" "}
                <span id="joined-at">
                  {fmtDate(user.metadata.creationTime)}
                </span>
              </p>
            </div>
          </div>
          <ProfileSettings key={user.uid} user={user} />
          <div className="account-signout">
            <p>Finished on this device?</p>
            <button
              id="logout-btn"
              className="btn btn-ghost"
              disabled={signingOut}
              onClick={handleSignOut}
            >
              {signingOut ? "Signing out…" : "Sign Out"}
            </button>
          </div>
        </div>
        <aside className="account-learning" aria-labelledby="learning-heading">
          <h2 id="learning-heading">Your learning</h2>
          <h3>Dark Patterns: Spot Them, Stop Them</h3>
          <p>Recognize deceptive design and learn how to respond.</p>
          <div className="account-progress-meta">
            <span>
              <strong id="mods-done">{progress.done}</strong> of{" "}
              <span id="mods-total">{progress.total}</span> modules
            </span>
            <span id="pct-text">{progress.pct}%</span>
          </div>
          <div
            className="account-progress"
            role="progressbar"
            aria-label="Course progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.pct}
          >
            <div
              id="progress-fill"
              style={{ width: `${progress.pct}%` } as CSSProperties}
            />
          </div>
          <a className="btn btn-primary" href="/courseone">
            {progress.done ? "Continue learning" : "Start learning"}
          </a>
          <p className="account-note">
            Course progress is saved on this device.
          </p>
        </aside>
      </div>
    </section>
  );
}
