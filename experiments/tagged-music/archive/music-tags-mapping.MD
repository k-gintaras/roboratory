I’ll turn your “tag pile with feelings” into a sane taxonomy plus a remap strategy. I’ll keep old tags alive through aliases, not force a mass retagging ritual like some cursed monastery database.

Thought for a few seconds

Below is a new tag system + old→new mapper design you can use for a worker.

Core idea:
old tags stay as raw evidence, worker generates normalized tags. Search uses normalized tags.

1. New Tag System
type MusicTags = {
  genre: Genre[];
  subgenre: Subgenre[];

  pace: Pace;
  energy: Energy;
  groove: Groove[];

  melody: Melody[];
  harmony: Harmony[];
  repetition: Repetition;
  progression: Progression;

  mood: Mood[];
  attitude: Attitude[];
  style: Style[];

  texture: Texture[];
  weight: Weight;
  soundProfile: SoundProfile[];

  vocalPresence: VocalPresence;
  vocalSource: VocalSource[];
  vocalStyle: VocalStyle[];

  instrumentation: Instrumentation[];

  eraFeel: EraFeel[];
  mixFit: MixFit[];

  flags: Flag[];
};
2. Suggested Values
Genre / Subgenre
type Genre =
  | "electronic"
  | "house"
  | "dnb"
  | "techno"
  | "trance"
  | "ambient"
  | "pop"
  | "rock"
  | "hiphop"
  | "classical"
  | "folk"
  | "jazz"
  | "latin"
  | "reggae"
  | "soundtrack"
  | "experimental"
  | "unknown";

type Subgenre =
  | "progressive-house"
  | "idm"
  | "industrial"
  | "dance"
  | "electro"
  | "electronica"
  | "soul-rnb"
  | "rap"
  | "mashup"
  | "remix"
  | "noise"
  | "newage"
  | "salsa"
  | "madrigal";
Pace / Energy / Groove
type Pace = "slow" | "mid" | "fast" | "unknown";

type Energy = "low" | "medium" | "high" | "peak" | "unknown";

type Groove =
  | "tight"
  | "driving"
  | "flowing"
  | "rhythmic"
  | "bouncy"
  | "funky"
  | "swing"
  | "club"
  | "loose";

Your brain probably cares about this group most. Genre is just the coat. Groove is the skeleton.

Melody / Harmony / Structure
type Melody =
  | "melodic"
  | "strong-melody"
  | "minimal"
  | "dance-melody"
  | "chaotic"
  | "atmospheric";

type Harmony =
  | "cohesive"
  | "harmonious"
  | "classy"
  | "rough"
  | "weird"
  | "experimental";

type Repetition =
  | "loop-heavy"
  | "balanced"
  | "varied"
  | "unknown";

type Progression =
  | "static"
  | "progressive"
  | "evolving"
  | "unknown";

This is where you separate “actual melody” from “three noises pretending to be a song”. Scientific term: fake-melody goblin behaviour.

Mood / Attitude / Style
type Mood =
  | "positive"
  | "happy"
  | "uplifting"
  | "calm"
  | "sad"
  | "tense"
  | "dark"
  | "dreamy"
  | "serious";

type Attitude =
  | "chill"
  | "cute"
  | "naughty"
  | "neutral"
  | "serious"
  | "cool"
  | "epic"
  | "dramatic";

type Style =
  | "cool"
  | "funky"
  | "classy"
  | "oldschool"
  | "modern"
  | "timeless"
  | "beautiful"
  | "unusual"
  | "experimental";

Important: keep cool / funky / classy. These are personal but useful. Your taxonomy should serve your taste, not impress a music professor in a cardigan.

Texture / Sound
type Texture =
  | "soft"
  | "gentle"
  | "balanced"
  | "strong"
  | "rough"
  | "industrial"
  | "ambient"
  | "electronic"
  | "acoustic";

type Weight = "light" | "medium" | "heavy" | "unknown";

type SoundProfile =
  | "deep"
  | "high"
  | "loud"
  | "quiet"
  | "hard"
  | "smooth";
