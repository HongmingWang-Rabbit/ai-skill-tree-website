'use client';

import { useState, useEffect } from 'react';
import { GlassPanel } from './GlassPanel';
import {
  SHARE_SLIDES,
  SOCIAL_PLATFORMS,
  SCREENSHOT_COLORS,
  type ShareSlideType,
  type SocialPlatform,
} from '@/lib/screenshot-constants';

// Social platform icons
const SocialIcons: Record<SocialPlatform, React.ReactNode> = {
  x: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  telegram: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  ),
  wechat: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.269-.03-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" />
    </svg>
  ),
};

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  previews: Record<ShareSlideType, string | null>;
  isCapturing: boolean;
  careerTitle: string;
  progress: number;
  filename: string;
  onDownload: (slideType: ShareSlideType) => void;
  onCopy: (slideType: ShareSlideType) => Promise<boolean>;
  onNativeShare: (slideType: ShareSlideType) => Promise<boolean>;
  onSlideChange: (slideType: ShareSlideType) => void;
  currentSlide: ShareSlideType;
  // Link sharing props (for user maps)
  mapId?: string;
  shareSlug?: string | null;
  isPublic?: boolean;
  isOwner?: boolean;
}

type ViewMode = 'main' | 'social';

export function ShareModal({
  isOpen,
  onClose,
  previews,
  isCapturing,
  careerTitle,
  progress,
  filename,
  onDownload,
  onCopy,
  onNativeShare,
  onSlideChange,
  currentSlide,
}: ShareModalProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [wechatInstructions, setWechatInstructions] = useState(false);

  // Reset states when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCopySuccess(false);
      setViewMode('main');
      setWechatInstructions(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPreview = previews[currentSlide];
  const currentSlideIndex = SHARE_SLIDES.findIndex(s => s.type === currentSlide);
  const currentSlideInfo = SHARE_SLIDES[currentSlideIndex];

  // Check if native share is available
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handlePrevSlide = () => {
    const prevIndex = (currentSlideIndex - 1 + SHARE_SLIDES.length) % SHARE_SLIDES.length;
    onSlideChange(SHARE_SLIDES[prevIndex].type);
  };

  const handleNextSlide = () => {
    const nextIndex = (currentSlideIndex + 1) % SHARE_SLIDES.length;
    onSlideChange(SHARE_SLIDES[nextIndex].type);
  };

  const handleCopy = async () => {
    setCopySuccess(false);
    const success = await onCopy(currentSlide);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDownload = () => {
    onDownload(currentSlide);
  };

  const handleNativeShare = async () => {
    await onNativeShare(currentSlide);
  };

  const handleSocialShare = async (platform: SocialPlatform) => {
    const shareText = `Check out my ${careerTitle} skill tree progress - ${progress}% complete!`;
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    if (platform === 'wechat') {
      // WeChat requires downloading the image and sharing manually
      setWechatInstructions(true);
      // Auto-download the image for convenience
      onDownload(currentSlide);
      return;
    }

    // For X and Telegram: Copy image to clipboard first, then open platform
    // This allows users to paste the image in their post
    const copied = await onCopy(currentSlide);
    if (copied) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    }

    const platformConfig = SOCIAL_PLATFORMS.find(p => p.id === platform);
    if (platformConfig) {
      const url = platformConfig.getShareUrl(shareText, shareUrl);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleBack = () => {
    setViewMode('main');
    setWechatInstructions(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <GlassPanel className="max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {viewMode === 'social' && (
              <button
                onClick={handleBack}
                className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                title="Back"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
            )}
            <h2 className="text-xl font-bold text-white">
              {viewMode === 'social' ? 'Share to Social' : 'Share Your Progress'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            disabled={isCapturing}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Slide Selector */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {SHARE_SLIDES.map((slide) => (
            <button
              key={slide.type}
              onClick={() => onSlideChange(slide.type)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                currentSlide === slide.type
                  ? 'bg-amber-500 text-slate-900'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {slide.title}
            </button>
          ))}
        </div>

        {/* Preview Area with Navigation */}
        <div className="relative mb-4">
          {/* Previous Button */}
          <button
            onClick={handlePrevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Preview */}
          <div className="min-h-[200px]">
            {isCapturing ? (
              <div className="aspect-video bg-slate-800 rounded-lg flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-400">
                  <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  <span>Generating preview...</span>
                </div>
              </div>
            ) : currentPreview ? (
              <div className="rounded-lg overflow-hidden border border-slate-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentPreview}
                  alt="Screenshot preview"
                  className="w-full h-auto"
                />
              </div>
            ) : (
              <div className="aspect-video bg-slate-800 rounded-lg flex items-center justify-center">
                <div className="text-center text-slate-500">
                  <div className="text-4xl mb-2">📸</div>
                  <p>Generating {currentSlideInfo.title}...</p>
                </div>
              </div>
            )}
          </div>

          {/* Next Button */}
          <button
            onClick={handleNextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Slide Indicators */}
        <div className="flex justify-center gap-2 mb-4">
          {SHARE_SLIDES.map((slide) => (
            <button
              key={slide.type}
              onClick={() => onSlideChange(slide.type)}
              className={`w-2 h-2 rounded-full transition-colors ${
                currentSlide === slide.type ? 'bg-amber-500' : 'bg-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Slide Info */}
        <div className="text-center mb-4">
          <p className="text-slate-400 text-sm">{currentSlideInfo.description}</p>
        </div>

        {/* Status Messages */}
        {copySuccess && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm text-center">
            {viewMode === 'social'
              ? 'Image copied! Paste it in your post with Ctrl+V (or Cmd+V on Mac)'
              : 'Screenshot copied to clipboard!'}
          </div>
        )}

        {/* Action Buttons - Main View */}
        {viewMode === 'main' && (
          <div className="grid grid-cols-2 gap-3">
            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={isCapturing || !currentPreview}
              className="py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 disabled:cursor-not-allowed text-slate-900 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download
            </button>

            {/* Copy to Clipboard Button */}
            <button
              onClick={handleCopy}
              disabled={isCapturing || !currentPreview}
              className="py-3 px-4 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 disabled:cursor-not-allowed text-slate-200 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {copySuccess ? 'Copied!' : 'Copy'}
            </button>

            {/* Share to Social Button */}
            <button
              onClick={() => setViewMode('social')}
              disabled={isCapturing || !currentPreview}
              className="col-span-2 py-3 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Share
            </button>
          </div>
        )}

        {/* Action Buttons - Social View */}
        {viewMode === 'social' && (
          <div className="space-y-3">
            {/* Native Device Share Button */}
            {canNativeShare && (
              <button
                onClick={handleNativeShare}
                disabled={isCapturing || !currentPreview}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 disabled:cursor-not-allowed text-slate-900 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Share via Device
              </button>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-700" />
              <span className="text-slate-500 text-xs">or copy image & open</span>
              <div className="flex-1 h-px bg-slate-700" />
            </div>

            {/* Social Platform Buttons */}
            <div className="grid grid-cols-3 gap-3">
              {SOCIAL_PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => handleSocialShare(platform.id)}
                  disabled={isCapturing || !currentPreview}
                  className={`py-3 px-4 ${platform.color} ${platform.hoverColor} disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex flex-col items-center justify-center gap-2`}
                >
                  {SocialIcons[platform.id]}
                  <span className="text-xs">{platform.name}</span>
                </button>
              ))}
            </div>

            {wechatInstructions && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{
                  backgroundColor: SCREENSHOT_COLORS.WECHAT_GREEN_MUTED,
                  borderWidth: 1,
                  borderColor: SCREENSHOT_COLORS.WECHAT_GREEN_BORDER,
                  color: SCREENSHOT_COLORS.WECHAT_GREEN,
                }}
              >
                <p className="font-medium mb-1">WeChat Sharing:</p>
                <ol className="list-decimal list-inside text-xs space-y-1">
                  <li>Download the image first</li>
                  <li>Open WeChat</li>
                  <li>Share the image in a chat or Moments</li>
                </ol>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-slate-500 text-center mt-4">
          {filename}
        </p>
      </GlassPanel>
    </div>
  );
}
