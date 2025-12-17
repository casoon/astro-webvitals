/**
 * Visibility Watcher - tracks when page becomes hidden
 */

class VisibilityWatcherClass {
	private _firstHiddenTime: number;

	constructor() {
		this._firstHiddenTime =
			document.visibilityState === "hidden" ? 0 : Infinity;

		const onVisibilityChange = (event: Event) => {
			if (
				document.visibilityState === "hidden" &&
				this._firstHiddenTime === Infinity
			) {
				this._firstHiddenTime =
					event.type === "visibilitychange" ? event.timeStamp : 0;
			}
		};

		document.addEventListener("visibilitychange", onVisibilityChange, true);
		document.addEventListener("prerenderingchange", onVisibilityChange, true);
	}

	get firstHiddenTime(): number {
		return this._firstHiddenTime;
	}
}

export const visibilityWatcher = new VisibilityWatcherClass();
