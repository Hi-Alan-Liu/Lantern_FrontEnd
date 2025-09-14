import React from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Sparkles, Heart, Star } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: 'landing' | 'lantern-flow' | 'task-center' | 'wish-wall') => void;
  userPoints: number;
}

export function LandingPage({ onNavigate, userPoints }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12 max-w-2xl mx-auto">
        <div className="relative mb-6">
          <h1 className="text-4xl md:text-6xl font-medium bg-gradient-to-r from-[#ff8a65] via-[#ffb74d] to-[#6366f1] bg-clip-text text-transparent">
            天燈 Go
          </h1>
          <div className="absolute -top-4 -right-4 w-8 h-8">
            <Sparkles className="w-full h-full text-[#ff8a65] lantern-float" />
          </div>
        </div>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
          創意放飛，毒品 Say No!
        </p>
      </div>

      {/* Feature Cards */}
<div className="mb-12 max-w-4xl mx-auto w-full">
  <Card className="lantern-glow p-6 md:p-8 bg-card/60 border border-border/30 cursor-default select-text">
    <div className="grid md:grid-cols-3 gap-6">
      {/* 1 */}
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center">
          <Heart className="w-6 h-6 text-accent" />
        </div>
        <h3 className="text-lg font-medium mb-2">匿名許願</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          無需註冊，匿名寫下心中所想，讓願望自由飛翔
        </p>
      </div>

      {/* 2 */}
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-medium mb-2">療癒儀式</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          透過溫柔的點燈儀式，釋放情緒，獲得內心平靜
        </p>
      </div>

      {/* 3 */}
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-secondary/20 flex items-center justify-center">
          <Star className="w-6 h-6 text-[#8b5cf6]" />
        </div>
        <h3 className="text-lg font-medium mb-2">星空共鳴</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          觀看滿天飛舞的天燈，感受來自世界的溫暖能量
        </p>
      </div>
    </div>
  </Card>
</div>


      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Button
          onClick={() => onNavigate('lantern-flow')}
          size="lg"
          className="px-8 py-6 bg-gradient-to-r from-[#ff8a65] to-[#ffb74d] hover:from-[#ff7043] hover:to-[#ff9800] text-white border-0 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 lantern-glow"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          立即點燈
        </Button>

        <Button
          onClick={() => onNavigate('wish-wall')}
          variant="outline"
          size="lg"
          className="px-8 py-6 border-border/50 hover:border-accent/50 rounded-full transition-all duration-300"
        >
          <Star className="w-5 h-5 mr-2" />
          看看別人的天燈
        </Button>
      </div>

      {/* Points Display */}
      <div className="mt-8 text-center">
        <Card className="px-4 py-2 bg-card/30 backdrop-blur-sm border-border/30 inline-block">
          <p className="text-sm text-muted-foreground">
            目前點數：<span className="text-accent font-medium">{userPoints}</span>
            <Button
              variant="link"
              size="sm"
              onClick={() => onNavigate('task-center')}
              className="ml-2 text-xs text-primary hover:text-accent p-0 h-auto"
            >
              獲得更多點數
            </Button>
          </p>
        </Card>
      </div>

      {/* Footer */}
      <div className="mt-4 text-center max-w-lg mx-auto">
        <p className="text-sm text-muted-foreground leading-relaxed">
          天燈 Go 致力於提供一個正向、健康的創意表達空間
          <br />
          用創意點亮生活，用正能量拒絕毒品
        </p>
      </div>
    </div>
  );
}