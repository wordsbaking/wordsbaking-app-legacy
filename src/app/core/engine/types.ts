export interface CollectionInfo {
  name: string;
  id: string;
}

export interface Meaning {
  poss: string[];
  text: string;
}

export interface Sentence {
  s: string;
  t: string;
}

export interface WordData {
  term: string;
  prons?: {
    [region: string]: string[];
  };
  briefs: Meaning[];
  meanings: Meaning[];
  sentences?: Sentence[];
}

export interface WordViewData {
  term: string;
  phonetics: string;
  meanings: string[];
  sentence: Sentence;
}

export interface WordInfo extends WordData {
  new: boolean;
  marked: boolean;
  obstinate: boolean;
  needRemoveConfirm: boolean;
}
