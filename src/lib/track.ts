// Port of window.ffTrack from js/app.js. Currently just logs; kept as a
// single seam so a real analytics sink can be swapped in later.

export function track(eventName: string, payload: Record<string, unknown> = {}): void {
  console.log('[ffTrack]', eventName, payload);
}
