import React, { useState, useRef } from 'react';
import { Volume2, Play, AlertCircle, Music, X, ChevronRight } from 'lucide-react';

export default function IslamicTicker() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState('001_afs');
  const [audioError, setAudioError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const audioRef = useRef(null);

  const ALL_SURAHS_LIST = [
    "আল-ফাতেহা", "আল-বাক্বারা", "আল-ইমরান", "আন-নিসা", "আল-মায়েদা", "আল-আনআম", "আল-আরাফ", "আল-আনফাল", "আত-তাওবাহ", "ইউনুস",
    "হুদ", "ইউসুফ", "আর-রা'দ", "ইব্রাহীম", "আল-হিজর", "আন-নহল", "বনী ইসরাঈল", "আল-কাহফ", "মারইয়াম", "ত্বোয়া-হা",
    "আল-আম্বিয়া", "আল-হজ্জ", "আল-মুমিনূন", "আন-নূর", "আল-ফুরকান", "আশ-শুআরা", "আন-নামল", "আল-কাসাস", "আল-আনকাবূত", "আর-রূম",
    "লোকমান", "আস-সাজদাহ", "আল-আহজাব", "সাবা", "ফাতির", "ইয়াছিন", "আস-ফফাত", "সোয়াদ", "আজ-জুমার", "গাফির",
    "ফুসসিলাত", "আশ-শুরা", "আজ-জুখরুফ", "আদ-দুখান", "আল-জাসিয়াহ", "আল-আহকাফ", "মুহাম্মদ", "আল-ফাতহ", "আল-হুজুরাত", "ক্বাফ",
    "আজ-জারিয়াত", "আত-তূর", "আন-নাজম", "আল-কামার", "আর-রহমান", "আল-ওয়াক্বিয়াহ", "আল-হাদীদ", "আল-মুজাদালাহ", "আল-হাশর", "আল-মুমতাহিনাহ",
    "আস-সফ", "আল-জুমুআহ", "আল-মুনাফিকূন", "আত-তাগাবুন", "আত-ত্বলাক", "আত-তাহরীম", "আল-মূল্‌ক", "আল-কলম", "আল-হাক্কাহ", "আল-মাআরিজ",
    "নূহ", "আল-জিন", "আল-মুযযামমিল", "আল-মুদ্দাসসির", "আল-কিয়ামাহ", "আল-ইনসান", "আল-মুরসালাত", "আন-নাবা", "আন-নাজিআত", "আবাসা",
    "আত-তাকবীর", "আল-ইনফিতার", "আল-মুত্বাফফিফীন", "আল-ইনশিকাক", "আল-বুরূজ", "আত-ত্বারিক", "আল-আলা", "আল-গাশিয়াহ", "আল-ফজর", "আল-বালাদ",
    "আশ-শামস", "আল-লাইল", "আদ-দুহা", "আলাম নাশরাহ", "আত-তীন", "আল-আলাক", "আল-কদর", "আল-বায়্যিনাহ", "আর-জিলজাল", "আল-আদিয়াত",
    "আল-কারিয়াহ", "আত-তাকাসুর", "আল-আসর", "আল-হুমাযাহ", "আল-ফীল", "কুরাইশ", "আল-মাউন", "আল-কাউসার", "আল-কাফিরূন", "আন-নাসর",
    "আল-লাহাব", "আল-ইখলাস", "আল-ফালাক", "আন-নাস"
  ];

  const all114SurahOptions = ALL_SURAHS_LIST.map((name, index) => {
    const num = index + 1;
    const paddedId = String(num).padStart(3, '0');
    const bnNum = String(num).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
    return {
      id: `all_${paddedId}_afs`,
      category: 'AllSurahs',
      name: `${bnNum}. সূরা ${name} — মিশারী রশিদ`,
      url: `https://server8.mp3quran.net/afs/${paddedId}.mp3`
    };
  });

  const surahOptions = [
    // ── 🌟 জনপ্রিয় ও ফজিলতপূর্ণ সূরাসমূহ ──
    { id: '001_afs', category: 'Surahs', name: '🌙 সূরা ফাতেহা — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/001.mp3' },
    { id: '002_afs', category: 'Surahs', name: '🌙 সূরা আল-বাক্বারা — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/002.mp3' },
    { id: '018_afs', category: 'Surahs', name: '🌙 সূরা আল-কাহফ — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/018.mp3' },
    { id: '036_afs', category: 'Surahs', name: '🌙 সূরা ইয়াছিন — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/036.mp3' },
    { id: '055_afs', category: 'Surahs', name: '🌙 সূরা আর-রহমান — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/055.mp3' },
    { id: '056_afs', category: 'Surahs', name: '🌙 সূরা আল-ওয়াক্বিয়াহ — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/056.mp3' },
    { id: '067_afs', category: 'Surahs', name: '🌙 সূরা আল-মূল্‌ক — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/067.mp3' },
    { id: '112_afs', category: 'Surahs', name: '🌙 সূরা আল-ইখলাস — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/112.mp3' },
    { id: '001_sds', category: 'Surahs', name: '🕌 সূরা ফাতেহা — সুদায়েস (কা\'বা)', url: 'https://server11.mp3quran.net/sds/001.mp3' },
    { id: '036_sds', category: 'Surahs', name: '🕌 সূরা ইয়াছিন — সুদায়েস (কা\'বা)', url: 'https://server11.mp3quran.net/sds/036.mp3' },

    // ── 📖 সম্পূর্ণ ৩০ পারা তেলাওয়াত (All 30 Paras / Juz 1 to 30) ──
    { id: 'para_1', category: 'Paras', name: '📖 ১ম পারা (আলিফ লাম মীম) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/001.mp3' },
    { id: 'para_2', category: 'Paras', name: '📖 ২য় পারা (ছাইয়াকুল) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/002.mp3' },
    { id: 'para_3', category: 'Paras', name: '📖 ৩য় পারা (তিলকার রুছুল) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/003.mp3' },
    { id: 'para_4', category: 'Paras', name: '📖 ৪র্থ পারা (লান তেনালু) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/004.mp3' },
    { id: 'para_5', category: 'Paras', name: '📖 ৫ম পারা (ওয়াল মুহছানাত) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/005.mp3' },
    { id: 'para_6', category: 'Paras', name: '📖 ৬ষ্ঠ পারা (লা ইউহিব্বুল্লাহ) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/006.mp3' },
    { id: 'para_7', category: 'Paras', name: '📖 ৭ম পারা (ওয়া ইজা ছামিঊ) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/007.mp3' },
    { id: 'para_8', category: 'Paras', name: '📖 ৮ম পারা (ওয়া লাউ আন্নানা) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/008.mp3' },
    { id: 'para_9', category: 'Paras', name: '📖 ৯ম পারা (ক্বাল আল-মালাউ) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/009.mp3' },
    { id: 'para_10', category: 'Paras', name: '📖 ১০ম পারা (ওয়া\'লামূ) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/010.mp3' },
    { id: 'para_11', category: 'Paras', name: '📖 ১১শ পারা (ইয়া\'তাজিরূনা) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/011.mp3' },
    { id: 'para_12', category: 'Paras', name: '📖 ১২শ পারা (ওয়া মা মিন দাব্বাহ) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/012.mp3' },
    { id: 'para_13', category: 'Paras', name: '📖 ১৩শ পারা (ওয়া মা উবার্‌রিউ) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/013.mp3' },
    { id: 'para_14', category: 'Paras', name: '📖 ১৪শ পারা (রুবামাও) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/014.mp3' },
    { id: 'para_15', category: 'Paras', name: '📖 ১৫শ পারা (সুবহানাল্লাজি) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/015.mp3' },
    { id: 'para_16', category: 'Paras', name: '📖 ১৬শ পারা (ক্বালা আলাম) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/016.mp3' },
    { id: 'para_17', category: 'Paras', name: '📖 ১৭শ পারা (ইক্বতারাবা লিন্নাস) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/017.mp3' },
    { id: 'para_18', category: 'Paras', name: '📖 ১৮শ পারা (ক্বাদ অফলাহা) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/018.mp3' },
    { id: 'para_19', category: 'Paras', name: '📖 ১৯শ পারা (ওয়া ক্বাল আল্লাজিনা) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/019.mp3' },
    { id: 'para_20', category: 'Paras', name: '📖 ২০শ পারা (আম্মান খালাক্বা) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/020.mp3' },
    { id: 'para_21', category: 'Paras', name: '📖 ২১শ পারা (উতলু মা ওহিয়া) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/021.mp3' },
    { id: 'para_22', category: 'Paras', name: '📖 ২২শ পারা (ওয়া মাঁই ইয়াক্বনুত) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/022.mp3' },
    { id: 'para_23', category: 'Paras', name: '📖 ২৩শ পারা (ওয়া মা লিইয়া) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/023.mp3' },
    { id: 'para_24', category: 'Paras', name: '📖 ২৪শ পারা (ফামান আজলামু) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/024.mp3' },
    { id: 'para_25', category: 'Paras', name: '📖 ২৫শ পারা (ইলাইহি ইউরাদ্দু) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/025.mp3' },
    { id: 'para_26', category: 'Paras', name: '📖 ২৬শ পারা (হা-মীম) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/026.mp3' },
    { id: 'para_27', category: 'Paras', name: '📖 ২৭শ পারা (ক্বালা ফামা খাতবুকুম) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/027.mp3' },
    { id: 'para_28', category: 'Paras', name: '📖 ২৮শ পারা (ক্বাদ সামিআল্লাহ) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/028.mp3' },
    { id: 'para_29', category: 'Paras', name: '📖 ২৯শ পারা (তাবারাকাল্লাজি) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/029.mp3' },
    { id: 'para_30', category: 'Paras', name: '📖 ৩০শ পারা (আম্মা ইয়াতাসাআলূন) — মিশারী রশিদ', url: 'https://server8.mp3quran.net/afs/030.mp3' },

    // ── 🕌 পবিত্র কোরআনের ১১৪টি সূরা (Surah 1 to 114) ──
    ...all114SurahOptions
  ];

  const currentSurah = surahOptions.find(s => s.id === selectedSurah) || surahOptions[0];

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      setIsLoading(false);
    } else {
      setAudioError(false);
      setIsLoading(true);
      const promise = audio.play();
      if (promise !== undefined) {
        promise
          .then(() => { setIsPlaying(true); setIsLoading(false); })
          .catch(err => { console.error(err); setAudioError(true); setIsPlaying(false); setIsLoading(false); });
      }
    }
  };

  const handleSurahChange = (surahId) => {
    setSelectedSurah(surahId);
    setIsPlaying(false);
    setIsLoading(false);
    setAudioError(false);
    const newSurah = surahOptions.find(s => s.id === surahId);
    if (audioRef.current && newSurah) {
      audioRef.current.pause();
      audioRef.current.src = newSurah.url;
      audioRef.current.load();
      setIsLoading(true);
      audioRef.current.play()
        .then(() => { setIsPlaying(true); setIsLoading(false); })
        .catch(err => { console.error(err); setAudioError(true); setIsPlaying(false); setIsLoading(false); });
    }
  };

  return (
    <>
      {/* Hidden Audio Element — always present in DOM */}
      <audio
        ref={audioRef}
        key={currentSurah.url}
        src={currentSurah.url}
        preload="metadata"
        onEnded={() => { setIsPlaying(false); setIsLoading(false); }}
        onError={() => { setAudioError(true); setIsPlaying(false); setIsLoading(false); }}
      />

      {/* Floating Toggle Tab — always visible on right edge, positioned below header */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="no-print"
        title={isOpen ? 'Hide Quran Player' : 'Show Quran Player'}
        style={{
          position: 'fixed',
          right: isOpen ? '264px' : '0px',
          top: '220px',
          zIndex: 200,
          background: isPlaying
            ? 'linear-gradient(180deg, #059669 0%, #047857 100%)'
            : 'linear-gradient(180deg, #064e3b 0%, #065f46 100%)',
          border: '1px solid rgba(52,211,153,0.6)',
          borderRight: isOpen ? 'none' : '1px solid rgba(52,211,153,0.6)',
          borderRadius: '6px 0 0 6px',
          color: '#a7f3d0',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          padding: '8px 3px',
          width: '22px',
          minHeight: '65px',
          boxShadow: isPlaying
            ? '0 0 15px rgba(5,150,105,0.6), -3px 0 12px rgba(0,0,0,0.3)'
            : '-3px 0 12px rgba(0,0,0,0.4)',
          transition: 'right 0.35s cubic-bezier(0.4,0,0.2,1), background 0.2s ease, box-shadow 0.2s ease',
          writingMode: 'vertical-rl'
        }}
      >
        {isPlaying ? (
          <Volume2 size={13} color="#34d399" style={{ flexShrink: 0 }} />
        ) : (
          <Music size={13} color="#6ee7b7" style={{ flexShrink: 0 }} />
        )}
        <span style={{
          fontSize: '11px',
          fontWeight: '800',
          letterSpacing: '0.05em',
          color: isPlaying ? '#a7f3d0' : '#6ee7b7',
          textTransform: 'uppercase',
        }}>
          {isPlaying ? 'তেলাওয়াত' : 'কুরআন'}
        </span>
        <ChevronRight
          size={12}
          color="#6ee7b7"
          style={{
            transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.3s ease',
            flexShrink: 0
          }}
        />
      </button>

      {/* Slide-in Panel */}
      <div
        className="no-print"
        style={{
          position: 'fixed',
          right: isOpen ? '0px' : '-264px',
          top: '180px',
          width: '264px',
          zIndex: 199,
          background: 'linear-gradient(160deg, #064e3b 0%, #022c22 60%, #014035 100%)',
          border: '1px solid rgba(52,211,153,0.45)',
          borderRight: 'none',
          borderRadius: '16px 0 0 16px',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.5), inset 1px 0 0 rgba(255,255,255,0.06)',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          transition: 'right 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Panel Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px', height: '32px',
              background: 'rgba(52,211,153,0.2)',
              borderRadius: '8px',
              border: '1px solid rgba(52,211,153,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Music size={16} color="#34d399" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#ecfdf5', lineHeight: 1 }}>কুরআন তেলাওয়াত</div>
              <div style={{ fontSize: '10px', color: '#6ee7b7', fontWeight: '600', marginTop: '2px' }}>Online Quran Recitation</div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#6ee7b7', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Surah & Para Selector with Grouping */}
        <div>
          <label style={{ fontSize: '10px', fontWeight: '700', color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
            সূরা ও পারা নির্বাচন
          </label>
          <select
            value={selectedSurah}
            onChange={(e) => handleSurahChange(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(4,46,35,0.8)',
              color: '#ffffff',
              border: '1px solid rgba(52,211,153,0.45)',
              borderRadius: '10px',
              padding: '8px 10px',
              fontSize: '12px',
              fontWeight: '600',
              outline: 'none',
              cursor: 'pointer',
            }}
            title="Select Quran Surah & Reciter"
          >
            <optgroup label="🌟 জনপ্রিয় সূরাসমূহ" style={{ background: '#042f2e', color: '#34d399' }}>
              {surahOptions.filter(s => s.category === 'Surahs').map(s => (
                <option key={s.id} value={s.id} style={{ background: '#042f2e', color: '#ffffff' }}>{s.name}</option>
              ))}
            </optgroup>
            <optgroup label="📖 ৩০ পারা সম্পূর্ণ তেলাওয়াত (All 30 Paras)" style={{ background: '#042f2e', color: '#fbbf24' }}>
              {surahOptions.filter(s => s.category === 'Paras').map(s => (
                <option key={s.id} value={s.id} style={{ background: '#042f2e', color: '#ffffff' }}>{s.name}</option>
              ))}
            </optgroup>
            <optgroup label="🕌 পবিত্র কোরআনের ১১৪টি সূরা (১-১১৪)" style={{ background: '#042f2e', color: '#6ee7b7' }}>
              {surahOptions.filter(s => s.category === 'AllSurahs').map(s => (
                <option key={s.id} value={s.id} style={{ background: '#042f2e', color: '#ffffff' }}>{s.name}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Now Playing Info */}
        <div style={{
          background: 'rgba(0,0,0,0.25)',
          borderRadius: '10px',
          padding: '10px 12px',
          border: '1px solid rgba(52,211,153,0.2)'
        }}>
          <div style={{ fontSize: '10px', color: '#6ee7b7', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
            {isPlaying ? '▶ Now Playing' : 'Selected Track'}
          </div>
          <div style={{ fontSize: '12px', color: '#ecfdf5', fontWeight: '600', lineHeight: '1.4' }}>
            {currentSurah.name}
          </div>
        </div>

        {/* Play/Pause Button */}
        <button
          onClick={toggleAudio}
          style={{
            width: '100%',
            background: isPlaying
              ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
            border: `1px solid ${isPlaying ? '#34d399' : 'rgba(52,211,153,0.4)'}`,
            color: '#ffffff',
            borderRadius: '12px',
            padding: '11px 14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: '800',
            transition: 'all 0.2s ease',
            boxShadow: isPlaying ? '0 0 20px rgba(16,185,129,0.5)' : 'none',
            letterSpacing: '0.02em'
          }}
          title={isPlaying ? 'Pause Quran Tilawat' : 'Play Online Quran Tilawat'}
        >
          {isPlaying ? (
            <> <Volume2 size={16} /> <span>তেলাওয়াত বন্ধ করুন</span> </>
          ) : isLoading ? (
            <> <Play size={16} /> <span>লোড হচ্ছে...</span> </>
          ) : (
            <> <Play size={16} /> <span>তেলাওয়াত শুরু করুন</span> </>
          )}
        </button>

        {/* Live indicator */}
        {isPlaying && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#34d399',
              boxShadow: '0 0 8px #34d399',
              animation: 'pulse 1.5s infinite',
              display: 'inline-block'
            }} />
            <span style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: '700' }}>LIVE — অনলাইন তেলাওয়াত চলছে</span>
          </div>
        )}

        {/* Error */}
        {audioError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '8px', padding: '8px 10px' }}>
            <AlertCircle size={14} color="#fca5a5" />
            <span style={{ fontSize: '11px', color: '#fca5a5', fontWeight: '600' }}>অনলাইন অডিও লোড হয়নি</span>
          </div>
        )}
      </div>

      {/* Pulse keyframe */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </>
  );
}
