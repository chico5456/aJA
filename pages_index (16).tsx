import React, { useState, useMemo, useEffect } from 'react';
import { Crown, Play, ArrowDown, Edit, Save, RefreshCw, MessageCircle, HeartCrack, Zap, Sparkles, ThumbsUp, ThumbsDown, Siren, Skull, Star, MicStage, Music, Users } from 'lucide-react';

// --- Types ---

type StatType = 'design' | 'comedy' | 'acting' | 'improv' | 'dance' | 'lipsync' | 'singing' | 'branding';
type Placement = 'WIN' | 'TOP2' | 'HIGH' | 'SAFE' | 'LOW' | 'BTM2' | 'ELIM' | ' ' | null;
type EpisodeFormat = 'STANDARD' | 'TOP2_NOELIM' | 'LIPSYNC_TOURNAMENT' | 'FINALE_LIPSYNC';
type Phase = 'SEASON_SELECT' | 'START' | 'ENTRANCES' | 'EPISODE_INTRO' | 'EVENTS' | 'PERFORMANCE' | 'CRITIQUES' | 'WHO_SHOULD_GO_HOME' | 'PRODUCERS' | 'LIPSYNC' | 'ELIMINATION' | 'FINALE';

interface Queen {
  id: string;
  name: string;
  imageUrl: string;
  entranceLine: string;
  stats: Record<StatType, number>;
  trackRecord: Placement[];
  status: 'active' | 'eliminated' | 'winner' | 'runner-up';
  eliminatedEpisode?: number;
  group: 1 | 2 | 3; // 1=Group A, 2=Group B, 3=Merged/All
  tempStatModifier?: number;
}

interface Challenge {
  name: string;
  type: StatType[];
  description: string;
}

interface Episode {
  id: number;
  title: string;
  format: EpisodeFormat;
  participatingGroups: (1 | 2 | 3)[] | 'ALL';
  challenge: Challenge;
}

interface Season {
  id: string;
  name: string;
  queens: Queen[];
  episodes: Episode[];
  logoColor: string;
}

// --- CONSTANTS ---

const PLACEMENT_COLORS: Record<string, string> = {
  WIN: 'bg-blue-400 text-blue-950 border-blue-500',
  TOP2: 'bg-cyan-300 text-cyan-950 border-cyan-400',
  HIGH: 'bg-blue-100 text-blue-900 border-blue-200',
  SAFE: 'bg-gray-50 text-gray-800 border-gray-200',
  LOW: 'bg-pink-100 text-pink-800 border-pink-200',
  BTM2: 'bg-red-300 text-red-950 border-red-400',
  ELIM: 'bg-red-600 text-white font-bold border-red-700',
  ' ': 'bg-gray-100',
};

// --- DATA: FLAVOR TEXT ---

const EVENTS_LIST = [
  { text: "gets into a heated argument in Untucked!", modifier: -1.5, type: 'drama' },
  { text: "struggles with the materials in the werkroom.", modifier: -1, type: 'struggle' },
  { text: "helps another queen with their sewing.", modifier: 0.5, type: 'positive' },
  { text: "receives a heartwarming video message from home.", modifier: 1, type: 'positive' },
  { text: "is completely delusional about their performance.", modifier: -0.5, type: 'drama' },
  { text: "slays the mini-challenge and gains confidence!", modifier: 1.5, type: 'positive' },
  { text: "accuses another queen of stealing their idea.", modifier: -1, type: 'drama' },
  { text: "quietly focuses and finishes their outfit early.", modifier: 1, type: 'positive' },
  { text: "has a meltdown during rehearsal.", modifier: -2, type: 'struggle' },
  { text: "shades everyone in their confessional.", modifier: 0, type: 'drama' },
];

const PERFORMANCE_FEEDBACK: Record<string, { good: string[], bad: string[] }> = {
  design: {
    good: ["struts down the runway in a stunning creation", "serves pure fashion tailored to perfection"],
    bad: ["walks out in a partially unfinished hem", "struggles to walk in their ill-fitting outfit"]
  },
  comedy: {
    good: ["has the judges cackling with every joke", "commands the room with natural wit"],
    bad: ["hears crickets after their opening joke", "nervously rushes through their set"]
  },
  lipsync: {
    good: ["hits every beat with ferocious precision", "embodies the song perfectly"],
    bad: ["misses several words and looks lost", "is off-beat for most of the number"]
  },
  general: {
    good: ["is absolutely glowing on stage today", "gives 110% energy to the performance"],
    bad: ["seems visibly nervous and shaky", "is getting overshadowed by the others"]
  }
};

const JUDGES_CRITIQUES: Record<string, { good: string[], safe: string[], bad: string[] }> = {
  general: {
    good: ["You were the clear standout this week.", "You are a superstar, baby!", "This is exactly what we've been waiting for."],
    safe: ["You're coasting right now. We need more.", "It was good, but not great.", "You faded into the background today."],
    bad: ["I'm very disappointed in what you brought.", "Your head wasn't in the game.", "This did not meet the standard."]
  }
};

// --- DATA: SEASONS ---