Vocal / Voice
type VocalPresence =
  | "instrumental"
  | "vocal"
  | "mostly-instrumental"
  | "unknown";

type VocalSource =
  | "male"
  | "female"
  | "mixed"
  | "chorus"
  | "robotic"
  | "ambient-voice"
  | "industrial-voice";

type VocalStyle =
  | "singing"
  | "spoken"
  | "chopped"
  | "sampled"
  | "chant"
  | "texture"
  | "random-words";

This solves your “is this vocal?” issue.

Example:

{
  vocalPresence: "mostly-instrumental",
  vocalSource: ["female"],
  vocalStyle: ["chopped", "sampled"]
}
Era / Mix Fit / Flags
type EraFeel =
  | "oldschool"
  | "modern"
  | "classic"
  | "timeless"
  | "new";

type MixFit =
  | "playlist-friendly"
  | "club-friendly"
  | "hard-to-mix"
  | "genre-bridge"
  | "style-clash-risk";

type Flag =
  | "favorite"
  | "tofix"
  | "long"
  | "weird"
  | "rough"
  | "remix"
  | "personal";
3. Old → New Mapping

Use this as your worker base.

type NormalizedPatch = Partial<MusicTags>;

type TagMapping = Record<string, NormalizedPatch>;

export const oldToNewTagMap: TagMapping = {
  // GENRE / ORIGINAL GENRE
  "Alternative": { genre: ["rock"], subgenre: [] },
  "Alternative & Punk": { genre: ["rock"], subgenre: [] },
  "Ambient": { genre: ["ambient"], melody: ["atmospheric"], texture: ["ambient"] },
  "Blues": { genre: ["jazz"] },
  "Dance": { genre: ["electronic"], subgenre: ["dance"], groove: ["club"] },
  "Dream": { mood: ["dreamy"], melody: ["atmospheric"] },
  "Drum and Bass": { genre: ["dnb", "electronic"], pace: "fast", energy: "high", groove: ["driving"] },
  "Electro": { genre: ["electronic"], subgenre: ["electro"] },
  "Electronic": { genre: ["electronic"], texture: ["electronic"] },
  "Electronica": { genre: ["electronic"], subgenre: ["electronica"] },
  "Folk": { genre: ["folk"], texture: ["acoustic"] },
  "Hip Hop Rap": { genre: ["hiphop"], subgenre: ["rap"] },
  "House": { genre: ["house"], groove: ["club"] },
  "IDM": { genre: ["electronic", "experimental"], subgenre: ["idm"] },
  "Inconnu": { genre: ["unknown"] },
  "Industrial": { genre: ["experimental"], subgenre: ["industrial"], texture: ["industrial"], weight: "heavy" },
  "Latin": { genre: ["latin"], groove: ["rhythmic"] },
  "Madrigals": { genre: ["classical"], subgenre: ["madrigal"], vocalSource: ["chorus"] },
  "Mashup": { subgenre: ["mashup"], flags: ["remix"] },
  "Noise": { genre: ["experimental"], subgenre: ["noise"], harmony: ["rough", "experimental"], melody: ["chaotic"] },
  "Other": { genre: ["unknown"] },
  "Pop": { genre: ["pop"] },
  "Progressive House": { genre: ["house"], subgenre: ["progressive-house"], progression: "progressive" },
  "R&B / Hip Hop": { genre: ["hiphop"], subgenre: ["soul-rnb"] },
  "Rap & Hip-Hop": { genre: ["hiphop"], subgenre: ["rap"] },
  "Reggae": { genre: ["reggae"], groove: ["bouncy"] },
  "Remix": { subgenre: ["remix"], flags: ["remix"] },
  "Rock": { genre: ["rock"] },
  "Salsa": { genre: ["latin"], subgenre: ["salsa"], groove: ["rhythmic"] },
  "Soul and R&B": { subgenre: ["soul-rnb"] },
  "Soundtrack": { genre: ["soundtrack"], attitude: ["dramatic"] },
  "Techno": { genre: ["techno", "electronic"], groove: ["driving", "club"] },
  "Trance": { genre: ["trance", "electronic"], mood: ["uplifting"], progression: "progressive" },
  "Newage": { subgenre: ["newage"], genre: ["ambient"], mood: ["calm"] },

  // VOLUME
  "loud": { soundProfile: ["loud"], energy: "high" },
  "quiet": { soundProfile: ["quiet"], energy: "low" },

  // SPEED
  "slow": { pace: "slow", energy: "low" },
  "fast": { pace: "fast", energy: "high" },
  "progressive": { progression: "progressive" },
  "progressive fast": { pace: "fast", energy: "high", progression: "progressive" },
  "slow progressive": { pace: "slow", progression: "progressive" },

  // BEATS
  "flowing": { groove: ["flowing"] },
  "rhythmic": { groove: ["rhythmic"] },
  "flowing rhythmic": { groove: ["flowing", "rhythmic"] },

  // AGE / ERA FEEL
  "classical": { genre: ["classical"], eraFeel: ["classic"] },
  "classy": { style: ["classy"], harmony: ["classy"] },
  "old": { eraFeel: ["oldschool"] },
  "modern": { eraFeel: ["modern"], style: ["modern"] },
  "new": { eraFeel: ["new"] },
  "old modern": { eraFeel: ["oldschool", "modern"], mixFit: ["style-clash-risk"] },
  "oldschool": { eraFeel: ["oldschool"], style: ["oldschool"] },
  "timeless": { eraFeel: ["timeless"], style: ["timeless"] },

  // VOCALS OLD
  "instrumental": { vocalPresence: "instrumental" },
  "vocal": { vocalPresence: "vocal" },
  "vocal instrumental": { vocalPresence: "mostly-instrumental" },
  "electro": { texture: ["electronic"] },
  "ubaby": { flags: ["personal"] },

  // INSTRUMENTS
  "acoustic": { texture: ["acoustic"], instrumentation: ["acoustic"] as any },
  "classic": { eraFeel: ["classic"] },
  "electronic": { texture: ["electronic"], genre: ["electronic"] },
  "guitar": { instrumentation: ["guitar"] as any },
  "guitar piano": { instrumentation: ["guitar", "piano"] as any },
  "orchestra": { instrumentation: ["orchestra"] as any },
  "piano": { instrumentation: ["piano"] as any },

  // FUNK / STYLE
  "beautiful": { style: ["beautiful"] },
  "beautiful epic": { style: ["beautiful"], attitude: ["epic"] },
  "beautiful funky": { style: ["beautiful", "funky"], groove: ["funky"] },
  "cool": { style: ["cool"] },
  "cool epic": { style: ["cool"], attitude: ["epic"] },
  "cool funky": { style: ["cool", "funky"], groove: ["funky"] },
  "epic": { attitude: ["epic"] },
  "epic funky": { attitude: ["epic"], style: ["funky"], groove: ["funky"] },
  "funky": { style: ["funky"], groove: ["funky", "swing"] },
  "unusual": { style: ["unusual"], harmony: ["experimental"] },
  "unusual beautiful": { style: ["unusual", "beautiful"] },
  "unusual epic": { style: ["unusual"], attitude: ["epic"] },
  "unusual funky": { style: ["unusual", "funky"], groove: ["funky"] },

  // ATTITUDE
  "chill": { attitude: ["chill"], mood: ["calm"] },
  "cute": { attitude: ["cute"] },
  "cute chill": { attitude: ["cute", "chill"], mood: ["calm"] },
  "cute naughty": { attitude: ["cute", "naughty"] },
  "cute neutral": { attitude: ["cute", "neutral"] },
  "naughty": { attitude: ["naughty"] },
  "neutral": { attitude: ["neutral"] },
  "serious": { attitude: ["serious"], mood: ["serious"] },

  // WEIGHT / PITCH
  "heavy": { weight: "heavy", texture: ["strong"] },
  "light": { weight: "light", texture: ["gentle"] },
  "deep": { soundProfile: ["deep"] },
  "high": { soundProfile: ["high"] },

  // MELODY
  "dance": { melody: ["dance-melody"], groove: ["club"] },
  "melodic": { melody: ["melodic", "strong-melody"] },
  "melodic dance": { melody: ["melodic", "dance-melody"], groove: ["club"] },
  "minimal": { melody: ["minimal"], repetition: "loop-heavy" },

  // ENERGY
  "active": { energy: "high" },
  "passive": { energy: "low" },
  "passive active": { energy: "medium" },

  // VOICE
  "ambient female": { vocalSource: ["female", "ambient-voice"], vocalStyle: ["texture"] },
  "ambient male": { vocalSource: ["male", "ambient-voice"], vocalStyle: ["texture"] },
  "ambient": { texture: ["ambient"], melody: ["atmospheric"] },
  "chorus": { vocalSource: ["chorus"], vocalStyle: ["chant"] },
  "female": { vocalSource: ["female"], vocalPresence: "vocal" },
  "male": { vocalSource: ["male"], vocalPresence: "vocal" },
  "male female": { vocalSource: ["male", "female", "mixed"], vocalPresence: "vocal" },
  "male female chorus": { vocalSource: ["male", "female", "mixed", "chorus"], vocalPresence: "vocal" },
  "male chorus": { vocalSource: ["male", "chorus"], vocalPresence: "vocal" },
  "industrial female": { vocalSource: ["female", "industrial-voice"], texture: ["industrial"] },
  "industrial male": { vocalSource: ["male", "industrial-voice"], texture: ["industrial"] },
  "industrial": { texture: ["industrial"], subgenre: ["industrial"] },
  "robo": { vocalSource: ["robotic"], vocalStyle: ["sampled"] },
  "robo female": { vocalSource: ["robotic", "female"], vocalStyle: ["sampled"] },

  // SOUNDS
  "balanced": { texture: ["balanced"] },
  "balanced strong": { texture: ["balanced", "strong"] },
  "gentle": { texture: ["gentle"] },
  "soft": { texture: ["soft"] },
  "soft balanced": { texture: ["soft", "balanced"] },
  "strong": { texture: ["strong"] },

  // MOOD
  "calm": { mood: ["calm"] },
  "calm positive": { mood: ["calm", "positive"] },
  "calm uplifting": { mood: ["calm", "uplifting"] },
  "positive": { mood: ["positive"] },
  "positive happy": { mood: ["positive", "happy"] },
  "positive happy uplifting": { mood: ["positive", "happy", "uplifting"] },
  "positive uplifting": { mood: ["positive", "uplifting"] },
  "sad": { mood: ["sad"] },
  "sad uplifting": { mood: ["sad", "uplifting"] },
  "tense": { mood: ["tense"] },
  "tense positive uplifting": { mood: ["tense", "positive", "uplifting"] },
  "tense uplifting": { mood: ["tense", "uplifting"] },
  "uplifting": { mood: ["uplifting"] },

  // SECONDARY GENRE OLD
  "atmospheric": { melody: ["atmospheric"], texture: ["ambient"] },
  "atmospheric pop": { genre: ["pop"], melody: ["atmospheric"] },
  "atmospheric rap": { genre: ["hiphop"], subgenre: ["rap"], melody: ["atmospheric"] },
  "atmospheric techno": { genre: ["techno"], melody: ["atmospheric"] },
  "atmospheric techno pop": { genre: ["techno", "pop"], melody: ["atmospheric"] },
  "atmospheric trance": { genre: ["trance"], melody: ["atmospheric"] },
  "chillout": { mood: ["calm"], attitude: ["chill"] },
  "chillout atmospheric": { mood: ["calm"], attitude: ["chill"], melody: ["atmospheric"] },
  "chillout atmospheric trance": { genre: ["trance"], mood: ["calm"], melody: ["atmospheric"] },
  "chillout pop": { genre: ["pop"], mood: ["calm"] },
  "dnb": { genre: ["dnb", "electronic"], pace: "fast", energy: "high" },
  "house techno": { genre: ["house", "techno"], groove: ["club", "driving"] },
  "house techno pop": { genre: ["house", "techno", "pop"], groove: ["club"] },
  "pop rap": { genre: ["pop", "hiphop"], subgenre: ["rap"] },
  "pop rock": { genre: ["pop", "rock"] },
  "rap": { genre: ["hiphop"], subgenre: ["rap"] },
  "techno dnb": { genre: ["techno", "dnb"], pace: "fast", energy: "high" },
  "techno pop": { genre: ["techno", "pop"] },
  "techno trance": { genre: ["techno", "trance"], progression: "progressive" },

  // OTHER / FLAGS
  "acid": { style: ["experimental"], soundProfile: ["hard"] },
  "acid timeless": { style: ["experimental", "timeless"], eraFeel: ["timeless"] },
  "dramatic": { attitude: ["dramatic"] },
  "favorite timeless": { flags: ["favorite"], eraFeel: ["timeless"] },
  "intrumental": { vocalPresence: "instrumental" },
  "timeless intrumental": { eraFeel: ["timeless"], vocalPresence: "instrumental" },
  "jazz": { genre: ["jazz"] },
  "long": { flags: ["long"] },
  "long timeless": { flags: ["long"], eraFeel: ["timeless"] },
  "long tofix": { flags: ["long", "tofix"] },
  "long tofix timeless": { flags: ["long", "tofix"], eraFeel: ["timeless"] },
  "music": {},
  "music timeless": { eraFeel: ["timeless"] },
  "rough": { flags: ["rough"], harmony: ["rough"], texture: ["rough"] },
  "tofix": { flags: ["tofix"] },
  "tofix rough timeless": { flags: ["tofix", "rough"], eraFeel: ["timeless"], harmony: ["rough"] },
  "tofix timeless": { flags: ["tofix"], eraFeel: ["timeless"] },
  "vika": { flags: ["personal"] },
  "vika timeless": { flags: ["personal"], eraFeel: ["timeless"] },
  "voice weird timeless": {
    vocalPresence: "vocal",
    vocalStyle: ["random-words"],
    flags: ["weird"],
    eraFeel: ["timeless"]
  },
  "weird": { flags: ["weird"], style: ["unusual"], harmony: ["weird"] },
  "weird timeless": { flags: ["weird"], style: ["unusual", "timeless"], eraFeel: ["timeless"] }
};
4. BPM Mapping

