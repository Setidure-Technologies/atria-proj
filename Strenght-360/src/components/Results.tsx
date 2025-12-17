import { useEffect, useState } from 'react';
import { TalentScores, DetailedTalentScores, getTopSubdomainsForDomain, CoreDomain } from '../utils/scoring';
import { TestSummary } from './TestSummary';
import { Award, TrendingUp, Users, Lightbulb, Target, ArrowLeft, BarChart3, Download } from 'lucide-react';
import { apiDB } from '../lib/apiDatabase';

interface ResultsProps {
  scores: TalentScores;
  detailedScores?: DetailedTalentScores;
  primaryDomain: string;
  studentName: string;
  studentEmail: string;
  testResponseId?: number;
  testStartTime?: Date;
  testEndTime?: Date;
  violations?: string[];
  questionsAnswered?: number;
  isAutoSubmit?: boolean;
  onBackToStart?: () => void;
}

export function Results({
  scores,
  detailedScores,
  primaryDomain,
  studentName,
  studentEmail,
  testResponseId,
  testStartTime,
  testEndTime,
  violations = [],
  questionsAnswered = 77,
  isAutoSubmit = false,
  onBackToStart
}: ResultsProps) {
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [sendError, setSendError] = useState<string | null>(null);
  const [pdfDownloadStatus, setPdfDownloadStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');
  const [pdfDownloadError, setPdfDownloadError] = useState<string | null>(null);

  useEffect(() => {
    const sendReport = async () => {
      if (!studentName || !studentEmail) {
        return;
      }

      setSendStatus('sending');
      setSendError(null);

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/send-report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: studentName,
            email: studentEmail,
            scores,
            primaryDomain,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to send report: ${response.status}`);
        }

        setSendStatus('success');
      } catch (error) {
        console.error('Error sending report email:', error);
        setSendStatus('error');
        setSendError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    if (studentEmail) {
      void sendReport();
    }
  }, [studentName, studentEmail, scores, primaryDomain]);

  const renderSendStatus = () => {
    if (sendStatus === 'sending') {
      return <p className="text-sm text-gray-500">Sending your report to {studentEmail}…</p>;
    }

    if (sendStatus === 'success') {
      return <p className="text-sm text-green-600">Report emailed successfully to {studentEmail}.</p>;
    }

    if (sendStatus === 'error') {
      return (
        <p className="text-sm text-red-600">
          We couldn't email your report automatically{sendError ? `: ${sendError}` : '.'} Please contact support.
        </p>
      );
    }

    return null;
  };

  const handleDownloadPDF = async () => {
    if (!testResponseId) {
      setPdfDownloadError('Test response ID not available');
      return;
    }

    setPdfDownloadStatus('downloading');
    setPdfDownloadError(null);

    try {
      await apiDB.generatePDFReport(testResponseId);
      setPdfDownloadStatus('success');
      setTimeout(() => setPdfDownloadStatus('idle'), 3000); // Reset status after 3 seconds
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setPdfDownloadStatus('error');
      setPdfDownloadError(error instanceof Error ? error.message : 'Failed to download PDF');
    }
  };

  // Helper function to map display names to CoreDomain enum values
  const mapDisplayNameToCoreDomain = (displayName: string): CoreDomain => {
    switch (displayName) {
      case 'Executing':
        return 'Executing';
      case 'Influencing':
        return 'Influencing';
      case 'Relationship Building':
        return 'RelationshipBuilding';
      case 'Strategic Thinking':
        return 'StrategicThinking';
      default:
        throw new Error(`Unknown domain: ${displayName}`);
    }
  };

  const talentDescriptions = {
    'Executing': {
      icon: Target,
      title: 'Executing — "The Doer"',
      description: 'You turn ideas into action and make things happen. You\'re dependable, responsible, and results-oriented.',
      themes: ['Achiever', 'Responsibility', 'Discipline', 'Focus', 'Restorative'],
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    'Influencing': {
      icon: TrendingUp,
      title: 'Influencing — "The Leader"',
      description: 'You naturally inspire others, take initiative, and communicate with confidence. You enjoy motivating people and driving results.',
      themes: ['Communication', 'Woo (Wins Others Over)', 'Command', 'Competition', 'Activator'],
      color: 'bg-orange-500',
      lightColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    'Relationship Building': {
      icon: Users,
      title: 'Relationship Building — "The Connector"',
      description: 'You form deep, meaningful relationships and bring people together. You thrive on empathy, trust, and harmony.',
      themes: ['Empathy', 'Relator', 'Harmony', 'Developer', 'Connectedness'],
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    'Strategic Thinking': {
      icon: Lightbulb,
      title: 'Strategic Thinking — "The Visionary"',
      description: 'You love to analyze, learn, and imagine possibilities. You are future-oriented, curious, and reflective.',
      themes: ['Ideation', 'Learner', 'Input', 'Intellection', 'Strategy'],
      color: 'bg-violet-500',
      lightColor: 'bg-violet-50',
      borderColor: 'border-violet-200'
    }
  };

  const domainInfo = talentDescriptions[primaryDomain as keyof typeof talentDescriptions];
  const Icon = domainInfo.icon;

  const allDomains = [
    { name: 'Executing', score: detailedScores?.executing || scores.executing, ...talentDescriptions['Executing'] },
    { name: 'Influencing', score: detailedScores?.influencing || scores.influencing, ...talentDescriptions['Influencing'] },
    { name: 'Relationship Building', score: detailedScores?.relationshipBuilding || scores.relationshipBuilding, ...talentDescriptions['Relationship Building'] },
    { name: 'Strategic Thinking', score: detailedScores?.strategicThinking || scores.strategicThinking, ...talentDescriptions['Strategic Thinking'] }
  ];

  const sortedDomains = [...allDomains].sort((a, b) => b.score - a.score);
  const maxScore = 55;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="text-center mb-8">
            <Award className="mx-auto mb-4 text-orange-600" size={64} />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Strength 360 Complete!</h1>
            <p className="text-gray-600">Thank you, {studentName}</p>
            <div className="mt-3 flex justify-center">{renderSendStatus()}</div>
            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
              {testResponseId && (
                <button
                  onClick={handleDownloadPDF}
                  disabled={pdfDownloadStatus === 'downloading'}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition duration-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {pdfDownloadStatus === 'downloading' ? 'Generating PDF...' : 'Download PDF Report'}
                </button>
              )}
              {onBackToStart && (
                <button
                  onClick={onBackToStart}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Take Another Strength 360
                </button>
              )}
            </div>

            {/* PDF Download Status */}
            {pdfDownloadStatus === 'success' && (
              <p className="text-sm text-green-600 mt-2 text-center">PDF report downloaded successfully!</p>
            )}
            {pdfDownloadStatus === 'error' && pdfDownloadError && (
              <p className="text-sm text-red-600 mt-2 text-center">Error: {pdfDownloadError}</p>
            )}
          </div>

          {/* Test Summary */}
          {testStartTime && testEndTime && (
            <TestSummary
              testStartTime={testStartTime}
              testEndTime={testEndTime}
              violations={violations}
              questionsAnswered={questionsAnswered}
              totalQuestions={77}
              isAutoSubmit={isAutoSubmit}
            />
          )}

          <div className={`${domainInfo.lightColor} border-2 ${domainInfo.borderColor} rounded-xl p-8 mb-8`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`${domainInfo.color} p-3 rounded-lg`}>
                <Icon className="text-white" size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your Primary Talent Domain</h2>
                <p className="text-lg text-gray-700 font-semibold mt-1">{domainInfo.title}</p>
              </div>
            </div>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              {domainInfo.description}
            </p>
            <div className="mt-4">
              <p className="font-semibold text-gray-800 mb-2">Explore Related Themes:</p>
              <div className="flex flex-wrap gap-2">
                {domainInfo.themes.map((theme) => (
                  <span key={theme} className="bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-700 border border-gray-300">
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Your Talent Domain Scores</h3>
            {sortedDomains.map((domain) => {
              const DomainIcon = domain.icon;
              const percentage = (domain.score / maxScore) * 100;
              const isHighConcentration = domain.score >= 25;

              // Get subdomain breakdown if detailed scores are available
              const coreDomainKey = mapDisplayNameToCoreDomain(domain.name);
              const subdomainBreakdown = detailedScores ?
                getTopSubdomainsForDomain(detailedScores.subdomains, coreDomainKey, 20).filter(sub => sub.score > 0) : [];

              return (
                <div key={domain.name} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`${domain.color} p-2 rounded-lg`}>
                        <DomainIcon className="text-white" size={20} />
                      </div>
                      <span className="font-semibold text-gray-800">{domain.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-900">{domain.score}</span>
                      {isHighConcentration && (
                        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                          High
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div
                      className={`${domain.color} h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {/* Subdomain Breakdown */}
                  {detailedScores && subdomainBreakdown.length > 0 && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <BarChart3 size={16} />
                        Talent Theme Breakdown ({domain.score} total points)
                      </h4>
                      <div className="space-y-1">
                        {subdomainBreakdown.map((sub) => (
                          <div key={sub.subdomain} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{sub.subdomain}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800">{sub.score}</span>
                              <span className="text-xs text-gray-500">({sub.percentage}%)</span>
                            </div>
                          </div>
                        ))}
                        {/* Debug: Show total of subdomain scores */}
                        <div className="border-t pt-1 mt-2">
                          <div className="flex items-center justify-between text-sm font-semibold">
                            <span className="text-gray-700">Subdomain Total:</span>
                            <span className="text-gray-900">
                              {subdomainBreakdown.reduce((sum, sub) => sum + sub.score, 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* <div className="mt-8 p-6 bg-orange-50 border-2 border-orange-200 rounded-xl">
            <h3 className="font-bold text-gray-900 mb-3">Understanding Your Results</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">•</span>
                <span>Your highest domain score indicates where your strongest natural talents lie.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">•</span>
                <span>A score of 25 or above suggests a high concentration of talent in that domain.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">•</span>
                <span>All domains work together to create your unique talent profile.</span>
              </li>
            </ul>
          </div> */}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">All Talent Theme Descriptions</h3>

          <div className="space-y-6">
            {Object.entries(talentDescriptions).map(([key, info]) => {
              const ThemeIcon = info.icon;
              return (
                <div key={key} className={`${info.lightColor} border ${info.borderColor} rounded-xl p-6`}>
                  <div className="flex items-start gap-4">
                    <div className={`${info.color} p-3 rounded-lg flex-shrink-0`}>
                      <ThemeIcon className="text-white" size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{info.title}</h4>
                      <p className="text-gray-700 mb-3">{info.description}</p>
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Explore Themes:</p>
                        <div className="flex flex-wrap gap-2">
                          {info.themes.map((theme) => (
                            <span key={theme} className="bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-700 border border-gray-300">
                              {theme}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
