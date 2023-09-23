import { uuid } from "../utils";

export type TimerJobCallbacks = {
  cancelOn?: () => boolean; // executed every cycle
  onCancel?: () => any;

  onStart?: () => any; // for after(), every_ms()
  onEnd?: () => any; // for after()
  onEveryCall?: () => any; // for every_ms()
};
export default class TimerJob {
  now = () => performance.now();
  elapsed_ms: () => number = () => performance.now() - this.startTimestamp;
  elapsed = () => this.elapsed_ms() * 0.001;
  startTimestamp: number = performance.now();

  timerJobs: Map<
    string,
    {
      start: number;
      end: number;
      type: "after" | "every_ms";
      f: () => any;
    } & TimerJobCallbacks
  > = new Map();

  after(ms: number, f: () => any, callbacks?: TimerJobCallbacks, id?: string) {
    console.log({ now: this.now() });
    id = id ?? uuid();
    this.timerJobs.set(id, {
      start: this.now(),
      end: this.now() + ms,
      f,
      type: "after",
      ...(callbacks ? callbacks : {}),
    });
    return id;
  }
  onEveryMs(
    ms: number,
    f: () => any,
    callbacks?: TimerJobCallbacks,
    id?: string
  ) {
    id = id ?? uuid();
    this.timerJobs.set(id, {
      start: this.now(),
      end: this.now() + ms,
      f,
      type: "every_ms",
      ...(callbacks ? callbacks : {}),
    });
    return id;
  }

  killTimerJob(id: string) {
    this.timerJobs.delete(id);
  }

  handleTimerJobs() {
    const now = this.now();
    const timerJobs = this.timerJobs;
    const timerJobIds = Array.from(timerJobs.keys());
    // if (timerJobIds.length > 0) {
    //   console.log({ timerJobIds });
    // }
    timerJobIds.forEach((id) => {
      const timerJob = timerJobs.get(id);

      if (timerJob.cancelOn?.()) {
        timerJobs.delete(id);
        timerJob.onCancel?.();
        return;
      }

      if (timerJob.end < now) {
        timerJob.onStart?.();
        if (timerJob.type === "every_ms") {
          timerJob.onEveryCall?.();
        }
        timerJob.onStart = undefined;

        timerJob.f();

        switch (timerJob.type) {
          case "every_ms":
            timerJob.end = now + (timerJob.end - timerJob.start);
            timerJob.start = now;
            break;
          case "after":
          default:
            timerJobs.delete(id);
            break;
        }
      }
    });
  }
}