Don’t store every BPM as a tag. Store actual BPM as number, then derive:

function deriveBpmTags(bpm: number): Partial<MusicTags> {
  if (!bpm || bpm <= 0) return { pace: "unknown" };

  if (bpm < 85) return { pace: "slow", energy: "low" };
  if (bpm < 115) return { pace: "mid", energy: "medium" };
  if (bpm < 140) return { pace: "fast", energy: "high" };
  if (bpm < 175) return { pace: "fast", energy: "peak" };

  return { pace: "fast", energy: "peak" };
}

Optional DnB trap:

// 85 BPM can feel like 170 BPM half-time.
// Store both realBpm and perceivedPace if needed.
5. Initial Key Mapping

Keep key as metadata, not taste tag.

type MusicalKey =
  | "A" | "Am"
  | "Ab" | "B" | "Bm" | "Bb" | "Bbm"
  | "C" | "Cm" | "C#m"
  | "D" | "Dm" | "Db"
  | "E" | "Em" | "Eb" | "Ebm"
  | "F" | "Fm" | "F#m"
  | "G" | "Gm" | "G#m" | "Gb";

Use later for harmonic mixing, not playlist mood.

6. Worker Merge Logic
const ARRAY_FIELDS = new Set([
  "genre",
  "subgenre",
  "groove",
  "melody",
  "harmony",
  "mood",
  "attitude",
  "style",
  "texture",
  "soundProfile",
  "vocalSource",
  "vocalStyle",
  "instrumentation",
  "eraFeel",
  "mixFit",
  "flags"
]);

