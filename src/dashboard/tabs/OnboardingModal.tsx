import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Lock,
  Globe,
  Clipboard,
  Beaker,
  Check
} from 'lucide-react';
import { ExtensionSettings, ProtectionMode } from '../../types';
import { StorageService } from '../../storage';
import { DetectionEngine } from '../../scanner/engine';
import { SanitizationEngine } from '../../sanitizer/engine';

interface OnboardingModalProps {
  onComplete: () => void;
  settings: ExtensionSettings;
  onUpdateSettings: (s: ExtensionSettings) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  onComplete,
  settings,
  onUpdateSettings
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedMode, setSelectedMode] = useState<ProtectionMode>(settings.protectionMode);
  const [enableClipboard, setEnableClipboard] = useState<boolean>(settings.clipboardProtection);

  // Step 6 Synthetic scan state
  const sampleSecretInput = 'const stripeKey = "sk_test_51FakeStripeTestKeyForOnboarding998877";\nconst db = "postgres://root:p@ssword@localhost:5432/app";';
  const [sampleOutput, setSampleOutput] = useState<string | null>(null);

  const handleRunSampleScan = () => {
    const engine = new DetectionEngine();
    const detections = engine.scan(sampleSecretInput);
    const result = SanitizationEngine.sanitize(sampleSecretInput, detections);
    setSampleOutput(result.sanitized);
  };

  const handleFinish = async () => {
    const updated = {
      ...settings,
      protectionMode: selectedMode,
      clipboardProtection: enableClipboard,
      onboardingCompleted: true
    };
    await StorageService.saveSettings(updated);
    onUpdateSettings(updated);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-dark-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-dark-900 border border-dark-700 rounded-2xl shadow-cyber overflow-hidden flex flex-col text-slate-100">
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-dark-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
            style={{ width: `${(step / 7) * 100}%` }}
          />
        </div>

        {/* Modal Header */}
        <div className="p-6 border-b border-dark-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-white tracking-wide">
              SecretSanitizer AI <span className="text-cyan-400">Setup</span>
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">Step {step} of 7</span>
        </div>

        {/* Dynamic Step Content */}
        <div className="p-6 flex-1 space-y-4">
          {step === 1 && (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Welcome to SecretSanitizer AI</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                The next-generation AI Privacy Firewall designed for developers, engineering teams,
                and privacy-conscious users. Protect yourself from accidentally leaking credentials,
                API keys, database URIs, and confidential data into AI platforms and clipboards.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">100% Privacy-First & Local Scanning</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                SecretSanitizer operates entirely inside your local browser sandbox.
              </p>
              <div className="space-y-2 pt-2">
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Zero cloud egress: Code and credentials never leave your machine.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>No external scanning APIs or third-party telemetry.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Zero raw secret storage in logs or persistent browser caches.</span>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2">
                <Globe className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Supported AI Platforms</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Firewall adapters are enabled by default for:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 font-mono">
                <div className="p-2.5 rounded-lg bg-dark-850 border border-dark-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> ChatGPT
                </div>
                <div className="p-2.5 rounded-lg bg-dark-850 border border-dark-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Claude AI
                </div>
                <div className="p-2.5 rounded-lg bg-dark-850 border border-dark-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Google Gemini
                </div>
                <div className="p-2.5 rounded-lg bg-dark-850 border border-dark-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Microsoft Copilot
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white">Choose Your Protection Policy</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                How should the firewall react when a credential is detected during submission?
              </p>
              <div className="space-y-2 pt-1 text-xs">
                <label
                  onClick={() => setSelectedMode('review')}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedMode === 'review'
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-white'
                      : 'bg-dark-850 border-dark-700 text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    checked={selectedMode === 'review'}
                    onChange={() => setSelectedMode('review')}
                  />
                  <div>
                    <div className="font-bold">Review Before Redaction (Recommended)</div>
                    <div className="text-[11px] text-slate-400">Shows an in-page modal with preview before submitting.</div>
                  </div>
                </label>

                <label
                  onClick={() => setSelectedMode('automatic')}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedMode === 'automatic'
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-white'
                      : 'bg-dark-850 border-dark-700 text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    checked={selectedMode === 'automatic'}
                    onChange={() => setSelectedMode('automatic')}
                  />
                  <div>
                    <div className="font-bold">Automatic Redaction</div>
                    <div className="text-[11px] text-slate-400">Auto-redacts secrets and submits clean placeholders seamlessly.</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-2">
                <Clipboard className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white">Configure Clipboard Guardian</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Detects credentials in user-selected text during copy actions.
              </p>
              <div className="p-4 rounded-xl bg-dark-850 border border-dark-700 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Enable Clipboard Protection</div>
                  <div className="text-[11px] text-slate-400">Warns before placing raw credentials on the system clipboard.</div>
                </div>
                <input
                  type="checkbox"
                  checked={enableClipboard}
                  onChange={(e) => setEnableClipboard(e.target.checked)}
                  className="rounded bg-dark-900 border-dark-700 text-cyan-500"
                />
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Beaker className="w-4 h-4 text-cyan-400" />
                  <span>Interactive Test Security Scan</span>
                </h2>
              </div>
              <p className="text-xs text-slate-300">
                Test the local detection engine right now on this synthetic snippet:
              </p>

              <div className="p-3 rounded-lg bg-dark-950 border border-dark-800 font-mono text-xs text-rose-300 whitespace-pre">
                {sampleSecretInput}
              </div>

              {sampleOutput ? (
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-emerald-400">Sanitized Output Result:</div>
                  <div className="p-3 rounded-lg bg-dark-950 border border-emerald-500/40 font-mono text-xs text-emerald-300 whitespace-pre">
                    {sampleOutput}
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleRunSampleScan}
                  className="bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-bold text-xs px-4 py-2 rounded-lg transition-colors"
                >
                  Run Test Scan
                </button>
              )}
            </div>
          )}

          {step === 7 && (
            <div className="space-y-3 text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Protection Active & Ready!</h2>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                SecretSanitizer AI is now actively protecting your browser workflows.
                Whenever you prompt ChatGPT, Claude, Gemini, or copy sensitive tokens,
                we've got you covered.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-dark-700/80 bg-dark-950 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 7 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-bold text-xs px-5 py-2 rounded-lg flex items-center gap-1.5 shadow-glow-cyan transition-colors"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow-glow-cyan hover:opacity-90 transition-opacity"
            >
              Enter Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