const S16_QUEENS: Queen[] = [
  { id: 'sapphira', name: 'Sapphira Cristál', entranceLine: 'I have arrived!', imageUrl: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/a/a5/SapphiraCrist%C3%A1l.jpg', group: 1, stats: { design: 8, comedy: 7, acting: 9, improv: 7, dance: 9, lipsync: 9, singing: 10, branding: 9 }, trackRecord: [], status: 'active' },
  { id: 'q', name: 'Q', entranceLine: 'Did somebody order a bis-Q-it?', imageUrl: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/7/76/Q.jpg', group: 1, stats: { design: 10, comedy: 4, acting: 5, improv: 3, dance: 5, lipsync: 3, singing: 4, branding: 7 }, trackRecord: [], status: 'active' },
  { id: 'dawn', name: 'Dawn', entranceLine: 'Wakey wakey!', imageUrl: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/a/a5/Dawn.jpg', group: 1, stats: { design: 9, comedy: 6, acting: 5, improv: 5, dance: 4, lipsync: 6, singing: 4, branding: 8 }, trackRecord: [], status: 'active' },
  { id: 'mirage', name: 'Mirage', entranceLine: 'Legs for days!', imageUrl: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/b/b3/Mirage.jpg', group: 1, stats: { design: 5, comedy: 5, acting: 5, improv: 4, dance: 10, lipsync: 8, singing: 6, branding: 5 }, trackRecord: [], status: 'active' },
  { id: 'amanda', name: 'Amanda Tori Meating', entranceLine: 'Meeting adjourned!', imageUrl: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/1/18/AmandaToriMeating.jpg', group: 1, stats: { design: 3, comedy: 8, acting: 7, improv: 6, dance: 6, lipsync: 7, singing: 5, branding: 6 }, trackRecord: [], status: 'active' },
  { id: 'morphine', name: 'Morphine Love Dion', entranceLine: 'Body, face, and ass for days!', imageUrl: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/d/d6/MorphineLoveDion.jpg', group: 1, stats: { design: 6, comedy: 6, acting: 6, improv: 5, dance: 9, lipsync: 10, singing: 4, branding: 8 }, trackRecord: [], status: 'active' },
  { id: 'xunami', name: 'Xunami Muse', entranceLine: 'Muse has arrived.', imageUrl: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/6/6c/XunamiMuse.jpg', group: 1, stats: { design: 8, comedy: 5, acting: 5, improv: 5, dance: 7, lipsync: 7, singing: 3, branding: 9 }, trackRecord: [], status: 'active' },
  { id: 'nymphia', name: 'Nymphia Wind', entranceLine: 'Banana time!', imageUrl: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/8/82/NymphiaWind.jpg', group: 2, stats: { design: 10, comedy: 8, acting: 6, improv: 7, dance: 9, lipsync: 8, singing: 5, branding: 10 }, trackRecord: [], status: 'active' },
  { id: 'plane', name: 'Plane Jane', entranceLine: 'Buckle up!', imageUrl: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/0/03/PlaneJane.jpg', group: 2, stats: { design: 7, comedy: 9, acting: 8, improv: 9, dance: 9, lipsync: 8, singing: 7, branding: 8 }, trackRecord: [], status: 'active' },
  { id: 'plasma', name: 'Plasma', entranceLine: 'Old Hollywood glam!', imageUrl: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/9/92/Plasma.jpg', group: 2, stats: { design: 6, comedy: 8, acting: 9, improv: 7, dance: 7, lipsync: 6, singing: 10, branding: 8 }, trackRecord: [], status: 'active' },
  { id: 'mhiya', name: 'Mhi\'ya Iman Le\'Paige', entranceLine: 'Flip it and reverse it!', imageUrl: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/4/45/Mhi%27yaImanLe%27Paige.jpg', group: 2, stats: { design: 4, comedy: 5, acting: 4, improv: 5, dance: 10, lipsync: 10, singing: 2, branding: 5 }, trackRecord: [], status: 'active' },
  { id: 'megami', name: 'Megami', entranceLine: 'Geek chic.', imageUrl: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/6/6e/Megami.jpg', group: 2, stats: { design: 6, comedy: 5, acting: 5, improv: 4, dance: 7, lipsync: 9, singing: 6, branding: 6 }, trackRecord: [], status: 'active' },
  { id: 'geneva', name: 'Geneva Karr', entranceLine: 'Vroom vroom!', imageUrl: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/7/72/GenevaKarr.jpg', group: 2, stats: { design: 5, comedy: 4, acting: 5, improv: 4, dance: 7, lipsync: 7, singing: 5, branding: 5 }, trackRecord: [], status: 'active' },
  { id: 'hershii', name: 'Hershii LiqCour-Jeté', entranceLine: 'Chocolate kiss!', imageUrl: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/7/7e/HershiiLiqCour-Jet%C3%A9.jpg', group: 2, stats: { design: 4, comedy: 7, acting: 6, improv: 5, dance: 5, lipsync: 7, singing: 4, branding: 6 }, trackRecord: [], status: 'active' },
];

const S16_EPISODES: Episode[] = [
  { id: 1, title: "Rate-A-Queen Pt. 1", format: 'TOP2_NOELIM', participatingGroups: [1], challenge: { name: "MTV Talent Show", type: ['dance', 'singing', 'comedy'], description: "Perform your signature talent in front of the judges!" } },
  { id: 2, title: "Rate-A-Queen Pt. 2", format: 'TOP2_NOELIM', participatingGroups: [2], challenge: { name: "Queen Choice Awards", type: ['dance', 'singing', 'comedy'], description: "Perform your signature talent for the second group!" } },
  { id: 3, title: "The Mother of All Balls", format: 'STANDARD', participatingGroups: 'ALL', challenge: { name: "The Mother of All Balls", type: ['design'], description: "Serve three distinct looks, including one made from scratch." } },
  { id: 4, title: "RDR Live!", format: 'STANDARD', participatingGroups: 'ALL', challenge: { name: "RDR Live!", type: ['acting', 'comedy', 'improv'], description: "Perform in a live sketch comedy show." } },
  { id: 5, title: "Girl Groups", format: 'STANDARD', participatingGroups: 'ALL', challenge: { name: "Girl Groups", type: ['dance', 'singing', 'branding'], description: "Write verses and perform choreography in girl groups." } },
  { id: 6, title: "Welcome to the DollHouse", format: 'STANDARD', participatingGroups: 'ALL', challenge: { name: "DollHouse Design", type: ['design', 'branding'], description: "Design a doll based on your drag persona." } },
  { id: 7, title: "The Sound of Rusic", format: 'STANDARD', participatingGroups: 'ALL', challenge: { name: "Rusical", type: ['dance', 'singing', 'acting'], description: "Star in The Sound of Rusic live musical." } },
  { id: 8, title: "Snatch Game", format: 'STANDARD', participatingGroups: 'ALL', challenge: { name: "Snatch Game", type: ['comedy', 'improv'], description: "Impersonate celebrities in the Snatch Game." } },
  { id: 9, title: "See You Next Wednesday", format: 'STANDARD', participatingGroups: 'ALL', challenge: { name: "Neo-Goth Design", type: ['design'], description: "Create a neo-goth outfit from unconventional materials." } },
  { id: 10, title: "Werq the World", format: 'TOP2_NOELIM', participatingGroups: 'ALL', challenge: { name: "Werq the World", type: ['dance', 'branding'], description: "Write and perform political anthem verses." } },
  { id: 11, title: "Corporate Queens", format: 'STANDARD', participatingGroups: 'ALL', challenge: { name: "Corporate Presentations", type: ['comedy', 'branding'], description: "Host a drag awareness corporate seminar." } },
  { id: 12, title: "Bathroom Hunties", format: 'STANDARD', participatingGroups: 'ALL', challenge: { name: "Bathroom Design", type: ['design', 'comedy'], description: "Design an immersive bathroom experience." } },
  { id: 13, title: "Makeover", format: 'STANDARD', participatingGroups: 'ALL', challenge: { name: "Drag Fam Makeover", type: ['design', 'branding'], description: "Transform a dancer into your drag sister." } },
  { id: 14, title: "Booked and Blessed", format: 'STANDARD', participatingGroups: 'ALL', challenge: { name: "Memoir Branding", type: ['branding', 'comedy'], description: "Write and market your own memoir." } },
];

// Pre-assigned groups for S13 based on Ep 1 results to simplify simulation structure
// Group 1 = Winners Circle (+ Elliott), Group 2 = Porkchop Loading Dock (- Elliott)
const S13_QUEENS: Queen[] = [
  { id: 'symone', name: 'Symone', entranceLine: 'I\'m here!', imageUrl: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/7/74/Symone.jpg', group: 1, stats: { design: 7, comedy: 8, acting: 10, improv: 8, dance: 6, lipsync: 9, singing: 5, branding: 10 }, trackRecord: [], status: 'active' },
  { id: 'kandy', name: 'Kandy Muse', entranceLine: 'From the hood to Hollywood!', imageUrl: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/c/c0/KandyMuse.jpg', group: 1, stats: { design: 4, comedy: 8, acting: 7, improv: 6, dance: 6, lipsync: 9, singing: 5, branding: 9 }, trackRecord: [], status: 'active' },
  { id: 'gottmik', name: 'Gottmik', entranceLine: 'Time to crash the system.', imageUrl: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/1/16/Gottmik.jpg', group: 1, stats: { design: 10, comedy: 9, acting: 6, improv: 8, dance: 3, lipsync: 5, singing: 2, branding: 9 }, trackRecord: [], status: 'active' },
  { id: 'rose', name: 'Rosé', entranceLine: 'Coming up Rosé!', imageUrl: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/b/b6/Ros%C3%A9.jpg', group: 2, stats: { design: 7, comedy: 8, acting: 9, improv: 7, dance: 9, lipsync: 8, singing: 10, branding: 7 }, trackRecord: [], status: 'active' },
  { id: 'olivia', name: 'Olivia Lux', entranceLine: 'Light up the room!', imageUrl: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/a/a3/OliviaLux.jpg', group: 1, stats: { design: 7, comedy: 5, acting: 7, improv: 6, dance: 8, lipsync: 8, singing: 9, branding: 8 }, trackRecord: [], status: 'active' },
  { id: 'utica', name: 'Utica Queen', entranceLine: 'Don\'t pop the corn yet!', imageUrl: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/3/36/UticaQueen.jpg', group: 2, stats: { design: 10, comedy: 6, acting: 4, improv: 6, dance: 4, lipsync: 7, singing: 3, branding: 7 }, trackRecord: [], status: 'active' },
  { id: 'tina', name: 'Tina Burner', entranceLine: 'Turn it and burn it!', imageUrl: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/6/67/TinaBurner.jpg', group: 1, stats: { design: 5, comedy: 7, acting: 8, improv: 6, dance: 7, lipsync: 7, singing: 8, branding: 8 }, trackRecord: [], status: 'active' },
  { id: 'denali', name: 'Denali', entranceLine: 'Triple axel, double loop!', imageUrl: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/a/ad/Denali.jpg', group: 2, stats: { design: 7, comedy: 5, acting: 6, improv: 5, dance: 10, lipsync: 10, singing: 6, branding: 6 }, trackRecord: [], status: 'active' },
  { id: 'elliott', name: 'Elliott with 2 Ts', entranceLine: 'Double the T!', imageUrl: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/2/28/Elliottwith2Ts.jpg', group: 1, stats: { design: 6, comedy: 4, acting: 5, improv: 3, dance: 9, lipsync: 8, singing: 4, branding: 5 }, trackRecord: [], status: 'active' },
  { id: 'lala', name: 'LaLa Ri', entranceLine: 'Saint or sinner?', imageUrl: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/3/34/LaLaRi.jpg', group: 1, stats: { design: 2, comedy: 7, acting: 5, improv: 5, dance: 9, lipsync: 10, singing: 4, branding: 7 }, trackRecord: [], status: 'active' },
  { id: 'tamisha', name: 'Tamisha Iman', entranceLine: 'The legend has arrived.', imageUrl: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/4/4f/TamishaIman.jpg', group: 2, stats: { design: 8, comedy: 5, acting: 5, improv: 4, dance: 6, lipsync: 7, singing: 3, branding: 6 }, trackRecord: [], status: 'active' },
  { id: 'joey', name: 'Joey Jay', entranceLine: 'Filler queen? I don\'t think so.', imageUrl: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/e/e8/JoeyJay.jpg', group: 2, stats: { design: 4, comedy: 5, acting: 5, improv: 4, dance: 8, lipsync: 6, singing: 4, branding: 5 }, trackRecord: [], status: 'active' },
  { id: 'kahmora', name: 'Kahmora Hall', entranceLine: 'From the house of Hall!', imageUrl: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/e/ed/KahmoraHall.jpg', group: 2, stats: { design: 9, comedy: 2, acting: 2, improv: 2, dance: 3, lipsync: 4, singing: 2, branding: 6 }, trackRecord: [], status: 'active' },
];

const S13_EPISODES: Episode[] = [
  { id: 1, title: "The Pork Chop", format: 'LIPSYNC_TOURNAMENT', participatingGroups: 'ALL', challenge: { name: "Lip-Sync for Your Life", type: ['lipsync'], description: "Face-off in immediate Lip-Sync battles. Losers must vote one queen out." } },
  { id: 2, title: "Condragulations", format: 'TOP2_NOELIM', participatingGroups: [1], challenge: { name: "Condragulations Verses", type: ['dance', 'singing', 'branding'], description: "Write and perform verses to 'Condragulations' (Winners Circle)." } },
  { id: 3, title: "Phenomenon", format: 'TOP2_NOELIM', participatingGroups: [2], challenge: { name: "Phenomenon Verses", type: ['dance', 'singing', 'branding'], description: "Write and perform verses to 'Phenomenon' (B-Squad)." } },
  { id: 4, title: "RuPaulmark Channel", format: 'STANDARD', participatingGroups: 'ALL', challenge: { name: "RuPaulmark Acting", type: ['acting', 'comedy'], description: "Overact in cheesy holiday movies." } },
  { id: 5, title: "The Bag Ball", format: 'STANDARD', participatingGroups: 'ALL', challenge: { name: "The Bag Ball", type: ['design'], description: "Create looks from various types of bags." } },
  { id: 6, title: "Disco-mentary", format: 'STANDARD', participatingGroups: 'ALL', challenge: { name: "Disco Dance", type: ['dance'], description: "Perform in a disco-themed dance documentary." } },
  { id: 7, title: "Bossy Rossy RuBoot", format: 'STANDARD', participatingGroups: 'ALL', challenge: { name: "Bossy Rossy Improv", type: ['improv', 'comedy'], description: "Improvise on the trashy talk show Bossy Rossy." } },
  { id: 8, title: "Social Media Rusical", format: 'STANDARD', participatingGroups: 'ALL', challenge: { name: "Social Media Rusical", type: ['singing', 'dance', 'acting'], description: "Star in the 'Social Media' live musical." } },
  { id: 9, title: "Snatch Game", format: 'STANDARD', participatingGroups: 'ALL', challenge: { name: "Snatch Game", type: ['comedy', 'improv'], description: "Impersonate celebrities in the Snatch Game." } },
  { id: 10, title: "Freaky Friday Queens", format: 'STANDARD', participatingGroups: 'ALL', challenge: { name: "Makeover", type: ['design', 'branding'], description: "Makeover another queen into your drag doppelganger." } },
  { id: 11, title: "Pop! Goes the Queens", format: 'STANDARD', participatingGroups: 'ALL', challenge: { name: "Soda Branding", type: ['branding', 'comedy'], description: "Create and market your own soft drink brand." } },
  { id: 12, title: "Nice Girls Roast", format: 'STANDARD', participatingGroups: 'ALL', challenge: { name: "Roast", type: ['comedy'], description: "Perform a roast of Miss Congeniality winners." } },
  { id: 13, title: "Henny, I Shrunk the Queens!", format: 'STANDARD', participatingGroups: 'ALL', challenge: { name: "Sci-Fi Acting", type: ['acting'], description: "Star in the sci-fi adventure movie." } },
  { id: 14, title: "Gettin' Lucky", format: 'TOP2_NOELIM', participatingGroups: 'ALL', challenge: { name: "Lucky Verses", type: ['dance', 'singing'], description: "Write verses and perform in RuPaul's 'Lucky'." } },
];

const SEASONS: Record<string, Season> = {
  s16: { id: 's16', name: 'Season 16', queens: S16_QUEENS, episodes: S16_EPISODES, logoColor: 'from-pink-500 to-cyan-500' },
  s13: { id: 's13', name: 'Season 13', queens: S13_QUEENS, episodes: S13_EPISODES, logoColor: 'from-red-500 to-yellow-500' },
};

// --- HELPER COMPONENTS ---

const QueenImage = ({ url, name, className = "w-full h-full object-cover" }: { url: string, name: string, className?: string }) => {
  const [error, setError] = useState(false);
  if (error || !url) {
    return (
      <div className={`bg-gradient-to-br from-gray-200 to-gray-400 flex items-center justify-center text-gray-700 font-bold text-center p-1 leading-tight select-none ${className}`}>
        {name.split(' ')[0].slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return <img src={url} alt={name} className={className} onError={() => setError(true)} />;
};

const TrackRecordTable = ({ queens, episodeIdx, episodes }: { queens: Queen[], episodeIdx: number, episodes: Episode[] }) => {
  const sortedQueens = useMemo(() => {
    const active = queens.filter(q => q.status !== 'eliminated').sort((a, b) => {
       const score = (q: Queen) => q.trackRecord.filter(p => p === 'WIN' || p === 'TOP2').length * 3 +
                                  q.trackRecord.filter(p => p === 'HIGH').length * 2 -
                                  q.trackRecord.filter(p => p === 'BTM2' || p === 'LOW').length;
       return score(b) - score(a);
    });
    const eliminated = queens.filter(q => q.status === 'eliminated').sort((a, b) => (a.eliminatedEpisode || 0) - (b.eliminatedEpisode || 0));
    return [...active, ...eliminated.reverse()];
  }, [queens]);

  return (
    <div className="overflow-x-auto border rounded-sm shadow-sm bg-white">
      <table className="min-w-full text-xs border-collapse">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="px-2 py-2 text-left sticky left-0 bg-gray-100 z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Queen</th>
            {episodes.slice(0, episodeIdx).map((ep, i) => (
              <th key={i} className="px-1 py-2 text-center border-r min-w-[36px]">{ep.id}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedQueens.map(queen => (
            <tr key={queen.id} className="border-b h-10">
              <td className="px-2 py-1 font-bold sticky left-0 bg-white z-10 flex items-center gap-2 border-r h-full shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                 <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                     <QueenImage url={queen.imageUrl} name={queen.name} />
                 </div>
                 <div className="flex items-center gap-1">
                   {queen.status === 'winner' && <Crown size={12} className="text-yellow-500 flex-shrink-0" />}
                   <span className={`truncate ${queen.status === 'eliminated' ? 'text-gray-400 font-normal' : ''}`}>{queen.name}</span>
                 </div>
              </td>
              {episodes.slice(0, episodeIdx).map((_, i) => {
                const placement = queen.trackRecord[i] || ' ';
                return (
                  <td key={i} className={`px-1 py-1 text-center border-r font-bold text-[10px]`}>
                     <div className={`w-full h-full flex items-center justify-center rounded-sm ${PLACEMENT_COLORS[placement] || 'bg-white'}`}>
                       {placement === ' ' ? '' : placement}
                     </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- MAIN COMPONENT ---

export default function DragRaceSimulator() {
  const [phase, setPhase] = useState<Phase>('SEASON_SELECT');
  const [currentSeason, setCurrentSeason] = useState<Season>(SEASONS.s16);
  const [queens, setQueens] = useState<Queen[]>([]);
  const [episodeIndex, setEpisodeIndex] = useState(0);
  const [currentEvents, setCurrentEvents] = useState<{queen: Queen, event: typeof EVENTS_LIST[0]}[]>([]);
  const [simulatedPlacements, setSimulatedPlacements] = useState<Record<string, Placement>>({});
  const [lipSyncQueens, setLipSyncQueens] = useState<Queen[]>([]);
  const [winner, setWinner] = useState<Queen | null>(null);
  const [recentEliminated, setRecentEliminated] = useState<Queen | null>(null);
  const [performanceFeed, setPerformanceFeed] = useState<{queen: Queen, text: string, score: number}[]>([]);
  const [goHomeVotes, setGoHomeVotes] = useState<{voter: Queen, votedFor: Queen}[]>([]);

  const activeEpisode = useMemo(() => currentSeason.episodes[episodeIndex] || currentSeason.episodes[currentSeason.episodes.length - 1], [currentSeason, episodeIndex]);

  const participatingQueens = useMemo(() => {
     if (!activeEpisode) return [];
     return queens.filter(q => 
       q.status === 'active' && 
       (activeEpisode.participatingGroups === 'ALL' || activeEpisode.participatingGroups.includes(q.group))
     );
  }, [queens, activeEpisode]);

  const startSeason = (seasonId: string) => {
    const selectedSeason = SEASONS[seasonId];
    setCurrentSeason(selectedSeason);
    setQueens(selectedSeason.queens.map(q => ({...q, trackRecord: [], status: 'active', eliminatedEpisode: undefined, tempStatModifier: 0})));
    setEpisodeIndex(-1);
    setWinner(null);
    setPhase('ENTRANCES');
  };

  const startNextEpisode = () => {
    if (episodeIndex + 1 >= currentSeason.episodes.length) {
        setPhase('FINALE');
        return;
    }
    setEpisodeIndex(prev => prev + 1);
    setQueens(prev => prev.map(q => ({ ...q, tempStatModifier: 0 })));
    setGoHomeVotes([]);
    setPhase('EPISODE_INTRO');
  };

  const generateEvents = () => {
    if (activeEpisode.format === 'LIPSYNC_TOURNAMENT') {
        // Special case for S13 Porkchop: Skip events, go straight to "performance" (battles)
        setPhase('PERFORMANCE');
        return;
    }
    const numEvents = Math.max(2, Math.min(4, Math.floor(participatingQueens.length / 3)));
    const shuffled = [...participatingQueens].sort(() => 0.5 - Math.random());
    const newEvents = shuffled.slice(0, numEvents).map(q => ({ queen: q, event: EVENTS_LIST[Math.floor(Math.random() * EVENTS_LIST.length)] }));
    
    setCurrentEvents(newEvents);
    setQueens(prev => prev.map(q => {
       const ev = newEvents.find(e => e.queen.id === q.id);
       return ev ? { ...q, tempStatModifier: ev.event.modifier } : q;
    }));
    setPhase('EVENTS');
  };

  const startPerformance = () => {
      if (activeEpisode.format === 'LIPSYNC_TOURNAMENT') {
         // Mock performance feed for Lip Sync tournament
         const feed = participatingQueens.map(q => ({
             queen: q, 
             text: q.group === 1 ? "wins their lip-sync battle!" : "loses their lip-sync battle.",
             score: q.group === 1 ? 10 : 5
         }));
         setPerformanceFeed(feed);
         setPhase('PERFORMANCE');
         return;
      }

      const feed = participatingQueens.map(q => {
          let rawScore = 0;
          activeEpisode.challenge.type.forEach(stat => rawScore += q.stats[stat]);
          const score = (rawScore / activeEpisode.challenge.type.length) + ((Math.random() * 3) - 1.5) + (q.tempStatModifier || 0);
          const type = activeEpisode.challenge.type[0] || 'general';
          const pool = (score > 6.5 ? PERFORMANCE_FEEDBACK[type]?.good : PERFORMANCE_FEEDBACK[type]?.bad) || PERFORMANCE_FEEDBACK.general.good;
          return { queen: q, text: pool[Math.floor(Math.random() * pool.length)] || "performs on stage.", score };
      }).sort(() => 0.5 - Math.random());
      setPerformanceFeed(feed);
      setPhase('PERFORMANCE');
  };

  const runSimulation = () => {
    const scored = [...performanceFeed].sort((a, b) => b.score - a.score);
    const newPlacements: Record<string, Placement> = {};
    const count = scored.length;

    if (activeEpisode.format === 'LIPSYNC_TOURNAMENT') {
        scored.forEach(item => newPlacements[item.queen.id] = item.queen.group === 1 ? 'WIN' : 'LOW');
    } else if (activeEpisode.format === 'TOP2_NOELIM') {
       scored.forEach((q, i) => {
           if (i <= 1) newPlacements[q.queen.id] = 'TOP2';
           else if (i <= Math.ceil(count/3)) newPlacements[q.queen.id] = 'HIGH';
           else if (i >= count - Math.max(2, Math.floor(count/4))) newPlacements[q.queen.id] = 'LOW';
           else newPlacements[q.queen.id] = 'SAFE';
       });
    } else {
       scored.forEach((q, i) => {
          if (i === 0) newPlacements[q.queen.id] = 'WIN';
          else if (i <= Math.ceil(count/4)) newPlacements[q.queen.id] = 'HIGH';
          else if (i >= count - 2) newPlacements[q.queen.id] = 'BTM2';
          else if (i >= count - 3 && count > 6) newPlacements[q.queen.id] = 'LOW';
          else newPlacements[q.queen.id] = 'SAFE';
       });
    }
    setSimulatedPlacements(newPlacements);
    setPhase('CRITIQUES');
  };

  const askWhoShouldGoHome = () => {
      const targets = participatingQueens.filter(q => simulatedPlacements[q.id] === 'BTM2' || simulatedPlacements[q.id] === 'LOW');
      const validTargets = targets.length > 0 ? targets : participatingQueens;
      
      setGoHomeVotes(participatingQueens.map(voter => ({
          voter,
          votedFor: (voter.group === validTargets[0]?.group && validTargets.length > 1 && Math.random() > 0.3) 
              ? validTargets[1] || validTargets[0] // Try not to vote for own group if possible in early seasons, simplified logic
              : validTargets[Math.floor(Math.random() * validTargets.length)]
      })));
      setPhase('WHO_SHOULD_GO_HOME');
  }

  const confirmProducers = () => {
    if (activeEpisode.format === 'LIPSYNC_TOURNAMENT') {
        finalizeEpisode(); // Skip lipsync phase for tournament, it was the whole episode
        return;
    }

    const episodePlacements = participatingQueens.map(q => ({ id: q.id, placement: simulatedPlacements[q.id] }));
    const targetPlacement = activeEpisode.format === 'TOP2_NOELIM' ? 'TOP2' : 'BTM2';
    const candidates = episodePlacements.filter(p => p.placement === targetPlacement || (targetPlacement === 'TOP2' && p.placement === 'WIN'));
    
    if (candidates.length >= 2) {
       setLipSyncQueens(queens.filter(q => candidates.some(c => c.id === q.id)).slice(0, 2));
       setPhase('LIPSYNC');
    } else finalizeEpisode();
  };

  const finalizeEpisode = (lipSyncWinnerId?: string) => {
      setQueens(prev => prev.map(q => {
          if (q.status === 'eliminated') return q;
          if (!participatingQueens.some(pq => pq.id === q.id)) {
              return (q.trackRecord.length === episodeIndex) ? { ...q, trackRecord: [...q.trackRecord, ' '] } : q;
          }
          let p = simulatedPlacements[q.id];
          if (activeEpisode.format === 'TOP2_NOELIM') {
             if (q.id === lipSyncWinnerId) p = 'WIN';
             else if (p === 'WIN' && lipSyncWinnerId && q.id !== lipSyncWinnerId) p = 'TOP2';
          }
          return { ...q, trackRecord: [...q.trackRecord, p] };
      }));
      startNextEpisode();
  };

  const performLipSync = (winnerId: string) => {
      if (activeEpisode.format === 'TOP2_NOELIM') {
          finalizeEpisode(winnerId);
      } else {
          const loser = lipSyncQueens.find(q => q.id !== winnerId);
          if (loser) {
              setRecentEliminated(loser);
              setQueens(prev => prev.map(q => {
                  if (q.id === loser.id) return { ...q, status: 'eliminated', eliminatedEpisode: activeEpisode.id, trackRecord: [...q.trackRecord, 'ELIM'] };
                  if (participatingQueens.some(pq => pq.id === q.id) && q.trackRecord.length === episodeIndex) {
                       return { ...q, trackRecord: [...q.trackRecord, q.id === winnerId ? 'BTM2' : simulatedPlacements[q.id]] };
                  }
                  return (q.trackRecord.length === episodeIndex) ? { ...q, trackRecord: [...q.trackRecord, ' '] } : q;
              }));
              setPhase('ELIMINATION');
          }
      }
  };

  // --- RENDERERS ---

  if (phase === 'SEASON_SELECT') {
      return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
           <h1 className="text-5xl md:text-7xl font-black text-white mb-12 tracking-tighter uppercase text-center">
               <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500">Drag Race Simulator</span>
           </h1>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
               {Object.values(SEASONS).map(season => (
                   <button key={season.id} onClick={() => startSeason(season.id)} className="group relative overflow-hidden rounded-3xl aspect-video bg-gray-900 border-2 border-gray-800 hover:border-white transition-all">
                       <div className={`absolute inset-0 opacity-50 bg-gradient-to-br ${season.logoColor} group-hover:opacity-70 transition-opacity`} />
                       <div className="absolute inset-0 flex items-center justify-center">
                           <h2 className="text-4xl font-black text-white uppercase drop-shadow-xl tracking-widest">{season.name}</h2>
                       </div>
                       <div className="absolute bottom-4 right-4 flex gap-1">
                           {season.queens.slice(0, 4).map(q => (
                               <div key={q.id} className="w-10 h-10 rounded-full border-2 border-white/50 overflow-hidden">
                                   <QueenImage url={q.imageUrl} name={q.name} />
                               </div>
                           ))}
                       </div>
                   </button>
               ))}
           </div>
        </div>
      )
  }

  if (phase === 'ENTRANCES') {
      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white p-6">
           <h2 className="text-4xl font-black text-center mb-8 uppercase">{currentSeason.name} Cast</h2>
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 max-w-7xl mx-auto mb-24">
               {queens.map((q, i) => (
                   <div key={q.id} className="bg-white rounded-xl overflow-hidden shadow-md animate-in fade-in slide-in-from-bottom-4" style={{animationDelay: `${i*50}ms`, animationFillMode: 'backwards'}}>
                       <div className="aspect-[3/4] relative">
                           <QueenImage url={q.imageUrl} name={q.name} />
                           <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 p-3 pt-8">
                               <p className="text-white font-bold leading-none">{q.name}</p>
                           </div>
                       </div>
                       <div className="p-3 bg-gray-50 text-xs text-gray-600 italic truncate border-t">"{q.entranceLine}"</div>
                   </div>
               ))}
           </div>
           <div className="fixed bottom-8 inset-x-0 flex justify-center z-20">
               <button onClick={startNextEpisode} className="bg-black text-white px-10 py-4 rounded-full font-bold text-xl shadow-xl hover:scale-105 transition-all flex items-center gap-2">
                   START SEASON <Play fill="currentColor" size={18} />
               </button>
           </div>
        </div>
      )
  }

  if (phase === 'EPISODE_INTRO') {
      return (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 relative overflow-hidden">
              <div className={`absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${currentSeason.logoColor}`} />
              <div className="bg-white relative z-10 p-8 md:p-16 rounded-[2rem] shadow-2xl max-w-2xl w-full text-center animate-in zoom-in-95 duration-500">
                  <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-1.5 rounded-full font-bold mb-8 text-sm tracking-wider uppercase">
                      <Star size={14} className="text-yellow-400" /> Episode {activeEpisode.id}
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-4 leading-none tracking-tight">{activeEpisode.title}</h1>
                  <div className="w-20 h-1.5 bg-gray-200 mx-auto rounded-full mb-6" />
                  <h2 className="text-2xl font-bold text-pink-600 mb-4">{activeEpisode.challenge.name}</h2>
                  <p className="text-lg text-gray-600 mb-12 leading-relaxed">{activeEpisode.challenge.description}</p>
                  <button onClick={generateEvents} className="bg-pink-600 text-white px-12 py-4 rounded-full font-bold text-xl hover:scale-105 transition-transform shadow-lg w-full md:w-auto">
                      ENTER WERKROOM
                  </button>
              </div>
          </div>
      )
  }

  if (phase === 'EVENTS' || phase === 'PERFORMANCE') {
      return (
          <div className="min-h-screen bg-slate-950 flex flex-col items-center p-6 text-white relative pb-32">
              <div className="max-w-3xl w-full z-10 mt-8">
                  <h2 className="text-3xl font-black text-center mb-12 flex items-center justify-center gap-3 uppercase tracking-widest">
                      {phase === 'EVENTS' ? <><MessageCircle /> Werkroom Highlights</> : <><MicStage /> Main Stage</>}
                  </h2>
                  
                  <div className="space-y-4">
                      {(phase === 'EVENTS' ? currentEvents : performanceFeed).map((item, i) => (
                          <div key={i} className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex items-center gap-4 shadow-lg animate-in slide-in-from-right" style={{animationDelay: `${i * 150}ms`, animationFillMode: 'backwards'}}>
                              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-600 flex-shrink-0">
                                  <QueenImage url={item.queen.imageUrl} name={item.queen.name} />
                              </div>
                              <div className="flex-grow">
                                  <span className="font-bold text-pink-400 text-lg mr-2">{item.queen.name}</span>
                                  <span className="text-slate-300 leading-tight">{'event' in item ? item.event.text : item.text}</span>
                              </div>
                              {'event' in item && (
                                  <div className="text-slate-500">
                                      {item.event.type === 'drama' ? <HeartCrack className="text-red-400" /> : 
                                       item.event.type === 'positive' ? <Sparkles className="text-yellow-400" /> : <Zap className="text-blue-400" />}
                                  </div>
                              )}
                              {'score' in item && activeEpisode.format !== 'LIPSYNC_TOURNAMENT' && (
                                  <div className="text-slate-500">
                                      {item.score > 6.5 ? <ThumbsUp size={18} className="text-green-500" /> : <ThumbsDown size={18} className="text-red-500" />}
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
              <div className="fixed bottom-8 z-20">
                 <button onClick={phase === 'EVENTS' ? startPerformance : runSimulation} className="bg-white text-slate-950 px-10 py-4 rounded-full font-bold text-xl hover:scale-105 transition-all shadow-xl flex items-center gap-2">
                     {phase === 'EVENTS' ? <>HEAD TO MAIN STAGE <ArrowDown /></> : <>JUDGES CRITIQUES <Users /></>}
                 </button>
              </div>
          </div>
      )
  }

  if (phase === 'CRITIQUES' || phase === 'WHO_SHOULD_GO_HOME') {
      return (
          <div className={`min-h-screen ${phase === 'CRITIQUES' ? 'bg-pink-50' : 'bg-red-950'} p-6 flex flex-col items-center pb-32 transition-colors duration-500`}>
              {phase === 'CRITIQUES' ? (
                  <>
                      <h2 className="text-4xl font-black text-center mb-10 text-pink-900 uppercase">Judges Critiques</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl w-full">
                          {participatingQueens.filter(q => ['WIN','TOP2','HIGH','LOW','BTM2'].includes(simulatedPlacements[q.id]!)).map(q => (
                              <div key={q.id} className="bg-white p-4 rounded-2xl shadow-md flex items-center gap-4 border border-pink-100">
                                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                                      <QueenImage url={q.imageUrl} name={q.name} />
                                  </div>
                                  <div>
                                      <h3 className="font-bold text-lg">{q.name}</h3>
                                      <span className={`text-xs font-bold px-2 py-1 rounded ${PLACEMENT_COLORS[simulatedPlacements[q.id]!]}`}>
                                          {simulatedPlacements[q.id] === 'TOP2' ? 'TOP 2' : simulatedPlacements[q.id]}
                                      </span>
                                  </div>
                              </div>
                          ))}
                      </div>
                      <div className="fixed bottom-8 flex gap-4 z-20">
                          {activeEpisode.format === 'STANDARD' && (
                              <button onClick={askWhoShouldGoHome} className="bg-red-600 text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform shadow-lg flex items-center gap-2">
                                  <Skull size={18} /> WHO SHOULD GO HOME?
                              </button>
                          )}
                          <button onClick={() => setPhase('PRODUCERS')} className="bg-gray-900 text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform shadow-lg flex items-center gap-2">
                              <Edit size={18} /> DELIBERATE
                          </button>
                      </div>
                  </>
              ) : (
                  <>
                      <Siren size={50} className="text-red-500 mb-6 animate-pulse" />
                      <h2 className="text-4xl font-black text-center text-white mb-12 uppercase drop-shadow-lg">Who Should Go Home?</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl w-full">
                          {goHomeVotes.map((vote, i) => (
                              <div key={i} className="bg-black/40 backdrop-blur-md border border-red-500/30 p-3 rounded-xl flex items-center justify-between text-white animate-in slide-in-from-bottom" style={{animationDelay: `${i*100}ms`, animationFillMode: 'backwards'}}>
                                  <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-red-500/50"><QueenImage url={vote.voter.imageUrl} name={vote.voter.name} /></div>
                                      <span className="font-bold">{vote.voter.name}</span>
                                  </div>
                                  <div className="text-red-300 italic text-sm px-2">votes for</div>
                                  <div className="flex items-center gap-3 flex-row-reverse">
                                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/70"><QueenImage url={vote.votedFor.imageUrl} name={vote.votedFor.name} /></div>
                                      <span className="font-black uppercase">{vote.votedFor.name}</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                      <div className="fixed bottom-8 z-20">
                          <button onClick={() => setPhase('PRODUCERS')} className="bg-white text-red-950 px-12 py-4 rounded-full font-black text-xl hover:scale-105 transition-all shadow-[0_0_25px_rgba(255,0,0,0.3)]">
                              BRING BACK MY GIRLS
                          </button>
                      </div>
                  </>
              )}
          </div>
      )
  }

  if (phase === 'PRODUCERS') {
      return (
          <div className="min-h-screen bg-gray-50 p-4 lg:p-8 pb-32">
              <div className="max-w-7xl mx-auto bg-white p-6 rounded-2xl shadow-sm mb-8 sticky top-4 z-30 flex justify-between items-center border-b-4 border-purple-500">
                  <h2 className="text-2xl font-black flex items-center gap-2"><Edit className="text-purple-500" /> Producers Room</h2>
                  <button onClick={confirmProducers} className="bg-green-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-600 transition-colors shadow-md">
                      <Save size={18} /> CONFIRM PLACEMENTS
                  </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {participatingQueens.map(q => (
                          <div key={q.id} className="bg-white p-3 rounded-xl shadow-sm border flex items-center gap-3">
                              <div className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0 border">
                                  <QueenImage url={q.imageUrl} name={q.name} />
                              </div>
                              <div className="flex-grow min-w-0">
                                  <h3 className="font-bold truncate">{q.name}</h3>
                                  <select 
                                      className={`mt-1 w-full font-bold text-xs p-1.5 rounded border cursor-pointer ${PLACEMENT_COLORS[simulatedPlacements[q.id] || 'SAFE']}`}
                                      value={simulatedPlacements[q.id] || 'SAFE'}
                                      onChange={(e) => setSimulatedPlacements(prev => ({...prev, [q.id]: e.target.value as Placement}))}
                                  >
                                      <option value="WIN">WIN</option><option value="TOP2">TOP2</option><option value="HIGH">HIGH</option>
                                      <option value="SAFE">SAFE</option><option value="LOW">LOW</option><option value="BTM2">BTM2</option>
                                  </select>
                              </div>
                          </div>
                      ))}
                  </div>
                  <div>
                      <div className="bg-white p-4 rounded-xl shadow-sm overflow-hidden sticky top-28">
                          <h3 className="font-bold text-gray-700 mb-3 uppercase tracking-wider text-sm border-b pb-2">Track Record</h3>
                          <TrackRecordTable queens={queens} episodeIdx={episodeIndex} episodes={currentSeason.episodes} />
                      </div>
                  </div>
              </div>
          </div>
      )
  }

  if (phase === 'LIPSYNC' || phase === 'ELIMINATION') {
      const isWin = activeEpisode.format === 'TOP2_NOELIM';
      return (
          <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-white ${phase === 'ELIMINATION' ? 'bg-black' : isWin ? 'bg-cyan-900' : 'bg-red-900'}`}>
              {phase === 'LIPSYNC' ? (
                  <>
                      <h2 className="text-4xl md:text-6xl font-black text-center mb-12 uppercase leading-none">
                          Lip Sync For {isWin ? 'The Win' : 'Your Life'}
                      </h2>
                      <div className="flex flex-col md:flex-row gap-8 items-center">
                          {lipSyncQueens.map(q => (
                              <div key={q.id} className="flex flex-col items-center group">
                                  <div className={`w-64 h-80 rounded-2xl overflow-hidden border-4 ${isWin ? 'border-cyan-400' : 'border-red-500'} shadow-2xl transition-transform group-hover:scale-105`}>
                                      <QueenImage url={q.imageUrl} name={q.name} />
                                  </div>
                                  <button onClick={() => performLipSync(q.id)} className="mt-6 bg-white text-black px-8 py-3 rounded-full font-black text-xl hover:scale-110 transition-transform">
                                      {isWin ? 'WINNER' : 'SHANTAY'}
                                  </button>
                              </div>
                          ))}
                      </div>
                  </>
              ) : (
                  <div className="flex flex-col items-center animate-in zoom-in duration-700">
                      <div className="w-64 h-64 rounded-full overflow-hidden grayscale border-4 border-gray-800 mb-8 shadow-2xl">
                          {recentEliminated && <QueenImage url={recentEliminated.imageUrl} name={recentEliminated.name} />}
                      </div>
                      <h2 className="text-6xl font-black mb-4">{recentEliminated?.name}</h2>
                      <p className="text-2xl opacity-60 italic mb-12">sashay away...</p>
                      <button onClick={startNextEpisode} className="bg-white text-black px-10 py-3 rounded-full font-bold text-lg hover:scale-105 transition-transform">
                          CONTINUE
                      </button>
                  </div>
              )}
          </div>
      )
  }

  if (phase === 'FINALE') {
      return (
          <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-400 via-orange-500 to-purple-900 flex flex-col items-center p-6 text-white overflow-y-auto">
              {!winner ? (
                  <div className="my-auto flex flex-col items-center">
                      <Crown size={80} className="text-yellow-300 mb-6 drop-shadow-[0_0_25px_rgba(253,224,71,0.6)]" />
                      <h1 className="text-6xl font-black mb-16 text-center drop-shadow-xl">GRAND FINALE</h1>
                      <div className="flex flex-wrap justify-center gap-6 mb-16 max-w-5xl">
                          {queens.filter(q => q.status === 'active').map(q => (
                              <div key={q.id} className="flex flex-col items-center">
                                  <div className="w-36 h-48 rounded-xl overflow-hidden border-4 border-yellow-400 shadow-2xl">
                                      <QueenImage url={q.imageUrl} name={q.name} />
                                  </div>
                                  <p className="mt-4 font-black text-xl uppercase drop-shadow-md">{q.name}</p>
                              </div>
                          ))}
                      </div>
                      <button onClick={() => {
                          const active = queens.filter(q => q.status === 'active');
                          const win = active[Math.floor(Math.random() * active.length)];
                          setWinner(win);
                          setQueens(prev => prev.map(q => q.id === win.id ? { ...q, status: 'winner', trackRecord: [...q.trackRecord, 'WIN'] } : q));
                      }} className="bg-white text-purple-900 px-16 py-5 rounded-full text-2xl font-black shadow-2xl hover:scale-105 transition-transform flex items-center gap-3">
                          CROWN A WINNER
                      </button>
                  </div>
              ) : (
                  <div className="flex flex-col items-center w-full mt-12 animate-in zoom-in duration-1000">
                      <h1 className="text-8xl font-black mb-8 drop-shadow-2xl tracking-tighter text-yellow-300">WINNER</h1>
                      <div className="w-80 h-80 rounded-full overflow-hidden border-[10px] border-yellow-300 shadow-[0_0_60px_rgba(253,224,71,0.5)] mb-8">
                          <QueenImage url={winner.imageUrl} name={winner.name} />
                      </div>
                      <h2 className="text-6xl font-black mb-16 uppercase tracking-widest">{winner.name}</h2>
                      <div className="bg-white/95 text-gray-900 p-8 rounded-3xl w-full max-w-6xl shadow-2xl mb-16">
                          <h3 className="font-black mb-6 text-2xl uppercase text-center">Final Track Record</h3>
                          <TrackRecordTable queens={queens} episodeIdx={currentSeason.episodes.length} episodes={currentSeason.episodes} />
                      </div>
                      <button onClick={() => setPhase('SEASON_SELECT')} className="mb-24 bg-black text-white px-10 py-4 rounded-full font-bold text-xl flex items-center gap-3 hover:scale-105 transition-transform">
                          <RefreshCw /> START NEW SEASON
                      </button>
                  </div>
              )}
          </div>
      )
  }

  return null;
}