function mergePatch(target: any, patch: any) {
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;

    if (ARRAY_FIELDS.has(key)) {
      target[key] = Array.from(new Set([...(target[key] ?? []), ...(value as any[])]));
    } else {
      target[key] = value;
    }
  }

  return target;
}
7. Normalize One Song
const emptyTags: MusicTags = {
  genre: [],
  subgenre: [],

  pace: "unknown",
  energy: "unknown",
  groove: [],

  melody: [],
  harmony: [],
  repetition: "unknown",
  progression: "unknown",

  mood: [],
  attitude: [],
  style: [],

  texture: [],
  weight: "unknown",
  soundProfile: [],

  vocalPresence: "unknown",
  vocalSource: [],
  vocalStyle: [],

  instrumentation: [],

  eraFeel: [],
  mixFit: [],

  flags: []
};

function normalizeSong(oldTags: string[], bpm?: number): MusicTags {
  const result = structuredClone(emptyTags);

  for (const tag of oldTags) {
    const patch = oldToNewTagMap[tag];

    if (patch) {
      mergePatch(result, patch);
    } else {
      result.flags.push(`unmapped:${tag}` as any);
    }
  }

  if (bpm) {
    mergePatch(result, deriveBpmTags(bpm));
  }

  result.flags = Array.from(new Set(result.flags));

  return result;
}
8. Search Synonyms

