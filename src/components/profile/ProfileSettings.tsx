import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type SubmitEvent,
} from "react";
import { sendEmailVerification, updateProfile, type User } from "firebase/auth";
import {
  getDownloadURL,
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  type UploadTask,
} from "firebase/storage";
import {
  auth,
  authStore,
  errorMessage,
  initialsFrom,
  resetPassword,
} from "@/lib/auth";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { setUserName } from "@/lib/storage";
import { showToast } from "@/lib/toast";

const MAX_AVATAR_BYTES = 3 * 1024 * 1024;

function validateAvatarFile(file: File): string | null {
  if (!/^image\//i.test(file.type)) return "Please choose an image file.";
  if (file.size > MAX_AVATAR_BYTES) return "Image must be under 3 MB.";
  return null;
}

function startAvatarUpload(
  file: File,
  uid: string,
  onProgress: (pct: number) => void,
): { task: UploadTask; result: Promise<string> } {
  const storage = getStorage();
  const path = `avatars/${uid}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
  const fileRef = storageRef(storage, path);
  const task = uploadBytesResumable(fileRef, file, {
    cacheControl: "public,max-age=31536000",
  });

  const result = new Promise<string>((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        onProgress(
          snapshot.totalBytes > 0
            ? Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
              )
            : 0,
        );
      },
      (err) => reject(err),
      () => {
        getDownloadURL(task.snapshot.ref).then(resolve).catch(reject);
      },
    );
  });

  return { task, result };
}

export function ProfileSettings({ user }: { user: User }) {
  const [name, setName] = useState(user.displayName ?? "");
  const [photoUrl, setPhotoUrl] = useState(user.photoURL ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [emailVerified, setEmailVerified] = useState(user.emailVerified);
  const [verificationSent, setVerificationSent] = useState(false);
  const [securityMessage, setSecurityMessage] = useState("");
  const [saving, runSave] = useSubmitLock();
  const [sending, runSend] = useSubmitLock();
  const taskRef = useRef<UploadTask | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );
  useEffect(
    () => () => {
      taskRef.current?.cancel();
    },
    [],
  );
  useEffect(() => {
    if (!verificationSent) return;
    const timer = window.setTimeout(() => setVerificationSent(false), 60_000);
    return () => window.clearTimeout(timer);
  }, [verificationSent]);
  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      void user
        .reload()
        .then(() => {
          if (!cancelled) setEmailVerified(user.emailVerified);
        })
        .catch(() => {
          /* Keep the last known state while offline. */
        });
    };
    refresh();
    window.addEventListener("focus", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", refresh);
    };
  }, [user]);

  function clearFile(): void {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationError = validateAvatarFile(file);
    clearFile();
    setError(validationError ?? "");
    if (validationError) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function discardChanges(): void {
    setName(user.displayName ?? "");
    setPhotoUrl(user.photoURL ?? "");
    clearFile();
    setError("");
  }

  function handleSubmit(e: SubmitEvent<HTMLFormElement>): void {
    e.preventDefault();
    setError("");
    void runSave(async () => {
      let finalPhotoURL = photoUrl.trim();
      if (selectedFile) {
        try {
          const { task, result } = startAvatarUpload(
            selectedFile,
            user.uid,
            setUploadProgress,
          );
          taskRef.current = task;
          setUploadProgress(0);
          finalPhotoURL = await result;
        } catch (err) {
          const canceled =
            (err as { code?: string })?.code === "storage/canceled";
          setError(
            canceled
              ? "Upload canceled."
              : "Could not upload your photo. Please try again or use an image link.",
          );
          return;
        } finally {
          taskRef.current = null;
          setUploadProgress(null);
        }
      }
      try {
        // Empty strings explicitly clear saved values instead of omitting the update.
        await updateProfile(user, {
          displayName: name.trim(),
          photoURL: finalPhotoURL,
        });
        setUserName(name.trim());
        authStore.set({ user: auth.currentUser ?? user, status: "in" });
        setName(name.trim());
        setPhotoUrl(finalPhotoURL);
        clearFile();
        showToast("Profile updated");
      } catch {
        setError("Could not save your profile. Please try again.");
      }
    });
  }

  function sendAccountEmail(kind: "verify" | "reset"): void {
    void runSend(async () => {
      setSecurityMessage("");
      try {
        if (kind === "verify") {
          await sendEmailVerification(user);
          setVerificationSent(true);
          setSecurityMessage(
            "Verification link sent. Check your inbox, then return here.",
          );
          showToast("Verification email sent.");
        } else if (user.email) {
          await resetPassword(user.email);
          setSecurityMessage(
            "Password reset link sent. Check your inbox to choose a new password.",
          );
        }
      } catch (err) {
        setSecurityMessage(errorMessage(err));
      }
    });
  }

  const avatarSrc = previewUrl ?? (photoUrl.trim() || null);
  const dirty =
    name.trim() !== (user.displayName ?? "") ||
    photoUrl.trim() !== (user.photoURL ?? "") ||
    !!selectedFile;
  const hasPassword = user.providerData.some(
    (provider) => provider.providerId === "password",
  );

  return (
    <div className="settings">
      <section className="account-section" aria-labelledby="settings-heading">
        <h2 id="settings-heading">Personal details</h2>
        <p className="account-note">
          Your name appears on your course certificate.
        </p>
        <form className="settings-form" onSubmit={handleSubmit}>
          <fieldset disabled={saving}>
            <div className="account-photo-editor">
              <div className="account-avatar account-avatar--preview">
                {avatarSrc && avatarSrc !== failedPhoto ? (
                  <img
                    src={avatarSrc}
                    alt="Photo preview"
                    onError={() => setFailedPhoto(avatarSrc)}
                  />
                ) : (
                  <span>{initialsFrom(user)}</span>
                )}
              </div>
              <div className="account-photo-controls">
                <label className="account-upload" htmlFor="input-photo-file">
                  Choose photo
                  <input
                    id="input-photo-file"
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    aria-describedby="photo-help"
                  />
                </label>
                {(avatarSrc || user.photoURL) && (
                  <button
                    className="account-text-button"
                    type="button"
                    onClick={() => {
                      clearFile();
                      setPhotoUrl("");
                      setError("");
                    }}
                  >
                    Remove photo
                  </button>
                )}
                <p id="photo-help">
                  Images up to 3 MB
                  {selectedFile ? ` · ${selectedFile.name}` : ""}
                </p>
              </div>
            </div>
            <label className="account-field" htmlFor="input-name">
              Display name
              <input
                id="input-name"
                name="name"
                autoComplete="name"
                type="text"
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <details className="account-photo-link">
              <summary>Use an image link</summary>
              <label className="account-field" htmlFor="input-photo">
                Image URL
                <input
                  id="input-photo"
                  name="photoUrl"
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={photoUrl}
                  onChange={(e) => {
                    clearFile();
                    setPhotoUrl(e.target.value);
                  }}
                />
              </label>
            </details>
          </fieldset>
          {uploadProgress !== null && (
            <div className="account-upload-progress">
              <progress
                value={uploadProgress}
                max={100}
                aria-label="Avatar upload progress"
              />
              <button
                type="button"
                className="account-text-button"
                onClick={() => taskRef.current?.cancel()}
              >
                Cancel Upload
              </button>
            </div>
          )}
          <p className="form-error" role="alert" hidden={!error}>
            {error}
          </p>
          <div className="settings-actions">
            <button
              type="submit"
              id="settings-submit"
              className="btn btn-primary"
              disabled={saving || !dirty}
              aria-busy={saving || undefined}
            >
              {saving ? "Saving…" : "Save Profile"}
            </button>
            {dirty && (
              <button
                type="button"
                className="btn btn-ghost"
                disabled={saving}
                onClick={discardChanges}
              >
                Discard changes
              </button>
            )}
          </div>
        </form>
      </section>
      <section
        className="account-section account-security"
        aria-labelledby="security-heading"
      >
        <h2 id="security-heading">Sign-in & security</h2>
        <div className="account-security-row">
          <div>
            <h3>Email address</h3>
            <p>{user.email}</p>
            <span className="account-verification">
              {emailVerified ? "Email verified" : "Email not verified"}
            </span>
          </div>
          {!emailVerified && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => sendAccountEmail("verify")}
              disabled={sending || verificationSent}
            >
              {verificationSent ? "Email sent" : "Verify Email"}
            </button>
          )}
        </div>
        <div className="account-security-row">
          <div>
            <h3>{hasPassword ? "Password" : "Connected account"}</h3>
            <p>
              {hasPassword
                ? "Choose a new password using a link sent to your email."
                : "You sign in through your connected account. Manage your password with that service."}
            </p>
          </div>
          {hasPassword && (
            <button
              type="button"
              className="btn btn-ghost"
              disabled={sending}
              onClick={() => sendAccountEmail("reset")}
            >
              Reset password
            </button>
          )}
        </div>
        <p className="account-message" role="status" hidden={!securityMessage}>
          {securityMessage}
        </p>
      </section>
    </div>
  );
}
