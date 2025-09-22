import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Maximize2, X } from 'lucide-react';

interface VideoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
  onPlay?: () => void;
  onPause?: () => void;
  timeSegment?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  isOpen,
  onClose,
  videoUrl,
  title,
  onPlay,
  onPause,
  timeSegment
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Convert YouTube URL to embed format
  const getEmbedUrl = (url: string) => {
    try {
      // Handle various YouTube URL formats
      let videoId = '';
      
      if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('youtube.com/watch?v=')[1].split('&')[0];
      } else if (url.includes('youtube.com/shorts/')) {
        videoId = url.split('youtube.com/shorts/')[1].split('?')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      } else if (url.includes('youtube.com/embed/')) {
        return url; // Already embed format
      }
      
      if (!videoId) return url;
      
      // Extract time parameters if present
      let startTime = '';
      if (url.includes('t=')) {
        const timeParam = url.split('t=')[1].split('&')[0];
        if (timeParam.includes('s')) {
          startTime = `&start=${timeParam.replace('s', '')}`;
        } else {
          startTime = `&start=${timeParam}`;
        }
      }
      
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1${startTime}`;
    } catch (error) {
      console.error('Error converting URL to embed format:', error);
      return url;
    }
  };

  const embedUrl = getEmbedUrl(videoUrl);

  const handlePlay = () => {
    setIsPlaying(true);
    onPlay?.();
    
    // Send play command to YouTube iframe
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        '{"event":"command","func":"playVideo","args":""}',
        '*'
      );
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    onPause?.();
    
    // Send pause command to YouTube iframe
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        '{"event":"command","func":"pauseVideo","args":""}',
        '*'
      );
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    // Send mute/unmute command to YouTube iframe
    if (iframeRef.current) {
      const command = isMuted ? 'unMute' : 'mute';
      iframeRef.current.contentWindow?.postMessage(
        `{"event":"command","func":"${command}","args":""}`,
        '*'
      );
    }
  };

  const openFullscreen = () => {
    window.open(videoUrl, '_blank', 'noopener,noreferrer');
  };

  // Reset playing state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
    }
  }, [isOpen]);

  // Listen for YouTube player events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com') return;
      
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'video-progress') {
          // Handle video progress if needed
        }
      } catch (error) {
        // Ignore parsing errors
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-black border-orange-500/20 p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-white text-lg">{title}</DialogTitle>
              {timeSegment && (
                <p className="text-orange-400 text-sm mt-1">{timeSegment}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6">
          {/* Video Container */}
          <div className="relative bg-black rounded-lg overflow-hidden mb-4">
            <div className="aspect-video">
              <iframe
                ref={iframeRef}
                src={embedUrl}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={title}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between bg-black/50 rounded-lg p-4 border border-orange-400/30">
            <div className="flex items-center space-x-3">
              <Button
                size="sm"
                onClick={isPlaying ? handlePause : handlePlay}
                className="bg-gradient-primary hover:bg-gradient-primary/80"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={toggleMute}
                className="border-orange-400/50 text-orange-400 hover:bg-orange-500/10"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={openFullscreen}
                className="border-orange-400/50 text-orange-400 hover:bg-orange-500/10"
              >
                <Maximize2 className="h-4 w-4 mr-1" />
                Open in YouTube
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-4 p-3 bg-orange-500/10 border border-orange-400/30 rounded-lg">
            <p className="text-orange-400 text-sm">
              <strong>Note:</strong> Click the play button above to start the video and any associated timers. 
              The video will not auto-play.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};