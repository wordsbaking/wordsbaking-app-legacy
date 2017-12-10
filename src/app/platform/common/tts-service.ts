export abstract class TTSService {
  abstract speak(term: string): Promise<void>;
}
