interface CordovaTTSOptions {
  /** text to speak */
  text: string;
  /** a string like 'en-US', 'zh-CN', etc */
  locale?: string;
  /** speed rate, 0 ~ 1 */
  rate?: number;
}

interface CordovaTTSStatic {
  speak(options: CordovaTTSOptions | string): Promise<void>;
  stop(): Promise<void>;
}

interface Window {
  TTS?: CordovaTTSStatic;
}
