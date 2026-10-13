export declare class AltchaReplayGuard {
  constructor(state: unknown);
  fetch(request: Request): Promise<Response>;
  alarm(): Promise<void>;
}
