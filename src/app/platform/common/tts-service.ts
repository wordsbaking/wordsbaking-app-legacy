export abstract class TTSService {
  abstract speak(term: string, rate?: number): Promise<void>;
}
