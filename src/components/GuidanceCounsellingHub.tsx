'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  GraduationCap,
  HeartHandshake,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { ALL_GRADE_KEYS, formatGradeLabel } from '@/lib/material-utils';
import { AdSlot, useMonetization } from '@/components/MonetizationEngine';
import type { CounsellingMessage, CounsellingRole } from '@/lib/counselling';

const PARENT_TOPICS = [
  'My child has lost motivation to study and revise at home',
  'How do I manage phone, TV & social media screen time peacefully?',
  'Helping my child overcome KPSEA / KJSEA exam anxiety',
  'How do we choose the right Grade 10 Senior School pathway?',
  'Communicating with my teenager without constant arguments',
];

const LEARNER_TOPICS = [
  'I feel anxious and overwhelmed about upcoming exams',
  'How can I improve in Mathematics and Science subjects?',
  'Help me choose my Senior School pathway and future career',
  'How do I handle peer pressure and choose good friends?',
  'Help me build a realistic daily study timetable I can stick to',
];

function renderFormattedText(text: string) {
  const lines = text.split(/\r?\n/);
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-2" />;

    const isBullet = /^[-•*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed);
    const cleanLine = trimmed.replace(/^[-•*]\s+/, '');

    // Bold segments **...**
    const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
    const renderedParts = parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-extrabold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });

    if (isBullet) {
      return (
        <div key={i} className="flex items-start gap-2 pl-1 py-0.5">
          <span className="text-emerald-600 font-black mt-0.5">•</span>
          <span>{renderedParts}</span>
        </div>
      );
    }

    return (
      <p key={i} className="leading-relaxed">
        {renderedParts}
      </p>
    );
  });
}

