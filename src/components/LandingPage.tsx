import React from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Sparkles, Heart, Star } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: 'landing' | 'lantern-flow' | 'task-center' | 'wish-wall') => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8 max-w-2xl mx-auto">
        <div className="relative mb-6 inline-block">
          <h1 className="text-4xl md:text-6xl font-medium bg-gradient-to-r from-[#ff8a65] via-[#ffb74d] to-[#6366f1] bg-clip-text text-transparent">
            天燈 Go
          </h1>
          <div className="absolute -top-4 -left-10 w-8 h-8">
            <Sparkles className="w-full h-full text-[#ff8a65] lantern-float" />
          </div>
        </div>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
          創意放飛，毒品 Say No!
        </p>
      </div>

      {/* Action Buttons - Now Primary Focus */}
      <div className="flex flex-col sm:flex-row gap-4 items-center mb-12">
        <Button
          onClick={() => onNavigate('lantern-flow')}
          size="lg"
          className="px-10 py-8 text-lg bg-gradient-to-r from-[#ff8a65] to-[#ffb74d] hover:from-[#ff7043] hover:to-[#ff9800] text-white border-0 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 lantern-glow"
        >
          <Sparkles className="w-6 h-6 mr-2" />
          立即點燈
        </Button>

        <Button
          onClick={() => onNavigate('wish-wall')}
          variant="outline"
          size="lg"
          className="px-10 py-8 text-lg border-2 border-accent/60 rounded-full transition-all duration-300"
        >
          <Star className="w-6 h-6 mr-2" />
          看看別人的天燈
        </Button>
      </div>

      {/* Feature Info - Simplified and De-emphasized */}
      <div className="grid md:grid-cols-3 gap-8 mb-8 max-w-3xl mx-auto w-full">
        <div className="text-center opacity-70">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-accent/10 flex items-center justify-center">
            <Heart className="w-5 h-5 text-accent/70" />
          </div>
          <p className="text-sm text-muted-foreground">
            無需註冊，自由寫下心中所想
          </p>
        </div>

        <div className="text-center opacity-70">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary/70" />
          </div>
          <p className="text-sm text-muted-foreground">
            透過溫柔儀式，釋放情緒
          </p>
        </div>

        <div className="text-center opacity-70">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-secondary/10 flex items-center justify-center">
            <Star className="w-5 h-5 text-[#8b5cf6]/70" />
          </div>
          <p className="text-sm text-muted-foreground">
            感受來自世界的溫暖能量
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center max-w-lg mx-auto">
        <p className="text-sm text-muted-foreground leading-relaxed">
          天燈 Go 致力於提供一個正向、健康的創意表達空間
          <br />
          用創意點亮生活，用正能量拒絕毒品
        </p>
      </div>
    </div>
  );
}