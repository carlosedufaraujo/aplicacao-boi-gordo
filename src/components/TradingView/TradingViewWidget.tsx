import React, { useEffect, useRef, memo } from 'react';

function TradingViewWidget() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    
    // Verificar se já existe um script para evitar duplicação
    if (container.current.querySelector('script')) {
      return;
    }
    
    // Limpar conteúdo anterior
    container.current.innerHTML = '';
    
    // Criar container do widget
    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget h-full';
    
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "symbols": [
          {
            "proName": "BMFBOVESPA:BGIU2025",
            "title": "BGIU25"
          },
          {
            "proName": "BMFBOVESPA:BGIV2025",
            "title": "BGIV25"
          },
          {
            "proName": "BMFBOVESPA:BGIX2025",
            "title": "BGIX25"
          },
          {
            "proName": "BMFBOVESPA:BGIZ2025",
            "title": "BGIZ25"
          },
          {
            "proName": "BMFBOVESPA:BGIF2026",
            "title": "BGIF26"
          },
          {
            "proName": "BMFBOVESPA:CCMU2025",
            "title": "CCMU25"
          },
          {
            "proName": "BMFBOVESPA:CCMX2025",
            "title": "CCMX25"
          },
          {
            "proName": "BMFBOVESPA:CCMF2026",
            "title": "CCMF26"
          },
          {
            "proName": "FX_IDC:USDBRL",
            "title": "USDBRL"
          },
          {
            "proName": "BMFBOVESPA:IBOV",
            "title": "IBOV"
          }
        ],
        "colorTheme": "light",
        "locale": "br",
        "largeChartUrl": "",
        "isTransparent": true,
        "showSymbolLogo": false,
        "displayMode": "adaptive"
      }`;
    
    container.current.appendChild(widgetDiv);
    container.current.appendChild(script);
    
    // Cleanup function
    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="relative w-full h-8 overflow-hidden">
      {/* Efeito de esmaecimento nas laterais */}
      <div className="absolute left-0 top-0 w-6 h-full bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 w-6 h-full bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      
      {/* Container do widget ocupando toda a largura */}
      <div 
        className="tradingview-widget-container w-full h-full flex items-center justify-center" 
        ref={container}
        style={{ fontSize: '10px' }}
      >
        <div className="tradingview-widget-container__widget w-full h-full"></div>
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);