export default function GuidanceCounsellingHub({
  externalTriggerCount = 0,
}: {
  externalTriggerCount?: number;
}) {
  const { trackInteraction } = useMonetization();
  const [isOpen, setIsOpen] = useState(false);
  // Role starts null EVERY time the user clicks the button so it IMMEDIATELY asks Parent vs Learner
  const [role, setRole] = useState<CounsellingRole | null>(null);
  const [gradeKey, setGradeKey] = useState<string>('All');
  const [messages, setMessages] = useState<CounsellingMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const openCounsellingModal = () => {
    trackInteraction('counselling_button_open');
    setRole(null); // Always ask if Parent or Learner immediately upon opening!
    setMessages([]);
    setInputText('');
    setIsOpen(true);
  };

  useEffect(() => {
    if (externalTriggerCount > 0) {
      openCounsellingModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalTriggerCount]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSelectRole = (chosen: CounsellingRole) => {
    trackInteraction(
      chosen === 'PARENT' ? 'counselling_role_parent' : 'counselling_role_learner'
    );
    setRole(chosen);
    const welcomeText =
      chosen === 'PARENT'
        ? 'Welcome, **Parent / Guardian**! Tell me what is on your mind regarding your child’s studies, behaviour, confidence, screen habits, or CBC pathway — or tap one of the quick topics below for an instant response.'
        : 'Welcome, **Learner**! Remember: **Be Alive, You Are Special.** Share anything on your mind — exams, tough subjects, career pathways, friendships, or study focus — or tap a topic below and I will guide you right away!';
    setMessages([{ sender: 'counsellor', text: welcomeText }]);
  };

  const sendPrompt = async (rawPrompt: string) => {
    const trimmed = rawPrompt.trim();
    if (!trimmed || !role || isGenerating) return;

    trackInteraction('counselling_message_sent');
    const nextMessages: CounsellingMessage[] = [
      ...messages,
      { sender: 'user', text: trimmed },
    ];
    setMessages(nextMessages);
    setInputText('');
    setIsGenerating(true);

    try {
      const gradeLabel =
        gradeKey === 'All' ? 'PP1–Grade 12' : formatGradeLabel(gradeKey);

      const res = await fetch('/api/counselling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          gradeLabel,
          messages: nextMessages,
        }),
      });
      const data = await res.json();
      const reply =
        data?.reply ||
        'I am here with you. Could you share a little more detail so I can give you the best guidance?';
      setMessages((prev) => [...prev, { sender: 'counsellor', text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'counsellor',
          text: 'Connection hiccup — please tap send again so I can generate your guidance response.',
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendPrompt(inputText);
  };

  const quickTopics = role === 'PARENT' ? PARENT_TOPICS : LEARNER_TOPICS;

  return (
    <>
      {/* HIGH-VISIBILITY TOP GUIDANCE & COUNSELLING CALLOUT BAR */}
      <section
        id="guidance-counselling-hub"
        aria-label="Gemini Guidance & Counselling for Parents and Learners"
        className="mb-6 bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white rounded-2xl px-5 py-4 shadow-md border border-purple-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-purple-400/20 border border-purple-300/40 text-purple-200 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Powered by Gemini AI
              </span>
              <span className="text-[11px] font-semibold text-emerald-300">
                Free Confidential Support • Parents &amp; Learners (PP1 – Grade 12)
              </span>
            </div>
            <h2 className="text-base md:text-lg font-black tracking-tight text-white">
              Guidance &amp; Counselling Desk for Parents &amp; Learners
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              Instant, tailored guidance on study motivation, exam anxiety, Senior
              School pathways, parenting teens, screen habits, peer pressure &amp;
              emotional wellbeing.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCounsellingModal}
          className="shrink-0 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-pink-400 hover:from-amber-300 hover:to-pink-300 text-slate-950 font-black text-xs sm:text-sm px-5 py-3.5 rounded-xl shadow-lg transition cursor-pointer"
        >
          <HeartHandshake className="w-4 h-4" />
          <span>Guidance &amp; Counselling (Parents &amp; Learners)</span>
        </button>
      </section>

      {/* MODAL: STEP 1 = ASK IF PARENT OR LEARNER -> STEP 2 = AUTO-GENERATED GEMINI COUNSELLING */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <HeartHandshake className="w-5 h-5 text-pink-300" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black truncate">
                      Gemini Guidance &amp; Counselling Desk
                    </h3>
                    {role && (
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          role === 'PARENT'
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-emerald-400 text-slate-950'
                        }`}
                      >
                        {role === 'PARENT' ? 'Parent Mode' : 'Learner Mode'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-purple-200 truncate">
                    {role === null
                      ? 'Step 1: Tell us whether you are a Parent or a Learner'
                      : 'Instant tailored responses auto-generated by Gemini AI'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {role !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setRole(null);
                      setMessages([]);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-lg transition"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Switch Role
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-slate-300 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* STEP 1: IMMEDIATELY ASK IF PARENT OR LEARNER */}
            {role === null ? (
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
                <div className="text-center space-y-2">
                  <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-800 text-xs font-extrabold px-3 py-1 rounded-full">
                    <Sparkles className="w-3.5 h-3.5" />
                    Personalized Gemini Guidance
                  </span>
                  <h4 className="text-xl font-black text-slate-900">
                    Are You a Parent / Guardian or a Learner?
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                    Please select who is asking today so Gemini knows how to tailor the
                    right counselling tone, guidance, and practical steps for you:
                  </p>
                </div>

                {/* Optional Grade Context Selector */}
                <div className="max-w-xs mx-auto">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase text-center mb-1">
                    Grade Level Context (Optional)
                  </label>
                  <select
                    value={gradeKey}
                    onChange={(e) => setGradeKey(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-slate-50 text-center"
                  >
                    <option value="All">All Levels (PP1 – Grade 12)</option>
                    {ALL_GRADE_KEYS.map((g) => (
                      <option key={g} value={g}>
                        {formatGradeLabel(g)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* TWO ROLE CHOICE CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleSelectRole('PARENT')}
                    className="group text-left border-2 border-amber-200 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-50 rounded-2xl p-5 space-y-3 transition shadow-xs hover:shadow-md cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center group-hover:scale-105 transition">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-base font-black text-slate-900">
                        I am a Parent / Guardian
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Get practical parenting strategies, child study motivation,
                        screen-time boundaries, teen communication &amp; CBC pathway
                        advice.
                      </p>
                    </div>
                    <span className="inline-block text-xs font-black text-amber-800 group-hover:translate-x-1 transition">
                      Continue as Parent →
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRole('LEARNER')}
                    className="group text-left border-2 border-emerald-200 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl p-5 space-y-3 transition shadow-xs hover:shadow-md cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center group-hover:scale-105 transition">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-base font-black text-slate-900">
                        I am a Learner / Student
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Get friendly, encouraging help with exam stress, tough subjects,
                        Senior School &amp; career choices, peer pressure &amp; study
                        habits.
                      </p>
                    </div>
                    <span className="inline-block text-xs font-black text-emerald-800 group-hover:translate-x-1 transition">
                      Continue as Learner →
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* STEP 2: TAILORED GEMINI COUNSELLING SESSION */
              <>
                <div className="p-5 overflow-y-auto flex-1 space-y-4 bg-slate-50/60">
                  {/* Starter Quick Prompts */}
                  {messages.length <= 1 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                        Tap a common {role === 'PARENT' ? 'Parent' : 'Learner'} question
                        or type your own below:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {quickTopics.map((topic) => (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => sendPrompt(topic)}
                            className="text-left text-xs font-semibold bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-slate-700 px-3 py-2 rounded-xl transition cursor-pointer shadow-2xs"
                          >
                            {topic}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chat Messages */}
                  <div className="space-y-3">
                    {messages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`flex ${
                          m.sender === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs sm:text-sm space-y-1 shadow-2xs ${
                            m.sender === 'user'
                              ? 'bg-purple-700 text-white rounded-br-sm'
                              : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'
                          }`}
                        >
                          {m.sender === 'counsellor' ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-purple-700 mb-1">
                                <Sparkles className="w-3 h-3" />
                                Gemini {role === 'PARENT' ? 'Parenting' : 'Student'}{' '}
                                Counsellor
                              </span>
                              <div className="space-y-1 text-xs sm:text-[13px]">
                                {renderFormattedText(m.text)}
                              </div>
                            </div>
                          ) : (
                            <p className="leading-relaxed">{m.text}</p>
                          )}
                        </div>
                      </div>
                    ))}

                    {isGenerating && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-600 flex items-center gap-2 shadow-2xs">
                          <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                          <span>Gemini is preparing your tailored guidance...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Subtle Monetization + Human Support Footer inside Session */}
                  {messages.length >= 2 && (
                    <div className="pt-2 space-y-3">
                      <AdSlot placement="preview_modal" />
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-emerald-950 font-semibold">
                          Need a 1-on-1 Personal Subject Teacher or human follow-up?
                        </span>
                        <a
                          href="https://wa.me/254705759072?text=Hello%2C%20I%20just%20used%20the%20Guidance%20%26%20Counselling%20Desk%20and%20would%20like%20further%20assistance"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-black text-emerald-700 hover:underline"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp 0705759072
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={handleFormSubmit}
                  className="p-4 bg-white border-t border-slate-200 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      role === 'PARENT'
                        ? 'Ask any parenting, study, discipline or CBC pathway question...'
                        : 'Ask anything about your studies, exams, career or wellbeing...'
                    }
                    disabled={isGenerating}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={isGenerating || !inputText.trim()}
                    className="bg-purple-700 hover:bg-purple-800 disabled:bg-slate-300 text-white font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Ask</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
