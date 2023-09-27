import { uuid } from "../utils";

type TimerJobType = "timeout" | "interval" | "counter" | "until";
interface Job {
  id: string;
  start: number; // Date.now()
  type: TimerJobType;
  callback: (...args: any[]) => any;
  onFinish?: (...args: any[]) => any;
  ms: number;
}

interface TimeoutJob extends Job {
  end: number;
}

interface UntilJob extends TimeoutJob {}

interface IntervalJob extends Job {
  execCount: number;
  nextMs: number;
}

interface CounterJob extends IntervalJob {
  count: number;
  curCount: number;
  direction: "inc" | "dec";
}

export default class TimerJob {
  start: number;

  jobs: Job[] = [];

  canceler: number = 0;

  constructor() {
    this.start = Date.now();
  }

  add(timerJob: Job) {
    const toBePushed = { ...timerJob };
    toBePushed.id = timerJob.id ?? `${Date.now()}-${Math.random()}`;

    this.jobs.push(toBePushed);
  }

  timeout(ms: number, callback: (...args: any[]) => any, id?: string) {
    const timeoutId = id ?? `timeout-${Date.now()}-${Math.random()}`;
    this.add({
      id: timeoutId,
      type: "timeout",
      callback,
      ms,
      start: Date.now(),
      end: Date.now() + ms,
    } as TimeoutJob);
    return timeoutId;
  }

  until(
    ms: number,
    callback: (elapsed: number) => any,
    onFinish?: (elapsed: number) => any,
    id?: string
  ) {
    const untilId = id ?? `until-${Date.now()}-${Math.random()}`;
    this.add({
      id: untilId,
      type: "until",
      callback,
      onFinish,
      ms,
      start: Date.now(),
      end: Date.now() + ms,
    } as UntilJob);
    return untilId;
  }

  clearTimerJob(id: string, execOnFinish = false) {
    // console.log("Cleared ", id);
    if (execOnFinish) {
      const job = this.jobs.find((j) => j.id === id);
      if (job) {
        switch (job.type) {
          case "timeout":
            job.onFinish?.();
            break;
          case "interval":
            const ij = job as IntervalJob;
            ij.onFinish?.(ij.execCount);
            break;
          case "counter":
            const cj = job as CounterJob;
            const direction = cj.direction === "inc" ? 1 : -1;
            const input = cj.count + direction * cj.execCount;
            cj.onFinish?.(input);
            break;
          default:
            break;
        }
      }
    }
    this.jobs = this.jobs.filter((j) => j.id !== id);
  }

  interval(
    ms: number,
    callback: (count: number) => any,
    onFinish?: (count: number) => any,
    id?: string
  ) {
    const start = Date.now();
    const intervalId = id ?? `interval-${Date.now()}-${Math.random()}`;
    const job: IntervalJob = {
      id: intervalId,
      type: "interval",
      callback,
      ms,
      start,
      execCount: 0,
      nextMs: start + ms,
      onFinish,
    };
    this.add(job);
    return intervalId;
  }

  counter(
    count: number,
    ms: number,
    callback: (lastCount: number) => any,
    type: "inc" | "dec",
    onFinish?: (lastCount: number) => any,
    id?: string
  ) {
    const start = Date.now();
    const countId = id ?? `counter-${Date.now()}-${Math.random()}`;
    const job: CounterJob = {
      id: countId,
      type: "counter",
      callback,
      ms,
      count,
      curCount: type === "inc" ? 0 : count,
      start,
      nextMs: start + ms,
      onFinish,
      execCount: 0,
      direction: type,
    };
    this.add(job);
    return countId;
  }

  handleTimerJobs() {
    const now = Date.now();

    this.jobs.forEach((job) => {
      const isInterval = job.type === "interval";
      const isCounter = job.type === "counter";
      const isTimeout = job.type === "timeout";
      const isUntil = job.type === "until";

      if (isUntil) {
        const untilJob = job as UntilJob;
        const elapsed = now - untilJob.start;
        if (now < untilJob.end) {
          untilJob.callback(elapsed);
        } else {
          untilJob?.onFinish?.(elapsed);
          this.clearTimerJob(untilJob.id);
        }
      }

      if (isTimeout) {
        const timeoutJob = job as TimeoutJob;
        if (now >= timeoutJob.end) {
          timeoutJob.callback();
          timeoutJob?.onFinish?.();
          this.clearTimerJob(timeoutJob.id);
        }
      }

      if (isInterval || isCounter) {
        const intervalJob = job as IntervalJob;
        if (now >= intervalJob.nextMs) {
          intervalJob.execCount += 1;
          const direction =
            (intervalJob as CounterJob).direction === "inc" ? 1 : -1;
          const input = isInterval
            ? intervalJob.execCount
            : (intervalJob as CounterJob).count +
              direction * intervalJob.execCount;
          intervalJob.callback(input);
          intervalJob.nextMs =
            intervalJob.start + (intervalJob.execCount + 1) * intervalJob.ms;
          if (isCounter) {
            const counterJob = intervalJob as CounterJob;
            if (counterJob.execCount === counterJob.count) {
              counterJob?.onFinish?.(input);
              this.clearTimerJob(counterJob.id);
            }
          }
        }
      }
    });
  }
}