This is how “fast paced music” finds old and new.

export const searchAliases = {
  "fast paced": {
    pace: ["fast"],
    energy: ["high", "peak"],
    oldTags: ["fast", "progressive fast", "dnb", "Drum and Bass"]
  },

  "funky house": {
    genre: ["house"],
    groove: ["funky", "swing"],
    style: ["funky"],
    oldTags: ["funky", "cool funky", "beautiful funky", "House"]
  },

  "cool house": {
    genre: ["house"],
    groove: ["tight", "driving", "club"],
    style: ["cool"],
    oldTags: ["cool", "cool epic", "House", "house techno"]
  },

  "female vocal positive house": {
    genre: ["house"],
    vocalSource: ["female"],
    mood: ["positive", "happy", "uplifting"],
    oldTags: ["female", "vocal", "positive", "positive uplifting", "House"]
  },

  "non repetitive house": {
    genre: ["house"],
    repetition: ["balanced", "varied"],
    oldTags: ["progressive", "Progressive House"]
  },

  "industrial hard": {
    texture: ["industrial", "strong"],
    weight: ["heavy"],
    oldTags: ["Industrial", "industrial", "heavy", "strong"]
  },

  "ambient soft": {
    genre: ["ambient"],
    texture: ["ambient", "soft", "gentle"],
    mood: ["calm"],
    oldTags: ["Ambient", "ambient", "soft", "gentle", "calm"]
  }
};
9. Your Main Playlist Recipes
Funky Vocal Female Positive House
{
  genre: ["house"],
  groove: ["funky", "swing"],
  vocalSource: ["female"],
  vocalPresence: "vocal",
  mood: ["positive"],
  style: ["funky"],
  eraFeel: ["modern", "timeless"],
  repetition: "balanced"
}
Cool House
{
  genre: ["house"],
  groove: ["tight", "driving", "club"],
  style: ["cool"],
  texture: ["balanced", "strong"],
  mood: ["positive", "neutral"],
  repetition: "balanced"
}
Progressive Positive
{
  progression: "progressive",
  mood: ["positive", "uplifting"],
  melody: ["melodic", "atmospheric"],
  energy: "medium"
}
Fast Uplifting
{
  pace: "fast",
  energy: "high",
  mood: ["uplifting", "positive"],
  groove: ["driving"]
}
Positive Pop That Does Not Suck
{
  genre: ["pop"],
  mood: ["positive"],
  melody: ["strong-melody", "melodic"],
  harmony: ["cohesive"],
  repetition: "balanced"
}

Important scientific category: pop that does not suck. Rare element. Handle carefully.

10. Recommended Worker Output

Store both:

type Song = {
  id: string;
  title: string;
  artist: string;

  oldTags: string[];
  normalizedTags: MusicTags;

  bpm?: number;
  initialKey?: MusicalKey;

  unmappedTags: string[];
};

Do not delete old tags. They are fossils. Useful fossils.

11. Priority For Manual Retagging Later

Only manually tag these new fields when you really love a song:

{
  groove,
  melody,
  harmony,
  repetition,
  style,
  mixFit
}

Those are your “why I love this” fields.

Genre is boring. BPM is math.
Groove + melody + cohesion = actual taste fingerprint.